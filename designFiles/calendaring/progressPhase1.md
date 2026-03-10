# Calendaring Feature — Phase 1 Progress

> **How to resume**: Read this file, then read `designFiles/calendaring/README.md` and sub-docs for full context.
> Check off items (`- [x]`) as they are completed. Each item is a discrete, reviewable unit of work.
> Phase 2 checklist items will be added only after Phase 1 is complete.

---

## Phase 1 — Core Calendar

### 1. Dependencies & Tailwind Config

- [x] **1.1** Install `@ilamy/calendar` and `rrule` npm packages
  - `npm install @ilamy/calendar rrule`
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Package Installation"

- [x] **1.2** Add `@source` directive to [`src/styles/globals.css`](src/styles/globals.css) so Tailwind scans the calendar package
  - Add `@source "../node_modules/@ilamy/calendar/dist";` after the `@import "tailwindcss";` line
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Tailwind CSS Configuration"

- [x] **1.3** Create [`src/lib/dayjs-config.ts`](src/lib/dayjs-config.ts) with dayjs plugin setup (utc, timezone, isSameOrAfter, isSameOrBefore)
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Day.js Configuration"

---

### 2. Database Schema Migration

- [x] **2.1** Add four new enums to [`prisma/schema.prisma`](prisma/schema.prisma):
  - `EventType` (BLOCK, BOOKABLE, COACHING_SLOT)
  - `RegistrationType` (PER_INSTANCE, PER_SERIES)
  - `ProductCategory` (COACHING_SESSION, CALENDAR_EVENT, COACHING_SLOT, CREDIT_PACK)
  - `RegistrationStatus` (CONFIRMED, CANCELLED)
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "Enums"

- [x] **2.2** Add `ClubResourceType` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Fields: `resourceTypeId`, `clubShortName`, `name` (VarChar 100), `color`, `backgroundColor`, `createdAt`, `updatedAt`
  - Relations: `club` (Club, onDelete: Cascade), `resources` (ClubResource[])
  - `@@unique([clubShortName, name])`, `@@index([clubShortName])`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "ClubResourceType"

- [x] **2.3** Add `ClubResource` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Fields: `resourceId`, `clubShortName`, `resourceTypeId`, `title` (VarChar 200), `description`, `color`, `backgroundColor`, `position` (Int, default 0), `isActive` (Boolean, default true), `createdAt`, `updatedAt`
  - Relations: `club` (Cascade), `resourceType` (**onDelete: Restrict**), `businessHours`, `events`
  - `@@index([clubShortName])`, `@@index([resourceTypeId])`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "ClubResource"

- [x] **2.4** Add `ResourceBusinessHours` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Fields: `businessHoursId`, `resourceId`, `daysOfWeek` (String[]), `startTime` (Int), `endTime` (Int), `createdAt`, `updatedAt`
  - Relation: `resource` (ClubResource, onDelete: Cascade)
  - `@@index([resourceId])`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "ResourceBusinessHours"

- [x] **2.5** Add `CalendarEvent` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Core fields: `eventId`, `clubShortName`, `resourceId` (nullable, **onDelete: SetNull**), `title` (VarChar 500), `description`, `start`, `end`, `allDay`, `color`, `backgroundColor`
  - Recurrence fields: `uid`, `rrule`, `exdates` (DateTime[]), `recurrenceId`, `parentEventId` (self-relation `"EventInstances"`, **onDelete: Cascade**)
  - Bookable fields with safe defaults (unused in V1): `eventType` (default BLOCK), `isBlocking` (default true), `isPublic` (default false), `maxParticipants`, `registrationType`, `creditCost`, `productId` (**onDelete: SetNull**), `resourceIds` (String[])
  - Metadata: `createdByUserId` (**onDelete: Cascade**), `isDeleted` (default false), `deletedAt`, `createdAt`, `updatedAt`
  - All indexes: `[clubShortName]`, `[resourceId]`, `[uid]`, `[parentEventId]`, `[createdByUserId]`, `[isDeleted]`, `[start, end]`, `[eventType]`, `[productId]`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "CalendarEvent"

- [x] **2.6** Add `Product` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Fields: `productId`, `clubShortName`, `category` (ProductCategory), `name` (VarChar 200), `description`, `priceInCents` (Int), `currency` (default "usd"), `polarProductId` (@unique), `polarPriceId`, `isActive` (default true), `createdByUserId`, `createdAt`, `updatedAt`
  - Relations: `club` (Cascade), `createdByUser` (named `"CreatedProducts"`), `calendarEvents` (CalendarEvent[]), `registrations` (EventRegistration[])
  - `@@index([clubShortName])`, `@@index([category])`, `@@index([polarProductId])`, `@@index([createdByUserId])`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "Product"

