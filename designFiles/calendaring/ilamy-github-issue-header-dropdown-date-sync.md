# Title

Built-in header dropdown navigation does not fire `onDateChange`

# Body

## Summary

The stock ilamy header updates the visible date when using the month/year/week/day dropdowns, but that path does not fire the `onDateChange` callback.

This makes built-in header date navigation inconsistent with the other callback-firing date-selection paths in the library.

This is especially problematic in apps that use `onDateChange` to keep a selected backend date range in sync with the visible calendar.

## Impact

In apps that use header date changes to keep a backend-selected date range in sync, dropdown navigation can move the visible calendar without updating the external date range.

That means the backend query can stay on the old range even though ilamy is already showing a different date range, so the UI may render stale or missing `CalendarEvent`s when the user changes the date range from the dropdown instead of the prev/next arrows.

The visible calendar and the app's external fetch state can drift apart even though both are reacting to built-in navigation controls.

## Repro

1. Render `IlamyCalendar` or `IlamyResourceCalendar` with the stock header.
2. Pass an `onDateChange` callback.
3. Use the built-in header dropdown to jump to another date.
4. Observe that the visible date changes but `onDateChange` is not fired.

## Suspected Cause

In `src/components/header/title-content.tsx`, the built-in header uses `setCurrentDate` directly instead of `selectDate`.

That updates internal state but bypasses the existing callback-firing date-selection path.

## Expected

The built-in header dropdown should use the same date-selection path as other user-driven navigation and fire `onDateChange` so external date-range state can stay synchronized with the visible calendar.

## Proposed Fix

In `title-content.tsx`, change the built-in header dropdown logic to use the existing `selectDate` helper instead of raw `setCurrentDate`.

That keeps the patch small and aligned with ilamy's current internal pattern rather than introducing a new navigation path.

## Regression Test

Add a test that:

- renders the default header with `onDateChange`
- opens a built-in dropdown
- selects a new date
- asserts `onDateChange` is called
