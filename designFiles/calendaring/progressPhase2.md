# Calendaring Feature — Phase 2 Progress

> **How to resume**: Read this file + `progressPhase1.md` for full context.
> Phase 1 is complete. This file tracks Phase 2 work.
> Check off items (`- [x]`) as they are completed.
>
> **Audit (Mar 4, 2026)**: All checklist items verified against codebase. None are complete yet.
> DB schema has all necessary fields from Phase 1. Starting with task 2.1 (Product CRUD).

---

## Phase 2 — Bookable Events & Registration

### Context

The DB schema already has all the necessary fields for bookable events (`eventType`, `isPublic`,
`maxParticipants`, `registrationType`, `creditCost`, `productId`, `resourceIds`, `EventRegistration`,
`Product`). Phase 1 created only `BLOCK` events. Phase 2 exposes `BOOKABLE` and `COACHING_SLOT`
event types to coaches and students.

---

### 1. Role & Event Type Alignment

- [x] **1.1** Add `eventType` selector to `EventFormModal.tsx` (FACILITY/ADMIN and COACH only)
  - Options: `BLOCK` (default), `BOOKABLE`, `COACHING_SLOT`
  - Modal only captures: title, resource, start/end, recurrence, color, eventType, productId
  - All other bookable-event details (isPublic, maxParticipants, registrationType, description) are
    managed on a dedicated `/events/[eventId]` page via `BookableEventDetails` component

- [x] **1.2** Role-based event type restrictions
  - `FACILITY`/`ADMIN`: can create `BLOCK` and `BOOKABLE`
  - `COACH`: can only create `COACHING_SLOT`
  - `maxParticipants = 1` auto-enforced for `COACHING_SLOT`

- [~] **1.3** Link coaching slot registrations to `CoachingNote` creation flow — **deferred**

---

### 2. Product Linking

- [x] **2.1** Create `createProduct` / `getProducts` / `updateProduct` / `deleteProduct` procedures
  in `products.ts` router (FACILITY/ADMIN only)
  - `ProductCategory`: `COACHING_SESSION`, `CALENDAR_EVENT`, `COACHING_SLOT`, `CREDIT_PACK`
  - Include Polar `polarProductId` / `polarPriceId` fields (populated after Polar sync)
  - **Implementation**: Created separate `src/server/api/routers/products.ts` router with all CRUD operations
  - Wired into `src/server/api/root.ts` as `products` router
  - **Bonus**: Created `/products` page with full CRUD UI (table view, create/edit modal, delete)
  - Added "Products" nav link in SideNavigation (FACILITY/ADMIN only)

- [x] **2.2** Add product selector to `EventFormModal` for `BOOKABLE`/`COACHING_SLOT` events
  - Dropdown of active products scoped to the club (shown only when eventType !== BLOCK)
  - Filter: `CALENDAR_EVENT` products for BOOKABLE, `COACHING_SLOT` products for COACHING_SLOT

- [x] **2.3** Wire `eventType` + `productId` into `createEvent` / `updateEvent` mutations
  - Also added `COACHING_SLOT` to `createEventSchema` enum
  - Added `productId` to `updateEventSchema`

---

### 3. Bookable Event Details — Separate Component & Page

> **Design Decision (Mar 4, 2026)**: Bookable event details are NOT part of the creation modal.
> The modal only handles scheduling (type, resource, time, recurrence, product link).
> All details beyond scheduling live in a reusable `BookableEventDetails` component,
> surfaced at `/events/[eventId]` so admins/facility users can manage them after creation.
> This component can also be embedded elsewhere in future (e.g. event roster page).

- [x] **3.1** Create `BookableEventDetails` component (`src/app/events/_components/BookableEventDetails.tsx`)
  - Fields: `title` (read-only), `description`, `isPublic` toggle, `maxParticipants`, `registrationType`
  - Only rendered/editable for FACILITY/ADMIN on BOOKABLE and COACHING_SLOT events

