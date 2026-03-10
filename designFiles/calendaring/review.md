# Calendaring Review (Phase 1 + Phase 2)

## Scope Reviewed
- Design docs reviewed: `designFiles/calendaring/*`
- Commit window reviewed (last 4 commits on `shuttlementor`):
  - `08bd90b` phase 2 calendaring
  - `1cf0a7a` reset calendarClient to avoid edit corruption
  - `126fbc5` payments design docs only
  - `a1a456e` calendaring phase 1
- Build/quality checks run:
  - `npm run typecheck` (fails)
  - `npm test` (no tests found)

## Work Log
- [x] Located actual calendaring docs path (`designFiles/calendaring`; `designDocs/calendaring` not present).
- [x] Reviewed phase progress docs and core design docs.
- [x] Reviewed code touched by phase 1 and phase 2 commits (calendar router, calendar UI, event details, products).
- [x] Ran typecheck and tests.
- [x] Produced findings, risks, and action items.

## Implementation Understanding
- Phase 1 delivered: calendar page, resources CRUD, event CRUD (whole-series recurrence), schema migration, navigation, toast UX, resource management page.
- Phase 2 delivered (partial):
  - Products router + `/products` UI
  - Event type selector and product linking in calendar modal
  - `/events/[eventId]` page + `BookableEventDetails` + `updateEventDetails`
  - Student filter in `getEvents` for public BOOKABLE/COACHING_SLOT events
- Phase 2 not yet delivered: registration mutations/booking flow, recurrence scope options, Polar flows, several UI polish tasks.

## Findings (Ordered by Severity)

### 1) Critical: Coach event flow is marked complete but is functionally blocked by backend auth
- Why this matters: Phase 2 claims coach slot creation/editing restrictions are complete, but coaches cannot actually mutate events.
- Evidence:
  - UI treats coach as create-capable: `CalendarClient` sets `canCreateEvents` true for coach and enables create interactions.
  - Modal create/update/delete calls `api.calendar.createEvent/updateEvent/deleteEvent`.
  - Server procedures are `facilityProcedure`, not `coachProcedure`.
- File refs:
  - `src/app/calendar/CalendarClient.tsx:104`
  - `src/app/calendar/CalendarClient.tsx:266`
  - `src/app/calendar/EventFormModal.tsx:136`
  - `src/app/calendar/EventFormModal.tsx:149`
  - `src/app/calendar/EventFormModal.tsx:162`
  - `src/server/api/routers/calendar.ts:591`
  - `src/server/api/routers/calendar.ts:837`
  - `src/server/api/routers/calendar.ts:921`
  - `designFiles/calendaring/progressPhase2.md:31`

### 2) High: Role/event-type policy is not enforced server-side and conflicts with intended behavior
- Why this matters: The stated matrix says FACILITY/ADMIN should create `BLOCK`/`BOOKABLE`, COACH should create `COACHING_SLOT`; additionally coaching slots should start non-blocking.
- Current behavior:
  - `createEvent` accepts `COACHING_SLOT` and is callable by FACILITY/ADMIN.
  - `isBlocking` is always set to `true`, including COACHING_SLOT.
  - Event form for FACILITY/ADMIN explicitly offers COACHING_SLOT option.
- File refs:
  - `src/server/api/routers/calendar.ts:178`
  - `src/server/api/routers/calendar.ts:714`
  - `src/app/calendar/EventFormModal.tsx:324`
  - `designFiles/calendaring/progressPhase2.md:31`

### 3) High: TypeScript build is currently broken
- Why this matters: `npm run typecheck` fails, so CI/build health is red.
- Root cause: nullable `userType`/`userId` passed into client props typed as non-null strings.
- File refs:
  - `src/app/events/[eventId]/page.tsx:25`
  - `src/app/events/[eventId]/EventDetailClient.tsx:15`
- Command result:
  - `TS2322: Type 'string | null' is not assignable to type 'string'`