- [x] **2.7** Add `EventRegistration` model to [`prisma/schema.prisma`](prisma/schema.prisma)
  - Fields: `registrationId`, `eventId`, `productId`, `userId`, `instanceDate` (DateTime, nullable), `polarOrderId`, `status` (RegistrationStatus, default CONFIRMED), `createdAt`, `updatedAt`
  - **No `@@unique` constraint** on `[eventId, userId, instanceDate]` — enforced in app logic only (comment in schema explaining why)
  - `@@index([eventId])`, `@@index([productId])`, `@@index([userId])`, `@@index([polarOrderId])`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "EventRegistration"

- [x] **2.8** Update `Club` model in [`prisma/schema.prisma`](prisma/schema.prisma) — add four new relation fields:
  - `resourceTypes ClubResourceType[]`
  - `resources ClubResource[]`
  - `calendarEvents CalendarEvent[]`
  - `products Product[]`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "Required Changes to Existing Models"

- [x] **2.9** Update `User` model in [`prisma/schema.prisma`](prisma/schema.prisma) — add three new relation fields:
  - `createdCalendarEvents CalendarEvent[]`
  - `createdProducts Product[] @relation("CreatedProducts")`
  - `eventRegistrations EventRegistration[] @relation("EventRegistrations")`
  - Ref: [`designFiles/calendaring/database-schema.md`](designFiles/calendaring/database-schema.md) § "Required Changes to Existing Models"

- [x] **2.10** Run Prisma migration: `npx prisma migrate dev --name add-calendaring-models`
  - ✅ Confirmed — `prisma/migrations/20260218213158_add_calendaring_models/` exists

---

### 3. tRPC `calendar` Router

- [x] **3.1** Add `coachProcedure` to [`src/server/api/trpc.ts`](src/server/api/trpc.ts)
  - Allows COACH users only (`user.userType === UserType.COACH`)
  - Follows same pattern as existing `facilityProcedure` (load user, check type, pass `ctx.user`)
  - Ref: [`designFiles/calendaring/api-design.md`](designFiles/calendaring/api-design.md) § intro (coachProcedure mentioned)

- [x] **3.2** Create [`src/server/api/routers/calendar.ts`](src/server/api/routers/calendar.ts) — Resource Type procedures:
  - `createResourceType` (facilityProcedure)
  - `getResourceTypes` (protectedProcedure) — includes `_count: { resources }`, ordered by name
  - `updateResourceType` (facilityProcedure) — verify ownership, handle duplicate name conflict
  - `deleteResourceType` (facilityProcedure) — friendly error if active resources exist before attempting delete
  - Include `requireSameClub` helper and `DEFAULT_COLOR` / `DEFAULT_BG_COLOR` constants
  - Ref: [`designFiles/calendaring/api-design.md`](designFiles/calendaring/api-design.md) § "Resource Type Procedures"

- [x] **3.3** Add Resource procedures to [`src/server/api/routers/calendar.ts`](src/server/api/routers/calendar.ts):
  - `createResource` (facilityProcedure) — verify resourceType belongs to club, create with businessHours in a transaction, auto-assign position if not provided
  - `getResources` (protectedProcedure) — active only, ordered by `position`, includes `resourceType` + `businessHours`
  - `updateResource` (facilityProcedure) — verify ownership, verify new resourceTypeId if changing
  - `updateResourceBusinessHours` (facilityProcedure) — replace-all strategy in transaction, validate `startTime < endTime`
  - `deleteResource` (facilityProcedure) — soft deactivate (`isActive = false`), not hard delete
  - Ref: [`designFiles/calendaring/api-design.md`](designFiles/calendaring/api-design.md) § "Resource Procedures"

