# Database Schema — Calendaring Feature

This document defines the Prisma models needed for the calendaring feature. All models follow existing conventions in `prisma/schema.prisma`.

## Entity Relationship Overview

```
Club (1) ──── (*) ClubResourceType
Club (1) ──── (*) ClubResource
ClubResourceType (1) ──── (*) ClubResource
ClubResource (1) ──── (*) ResourceBusinessHours
ClubResource (1) ──── (*) CalendarEvent
Club (1) ──── (*) CalendarEvent
User (1) ──── (*) CalendarEvent (createdBy)
CalendarEvent (1) ──── (*) CalendarEvent (parent → modified instances)
Club (1) ──── (*) Product
User (1) ──── (*) Product (createdBy)
Product (1) ──── (*) CalendarEvent (optional link)
Product (1) ──── (*) EventRegistration
CalendarEvent (1) ──── (*) EventRegistration
User (1) ──── (*) EventRegistration
```

## Models

### ClubResourceType

Per-club custom resource types. Each club defines their own (e.g., "Court", "Swim Lane", "Field").

```prisma
model ClubResourceType {
  resourceTypeId String   @id @default(cuid())
  clubShortName  String
  club           Club     @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  name           String   @db.VarChar(100) // e.g., "Court", "Swim Lane", "Field"
  color          String?  @db.VarChar(20)  // Default hex color for resources of this type, e.g., "#3B82F6"
  backgroundColor String? @db.VarChar(20)  // Default background hex color, e.g., "#EFF6FF"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  resources ClubResource[]

  @@unique([clubShortName, name]) // No duplicate type names within a club
  @@index([clubShortName])
}
```

**Notes:**
- `name` is unique per club (enforced by composite unique constraint)
- `color` and `backgroundColor` provide defaults for resources of this type; individual resources can override
- Cascade delete: if a club is removed, its resource types go too

### ClubResource

A physical or logical resource belonging to a club (e.g., "Court 1", "Lane 3").

```prisma
model ClubResource {
  resourceId     String   @id @default(cuid())
  clubShortName  String
  club           Club     @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  resourceTypeId String
  resourceType   ClubResourceType @relation(fields: [resourceTypeId], references: [resourceTypeId], onDelete: Restrict)
  title          String   @db.VarChar(200) // Display name, e.g., "Court 1"
  description    String?  @db.Text
  color          String?  @db.VarChar(20)  // Override color (hex), falls back to type color
  backgroundColor String? @db.VarChar(20)  // Override background color (hex)
  position       Int      @default(0)      // Display order in calendar
  isActive       Boolean  @default(true)   // Soft disable (inactive resources hidden from calendar)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  businessHours ResourceBusinessHours[]
  events        CalendarEvent[]

  @@index([clubShortName])
  @@index([resourceTypeId])
}
```

**Notes:**
- `resourceTypeId` uses `onDelete: Restrict` — you must remove or reassign resources before deleting a type
- `position` controls display order in the resource calendar (lower = higher/leftward)
- `isActive` allows hiding a resource without deleting its event history
- `color`/`backgroundColor` override the type defaults if set

### ResourceBusinessHours

Operating hours for a resource. Supports split shifts (multiple entries per resource).

```prisma
model ResourceBusinessHours {
  businessHoursId String   @id @default(cuid())
  resourceId      String
  resource        ClubResource @relation(fields: [resourceId], references: [resourceId], onDelete: Cascade)
  daysOfWeek      String[] // e.g., ["monday", "tuesday", "wednesday", "thursday", "friday"]
  startTime       Int      // Hour 0-23 (inclusive), e.g., 6 for 6:00 AM
  endTime         Int      // Hour 0-23 (exclusive), e.g., 22 for 10:00 PM
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([resourceId])
}
```

**Notes:**
- Multiple entries per resource support split shifts (e.g., morning 6-12, afternoon 14-22)
- `daysOfWeek` uses lowercase day names matching ilamy's BusinessHours interface
- `startTime`/`endTime` are hours (0-23), matching ilamy's format exactly
- No validation at DB level for startTime < endTime — enforce in application layer (Zod)

### CalendarEvent

A calendar event, optionally recurring. Events are scoped to a club and optionally assigned to a resource.

