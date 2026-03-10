# Shuttlementor — Session Handoff (Mar 9, 2026)

> **Purpose**: Full context for the next LLM session to pick up exactly where this one left off.
> Read this file + `designFiles/calendaring/progressPhase2.md` before starting any work.

---

## Project Overview

**Shuttlementor** is a Next.js 14 (App Router) + tRPC + Prisma + PostgreSQL app for managing
badminton clubs. Key features: multi-club, role-based (ADMIN, FACILITY, COACH, STUDENT),
calendar/event management, video coaching notes, product/payment integration (Polar — not yet live).

**Stack**: Next.js 14, TypeScript, Prisma ORM, PostgreSQL, tRPC, Clerk (auth), TailwindCSS,
shadcn/ui, `@ilamy/calendar` (custom calendar component library in sister workspace).

**Repo root**: `/Users/sumanth/Desktop/shuttlementorWorkspace/shuttlementor/`

**Sister workspace**: `/Users/sumanth/Desktop/shuttlementorWorkspace/ilamy-calendar/`
(the calendar component library — only touch if asked)

---

## Current Branch

`feat-calendar` — all Phase 2 calendaring work lives here.

---

## Phase 2 Status: LARGELY COMPLETE

All high/medium/low priority items from the previous handoff are done. See
`designFiles/calendaring/progressPhase2.md` for the full checklist. Summary:

### Completed (this session)

- **A** — `CHECK_IN` action added to `updateRegistrationStatus` mutation
- **B** — All `_count.registrations` capacity filters include `CHECKED_IN` (7 locations + roster query)
- **C** — `showRegistrantNames` fully wired: schema → router schema → `getPublicEventById` conditional
  include → `BookableEventDetails` toggle + display → `EventDetailClient` passing props
- **D** — Recurring edit/delete scope (`THIS` / `THIS_AND_FUTURE` / `ALL`) implemented in
  `updateEvent` + `deleteEvent` router handlers and `EventFormModal` scope selector UI
  - `THIS` on `BOOKABLE`/`COACHING_SLOT` with active registrations: blocked (guard + TODO migration comment)
  - `THIS_AND_FUTURE` on `BOOKABLE`/`COACHING_SLOT`: blocked (guard + TODO migration comment)
  - Registration instance-only confirmed; series-level (`PER_SERIES`) is schema-only, no UI
- **E1** — `window.confirm` → `AlertDialog` component (`src/app/_components/shared/AlertDialog.tsx`)
  wired into `EventFormModal`; dialog description is scope-aware
- **E2** — Color picker in `EventFormModal`: 14 Tailwind swatches (matching ilamy `COLOR_OPTIONS`),
  `color` state wired to `updateMutation`; event `color`/`backgroundColor` schema validation
  relaxed from `hexColorRegex` to plain `z.string()` to accept Tailwind class strings

### Previously completed (earlier sessions)

- Prisma migrations (3 applied): `CHECKED_IN` status, `CONFIRMED`→`REGISTERED` rename,
  `showRegistrantNames Boolean @default(false)` on `CalendarEvent`
- Full registration section in `calendar.ts`: `registerForEvent`, `cancelRegistration`,
  `getMyRegistrations`, `updateRegistrationStatus`, `getEventRegistrations`
- Role-based event type restrictions in `createEvent`/`updateEvent`/`deleteEvent`
- `BookableEventDetails` component + `/events/[eventId]` page
- Product CRUD router + `/products` page
- Student calendar view (`IlamyCalendar`, direct navigation to event page)
- Calendar view toggle (resource ↔ standard) for staff
- BUG-1 fix: `studentVisibility` filter moved inside each `OR` branch in `getEvents`

---

## What Still Needs To Be Done

### Registration Migration (future, not urgent)

Two guards exist in `calendar.ts` with `// TODO` comments marking the migration path:

1. **`THIS` scope on registerable events with active registrations** (both `updateEvent` and
   `deleteEvent`) — currently blocked with a user-facing error. Future: create a detached occurrence
   event (`parentEventId = eventId`), migrate registrations to it, cancel originals on base series.

