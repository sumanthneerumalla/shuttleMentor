# ilamy Calendar Key Warning - Updated Analysis

## What we observed

In `ResourceWeekHorizontal`, React warned about duplicate keys in the time header row:

`resource-week-header-2026-03-08T07:00:00.000Z-hour-animated`

That warning means at least two siblings rendered with the same key string at runtime.

## Where it happens

- File: `ilamy-calendar/src/features/resource-calendar/components/week-view/resource-week-horizontal.tsx`
- Area: time header row (`weekHours.flat().map(...)`)

Previous keying:

```tsx
const key = `resource-week-header-${col.toISOString()}-hour`
```

Implemented keying:

```tsx
const key = `resource-week-header-${index}`
```

## What we can and cannot claim

What we can claim:
- Timestamp-only keys were not safe in this render path.
- Switching to index-based keys removes key collisions in this list.

What we cannot claim with confidence from the current code alone:
- The exact internal data path that produced repeated timestamps.
- That `getViewHours()` itself emits duplicates (it currently builds a filtered day-hour list, not a per-resource concatenated list).

## Is the current fix good?

For this specific list, yes. It is a pragmatic and acceptable fix:
- The row is a presentational header, not interactive stateful list items.
- The order is deterministic for a given render input.
- It eliminates the React warning immediately.

Tradeoff:
- Index keys are tied to position, so if item order/length changes between renders, React may remount/reconcile less efficiently than with a semantic key.

## Optional hardening (not required right now)

If you want stable semantic keys even when duplicates exist, build a deduped composite key with an occurrence counter:

`<timestamp>-dup-<n>`

That keeps uniqueness without depending purely on index.

## Current status

- Fix is implemented locally in `resource-week-horizontal.tsx` (key now uses `index`).
- This should be safe to ship for the header-row use case.