```prisma
model CalendarEvent {
  eventId        String    @id @default(cuid())
  clubShortName  String
  club           Club      @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  resourceId     String?
  resource       ClubResource? @relation(fields: [resourceId], references: [resourceId], onDelete: SetNull)
  title          String    @db.VarChar(500)
  description    String?   @db.Text
  start          DateTime
  end            DateTime
  allDay         Boolean   @default(false)
  color          String?   @db.VarChar(20)  // Event text color (hex)
  backgroundColor String? @db.VarChar(20)  // Event background color (hex)

  // iCal / Recurrence fields
  uid            String    // Unique iCal UID — same across base event and all its modified instances
  rrule          String?   @db.Text // RFC 5545 RRULE string, e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20251231T235959Z"
  exdates        DateTime[] // Exception dates — occurrences to skip (for recurring events)
  recurrenceId   String?   // ISO timestamp of the original occurrence this instance overrides (for modified instances)
  parentEventId  String?   // FK to the base CalendarEvent (for modified instances)
  parentEvent    CalendarEvent?  @relation("EventInstances", fields: [parentEventId], references: [eventId], onDelete: Cascade)
  modifiedInstances CalendarEvent[] @relation("EventInstances")

  // Bookable event fields
  eventType         EventType  @default(BLOCK)
  isBlocking        Boolean    @default(true)    // Whether this event blocks the resource for conflict detection
  isPublic          Boolean    @default(false)   // Whether this event is visible on the public calendar
  maxParticipants   Int?                          // Capacity cap (null = unlimited)
  registrationType  RegistrationType?             // PER_INSTANCE (drop-in) or PER_SERIES (league)
  creditCost        Int?                          // Credits required to check in (Phase 5, null = not credit-based)
  productId         String?                       // FK to Product (null for BLOCK events)
  product           Product?   @relation(fields: [productId], references: [productId], onDelete: SetNull)
  resourceIds       String[]                      // Additional resource IDs for cross-resource events

  // Metadata
  createdByUserId String
  createdByUser   User     @relation(fields: [createdByUserId], references: [userId], onDelete: Cascade)
  isDeleted       Boolean  @default(false) // Soft deletion
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  registrations   EventRegistration[]

  @@index([clubShortName])
  @@index([resourceId])
  @@index([uid])
  @@index([parentEventId])
  @@index([createdByUserId])
  @@index([isDeleted])
  @@index([start, end]) // For date-range queries
  @@index([eventType])
  @@index([productId])
}
```

**Notes:**
- **`uid`**: For base events, auto-generated (e.g., `eventId + "@shuttlementor.com"`). For modified instances, same as the parent's `uid`. Used for iCal export and recurrence linking.
- **`rrule`**: Stored with `RRULE:` prefix as an RFC 5545 string. Parsed on the frontend using `RRule.fromString()` from rrule.js. Only present on base recurring events.
- **`exdates`**: PostgreSQL DateTime array. Each entry is a specific occurrence to skip. Only meaningful on base recurring events.
- **`recurrenceId`**: ISO string of the original occurrence time this modified instance replaces. Only present on modified instances (V2).
- **`parentEventId`**: Links modified instances to their base event. Cascade delete ensures deleting a series removes all modifications.
- **`resourceId`** uses `onDelete: SetNull` — if a resource is deleted, events remain but become unassigned.
- **`resourceIds`**: String array for cross-resource events. Maps to ilamy's `resourceIds` prop. Most events use `resourceId` (single); this is for events spanning multiple resources.
- **`eventType`**: Defaults to `BLOCK`. `BOOKABLE` and `COACHING_SLOT` events are purchasable via Polar.
- **`isBlocking`**: Defaults to `true`. Coach slots start as `false` (open) and flip to `true` on purchase.
- **`isPublic`**: Defaults to `false`. Facility/coach toggles per event. `BLOCK` events are never public (enforced in business logic). Controls visibility on the public calendar and embeddable widgets.
- **`maxParticipants`**: Our DB is sole source of truth for capacity. Available slots = `maxParticipants - count(confirmed registrations)`.
- **`registrationType`**: `PER_INSTANCE` for drop-in (users sign up per occurrence), `PER_SERIES` for leagues (purchase covers all occurrences).
- **`creditCost`**: Phase 5 field. Number of credits deducted per check-in. `null` means the event is not credit-based (direct purchase only). Events can support both direct Polar purchase AND credit-based check-in — credits are deducted if the user has them, otherwise they're directed to Polar checkout.
- **`creditPackId`** *(Phase 5 — not in V1 schema)*: Will be added as an optional FK to `CreditPack` to specify which credit pack type this event draws from. Combined with `creditCost`, this tells the system "deduct N credits from pack type X." Credits are deducted FIFO (balance expiring soonest first).
- **`productId`**: Links to the `Product` table for pricing/checkout. `BLOCK` events never have a product. For recurring events (leagues), the base event carries the `productId` and all expanded instances inherit it — no join table needed.
- **Soft delete** pattern matches existing `VideoCollection` model.

### Enums