### 4) Medium: `updateEvent` lacks date-range validation (`end > start`)
- Why this matters: creates invalid time ranges on update path even though create path validates.
- Evidence:
  - `createEvent` validates range via `validateDateRange`.
  - `updateEvent` does not validate new start/end before write.
- File refs:
  - `src/server/api/routers/calendar.ts:612`
  - `src/server/api/routers/calendar.ts:837`

### 5) Medium: Event-to-product integrity checks are missing
- Why this matters: `productId` can be set without verifying club ownership/category alignment, enabling cross-club or mismatched linkage if IDs are known.
- Evidence:
  - `productId` accepted in schemas and written directly.
  - No lookup/ownership check in create/update event paths.
- File refs:
  - `src/server/api/routers/calendar.ts:182`
  - `src/server/api/routers/calendar.ts:202`
  - `src/server/api/routers/calendar.ts:718`
  - `src/server/api/routers/calendar.ts:913`

### 6) Medium: Resource type deletion rule does not match soft-delete model
- Why this matters: Message says “active resources”, but check counts all related resources; once a type is ever used, delete can become permanently blocked even after deactivation.
- Evidence:
  - `deleteResource` is soft deactivate (`isActive = false`).
  - `deleteResourceType` uses `_count.resources > 0` (not filtered to active).
- File refs:
  - `src/server/api/routers/calendar.ts:363`
  - `src/server/api/routers/calendar.ts:581`
  - `designFiles/calendaring/progressPhase1.md:102`

### 7) Low: Phase progress docs contain terminal transcript/corruption noise
- Why this matters: reduces handoff reliability and can cause incorrect “done” status interpretation.
- Evidence: long command transcript appended to progress files.
- File refs:
  - `designFiles/calendaring/progressPhase2.md:182`
  - `designFiles/calendaring/progressPhase1.md:191`

## Gaps and Risk Notes
- No automated tests exist for these features (`npm test` => no test files).
- Review findings include both code defects and “status mismatch” defects (items checked as complete but not fully enforced).

## Action Items Tracker
- [ ] Implement coach-safe event mutations (or split procedures: facility vs coach) and align UI/API contract.
- [ ] Enforce server-side event type policy and COACHING_SLOT `isBlocking` lifecycle.
- [ ] Fix `EventDetailClient` prop typing nullability and re-run `npm run typecheck`.
- [ ] Add `updateEvent` date-range validation parity with create path.
- [ ] Validate `productId` ownership/category in create/update event mutations.
- [ ] Update resource-type delete logic to check active resources only.
- [ ] Clean progress docs to remove transcript noise and keep checklists authoritative.
- [ ] Add at least router-level tests for calendar/products authorization and invariant checks.

## Clarifications Requested
- Should `/events/[eventId]` support unauthenticated public-event viewing now via `getPublicEventById`, or stay authenticated-only in this phase?
- Should `products.getProducts` remain `protectedProcedure` for read access, or be restricted to FACILITY/ADMIN to match phase notes?

---

## Finalized Review Notes (Ranked by Importance, Urgency, Impact)

| Rank | Note | Importance | Urgency | Impact |
|---|---|---|---|---|
| 1 | Coach create/edit/delete flow is blocked by backend `facilityProcedure` despite UI enabling it | Critical | Immediate | Feature break for coach workflows; phase status mismatch |
| 2 | Role/event-type contract not enforced (`COACHING_SLOT` creation + blocking semantics) | High | Immediate | Authorization/policy drift; incorrect scheduling behavior |
| 3 | Typecheck fails in event detail page prop nullability | High | Immediate | Build/CI red; deploy risk |
| 4 | `updateEvent` missing `end > start` validation | Medium | High | Invalid event data possible in production |
| 5 | Missing `productId` club/category validation | Medium | High | Data integrity and cross-club linkage risk |
| 6 | Resource-type delete checks all resources, not active-only | Medium | Medium | Operational friction; misleading UX/error semantics |
| 7 | Progress docs contain transcript noise and stale completion claims | Low | Medium | Handoff/planning confusion |