- [x] **3.4** Add Event procedures to [`src/server/api/routers/calendar.ts`](src/server/api/routers/calendar.ts):
  - `createEvent` (facilityProcedure) — validate `end > start`, verify resourceId ownership, generate `uid` as `${eventId}@shuttlementor.com`, validate RRULE if provided
  - `getEvents` (protectedProcedure) — date-range query with recurring event filter logic (no `until` OR `until >= startDate`, AND `start < endDate`); include `resource`, `product`, `_count.registrations` (CONFIRMED only), `createdByUser`
  - `updateEvent` (facilityProcedure) — verify ownership + not deleted, validate RRULE if changing; V1 whole-series only
  - `deleteEvent` (facilityProcedure) — soft delete (`isDeleted = true`, `deletedAt = now()`); also soft-delete all modified instances (`parentEventId = eventId`)
  - `checkConflicts` (protectedProcedure) — blocking events only (`isBlocking = true`), non-recurring overlap + server-side RRULE expansion for recurring; warning-only (no hard block)
  - Ref: [`designFiles/calendaring/api-design.md`](designFiles/calendaring/api-design.md) § "Event Procedures"

- [x] **3.5** Register `calendarRouter` in [`src/server/api/root.ts`](src/server/api/root.ts)
  - Import and add `calendar: calendarRouter` to `appRouter`
  - Ref: [`designFiles/calendaring/api-design.md`](designFiles/calendaring/api-design.md) § "Router Registration"

---

### 4. Navigation

- [x] **4.1** Add "Calendar" nav item to [`src/app/_components/client/authed/SideNavigation.tsx`](src/app/_components/client/authed/SideNavigation.tsx)
  - Place after "Dashboard" and before "Video Collections"
  - `href: "/calendar"`, calendar SVG icon, `userTypes: [STUDENT, COACH, FACILITY, ADMIN]`
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Navigation Changes"

---

### 5. `/calendar` Page

- [x] **5.1** Create [`src/app/calendar/page.tsx`](src/app/calendar/page.tsx) — server component
  - Wrap `CalendarClient` in `OnboardedGuard` (same pattern as `/dashboard`)
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Page Architecture"

- [x] **5.2** Create [`src/app/calendar/CalendarClient.tsx`](src/app/calendar/CalendarClient.tsx) — main client component
  - `"use client"` directive; import `dayjs-config.ts` early
  - State: `currentDate` (dayjs), `currentView` (week/month/day)
  - Compute `viewRange` with ±1 week buffer via `useMemo`
  - Fetch user via `api.user.getOrCreateProfile.useQuery()`
  - Fetch resources via `api.calendar.getResources.useQuery()`
  - Fetch events via `api.calendar.getEvents.useQuery({ startDate, endDate }, { keepPreviousData: true })`
  - Role flags: `isStudent`, `isCoach`, `isFacilityOrAdmin`, `canCreateEvents`
  - `transformResources()` and `transformEvents()` functions (RRULE parsing via `RRule.fromString().origOptions`)
  - `handleEventAdd`, `handleEventUpdate`, `handleEventDelete` wired to tRPC mutations with cache invalidation
  - UTC conversion in handlers: `dayjs(event.start).utc().toDate()`
  - `onDateChange` / `onViewChange` handlers
  - Loading skeleton state
  - Render `IlamyResourceCalendar` with `key={userTimezone}`, `timezone`, access control props, and all callbacks
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Component Design" and "Date Range Management"

---

### 6. Resource Management UI

- [x] **6.1** Create resource management UI — FACILITY/ADMIN only
  - Implemented as a dedicated page at `/calendar/resources` (not a panel toggle)
  - `src/app/calendar/resources/page.tsx` — server component with FACILITY/ADMIN redirect guard
  - `src/app/calendar/resources/ResourceManagerClient.tsx` — full CRUD for resource types, resources, and business hours
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Resource Management UI"

- [x] **6.2** Integrate resource management link into `CalendarClient.tsx`
  - "Manage Resources" button (with Settings icon) shown only when `isFacilityOrAdmin`, links to `/calendar/resources`
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Resource Management UI"

---

### 7. Conflict Warning

- [x] **7.1 + 7.2** Conflict enforcement moved server-side (design decision change)
  - `ConflictWarningDialog` not implemented — instead, conflict check is enforced **in the `createEvent` and `updateEvent` mutations** via a `checkResourceConflicts()` helper
  - Throws `CONFLICT` tRPC error with message listing conflicting event titles
  - Covers non-recurring blocking events; recurring conflict detection still available via the separate `checkConflicts` query procedure
  - ⚠️ `onError` toast handling in `CalendarClient` still needed to surface the error to the user
  - Ref: [`designFiles/calendaring/frontend-integration.md`](designFiles/calendaring/frontend-integration.md) § "Event Lifecycle Handlers"

---

> **iCal Export** is automatically available via `@ilamy/calendar`'s built-in export button — no additional work needed in Phase 1.
> Ref: [`designFiles/calendaring/recurrence-strategy.md`](designFiles/calendaring/recurrence-strategy.md) § "iCal Export Compatibility"

