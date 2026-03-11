# Session Handoff

> Generated: 2026-03-10. Read this before starting the next session.

---

## What Was Completed This Session

### 1. `staffProcedure` added to `trpc.ts` ✓
- Added `staffProcedure` (lines 213–243) that allows `FACILITY | ADMIN | COACH`
- Used by event mutation procedures to replace their inline role guards
- File: `src/server/api/trpc.ts`

### 2. `calendar.ts` refactored to use `staffProcedure` ✓
- Swapped `createEvent`, `updateEvent`, `deleteEvent`, `getEventRegistrations` from `protectedProcedure` → `staffProcedure`
- Removed duplicate `getCurrentUser(ctx)` calls + top-level `if (!isFacilityOrAdmin && !isCoach)` blocks from those 4 procedures
- Ownership/type-specific business logic (e.g. coaches can only edit own events) was **preserved** as-is
- `updateRegistrationStatus` intentionally left as `protectedProcedure` — students call it too (CANCEL action)
- File: `src/server/api/routers/calendar.ts`
- `tsc --noEmit` was clean after these changes

### 3. `progressPhase3.md` reorganized ✓
- New structure: **Priority 1** (calendaring non-payment) → **Priority 2** (registration migration) → **Priority 3** (Polar payments) → **Optional: Platform Polish**
- All prior items preserved, just renumbered/regrouped
- Platform items (multi-club, UI consolidation, coach profiles, security) are in the optional section with lettered IDs (A1–D3)
- File: `designFiles/progressPhase3.md`

### 4. `nextSteps.md` cleaned ✓
- Removed only completed items: Info import fix, `userType` prop removal, `handleCoachAssigned` cleanup, input schema extraction, regex validation, `canCreateNotes` UI gating
- All pending/future items preserved
- File: `designFiles/nextSteps.md`

### 5. `ilamy-key-bug-analysis.md` deleted ✓
- Was requested; file no longer exists (was already gone when deletion was attempted)

---

## Open Issues — Needs Investigation in Next Session

### Bug A: "Manage Resources" redirects to home page
**Route**: `/calendar/resources`  
**Symptom**: Clicking "Manage Resources" button in the calendar page redirects the admin user back to the home page.  
**What we know**:
- `src/app/calendar/resources/page.tsx` calls `getOnboardedUserOrRedirect()` then checks `userType !== FACILITY && userType !== ADMIN` → `redirect("/calendar")`
- `getOnboardedUserOrRedirect()` defaults: unauthenticated → `"/"`, incomplete profile → `"/profile"`
- If the user lands on `/` (public landing), it means `!session?.userId` is true server-side — Clerk isn't returning a session for that route
- If the user lands on `/home` (authed dashboard), a different redirect is happening

**Diagnostic needed**: In browser DevTools → Network tab, click "Manage Resources" and look at:
1. What URL the 302 redirect points to (`/` vs `/home` vs `/profile`)
2. Whether it's a server-side or client-side redirect

**Possible causes to check**:
- Admin user's DB record might be missing `firstName`, `lastName`, or `email` → `isOnboardedUser()` returns false → redirects to `/profile`
- Clerk session not being read in async server component (less likely with Clerk v6 but worth checking)
- `NavBar.tsx` has a `useEffect` that redirects signed-in users on `"/"` to `"/home"` — not the cause here but note it exists at `src/app/_components/client/public/NavBar.tsx:43-54`

**Relevant files**:
- `src/app/calendar/resources/page.tsx`
- `src/app/_components/server/OnboardedGuard.tsx`
- `src/lib/utils.ts` — `isOnboardedUser()` checks `firstName`, `lastName`, `email`

---

### Bug B: Standard calendar view shows blank/stripes after creating an event
**Route**: `/calendar` (toggled to standard view)  
**Symptom**: After creating an event in the standard `IlamyCalendar` view, the calendar shows blank with faint horizontal stripes at ~9–10 AM. Events don't appear.

**Context**:
- The stripes are **not** from the resource calendar — user confirmed this happens in the standard view toggle
- The `IlamyResourceCalendar` uses `key="resource-{userTimezone}"` and `IlamyCalendar` uses `key="standard-{userTimezone}"` — they are separate component instances
- When toggling between the two, both components unmount/remount due to different `key` values

**Suspected root causes**:

