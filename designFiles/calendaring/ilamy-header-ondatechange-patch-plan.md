# ilamy Patch Plan: Fix Built-In Header Date Sync

## Goal

Fix the built-in ilamy header so dropdown navigation keeps external date state in sync without requiring a custom header implementation.

## Minimal Change

Change the built-in header dropdown selection logic in `src/components/header/title-content.tsx` to use `selectDate` instead of `setCurrentDate`.

## Rationale

`selectDate` is already the engine-level API that:

- updates ilamy's internal current date
- fires `onDateChange`

The current built-in header uses `setCurrentDate`, which updates local state but skips the callback path that parent applications rely on for refetching events.

## Proposed Code Change

Current shape:

```tsx
const { currentDate, view, setCurrentDate, t, firstDayOfWeek } =
  useSmartCalendarContext((ctx) => ({
    currentDate: ctx.currentDate,
    view: ctx.view,
    setCurrentDate: ctx.setCurrentDate,
    t: ctx.t,
    firstDayOfWeek: ctx.firstDayOfWeek,
  }))

const selectDate = (date: dayjs.Dayjs) => {
  setCurrentDate(date)
  setOpenPopover(null)
}
```

Target shape:

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

Then update the month/year/week/day dropdown handlers to call `handleSelectDate(...)`.

## Scope

Keep the patch limited to:

- `src/components/header/title-content.tsx`
- one regression test covering built-in header dropdown navigation and `onDateChange`

No API changes should be necessary.

## Suggested Regression Test

Add a test that renders the default ilamy header and verifies that choosing a dropdown option triggers `onDateChange`.

Possible coverage:

- one month dropdown case is enough for the sync regression
- optional extra cases for year/week/day if maintainers want broader coverage

## Consumer Benefit

With this fix, applications can:

- keep the stock ilamy header layout and features
- rely on `onDateChange` for external date-range synchronization

## Validation Checklist

1. Render `IlamyCalendar` with `onDateChange`.
2. Use the built-in month dropdown to jump to a different month.
3. Confirm `onDateChange` fires with the selected date.
4. Confirm prev/next/today behavior remains unchanged.
5. Confirm resource-calendar default header still hides unsupported `year` view.