- [x] **3.2** Create `updateEventDetails` tRPC procedure in `calendar.ts`
  - Accepts: `eventId`, `description`, `isPublic`, `maxParticipants`, `registrationType`
  - Separate from `updateEvent` (which handles scheduling changes)

- [x] **3.3** Create `/events/[eventId]` page
  - Server component fetches event by ID
  - Renders `BookableEventDetails` for FACILITY/ADMIN
  - Shows read-only summary + registration count

- [x] **3.4** Link to `/events/[eventId]` from calendar event click (for FACILITY/ADMIN on BOOKABLE events)

---

### 4. Student-Facing Calendar

- [x] **4.1** Show public bookable events to students (`isPublic = true`, `eventType = BOOKABLE`)
  - `getEvents` applies server-side filter for STUDENT role: `isPublic=true` + `eventType IN [BOOKABLE, COACHING_SLOT]`

> **Registration Status Model** (updated Mar 2026)
> `RegistrationStatus` enum has **five** values (DB migrated):
> - `REGISTERED` — active registration, credit consumed at registration time (renamed from `CONFIRMED`)
> - `CHECKED_IN` — student attended; no credit change if previously `REGISTERED`.
>   Walk-in check-in (no prior registration) requires billing at check-in time —
>   **TODO Phase 8**: implement alongside Polar/credit pack work.
> - `CANCELLED` — student cancelled; credit **forfeited**
> - `RESCHEDULED` — admin moved the student to another slot; credit **returned**
> - `NO_SHOW` — student did not attend; credit **forfeited**
>
> Only `REGISTERED` registrations count toward `currentRegistrations` / capacity.
> `CHECKED_IN` registrations also hold a seat (registered first, then checked in — same seat).
> Credit return logic (for `RESCHEDULED`) is handled in Phase 8 alongside Polar.

- [x] **4.2** Add "Register" button on event click for students
  - Shown on `EventDetailClient` when `eventType IN [BOOKABLE, COACHING_SLOT]`,
    `isPublic=true`, and `currentRegistrations < maxParticipants`
  - Also show current registration count and remaining spots

- [x] **4.3** `registerForEvent` tRPC mutation (protectedProcedure)
  - Creates `EventRegistration` with status `REGISTERED`
  - Checks `maxParticipants` not exceeded (count only `REGISTERED` registrations)
  - Checks for duplicate active registration (no re-register while already `REGISTERED`)
  - Allows re-register after `CANCELLED`/`NO_SHOW` (app-level, no DB unique constraint)

- [x] **4.4** `cancelRegistration` tRPC mutation (protectedProcedure)
  - Students can cancel their own registration → sets status to `CANCELLED`
  - Credit is forfeited (no refund)

- [x] **4.5** `updateRegistrationStatus` tRPC mutation (protectedProcedure)
  - Consolidated `markNoShow` + `rescheduleRegistration` + staff-initiated cancel into a
    single endpoint with `action: "CANCEL" | "NO_SHOW" | "RESCHEDULE" | "CHECK_IN"`
  - `CANCEL`: students can cancel own; coaches can cancel on their own events; facility/admin can cancel any in club
  - `NO_SHOW`: facility/admin only → sets status to `NO_SHOW`
  - `RESCHEDULE`: facility/admin only → marks old as `RESCHEDULED`, creates new `REGISTERED` on target event
  - `CHECK_IN`: facility/admin/coach (own events only) → transitions `REGISTERED` → `CHECKED_IN`
  - Walk-in billing (no prior REGISTERED) is TODO Phase 8

- [x] **4.6** `getMyRegistrations` tRPC query (protectedProcedure)
  - Returns all registrations for the current user with event details
  - Filterable by status (default: `REGISTERED` only)

