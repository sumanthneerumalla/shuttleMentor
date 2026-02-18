# Bookable Events & Digital Inventory — Design Strategy

This document covers how calendar events become configurable, purchasable digital inventory. It defines the event type system, product model, registration flow, and public calendar behavior.

## Finalized Decisions

| #    | Decision                                          | Details                                                                                                                                      |
| :--- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | All payments through Polar                        | Free events ($0) and paid events all go through Polar checkout. Unified architecture, no separate registration flow.                         |
| 2    | Coach event creation                              | Coaches can create events on any active club resource. Facility users own resource creation and time restrictions (business hours).           |
| 3    | Coach slot blocking lifecycle                     | Coach creates slot → non-blocking (open). Student purchases → automatically becomes blocking.                                                |
| 4    | Drop-in = per-instance signup                     | Users sign up for individual occurrences of drop-in sessions.                                                                                |
| 5    | League = per-series purchase                      | Purchasing a league associates the buyer with all events in the series. Mid-season joins deferred to later.                                  |
| 6    | Capacity on CalendarEvent                         | `maxParticipants` lives on the event. Our DB is sole source of truth for inventory (not Polar).                                              |
| 7    | Slot fill count is public                         | Club owners and unauthenticated visitors can see how many slots are filled.                                                                  |
| 8    | Bookable events are public                        | Anyone can see bookable events, even without an account.                                                                                     |
| 9    | Internal blocks hidden from public                | Non-authenticated users see only `isPublic` bookable/coaching events. `BLOCK` events are **excluded entirely** from the public API.          |
| 10   | Generalized Product model                         | Replace planned `CoachingProduct` with a generic `Product` table with `productCategory` enum.                                                |
| 11   | CalendarEvent ↔ Product are separate but linkable | Two distinct tables with an optional FK. Not every event has a product; not every product is a calendar event.                                |
| 12   | Coaches set their own pricing                     | Coaches set price per slot/series on the Product table.                                                                                      |
| 13   | Per-event public visibility                       | `isPublic` flag on `CalendarEvent` (default `false`). Facility/coach toggles per event. `BLOCK` events are never public.                     |
| 14   | Events support both purchase and credits          | Events can be purchased via Polar OR checked into with credits. Credits deducted first if available, otherwise Polar checkout. (Phase 5)      |

---

## Event Type System

### `EventType` Enum

```prisma
enum EventType {
  BLOCK           // Internal scheduling (maintenance, reserved, staff-only)
  BOOKABLE        // Facility-created bookable event (drop-in, league, open gym)
  COACHING_SLOT   // Coach-created training slot
}
```

### How Each Type Behaves

| Property           | BLOCK                        | BOOKABLE                     | COACHING_SLOT                                  |
| :----------------- | :--------------------------- | :--------------------------- | :--------------------------------------------- |
| Created by         | FACILITY / ADMIN             | FACILITY / ADMIN             | COACH                                          |
| Visible to public  | No (excluded from public API) | If `isPublic = true`        | If `isPublic = true`                           |
| Has Product        | No                           | Yes (via `productId` FK)     | Yes (via `productId` FK)                       |
| Has capacity       | No                           | Yes (`maxParticipants`)      | Yes (typically 1 for 1-on-1, or small group)   |
| Blocking behavior  | Always blocking              | Always blocking              | Non-blocking until purchased, then blocking    |
| Purchasable        | No                           | Yes (through Polar)          | Yes (through Polar)                            |

### `isBlocking` Field

- **BLOCK events**: always `isBlocking = true`
- **BOOKABLE events**: always `isBlocking = true` (they reserve the resource)
- **COACHING_SLOT events**: `isBlocking = false` when created (open slot). Transitions to `isBlocking = true` when purchased (Polar webhook confirms payment → our backend flips the flag).

This field is used by:
1. **Conflict detection** (`checkConflicts`): only blocking events generate conflict warnings
2. **Public calendar rendering**: non-blocking slots render with a distinct visual style (dashed border, semi-transparent) to indicate "available for booking"
3. **Resource availability**: non-blocking slots don't prevent other events from being scheduled on the same resource

---

## Product Model

### Prisma Schema