```prisma
enum EventType {
  BLOCK           // Internal scheduling (maintenance, reserved, staff-only)
  BOOKABLE        // Facility-created bookable event (drop-in, league, open gym)
  COACHING_SLOT   // Coach-created training slot
}

enum RegistrationType {
  PER_INSTANCE    // Sign up for individual occurrences (drop-in)
  PER_SERIES      // Sign up for the whole series (league)
}

enum ProductCategory {
  COACHING_SESSION    // Async coaching (video review, etc.)
  CALENDAR_EVENT      // Bookable calendar event (drop-in, league, open gym)
  COACHING_SLOT       // Coach training slot on calendar
  CREDIT_PACK         // Phase 5: purchasable credit packs (e.g., "10-class pack")
}

enum RegistrationStatus {
  CONFIRMED
  CANCELLED
}
```

### Product

A generic product representing something purchasable. Replaces the previously planned `CoachingProduct` model. All purchases (including $0 free events) go through Polar checkout.

```prisma
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
  calendarEvents  CalendarEvent[]
  registrations   EventRegistration[]

  @@index([clubShortName])
  @@index([category])
  @@index([polarProductId])
  @@index([createdByUserId])
}
```

**Notes:**
- `priceInCents = 0` for free events — still goes through Polar $0 checkout for unified order tracking
- `polarProductId` is set after the product is synced/created in Polar
- One product can link to multiple calendar events (e.g., a league product links to all events in the series)
- Coaches set price per slot/series via this table

### EventRegistration

Tracks who signed up for what. Created when Polar webhook confirms payment.

```prisma
model EventRegistration {
  registrationId  String             @id @default(cuid())
  eventId         String
  event           CalendarEvent      @relation(fields: [eventId], references: [eventId], onDelete: Cascade)
  productId       String
  product         Product            @relation(fields: [productId], references: [productId])
  userId          String
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

**Notes:**
- `instanceDate` is only set for `PER_INSTANCE` registration (drop-in). For `PER_SERIES` (league), it's null — the registration covers all occurrences.
- `polarOrderId` links back to the Polar order for refund/audit purposes.
- **No DB-level unique constraint** on `[eventId, userId, instanceDate]`. Uniqueness is enforced in application logic (tRPC mutation checks for existing `CONFIRMED` registrations before creating). This allows re-booking after cancellation without constraint violations.

## Required Changes to Existing Models

### Club model

Add relations to the new models:

```prisma
model Club {
  clubShortName String   @id
  clubName      String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  users          User[]
  resourceTypes  ClubResourceType[]  // NEW
  resources      ClubResource[]      // NEW
  calendarEvents CalendarEvent[]     // NEW
  products       Product[]           // NEW
}
```

### User model

Add relations for created events, products, and registrations:

```prisma
model User {
  // ... existing fields ...

  // NEW relations
  createdCalendarEvents CalendarEvent[]
  createdProducts       Product[]            @relation("CreatedProducts")
  eventRegistrations    EventRegistration[]  @relation("EventRegistrations")
}
```

## Index Strategy

| Model                 | Index                                                                                                                                          | Purpose                                      |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| ClubResourceType      | `[clubShortName]`                                                                                                                              | Filter types by club                         |
| ClubResource          | `[clubShortName]`, `[resourceTypeId]`                                                                                                          | Filter resources by club/type                |
| ResourceBusinessHours | `[resourceId]`                                                                                                                                 | Load business hours for a resource           |
| CalendarEvent         | `[clubShortName]`, `[resourceId]`, `[uid]`, `[parentEventId]`, `[createdByUserId]`, `[isDeleted]`, `[start, end]`, `[eventType]`, `[productId]` | Various query patterns                       |
| Product               | `[clubShortName]`, `[category]`, `[polarProductId]`, `[createdByUserId]`                                                                       | Filter by club/category, Polar sync lookup   |
| EventRegistration     | `[eventId]`, `[productId]`, `[userId]`, `[polarOrderId]`                                                                                       | Registration lookups, capacity counting      |

The `[start, end]` composite index is critical for efficient date-range queries when loading events for the current calendar view.

## UTC Standardization

All `DateTime` fields in calendar models are stored in **UTC** in PostgreSQL. This includes `start`, `end`, `exdates`, `instanceDate`, `createdAt`, `updatedAt`, `deletedAt`. The frontend converts to/from the user's timezone for display using ilamy's `timezone` prop and `dayjs.utc()` for serialization. This eliminates timezone edge cases in conflict detection (e.g., a 6PM EST event vs a 6PM PST event are stored as different UTC times and compared correctly).

## Migration Notes

- All new models — no breaking changes to existing data
- `onDelete: Restrict` on `ClubResource.resourceTypeId` prevents orphaned resources
- `onDelete: SetNull` on `CalendarEvent.resourceId` preserves events if resource is removed
- `onDelete: Cascade` on `CalendarEvent.parentEventId` cleans up modified instances when base event is deleted