- [x] **4.7** Event roster view for FACILITY/ADMIN/COACH on event detail page
  - `getEventRegistrations` query returns `REGISTERED` + `CHECKED_IN` registrants ordered by signup time
  - Returns `firstName` + `lastInitial` (e.g. "Alice B.") — no profile picture yet
  - Coaches can only see roster on their own events; facility/admin see all club events

---

### 5. Recurring Edit/Delete Scope (This Event / This & Future / All)

- [x] **5.1** Scope selector UI in `EventFormModal` — shown only when editing a recurring event
  - Options: "All events in series", "This event only", "This and following events"

- [x] **5.2** `updateEvent` mutation supports `scope: "THIS" | "THIS_AND_FUTURE" | "ALL"`
  - `THIS`: adds `instanceDate` to parent `exdates`; blocked if active registrations exist on that instance (BOOKABLE/COACHING_SLOT)
  - `THIS_AND_FUTURE`: truncates parent rrule `UNTIL`, creates new series from `instanceDate`; blocked for BOOKABLE/COACHING_SLOT (registration migration TODO)
  - `ALL`: updates whole series (existing behavior)

- [x] **5.3** `deleteEvent` mutation supports same scope options
  - `THIS`: adds `instanceDate` to `exdates`; blocked if active registrations exist (BOOKABLE/COACHING_SLOT)
  - `THIS_AND_FUTURE`: truncates rrule `UNTIL` to day before; blocked for BOOKABLE/COACHING_SLOT
  - `ALL`: soft-deletes whole series

> **Registration migration TODO**: Guards in place at both THIS and THIS_AND_FUTURE blocks with
> `// TODO` comments describing the migration path (detach occurrence event, re-point registrations).

---

### 6. ilamy-calendar PR — Replace Local Ports

- [ ] **6.1** Monitor the upstream PR at `https://github.com/kcsujeet/ilamy-calendar` that exports
  `EventForm`, `EventFormDialog`, and `RecurrenceEditor`.
  - Once merged and a new version is published to npm, bump `@ilamy/calendar` and:
    - Delete `src/app/calendar/EventFormModal.tsx`
    - Delete `src/app/calendar/RecurrenceEditor.tsx`
    - Replace `renderEventForm` in `CalendarClient.tsx` to use `EventFormDialog` directly
  - Both local files have a `TODO` comment marking them for removal.

---

### 7. UI Polish

- [x] **7.1** `window.confirm` replaced with `AlertDialog` component
  - `src/app/_components/shared/AlertDialog.tsx` — uses `glass-panel` + CSS vars + `AlertTriangle` from lucide
  - Description is scope-aware: "remove this occurrence" / "delete this and all following" / "delete the entire series"

- [x] **7.2** Color picker in `EventFormModal` — 14 Tailwind swatches matching ilamy `COLOR_OPTIONS`
  - `color` stored as Tailwind class string (e.g. `"bg-blue-100 text-blue-800"`)
  - `createEventSchema` and `updateEventSchema` `color`/`backgroundColor` relaxed to `z.string()` (not `hexColorRegex`)
  - Resource type color fields still use `hexColorRegex` — unchanged

- [x] **7.3** Event detail view for students (read-only)
  - Implemented: `EventDetailClient` shows full read-only view; Register/Cancel actions for students
  - `EventFormModal` shows read-only panel for non-owners with "View event details" link

- [ ] **7.4** Toast offset adjustment for mobile bottom nav
  - When mobile navigation is implemented, increase `ToastContainer` bottom offset from `bottom-4`
    to `bottom-16` (flagged in Phase 1 Toast spec)

- [x] **7.5** Students: calendar event click navigates directly to `/events/[eventId]`
  - Implemented: `CalendarClient.tsx` renders `<IlamyCalendar>` (not resource calendar) for students
  - `onEventClick` calls `router.push('/events/' + dbEventId)` — no modal opened
  - `renderEventForm` is not passed for students; `disableCellClick/disableDragAndDrop` remain true

