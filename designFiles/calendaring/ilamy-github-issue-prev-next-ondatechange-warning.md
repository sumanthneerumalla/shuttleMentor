# Title

`onDateChange` during prev/next navigation triggers React "setState in render" warning

# Body

## Summary

When `onDateChange` triggers a state update in user code, ilamy's built-in prev/next navigation can trigger:

```text
Cannot update a component while rendering a different component
```

## Repro

1. Render `IlamyCalendar` or `IlamyResourceCalendar` with the stock header.
2. Pass an `onDateChange` callback that updates React state.
3. Click the built-in prev or next arrow.
4. Observe the React warning.

## Suspected Cause

In `src/hooks/use-calendar-engine.ts`, `navigatePeriod` calls `onDateChange` from inside the `setCurrentDate((prev) => ...)` updater.

That means user state updates can happen during ilamy's own state update path.

## Expected

Prev/next navigation should update the date and call `onDateChange` without triggering React warnings.

## Proposed Fix

Compute `newDate`, call `setCurrentDate(newDate)`, then call `onDateChange?.(newDate)`.

## Regression Test

Add a component-level test that:

- renders ilamy with an `onDateChange` handler that updates React state
- clicks prev/next
- asserts navigation works
- asserts React does not emit the warning
