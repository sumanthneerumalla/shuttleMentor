# `onDateChange` During Prev/Next Navigation Triggers React "setState in render" Warning

## Summary

When a consumer passes an `onDateChange` callback that updates parent state, ilamy's built-in prev/next navigation can trigger this React warning:

```text
Cannot update a component (`CalendarClient`) while rendering a different component (`cf`).
```

This appears to happen because ilamy calls `onDateChange` from inside a `setCurrentDate` state updater during prev/next navigation.

## Consumer Context

This showed up in ShuttleMentor, where ilamy is used like this:

1. The parent owns `currentDate` and `currentView`.
2. The parent derives a backend fetch range from that state.
3. The parent passes fetched events into ilamy.
4. The parent listens to `onDateChange` and updates its own date state.

In practice, the callback is just:

```ts
const handleDateChange = (date: dayjs.Dayjs) => setCurrentDate(date)
```

That seems like a normal use of the public API.

## How To Reproduce

1. Render `IlamyCalendar` or `IlamyResourceCalendar` with the stock header.
2. In the parent component, store `currentDate` in React state.
3. Pass `onDateChange={(date) => setCurrentDate(date)}`.
4. Click the built-in prev or next arrow in the ilamy header.
5. Observe the React warning above.

## Suspected Root Cause

In `src/hooks/use-calendar-engine.ts`, `navigatePeriod` currently calls `onDateChange` from inside the `setCurrentDate((prev) => ...)` updater:

```ts
const navigatePeriod = useCallback(
  (direction: 1 | -1) => {
    setCurrentDate((prev) => {
      const newDate =
        direction === 1
          ? prev.add(1, VIEW_UNITS[view])
          : prev.subtract(1, VIEW_UNITS[view])
      onDateChange?.(newDate)
      return newDate
    })
  },
  [view, onDateChange]
)
```

That is enough to trigger the warning when the consumer callback updates parent state.

## Proposed Fix

Do not call `onDateChange` from inside the state updater.

Instead:

1. compute `newDate`
2. call `setCurrentDate(newDate)`
3. call `onDateChange?.(newDate)`

## Why This Looks Like A Library Issue

This does not look like consumer misuse.

The consumer is simply using `onDateChange` to synchronize external state with calendar navigation. Also, ilamy already uses the safer callback pattern in other paths such as `selectDate` and `today`.

So this looks like an internal callback-timing issue in the library rather than a bad integration pattern.

## Suggested Regression Test

Add a component-level test that:

1. renders `IlamyCalendar` with an `onDateChange` handler that updates parent state
2. clicks prev or next
3. asserts navigation works
4. asserts React does not emit the warning

## Note

In ShuttleMentor this warning was one real problem, but not the only desync source. There are separate app-side issues around year view handling, uncontrolled remounts, and timezone assumptions. This issue is specifically about the stock ilamy prev/next path calling the consumer callback at the wrong time.
