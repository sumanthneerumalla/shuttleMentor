# Built-in Header Dropdown Navigation Does Not Fire `onDateChange`

## Summary

The stock ilamy header updates the visible date when the user navigates with the month/year/week/day dropdowns, but it does not fire the consumer's `onDateChange` callback for that path.

That makes it easy for the calendar UI and the parent app state to drift apart.

## Consumer Context

This showed up in ShuttleMentor, where ilamy is used like this:

1. The parent stores `currentDate` and `currentView`.
2. The parent derives an event query range from that state.
3. The parent fetches events for that range.
4. The parent passes those events into `IlamyCalendar` / `IlamyResourceCalendar`.
5. The parent relies on `onDateChange` and `onViewChange` to keep its fetch state synchronized with calendar navigation.

That seems like a normal use of ilamy's public API. `onDateChange` is the obvious callback to use for external synchronization.

## How To Reproduce

1. Render `IlamyCalendar` or `IlamyResourceCalendar` with the stock header.
2. Pass an `onDateChange` callback that updates parent state.
3. Derive your fetch range from that parent state.
4. Use the built-in month/year/week/day dropdown in the header to jump to another date.
5. Observe that the visible calendar date changes, but `onDateChange` is not fired.

In ShuttleMentor, that meant:

- the calendar visually moved to a new period
- the parent still believed it was on the old period
- the event query stayed on the old range

## Suspected Root Cause

In `src/components/header/title-content.tsx`, the built-in header reads `setCurrentDate` from context and uses that for dropdown selection.

That updates ilamy's internal state, but it bypasses `selectDate`, which is the method that fires `onDateChange`.

## Proposed Fix

In `TitleContent`, use `selectDate` instead of `setCurrentDate` for dropdown selection.

Minimal shape:

```tsx
const { currentDate, view, selectDate, t, firstDayOfWeek } =
  useSmartCalendarContext((ctx) => ({
    currentDate: ctx.currentDate,
    view: ctx.view,
    selectDate: ctx.selectDate,
    t: ctx.t,
    firstDayOfWeek: ctx.firstDayOfWeek,
  }))

const handleSelectDate = (date: dayjs.Dayjs) => {
  selectDate(date)
  setOpenPopover(null)
}
```

Then replace the dropdown item handlers to call `handleSelectDate(...)`.

## Why This Looks Like A Library Issue

This does not look like consumer misuse.

The consumer is:

- using the stock ilamy header
- using the public `onDateChange` callback
- keeping external fetch state in sync with navigation

That is a reasonable integration pattern. The problem seems to be that the built-in dropdown path does not honor the same callback contract as the other navigation paths.

## Suggested Regression Test

Add a component-level test that:

1. renders `IlamyCalendar` with `onDateChange`
2. opens a built-in header dropdown
3. selects a new option
4. asserts that `onDateChange` is called

## Note

In ShuttleMentor this was one real desync source, but not the only one. There are separate app-side issues around year view handling, uncontrolled remounts, and timezone assumptions. This issue is specifically about the stock ilamy dropdown navigation path not notifying consumers.
