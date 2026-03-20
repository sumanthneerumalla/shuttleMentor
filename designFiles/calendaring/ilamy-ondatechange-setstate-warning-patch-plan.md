# ilamy Patch Plan: Remove `onDateChange` Call From State Updater

## Goal

Fix ilamy's prev/next navigation so it does not invoke `onDateChange` from inside a React state updater.

## Root Cause

In `src/hooks/use-calendar-engine.ts`, `navigatePeriod` currently calls `onDateChange` inside the `setCurrentDate` functional updater.

That can trigger React's warning about updating a parent component while rendering a different component when `onDateChange` updates parent state.

## Minimal Fix

Refactor `navigatePeriod` so `onDateChange` is called after `setCurrentDate`, not from inside the updater callback.

## Recommended Implementation

Current:

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

Proposed:

```ts
const navigatePeriod = useCallback(
  (direction: 1 | -1) => {
    const newDate =
      direction === 1
        ? currentDate.add(1, VIEW_UNITS[view])
        : currentDate.subtract(1, VIEW_UNITS[view])

    setCurrentDate(newDate)
    onDateChange?.(newDate)
  },
  [currentDate, view, onDateChange]
)
```

## Why This Is Acceptable

- small, local change
- no public API changes
- keeps the existing `onDateChange` contract
- aligns prev/next behavior with the existing `today` and `selectDate` patterns

## Tradeoff

This version depends on `currentDate` in the callback closure.

For normal UI navigation this should be fine, since each click is a separate event and React will re-render between interactions. If maintainers want to preserve the functional-updater style at all costs, they can still restructure it, but the key requirement is the same:

- do not invoke `onDateChange` from inside the updater function

## Suggested Test Coverage

1. Keep the existing hook-level navigation tests.
2. Add a component-level regression test around built-in header prev/next navigation with a parent-owned `currentDate` state.
3. Spy on `console.error` and assert the React warning is not emitted.

## Consumer Benefit

This lets apps safely do:

- `onDateChange={setCurrentDate}`
- derive query ranges from parent state
- refetch on calendar navigation

without React warnings from the stock ilamy navigation controls.