---

### 8. Registrant Display Names (Public Roster)

> **Design Decision (Mar 2026)**: Whether registrant names are publicly visible is a per-event
> setting controlled by facility/admin on the event detail page. It does not require a new DB table —
> a single boolean column `showRegistrantNames` on `CalendarEvent` is sufficient.

- [x] **8.1** Add `showRegistrantNames Boolean @default(false)` to `CalendarEvent` in `schema.prisma`
  - Migrated: `20260309202341_add_checked_in_status_show_registrant_names`
  - Field is in DB and Prisma client is regenerated

- [x] **8.2** `showRegistrantNames: z.boolean().optional()` added to `updateEventDetailsSchema`

- [x] **8.3** Toggle in `BookableEventDetails` edit view (FACILITY/ADMIN only)
  - "Show registrant names publicly" checkbox; saves via `updateEventDetails` mutation

- [x] **8.4** `getPublicEventById` conditionally includes registrants when `showRegistrantNames = true`
  - Returns `{ firstName, lastInitial }` array; empty array when flag is false

- [x] **8.5** Registrant names displayed in read-only section of `BookableEventDetails`
  - `EventDetailClient` passes `showRegistrantNames` + `registrants` props through

> **Rationale for minimal approach**: No new table, no new procedure, no new router. The only
> disruption is one schema field, one schema extension on the existing `updateEventDetails` mutation,
> and one conditional include on `getPublicEventById`. Everything else builds on existing components.

---

### 9. Calendar View Toggle (Resource vs. Non-Resource)

> **Context**: `@ilamy/calendar` exports both `IlamyResourceCalendar` (resource columns + events)
> and `IlamyCalendar` (standard calendar without resource columns). Both accept the same `CalendarEvent`
> shape. The resource calendar is useful for facility/admin/coaches who manage resources; students
> should only see the standard calendar (no resource column clutter, no resource assignments visible).
> Confirmed via `ilamy-calendar/src/components/demo/demo-page.tsx` which uses `useState<'regular' | 'resource'>`
> to toggle between them — same pattern we adopted.

- [x] **9.1** Replace `IlamyResourceCalendar` with `IlamyCalendar` for STUDENT role in `CalendarClient.tsx`
  - Students always see `<IlamyCalendar>` (no resource columns)
  - Staff (FACILITY/ADMIN/COACH) default to `<IlamyResourceCalendar>`

- [x] **9.2** Add view toggle for FACILITY/ADMIN and COACH (resource ↔ standard)
  - `useState<"resource" | "standard">` defaulting to `"resource"`
  - Toggle button in calendar header (next to "Manage Resources" link) using `LayoutGrid`/`Columns` icons
  - Both calendar modes wire the same `renderEventForm`, `onCellClick`, `onEventUpdate`, `onEventDelete`

- [x] **9.3** Wire `onEventClick` for students to navigate to `/events/[eventId]` directly
  - Implemented together with 9.1 — see 7.5 above

> **Implementation note**: Items 9.1 + 9.3 can be done in a single edit to `CalendarClient.tsx`.
> Item 9.2 adds a second render path and toggle button — a separate small edit.
> No new components, no new routes, no backend changes.

---

### 10. Payments (Polar Integration)

- [ ] **10.1** Create Polar products for bookable event types
  - Webhook handler to sync Polar product/price IDs back to `Product` table