```prisma
enum ProductCategory {
  COACHING_SESSION    // Async coaching (video review, etc.) — existing use case
  CALENDAR_EVENT      // Bookable calendar event (drop-in, league, open gym)
  COACHING_SLOT       // Coach training slot on calendar
}

model Product {
  productId       String          @id @default(cuid())
  clubShortName   String
  club            Club            @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  category        ProductCategory
  name            String          @db.VarChar(200)
  description     String?         @db.Text
  priceInCents    Int             // Price in cents (0 for free events)
  currency        String          @default("usd") @db.VarChar(3)
  polarProductId  String?         @unique // Polar product ID (set after syncing with Polar)
  polarPriceId    String?         // Polar price ID
  isActive        Boolean         @default(true)
  createdByUserId String
  createdByUser   User            @relation("CreatedProducts", fields: [createdByUserId], references: [userId])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  calendarEvents  CalendarEvent[] // Events linked to this product
  registrations   EventRegistration[]

  @@index([clubShortName])
  @@index([category])
  @@index([polarProductId])
  @@index([createdByUserId])
}
```

### Product ↔ CalendarEvent Relationship

- `CalendarEvent` gets an optional `productId` FK pointing to `Product`
- One `Product` can be linked to multiple `CalendarEvent` rows (e.g., a league product links to all events in the series)
- `BLOCK` events never have a `productId`
- `BOOKABLE` and `COACHING_SLOT` events should have a `productId`

---

## Registration Model

### Prisma Schema

```prisma
enum RegistrationStatus {
  CONFIRMED
  CANCELLED
}

model EventRegistration {
  registrationId  String             @id @default(cuid())
  eventId         String             // Base event (for per-series) or specific event
  event           CalendarEvent      @relation(fields: [eventId], references: [eventId], onDelete: Cascade)
  productId       String
  product         Product            @relation(fields: [productId], references: [productId])
  userId          String             // Who registered
  user            User               @relation("EventRegistrations", fields: [userId], references: [userId])
  instanceDate    DateTime?          // For PER_INSTANCE (drop-in): the specific occurrence date
  polarOrderId    String?            // Polar order/checkout ID for traceability
  status          RegistrationStatus @default(CONFIRMED)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([eventId])
  @@index([productId])
  @@index([userId])
  @@index([polarOrderId])
  @@unique([eventId, userId, instanceDate]) // dont actually implement this in db level but keep it in code to allow re-booking after cancellation
}
```

### Registration Flow

```
1. Public user sees bookable event on calendar
2. Clicks event → sees details + "Book" / "Register" button
3. Button redirects to Polar checkout (with $0 for free events)
4. Polar processes payment → sends webhook to our backend
5. Webhook handler:
   a. Creates EventRegistration row
   b. For COACHING_SLOT: sets isBlocking = true on the CalendarEvent
   c. Invalidates relevant caches
6. Calendar UI updates to show new registration count
```

### Capacity Tracking

Available slots are computed, not stored:

```typescript
availableSlots = event.maxParticipants - count(EventRegistration where eventId = X and status = CONFIRMED)
```

For **per-instance** (drop-in) events, the count is filtered by `instanceDate`:

```typescript
availableSlots = event.maxParticipants - count(EventRegistration where eventId = X and instanceDate = Y and status = CONFIRMED)
```

---

## CalendarEvent Schema Extensions

New fields added to the existing `CalendarEvent` model:

```prisma
model CalendarEvent {
  // ... all existing fields from database-schema.md ...

  // === Bookable event fields ===
  eventType         EventType  @default(BLOCK)
  isBlocking        Boolean    @default(true)    // Whether this event blocks the resource
  isPublic          Boolean    @default(false)   // Whether visible on public calendar / embeds
  maxParticipants   Int?                          // Capacity cap (null = unlimited)
  registrationType  RegistrationType?             // PER_INSTANCE or PER_SERIES
  creditCost        Int?                          // Phase 5: credits per check-in (null = not credit-based)
  productId         String?                       // FK to Product (null for BLOCK events)
  product           Product?   @relation(fields: [productId], references: [productId], onDelete: SetNull)

  // Relations
  registrations     EventRegistration[]

  // New indexes
  @@index([eventType])
  @@index([productId])
}

enum RegistrationType {
  PER_INSTANCE    // Sign up for individual occurrences (drop-in)
  PER_SERIES      // Sign up for the whole series (league)
}
```

---

## Public Calendar View

### Route: `/club/[clubShortName]/calendar` (or similar public route)

Unauthenticated users see a filtered calendar:

