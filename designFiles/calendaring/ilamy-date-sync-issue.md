# Ilamy Date Sync Issue

## Summary

Two ilamy date-navigation bugs can affect apps that keep external date state in sync with the calendar:

1. `onDateChange` can fire while ilamy is still updating its own state, which triggers the React warning:
   `Cannot update a component while rendering a different component`.
2. Some ilamy header date pickers update ilamy's internal date without calling `onDateChange`, which can leave the app's external `currentDate` out of sync with the visible calendar.

These are shared ilamy issues. They affect both `IlamyCalendar` and `IlamyResourceCalendar`.

## Confirmed Cause

- In ilamy's shared calendar engine, `navigatePeriod` calls `onDateChange` inside the `setCurrentDate` updater.
- In ilamy's stock header title popover, date selection uses `setCurrentDate` directly instead of the `selectDate` helper that also calls `onDateChange`.

## Impact

- The React warning does not change event block sizing or placement by itself.
- The bigger user-facing risk is stale or wrong event data after some date jumps, because an app may fetch by parent `currentDate` while ilamy is already showing a different date internally.
- Scope: standard calendar and resource calendar.

## Fix Options

### Option 1 — App-only mitigation

- Defer the app's `handleDateChange` callback with `queueMicrotask` or `setTimeout(0)`.
- This should suppress the warning.
- It does not solve the header popover desync by itself.

### Option 2 — App custom header

- Replace ilamy's stock header with a custom `headerComponent`.
- Route all date/view changes through app-owned state.
- This fixes both issues without patching ilamy, but adds more app-level integration code.

### Option 3 — Ilamy-side fix

- Part A — Prev/next callback timing
  - Move `onDateChange` notification out of the state updater and into a safer post-update path.
- Part B — Header dropdown callback path
  - Update the stock header title popover to use `selectDate` instead of raw `setCurrentDate`.
- This is the cleanest fix because it corrects the shared library behavior for both standard and resource calendars.

## Recommended Plan

1. Patch ilamy Part A: fix prev/next navigation so `onDateChange` is not fired from inside the state updater.
2. Patch ilamy Part B: fix the stock header title popover to use `selectDate`.
3. Keep app-side `onDateChange` wiring as-is after the ilamy fix.
4. If the ilamy patch is deferred, use the app-only mitigation as a temporary stopgap to remove the warning.