1. **`key` prop forces full remount on toggle** — when switching resource → standard, the `IlamyCalendar` mounts fresh with `events=[]` while `getEvents` is still fetching (or using `keepPreviousData`). The stripes may be the calendar rendering with no events during the loading window.

2. **`onAdd` callback with empty `id`** — `EventFormModal.buildEvent()` returns `id: selectedEvent?.id ?? ""` (empty string for new events). After `createMutation` succeeds, it calls `onAdd?.(buildEvent())` passing an event with `id: ""`. The ilamy calendar may reject/ignore events with empty IDs, causing optimistic render to fail. The `invalidate()` eventually brings real data back, but there may be a flash.

3. **`keepPreviousData`** — `getEvents` uses `keepPreviousData`, which shows stale data during refetch. After `invalidate()`, if stale data is empty or from a different date range, it might briefly show nothing.

**What to verify first**:
- Does the blank state persist after a hard page refresh? If events appear after refresh → it's a temporary render/fetch issue, not a save failure
- Does switching back to resource view after the blank show events? If yes → the events ARE saved, it's a rendering issue specific to `IlamyCalendar`
- Check browser console for any errors from ilamy after creating an event in standard view

**Suspected fix direction**:
- Remove the `key` prop difference between the two calendars OR pass the same `key` to both so they don't remount on toggle
- Or: ensure `events` prop is always populated before the calendar renders (don't render until `eventsData` is loaded)

**Relevant files**:
- `src/app/calendar/CalendarClient.tsx` — lines 304–358 (both calendar components), lines 46–58 (`viewRange`/`key` props), lines 65–74 (`getEvents` query with `keepPreviousData`)
- `src/app/calendar/EventFormModal.tsx` — lines 174–186 (`createMutation`), lines 214–228 (`buildEvent`)

---

### Thread C: ilamy resource↔standard calendar switching pattern
**Question**: Does ilamy have a built-in/recommended way to switch between `IlamyCalendar` and `IlamyResourceCalendar` while keeping events in sync?

**What was attempted**: Tried reading ilamy docs/source but `node_modules` is gitignored and the ilamy docs URLs 404'd.

**What to try next session**:
- Check `https://ilamy.dev/docs` for a "switching views" or "resource calendar" guide
- Look at whether ilamy exports a single unified component that handles both modes via a prop (rather than two separate components)
- Check the ilamy GitHub releases page (`https://github.com/kcsujeet/ilamy-calendar/releases`) — a recent release note mentioned `ResourceCalendarEvent` type was removed and merged into `CalendarEvent`, suggesting the two components share state

---

## Current `progressPhase3.md` Structure (for reference)

```
Priority 1 — Calendaring Phase 2.5 (no payments needed)
  C1 - renderEvent with capacity badges
  C2 - Share links / copy link button
  C3 - staffProcedure ✓ Done
  C4 - Public calendar standalone page
  C5 - Embeddable calendar widget

Priority 2 — Registration migration (recurring events)
  R1 - THIS scope with active registrations
  R2 - THIS_AND_FUTURE scope

Priority 3 — Polar payments
  P1–P6

Optional: Platform Polish (pick-and-choose)
  A1–A4 Coach profile pages
  B1–B3 Video collections
  S1–S3 Security & architecture
  M1–M3 Multi-club architecture
  U1–U5 UI consolidation
  D1–D3 Dashboard & metrics
```

---

## Key File Locations

| File | Notes |
|------|-------|
| `src/server/api/trpc.ts` | `staffProcedure` added at lines ~213–243 |
| `src/server/api/routers/calendar.ts` | 4 procedures use `staffProcedure`; `staffProcedure` comment added to import |
| `designFiles/progressPhase3.md` | Fully reorganized this session |
| `designFiles/nextSteps.md` | Completed items removed |
| `src/app/calendar/CalendarClient.tsx` | Resource/standard toggle logic, `key` props, `viewRange` |
| `src/app/calendar/EventFormModal.tsx` | `createMutation`, `buildEvent`, `onAdd` callback |
| `src/app/calendar/resources/page.tsx` | `getOnboardedUserOrRedirect` + FACILITY/ADMIN guard |
| `src/app/_components/server/OnboardedGuard.tsx` | Default redirects: unauthed→`/`, incomplete→`/profile` |
| `src/lib/utils.ts` | `isOnboardedUser` checks firstName + lastName + email |