2. **`THIS_AND_FUTURE` scope on `BOOKABLE`/`COACHING_SLOT`** (both `updateEvent` and `deleteEvent`)
   — currently blocked. Future: re-point forward registrations (`instanceDate >= split point`) from
   old `eventId` to newly created series `eventId`, preserving status and `instanceDate`.

### ilamy-calendar PR (low priority, monitor)

`EventFormModal.tsx` and `RecurrenceEditor.tsx` are local ports of ilamy components. Once the
upstream PR exporting `EventFormDialog` and `RecurrenceEditor` is merged and published, remove
these local files and import directly from `@ilamy/calendar`. Both files have TODO comments.

### UI / minor

- **Toast bottom offset** (7.4): When mobile nav is built, increase `ToastContainer` bottom offset
  from `bottom-4` to `bottom-16`.

### Payments (Polar) — Phase 8, blocked on product/pricing design

- Items 10.1–10.3: Polar product sync, checkout flow, credit pack support.
- Walk-in billing (CHECKED_IN without prior REGISTERED) is also Phase 8.

---

## Key File Map

| File | Purpose |
|------|---------|
| `src/server/api/routers/calendar.ts` | All calendar + registration tRPC procedures |
| `src/server/api/routers/products.ts` | Product CRUD |
| `src/server/api/root.ts` | tRPC router wiring |
| `src/app/calendar/CalendarClient.tsx` | Main calendar UI (staff + student views) |
| `src/app/calendar/EventFormModal.tsx` | Create/edit event form (local port from ilamy) |
| `src/app/calendar/RecurrenceEditor.tsx` | Recurrence rule editor (local port from ilamy) |
| `src/app/_components/shared/AlertDialog.tsx` | Reusable confirm dialog (destructive variant) |
| `src/app/events/[eventId]/page.tsx` | Event detail server component |
| `src/app/events/[eventId]/EventDetailClient.tsx` | Event detail client (register/cancel/roster) |
| `src/app/events/_components/BookableEventDetails.tsx` | Edit panel for event details |
| `prisma/schema.prisma` | DB schema — source of truth |
| `designFiles/calendaring/progressPhase2.md` | Detailed phase 2 checklist + decisions |
| `designFiles/calendaring/progressPhase1.md` | Phase 1 reference |

---

## Important Constraints / Decisions

1. **No billing/credit deduction for `CHECKED_IN` yet** — implement alongside Polar in Phase 8.

2. **No profile pictures for registrants yet** — roster shows `firstName + lastInitial` only.
   The `getEventRegistrations` query has a comment marking where to add `profilePicture` later.

3. **Router consolidation is final** — `createEvent`, `updateEvent`, `deleteEvent` are
   `protectedProcedure` with in-handler role checks. Do not revert to `facilityProcedure`.

4. **`showRegistrantNames` per-event toggle** — not a global club setting.

5. **Instance-level registration only** — `PER_SERIES` is in the schema but no UI/UX designed yet.
   Do not build series-level registration UI until explicitly requested.

6. **Event `color` field stores Tailwind class strings** — e.g. `"bg-blue-100 text-blue-800"`.
   Validation in `createEventSchema` and `updateEventSchema` is `z.string()` (not `hexColorRegex`).
   Resource type color fields still use `hexColorRegex` — do not change those.

7. **Prisma schema `url` lint warning** — Prisma 7 deprecation notice, safe to ignore.

8. **`ilamy-calendar` local ports** — do not refactor unless asked.

---

## Schema Lint Warning (Known, Safe to Ignore)

```
The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts`...
```
This is a Prisma 7 deprecation notice. The app works correctly. Address only if user requests it.

---

## Suggested First Task for Next Session

Phase 2 is complete. The natural next area is either:
- **Registration migration** (unblocking `THIS`/`THIS_AND_FUTURE` scopes for registerable events)
- **Payments / Polar** (Phase 8) — requires product/pricing design decision first
- **Mobile nav** (unlocks toast offset fix 7.4)

Read `designFiles/calendaring/progressPhase2.md` for full checklist detail before starting.