---

## Code Review Findings

### ✅ What's Correct

- **Schema**: All models, enums, relations, indexes, and `onDelete` behaviors match the design doc exactly. No-unique-constraint comment on `EventRegistration` is present and correct.
- **`coachProcedure`**: Correctly implemented, follows the exact same pattern as `facilityProcedure`.
- **Router registration**: `calendarRouter` properly imported and added to `appRouter`.
- **Resource type CRUD**: Ownership verification, duplicate name `CONFLICT` error, and friendly error on delete-with-active-resources are all correct.
- **Resource CRUD**: Transaction for create-with-business-hours, auto-position, replace-all for business hours update, soft deactivate on delete — all correct.
- **`getEvents` recurring filter**: Correctly filters expired series by parsing `until` from RRULE. CONFIRMED-only registration count is correct.
- **`checkConflicts`**: Properly expands recurring events server-side, respects `isBlocking = true`, excludes exdated instances, supports `excludeEventId`.
- **`CalendarClient`**: `useMemo` on both transforms (design doc noted this as a future optimization — done upfront, good), `keepPreviousData`, `key={userTimezone}`, UTC conversion in handlers, role flags, `onViewChange` guards against `"year"` view.
- **`dayjs-config.ts`**: All four required plugins registered in correct order.
- **Tailwind `@source`**: Correctly placed on line 2, immediately after `@import "tailwindcss"`.
- **Navigation**: Uses `lucide-react` `<Calendar>` icon instead of the inline SVG in the design doc — acceptable and cleaner.

### ✅ Fixed

- **Bug 1 — two-step UID**: `createEvent` now pre-generates `eventId` via `crypto.randomUUID()` and sets `uid` in the same `create` call. No second DB round-trip.
- **Bug 2 — modified instances**: `getEvents` query now has a third `OR` branch fetching `parentEventId: { not: null }` events in the date range.
- **Bug 3 — `parseRRule` inside component**: moved to module scope above `CalendarClient`.
- **Conflict enforcement**: `checkResourceConflicts()` helper added; called in both `createEvent` and `updateEvent` before the DB write. Throws `CONFLICT` tRPC error on overlap.
- **Resource Management UI**: `/calendar/resources` page + `ResourceManagerClient.tsx` created with full CRUD for types, resources, and business hours. "Manage Resources" link added to `CalendarClient` for FACILITY/ADMIN.

### ✅ Also Fixed

- **`onError` toast on mutations**: `useToast` hook + `ToastContainer` built in `src/app/_components/shared/Toast.tsx` (no new packages — React state + Lucide icons + existing CSS variables). All three mutations in `CalendarClient` now call `toast(err.message, "error")` in `onError`. Auto-dismisses after 5 s. See Toast spec below.
- **`Manage Resources` link styling**: Updated to `rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-[var(--accent)]` — matches SideNavigation's nav link pattern exactly.
- **`renderEventForm` custom modal**: `EventFormModal.tsx` implemented as a right slide-over with title, resource selector, start/end datetime, all-day toggle, recurrence (RRULE), and description. `RecurrenceEditor.tsx` ported from ilamy-calendar source (not exported by the npm package). Both files carry a `TODO` comment to replace them once the upstream PR is merged and `EventFormDialog` + `RecurrenceEditor` are exported from `@ilamy/calendar`.
- **Duplicate DB insert bug**: `onEventAdd` removed from `<IlamyResourceCalendar>` props — the modal's `createMutation` is the sole owner of event creation. Previously `onAdd(buildEvent())` triggered `handleEventAdd` which fired a second insert (without rrule).
- **NavBar hydration error**: Fixed SSR mismatch by gating auth-conditional nav on `isLoaded`.

### ✅ Phase 1 Complete

All checklist items and deferred items are now done. See `progressPhase2.md` for the next phase.

---

### Spec: Toast Notification System

**File:** `src/app/_components/shared/Toast.tsx`

**Design decisions:**
- No new packages — built on React `useState` + Lucide icons + existing CSS variables and `globals.css` animation classes.
- `useToast()` hook returns `{ toasts, toast, dismiss }`. Call `toast(message, variant)` anywhere in the component tree that imports the hook.
- Variants: `"success"` (green), `"error"` (red / `--destructive`), `"info"` (indigo / `--primary`).
- Auto-dismisses after 5 seconds; user can also dismiss manually via the X button.
- Uses `glass-panel` + `animate-slide-in-right` from `globals.css` — no extra CSS needed.
- `ToastContainer` is a fixed-position overlay rendered inside the page component (not a global provider), so it stays scoped to the page that needs it.

