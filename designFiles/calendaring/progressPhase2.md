# Calendaring Feature — Phase 2 Progress

> **How to resume**: Read this file + `progressPhase1.md` for full context.
> Phase 1 is complete. This file tracks Phase 2 work.
> Check off items (`- [x]`) as they are completed.

---

## Phase 2 — Bookable Events & Registration

### Context

The DB schema already has all the necessary fields for bookable events (`eventType`, `isPublic`,
`maxParticipants`, `registrationType`, `creditCost`, `productId`, `resourceIds`, `EventRegistration`,
`Product`). Phase 1 created only `BLOCK` events. Phase 2 exposes `BOOKABLE` and `COACHING_SLOT`
event types to coaches and students.

---

### 1. Role & Event Type Alignment

- [ ] **1.1** Add `eventType` selector to `EventFormModal.tsx` (FACILITY/ADMIN and COACH only)
  - Options: `BLOCK` (default), `BOOKABLE`, `COACHING_SLOT`
  - Show/hide additional fields based on selected type (see below)

- [ ] **1.2** `COACHING_SLOT` events — coach-created availability blocks
  - Coaches create slots; students book into them (1:1)
  - `maxParticipants = 1` enforced for coaching slots

- [ ] **1.3** Link coaching slot registrations to `CoachingNote` creation flow
  - After a slot is completed, prompt coach to create a session note

---

### 2. Product Linking

- [ ] **2.1** Create `createProduct` / `getProducts` / `updateProduct` / `deleteProduct` procedures
  in `calendar.ts` (FACILITY/ADMIN only)
  - `ProductCategory`: `COACHING_SESSION`, `CALENDAR_EVENT`, `COACHING_SLOT`, `CREDIT_PACK`
  - Include Polar `polarProductId` / `polarPriceId` fields (populated after Polar sync)

- [ ] **2.2** Add product selector to `EventFormModal` for `BOOKABLE` events
  - Dropdown of active products scoped to the club

- [ ] **2.3** Wire `productId` into `createEvent` / `updateEvent` mutations

---

### 3. Event Form — Bookable Event Fields

- [ ] **3.1** Add `isPublic` toggle — shown when `eventType !== BLOCK`
  - Only public bookable events are visible to students on the calendar

- [ ] **3.2** Add `maxParticipants` number input — shown when `eventType === BOOKABLE`

- [ ] **3.3** Add `registrationType` selector (`PER_INSTANCE` / `PER_SERIES`) — shown for recurring
  bookable events

- [ ] **3.4** Pass new fields through `createMutation` and `updateMutation`
  - Update `createEventSchema` / `updateEventSchema` in `calendar.ts` to accept and write these

---

### 4. Student-Facing Calendar

- [ ] **4.1** Show public bookable events to students (`isPublic = true`, `eventType = BOOKABLE`)
  - Currently students see all events fetched by `getEvents`; filter or differentiate in UI

- [ ] **4.2** Add "Book" button on event click for students (shown when `eventType === BOOKABLE`
  and `currentRegistrations < maxParticipants`)

- [ ] **4.3** `registerForEvent` tRPC mutation (protectedProcedure)
  - Creates `EventRegistration` with status `CONFIRMED`
  - Checks `maxParticipants` not exceeded
  - Checks for duplicate registration (app-level enforcement — no DB unique constraint by design)

- [ ] **4.4** `cancelRegistration` tRPC mutation (protectedProcedure)
  - Sets `EventRegistration.status = CANCELLED`

- [ ] **4.5** `getMyRegistrations` tRPC query (protectedProcedure)
  - Returns all confirmed registrations for the current user with event details

---

### 5. Recurring Edit/Delete Scope (This Event / This & Future / All)

- [ ] **5.1** Implement `RecurrenceEditDialog` equivalent in our `EventFormModal`
  - Currently edit/delete always modifies the whole series (V1 decision)
  - Phase 2: surface "Edit this event only", "Edit this and following", "Edit all" options
  - Requires creating modified instances (`parentEventId` linking) for single-instance edits
  - Requires `exdates` update on the parent for "delete this instance"

- [ ] **5.2** Update `updateEvent` mutation to support `scope: "THIS" | "THIS_AND_FUTURE" | "ALL"`
  - `THIS`: create a modified instance with `parentEventId` pointing to original, add `recurrenceId`
  - `THIS_AND_FUTURE`: update `rrule` UNTIL on original, create new series from this date forward
  - `ALL`: existing behavior (update whole series)

- [ ] **5.3** Update `deleteEvent` mutation to support same scope options
  - `THIS`: add instance date to `exdates` array on the parent event
  - `THIS_AND_FUTURE`: update RRULE `UNTIL` on parent to the day before
  - `ALL`: existing soft-delete behavior

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

- [ ] **7.1** Replace `window.confirm` in `EventFormModal.handleDelete` with a proper dialog
  (use Radix `AlertDialog` — already available via shadcn)

- [ ] **7.2** Add color picker back to `EventFormModal` using ilamy's Tailwind class approach
  (see `COLOR_OPTIONS` in the ilamy `event-form.tsx` source — 14 color swatches)
  - Currently color/backgroundColor are not set from the form; server defaults apply

- [ ] **7.3** Event detail view for students (read-only)
  - Show title, description, resource, time, registration count, "Book" button
  - Currently `disableEventClick={false}` but ilamy's default click behavior may not show our custom data

- [ ] **7.4** Toast offset adjustment for mobile bottom nav
  - When mobile navigation is implemented, increase `ToastContainer` bottom offset from `bottom-4`
    to `bottom-16` (flagged in Phase 1 Toast spec)

---

### 8. Payments (Polar Integration)

- [ ] **8.1** Create Polar products for bookable event types
  - Webhook handler to sync Polar product/price IDs back to `Product` table

- [ ] **8.2** Checkout flow for `BOOKABLE` events
  - Redirect to Polar checkout with event context
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`

- [ ] **8.3** Credit pack support (`ProductCategory.CREDIT_PACK`)
  - Track credit balance per user
  - Deduct credits on registration when `creditCost` is set on the event

---

## Notes

- **BLOCK events are Phase 1 complete.** The `eventType` field defaults to `BLOCK` in the DB
  with `isBlocking=true` and `isPublic=false` — safe for all existing events.
- **No Polar work needed before items 4.1–4.5** (registration flow can use credit/free events first).
- **Items 6.1 and 7.1–7.2 are small and can be done at any time** — they are improvements to
  Phase 1 work, not blockers for Phase 2.
