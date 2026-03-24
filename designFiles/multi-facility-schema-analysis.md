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
  timezone      String?  // V1: ignored — all facilities share the club/user timezone.
                          // Reserved for future use if facilities span timezones.
  isActive      Boolean  @default(true)
  position      Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  resources      ClubResource[]
  calendarEvents CalendarEvent[]

  @@unique([clubShortName, name])  // No duplicate facility names within a club
  @@index([clubShortName])
}
```

**Deletion policy:** Facilities are soft-deleted via `isActive = false`, never hard-deleted. The FKs on `ClubResource` and `CalendarEvent` use `onDelete: Restrict` as a safety net to prevent accidental data loss if someone bypasses soft-delete.

### 2. `ClubResource` — add optional `facilityId`

```prisma
facilityId    String?
facility      ClubFacility? @relation(fields: [facilityId], references: [facilityId], onDelete: Restrict)
```

Resources with `facilityId = null` are **unassigned**. They should appear in an "All Facilities" view (and optionally an "Unassigned" management state), but not automatically appear inside every individual facility filter.

### 3. `CalendarEvent` — add `facilityId` (nullable only during migration)

```prisma
facilityId    String?
facility      ClubFacility? @relation(fields: [facilityId], references: [facilityId], onDelete: Restrict)
```

Use a nullable field only for migration/backfill. Before the multi-facility feature is considered complete, `CalendarEvent.facilityId` should be made required at the database level so every event belongs to exactly one facility.

### 4. `ClubResourceType` — stays club-wide (no `facilityId`)

Resource types (e.g. "Court", "Swim Lane") remain scoped to `clubShortName` only. Types are reusable across facilities. The Resource Manager UI should filter the type dropdown contextually when a facility filter is active (show types that have resources at the selected facility, plus all types when creating).

### 5. `Product` — no `facilityId` for V1

Products remain scoped to `clubShortName` only. If per-facility pricing is needed later, a `facilityId` FK can be added in a future phase.

### 6. `User` / `UserFacility` join table — deferred (V2+)

Skip for V1. All staff can see and manage all facilities within their club. If staff scoping is needed later:

```prisma
model UserFacility {
  userId     String
  facilityId String
  user       User         @relation(fields: [userId], references: [userId], onDelete: Cascade)
  facility   ClubFacility @relation(fields: [facilityId], references: [facilityId], onDelete: Cascade)

  @@id([userId, facilityId])
}
```

---

## Migration Path

### Phase A — Schema + backfill (no behavior change)

1. Add `ClubFacility` model.
2. Add nullable `facilityId` to `ClubResource` and `CalendarEvent`.
3. Add `@@index([facilityId])` to `CalendarEvent` (Phase C will filter by it heavily).
4. **Backfill in the same migration:** For every club that has at least one `ClubResource` or `CalendarEvent`, auto-create a "Main" facility. Assign all existing resources and events for that club to the new facility.
5. After backfill, make `CalendarEvent.facilityId` required (non-nullable) in a follow-up migration once confirmed safe.

**Backfill SQL sketch** (runs inside the migration):
```sql
-- 1. Create a "Main" facility for each club that has resources or events
INSERT INTO "ClubFacility" ("facilityId", "clubShortName", "name", "isActive", "position", "createdAt", "updatedAt")
SELECT gen_random_uuid(), c."clubShortName", 'Main', true, 0, NOW(), NOW()
FROM "Club" c
WHERE EXISTS (SELECT 1 FROM "ClubResource" cr WHERE cr."clubShortName" = c."clubShortName")
   OR EXISTS (SELECT 1 FROM "CalendarEvent" ce WHERE ce."clubShortName" = c."clubShortName");

-- 2. Assign all resources to their club's "Main" facility
UPDATE "ClubResource" cr
SET "facilityId" = cf."facilityId"
FROM "ClubFacility" cf
WHERE cf."clubShortName" = cr."clubShortName" AND cf."name" = 'Main';

-- 3. Assign all events to their club's "Main" facility
UPDATE "CalendarEvent" ce
SET "facilityId" = cf."facilityId"
FROM "ClubFacility" cf
WHERE cf."clubShortName" = ce."clubShortName" AND cf."name" = 'Main';
```

### Phase B — Resource Manager UI

1. Add facility CRUD to `/calendar/resources` (create, rename, reorder, deactivate).
2. Allow assigning a resource to a facility when creating/editing.
3. Filter the resource calendar by facility using a tab or dropdown.
4. Filter the resource type dropdown contextually when a facility filter is active.

### Phase C — Event Scoping

1. Pre-populate facility on event creation from the selected resource's facility.
2. Filter `getEvents` by `facilityId` when a facility filter is active on the calendar.
3. **App-logic validation** in `createEvent` / `updateEvent` routes: all `resourceIds` entries must belong to the same facility, and `CalendarEvent.facilityId` must match. No DB-level constraint on the `resourceIds` string array.

### Phase D — Public Calendar

1. Expose per-facility public calendars via query param: `/club/[clubShortName]?facility=<facilityId>`.
2. Default (no param) shows all facilities / all events.
3. Wire up the `TODO(multi-facility)` hooks already planted in `CalendarClient.tsx` (embed URL) and `PublicCalendarClient.tsx` (facility filter prop).

---

## What Does NOT Need To Change

- `clubShortName` remains the primary auth/ownership scope. All security checks (`requireSameClub`) stay as-is.
- `Club` model needs only a `facilities ClubFacility[]` relation added.
- `ClubResourceType` stays club-wide — no `facilityId`.
- `Product` model stays club-wide — no `facilityId` for V1.
- `User.clubShortName` stays single — multi-club membership is a separate M1/M2 concern.
- tRPC procedure auth logic is unchanged.

---

## Effort Estimate

| Phase | Effort |
|---|---|
| A — Schema + backfill migration | Low (~1 hr, migration + types) |
| B — Resource Manager facility CRUD + filter | Medium (~3–4 hrs) |
| C — Event scoping + calendar filter + app-logic validation | Medium (~2–3 hrs) |
| D — Public per-facility page (query param) | Medium (~2 hrs) |

---

## Settled Rules

- `ClubResource.facilityId = null` means **unassigned**, not "visible in every facility".
- Unassigned resources should appear in **All Facilities**, not in each specific facility filter.
- `CalendarEvent.facilityId` can be nullable only during migration/backfill; the final schema requires it.
- Events with multiple attached resources (`resourceIds`) must not span multiple facilities — enforced in app logic, not DB constraints.
- Facilities are soft-deleted (`isActive = false`), never hard-deleted. FKs use `onDelete: Restrict`.
- Facility names are unique per club (`@@unique([clubShortName, name])`).
- `ClubResourceType` stays club-wide; UI filters types contextually per facility.
- `Product` has no facility association for V1.
- `UserFacility` staff scoping is deferred to V2+.
- `ClubFacility.timezone` is reserved but ignored in V1 — calendar uses user timezone.
- Public per-facility URLs use query param format: `?facility=<facilityId>`.
