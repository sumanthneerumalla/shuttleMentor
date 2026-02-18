# Calendaring Feature — Master Design Document

This document is the entry point for the calendaring feature design. It captures all decisions, links to sub-documents, and provides a high-level overview for implementers.

## Overview

Facility users (and admins) can create **resources** (courts, swim lanes, fields, etc.) belonging to their club, then schedule **events** on those resources using a calendar UI powered by [`@ilamy/calendar`](https://ilamy.dev/docs/introduction/). Events support **recurrence** (RRULE-based, RFC 5545), **iCal export**, and are persisted to our PostgreSQL database so users see their calendar state on every login.

All club members (STUDENT, COACH, FACILITY, ADMIN) can **view** the calendar read-only. Only FACILITY and ADMIN users can **create, edit, and delete** resources and events.

## Design Decisions

| Decision                    | Choice                                                                                  | Rationale                                                                                          |
| :-------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| Resource type system        | Per-club custom types (`ClubResourceType` table)                                        | Maximum flexibility — each club defines their own types without needing DB migrations               |
| Calendar access control     | All club members read-only; FACILITY + ADMIN can edit                                   | Students/coaches benefit from seeing facility schedules                                             |
| Conflict detection          | Warn but allow overlaps                                                                 | Facility users are trusted to manage their schedule; hard blocks are frustrating                    |
| Recurrence scope (V1)       | Design for full, implement basic                                                        | Schema supports exdates + modified instances; V1 UI only does whole-series edit/delete              |
| Business hours              | Per-resource business hours                                                             | Each resource can have its own operating schedule; ilamy calendar renders this natively             |
| Event storage               | RRULE string in DB, client-side expansion                                               | ilamy calendar expands recurring events automatically — no server-side instance generation needed   |
| Event types                 | `BLOCK`, `BOOKABLE`, `COACHING_SLOT` enum                                               | Enables internal scheduling, purchasable events, and coach training slots on the same calendar     |
| Coach event creation        | Coaches can create `COACHING_SLOT` events on any active club resource                   | Facility owns resources + business hours; coaches book within those constraints                     |
| Coach slot blocking         | Non-blocking until purchased, then auto-blocking                                        | Open slots don't prevent other bookings; purchased slots do                                        |
| All payments through Polar  | Free ($0) and paid events both use Polar checkout                                       | Unified order tracking, minimal architecture                                                       |
| Inventory source of truth   | Our DB (`maxParticipants` - confirmed registrations)                                    | Simple, single source of truth; no Polar inventory sync needed                                     |
| Public calendar             | Only `isPublic` bookable/coaching events visible; BLOCK events excluded entirely        | Public users see only what they can book; no knowledge of internal scheduling                       |
| Product model               | Generic `Product` table with `ProductCategory` enum                                     | Replaces planned `CoachingProduct`; supports coaching sessions, calendar events, and coach slots    |
| Registration model          | `EventRegistration` with `PER_INSTANCE` / `PER_SERIES` types                            | Drop-ins sign up per occurrence; leagues cover the whole series                                     |
| Per-event public visibility | `isPublic` flag on `CalendarEvent` (default `false`)                                    | Facility/coach toggles per event; `BLOCK` events never public                                      |
| Dual payment model          | Events support Polar purchase AND credit-based check-in                                 | Credits deducted first if available, otherwise Polar checkout (Phase 5)                             |
| iCal export                 | Built into ilamy — no additional library                                                | Export button renders natively in calendar header                                                   |

## Sub-Documents

| Document                                                       | Description                                                                               |
| :------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| [database-schema.md](./database-schema.md)                     | Prisma models for resources, resource types, events, business hours, products, registrations |
| [api-design.md](./api-design.md)                               | tRPC router design — procedures, inputs, outputs, access control                          |
| [frontend-integration.md](./frontend-integration.md)           | `/calendar` page, `@ilamy/calendar` integration, component architecture                   |
| [recurrence-strategy.md](./recurrence-strategy.md)             | How recurrence is stored, loaded, expanded, and modified                                  |
| [bookable-events-strategy.md](./bookable-events-strategy.md)   | Bookable events, digital inventory, Product model, registration flow, public calendar     |

## Technology Stack

- **Calendar UI**: `@ilamy/calendar` (IlamyResourceCalendar component)
- **Recurrence engine**: `rrule.js` (bundled with @ilamy/calendar, also used for DB serialization)
- **Backend**: tRPC routers with `facilityProcedure` / `protectedProcedure`
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Clerk (existing), role-based via `UserType` enum
- **Styling**: Tailwind CSS v4 (ilamy ships zero CSS, uses Tailwind utilities)

## Implementation Phases

### Phase 1 (V1) — Core Calendar
1. DB migration: add all models (`ClubResourceType`, `ClubResource`, `ResourceBusinessHours`, `CalendarEvent`, `Product`, `EventRegistration`) and enums. Bookable fields have defaults so V1 code can ignore them.
2. tRPC `calendar` router: CRUD for resource types, resources, and events (BLOCK type only in V1)
3. `/calendar` page with `IlamyResourceCalendar`
4. Side navigation: add "Calendar" link for all user types
5. Resource management UI (settings panel for FACILITY/ADMIN)
6. Whole-series recurrence (create/edit/delete entire series)
7. Conflict warning (frontend-only check, respects `isBlocking`)
8. iCal export (built into ilamy — works automatically with our schema)

### Phase 2 — Advanced Recurrence
1. Per-instance edit/delete (exdates, modified instances)
2. "Edit this and all future" operation

### Phase 2.5 — Bookable Events
1. `BOOKABLE` and `COACHING_SLOT` event types in UI
2. `coachProcedure` for coach slot creation (`createCoachSlot`, `updateCoachSlot`, `deleteCoachSlot`)
3. Product creation flow (facility creates bookable event → linked Product)
4. Custom `renderEvent` with capacity badges, price display
5. Public calendar standalone page (`/club/[clubShortName]/calendar`)
6. Share links (deep link to specific event)
7. `isPublic` toggle in event creation UI

### Phase 3 — Payments Integration (Polar)
1. Polar product sync (create Polar products from our Product table)
2. Polar checkout flow (redirect to Polar, handle webhook)
3. EventRegistration creation on webhook confirmation
4. `isBlocking` auto-transition for coaching slots on purchase
5. Capacity enforcement (prevent checkout when full)
6. Embeddable calendar widget (`<iframe>` at `/embed/[clubShortName]/calendar`)

### Phase 4 — Enhanced Booking & Embeds
1. Badge/chiclet embeddable components (`<script>` tag + internal `<EventBadgeList>`)
2. Waitlist support
3. Cancellation/refund flow
4. Cross-resource events (resourceIds array)
5. Mid-season league joins *(low priority)*

### Phase 5 — Classes & Credits
1. `CreditPack`, `UserCreditBalance`, `CheckIn` models
2. `CREDIT_PACK` product category
3. `creditPackId` FK on `CalendarEvent` — links event to which credit pack type it draws from
4. Credit purchase flow (via Polar)
5. Credit deduction on check-in (FIFO: deduct from balance expiring soonest)
6. Events support both direct purchase AND credit-based check-in
7. Credit balance display in user profile