**Mobile considerations (aligned with upcoming mobile migration):**
- Container is `fixed bottom-4 right-4` on mobile, `sm:bottom-6 sm:right-6` on larger screens.
- Toast width is `max-w-sm w-full` — on narrow screens it will naturally fit within the viewport without overflowing.
- The `shrink-0` on the icon and dismiss button prevents them from collapsing on small screens.
- When the mobile migration introduces a bottom navigation bar, the toast offset (`bottom-4`) may need to increase to `bottom-16` or similar to avoid overlap — flag this during the mobile migration phase.
- `aria-live="polite"` on the container ensures screen readers announce toasts without interrupting the user.

**Reuse guidance:**
- `useToast` + `ToastContainer` can be dropped into any client component that needs mutation feedback — not calendar-specific.
- For the `renderEventForm` modal (when implemented), import the same hook to surface save/conflict errors inside the modal.

---

### Spec: `renderEventForm` Custom Event Modal

**Architecture Decision: slide-over modal, not a new page.**
- `@ilamy/calendar`'s `renderEventForm` prop passes `EventFormProps` and expects inline JSX — designed for a modal pattern.
- Navigating to a new page loses calendar scroll position, selected date, and view state.
- A right slide-over keeps the calendar visible so users can see the time slot they're filling.

**`EventFormProps` interface (from `@ilamy/calendar`):**
```ts
interface EventFormProps {
  open: boolean;
  selectedEvent: CalendarEvent | null; // null = new event, non-null = edit
  onAdd: (event: CalendarEvent) => void;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onClose: () => void;
}
```

**File location:** `src/app/calendar/EventFormModal.tsx`

**Form fields required:**
| Field | Input type | Notes |
|---|---|---|
| Title | `<Input>` text | Required, maxLength 500 |
| Resource | `<select>` | Populated from `resources` prop passed down; optional |
| Start date/time | `<input type="datetime-local">` | Pre-filled from `selectedEvent.start` |
| End date/time | `<input type="datetime-local">` | Pre-filled from `selectedEvent.end` |
| All day | `<input type="checkbox">` | Hides time fields when checked |
| Description | `<textarea>` | Optional |
| Recurrence (RRULE) | Custom sub-form | See below |
| Text color | `<input type="color">` | Optional, defaults to `--primary` |
| Background color | `<input type="color">` | Optional, defaults to `--accent` |

**Recurrence sub-form (RRULE builder — V1 scope only):**
- Frequency selector: None / Daily / Weekly / Monthly
- When Weekly: day-of-week multi-select (Mon–Sun checkboxes)
- When Monthly: day-of-month number input
- Interval: number input (e.g. "every N weeks")
- End condition: Never / Until date / Count (number of occurrences)
- On save, serialize to RRULE string via `new RRule({ freq, interval, byweekday, until, count }).toString()`

**Behavior:**
- `selectedEvent === null` → "New Event" mode; start/end pre-filled from the clicked time slot
- `selectedEvent !== null` → "Edit Event" mode; all fields pre-filled; show Delete button
- Delete button: calls `onDelete(selectedEvent)` after `window.confirm()`
- Save button: calls `onAdd(event)` or `onUpdate(event)` depending on mode
- Cancel / backdrop click: calls `onClose()`
- Slide-over from the right; overlay backdrop dims the calendar

**Styling:**
- Use `glass-panel` for the modal container
- Use shared `Button` and `Input` components throughout
- Use `var(--foreground)`, `var(--muted-foreground)`, `var(--border)` tokens for all text/borders
- Width: `w-full max-w-md` fixed on the right edge

**Integration in `CalendarClient.tsx`:**
```tsx
import EventFormModal from "~/app/calendar/EventFormModal";
// ...
renderEventForm={(props) => (
  <EventFormModal {...props} resources={resources} />
)}
```

**Access control:** Only render `renderEventForm` when `canCreateEvents` is true. Students see read-only event detail (ilamy handles this via `disableCellClick`).

### Architecture Decision: ResourceManager

**Dedicated page at `/calendar/resources`**, not a panel toggle. Rationale:
- Three distinct sections (types, resources, business hours) are too complex for a sidebar panel.
- Independently navigable — useful for bookmarking and future onboarding flows.
- Keeps `CalendarClient` lean.
