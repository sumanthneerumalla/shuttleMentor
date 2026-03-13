# Multi-Facility Schema Analysis

## What "Multiple Facilities Per Club" Means

Right now a `Club` is a single logical entity with one set of resources, events, and members. "Multiple facilities" means a single club could own and operate more than one physical location — e.g., "City Badminton Club" has a downtown hall and a suburban hall, each with its own courts, hours, and staff.

---

## Current Schema Constraints

### The bottleneck: `clubShortName` as the only scope key

Everything is scoped by `clubShortName`:

| Model | Scoped by |
|---|---|
| `ClubResource` | `clubShortName` |
| `CalendarEvent` | `clubShortName` |
| `Product` | `clubShortName` |
| `User` | `clubShortName` (single club, denormalized) |

There is no concept of a sub-location or facility within a club. All courts, events, and staff pool into one flat namespace per club.

---

## What Needs To Change

### 1. New `ClubFacility` model

```prisma
model ClubFacility {
  facilityId    String   @id @default(cuid())
  clubShortName String
  club          Club     @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  name          String   @db.VarChar(200)  // e.g., "Downtown Hall", "Suburban Centre"
  address       String?  @db.Text
  timezone      String?  // Facility-local timezone if different from club default
  isActive      Boolean  @default(true)
  position      Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  resources      ClubResource[]
  calendarEvents CalendarEvent[]

  @@index([clubShortName])
}
```

### 2. `ClubResource` — add optional `facilityId`

```prisma
facilityId    String?
facility      ClubFacility? @relation(fields: [facilityId], references: [facilityId], onDelete: SetNull)
```

Resources with `facilityId = null` are **unassigned**. They should appear in an "All Facilities" view (and optionally an "Unassigned" management state), but not automatically appear inside every individual facility filter.

### 3. `CalendarEvent` — add `facilityId` (nullable only during migration)

```prisma
facilityId    String?
facility      ClubFacility? @relation(fields: [facilityId], references: [facilityId], onDelete: SetNull)
```

Use a nullable field only for migration/backfill. Before the multi-facility feature is considered complete, `CalendarEvent.facilityId` should be made required at the database level so every event belongs to exactly one facility.

### 4. `User` / `UserFacility` join table (optional, for staff scoping)

If staff members should be scoped to specific facilities (e.g., a coach only manages courts at one location):

```prisma
model UserFacility {
  userId     String
  facilityId String
  user       User         @relation(fields: [userId], references: [userId], onDelete: Cascade)
  facility   ClubFacility @relation(fields: [facilityId], references: [facilityId], onDelete: Cascade)

  @@id([userId, facilityId])
}
```

This is optional — skip for V1 if all staff can see all facilities.

---

## Migration Path

### Phase A — Schema (no behavior change)

1. Add `ClubFacility` model.
2. Add nullable `facilityId` to `ClubResource` and `CalendarEvent`.
3. Run migration — existing resources start as unassigned, and existing events can remain temporarily nullable while backfill logic is introduced.
4. Before multi-facility event filtering is shipped, backfill `CalendarEvent.facilityId` and make it required.

### Phase B — Resource Manager UI

1. Add facility CRUD to `/calendar/resources`.
2. Allow assigning a resource to a facility when creating/editing.
3. Filter the resource calendar by facility using a tab or dropdown.

### Phase C — Event Scoping

1. Optionally assign an event to a facility at creation time (pre-populate from the selected resource's facility).
2. Filter `getEvents` by `facilityId` when a facility filter is active on the calendar.
3. Enforce that events with attached resources cannot span multiple facilities.
4. Enforce that an event's `facilityId` matches the facility of its attached resource(s).

### Phase D — Public Calendar (if needed)

1. Expose `/club/[clubShortName]/[facilityId]` or `/club/[clubShortName]?facility=xyz` for per-facility public pages.

---

## What Does NOT Need To Change

- `clubShortName` remains the primary auth/ownership scope. All security checks (`requireSameClub`) stay as-is.
- `Club` model needs no changes.
- `Product` model does not need `facilityId` unless pricing differs per facility (unlikely for V1).
- `User.clubShortName` stays single — multi-club membership is a separate M1/M2 concern.
- tRPC procedure auth logic is unchanged.

---

## Effort Estimate

| Phase | Effort |
|---|---|
| A — Schema only | Low (~1 hr, migration + types) |
| B — Resource Manager facility CRUD + filter | Medium (~3–4 hrs) |
| C — Event scoping + calendar filter | Medium (~2–3 hrs) |
| D — Public per-facility page | Medium (~2 hrs) |

---

## Settled Rules

- `ClubResource.facilityId = null` means **unassigned**, not "visible in every facility".
- Unassigned resources should appear in **All Facilities**, not in each specific facility filter.
- `CalendarEvent.facilityId` can be nullable only during migration/backfill; the final multi-facility schema should require it.
- Events with multiple attached resources must not span multiple facilities.