- [ ] **10.2** Checkout flow for `BOOKABLE` events
  - Redirect to Polar checkout with event context
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`

- [ ] **10.3** Credit pack support (`ProductCategory.CREDIT_PACK`)
  - Track credit balance per user
  - Deduct credits on registration when `creditCost` is set on the event

---

## Known Bugs

### BUG-1: Students not seeing recurring events on expected dates — FIXED
- **Root cause (confirmed)**: The `...(isStudent && { isPublic: true, eventType: { in: [...] } })`
  spread sat at the top level of the Prisma `where` clause alongside `OR: [...]`. Prisma treats
  top-level keys as implicit `AND`, so `isPublic: true` became an `AND` condition that ALL three
  `OR` branches had to satisfy. Modified instances (`parentEventId: { not: null }`) don't necessarily
  have `isPublic` copied from their parent, so they were silently filtered out.
- **Fix**: Moved `studentVisibility` spread (`isPublic: true`, `eventType: { in: [...] }`) **inside**
  each of the three `OR` branches in `getEvents`. Now each branch independently applies the student
  visibility filter without blocking others.
- **File changed**: `src/server/api/routers/calendar.ts` — `getEvents` query only.

---

## Open Threads (as of Mar 9, 2026 — end of session)

1. **Registration migration for recurring scope** — `THIS` and `THIS_AND_FUTURE` are blocked for
   `BOOKABLE`/`COACHING_SLOT` events with active registrations. Guards + TODO comments are in place
   in `calendar.ts`. Implement when needed: detach occurrence event, re-point registrations.

2. **Walk-in billing** — `CHECKED_IN` without prior `REGISTERED` row requires credit deduction
   at check-in time. TODO Phase 8 alongside Polar.

3. **Payments (Polar)** — Items 10.1–10.3. Blocked on product/pricing design.

4. **ilamy-calendar PR** — Monitor upstream; replace local `EventFormModal` + `RecurrenceEditor`
   ports once published.

5. **Toast bottom offset** (7.4) — Blocked on mobile nav being built.

---

## Notes

- **BLOCK events are Phase 1 complete.** The `eventType` field defaults to `BLOCK` in the DB
  with `isBlocking=true` and `isPublic=false` — safe for all existing events.
- **No Polar work needed before items 4.1–4.5** (registration flow can use credit/free events first).
- **Items 6.1 and 7.1–7.2 are small and can be done at any time** — they are improvements to
  Phase 1 work, not blockers for Phase 2.
- **`CONFIRMED` renamed to `REGISTERED`** — migration applied (`20260309200103_rename_confirmed_to_registered_add_checked_in`).
  All router code uses `RegistrationStatus.REGISTERED`. The DB default on `EventRegistration.status`
  is now `REGISTERED`. Prisma client regenerated.

---

## Testing Checklist (as of Mar 2026)

### Products (`/products`)
- Active products only shown by default; "Show inactive" checkbox reveals dimmed rows
- Create / edit / delete product CRUD
- Delete blocked if product is linked to events
- Category filter: BOOKABLE event → `CALENDAR_EVENT` products only; COACHING_SLOT → `COACHING_SLOT` products only

### Calendar — FACILITY/ADMIN
- All events visible (BLOCK, BOOKABLE, COACHING_SLOT)
- Event type selector shows BLOCK / BOOKABLE only (no COACHING_SLOT option)
- Click event → edit form opens; event type is read-only on edit
- "Event Page" link in form footer for BOOKABLE events
- Manage Resources button visible

### Calendar — COACH
- Only sees own COACHING_SLOT events + public BOOKABLE events
- Event type is always COACHING_SLOT (selector hidden)
- Can create/edit/delete own events; cannot edit others'
- No Manage Resources button

### Calendar — STUDENT
- Only `isPublic=true` + `eventType IN [BOOKABLE, COACHING_SLOT]` events visible
- Cannot click cells or drag events
- Currently: read-only modal on event click with "View event details" link
- **Pending (7.5)**: click should navigate directly to `/events/[eventId]` skipping the modal

### Event detail page (`/events/[eventId]`)
- Accessible without login (incognito test)
- FACILITY/ADMIN — Edit toggle visible; editable fields on toggle; save works
- COACH (own event) — Edit toggle visible
- COACH (other's event) — view-only, no toggle
- STUDENT — view-only, full details shown (description, visibility, capacity, registration type)