1. **BOOKABLE** and **COACHING_SLOT** events where `isPublic = true` render with full details (title, time, capacity, price, coach name)
2. **BLOCK** events are **never sent** to the public frontend — the `getPublicEvents` API excludes them entirely. Public users should not know about internal scheduling blocks. Empty time slots simply appear as open time.
3. The `renderEvent` prop handles display:

```typescript
const renderPublicEvent = (event: CalendarEvent) => {
  const data = event.data as EventDisplayData;

  return (
    <div className="px-2 py-1 rounded">
      <div className="font-semibold text-sm">{event.title}</div>
      {data.coachName && (
        <div className="text-xs opacity-75">with {data.coachName}</div>
      )}
      {data.maxParticipants && (
        <div className="text-xs opacity-75">
          {data.currentRegistrations}/{data.maxParticipants} spots filled
        </div>
      )}
      {data.priceInCents != null && (
        <div className="text-xs font-medium">
          {data.priceInCents === 0 ? "Free" : `$${(data.priceInCents / 100).toFixed(2)}`}
        </div>
      )}
    </div>
  );
};
```

### Data for `renderEvent`

The `CalendarEvent.data` bag (ilamy's `data?: Record<string, any>`) carries display metadata:

```typescript
// During transformEvents()
data: {
  dbEventId: e.eventId,
  eventType: e.eventType,
  isBlocking: e.isBlocking,
  maxParticipants: e.maxParticipants,
  currentRegistrations: registrationCounts[e.eventId] ?? 0,
  priceInCents: e.product?.priceInCents ?? null,
  productId: e.productId,
  coachName: e.createdByUser?.firstName ?? null,
}
```

### Multi-Resource Events

Events can span multiple resources using ilamy's `resourceIds` array. When a facility creates a bookable event, they can associate it with one or more resources. The schema already supports this via `resourceId` (single) — for multi-resource, we add:

```prisma
// On CalendarEvent
resourceIds   String[]  // Additional resource IDs (for cross-resource events)
```

The frontend maps this to ilamy's `resourceIds` prop.

---

## Access Control Updates

### Event Creation by Role

| Role     | Can Create | Event Types        | Resources               |
| :------- | :--------- | :----------------- | :---------------------- |
| FACILITY | Yes        | BLOCK, BOOKABLE    | Any club resource       |
| ADMIN    | Yes        | BLOCK, BOOKABLE    | Any club resource       |
| COACH    | Yes        | COACHING_SLOT only | Any active club resource |
| STUDENT  | No         | —                  | —                       |

### New tRPC Procedures Needed

- **`coachProcedure`** (or reuse existing pattern): allows COACH users to create/edit/delete their own COACHING_SLOT events only
- **`getPublicEvents`**: unauthenticated procedure that returns only `isPublic = true` bookable/coaching events for a given club (BLOCK events excluded entirely)
- **`getPublicResources`**: unauthenticated procedure that returns active resources for a given club

---

## Implementation Phases

These features are **not part of V1**. The schema fields are added in V1 with defaults so they don't break existing functionality.

### Phase 2.5 — Bookable Events (after V2 recurrence)
1. Add `EventType`, `RegistrationType` enums and new fields to `CalendarEvent`
2. Create `Product` and `EventRegistration` models
3. `coachProcedure` for COACHING_SLOT creation (`createCoachSlot`, `updateCoachSlot`, `deleteCoachSlot`)
4. Custom `renderEvent` with capacity badges
5. Public calendar standalone page (`/club/[clubShortName]/calendar`)
6. Share links (deep link to specific event)
7. `isPublic` toggle in event creation UI

### Phase 3 — Payments Integration
1. Polar product sync (create Polar products from our Product table)
2. Polar checkout flow (redirect to Polar, handle webhook)
3. Registration creation on webhook
4. `isBlocking` auto-transition for coaching slots
5. Capacity enforcement (prevent checkout when full)
6. Embeddable calendar widget (`<iframe>` at `/embed/[clubShortName]/calendar`)

### Phase 4 — Enhanced Booking
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
6. Events support both direct purchase AND credit-based check-in (`creditCost` + `creditPackId` fields)
7. Credit balance display in user profile

> **Future Optimization — Overbooking Race Condition**
>
> The Polar webhook handler that creates `EventRegistration` rows must be atomic in production. Use a DB transaction to lock rows, re-count confirmed registrations, check against `maxParticipants`, and only then create the registration. If capacity is full, trigger automated refund via Polar API.
