# API Design — Calendaring Feature

This document defines the tRPC router for the calendaring feature. It follows existing patterns from `src/server/api/routers/user.ts` and `src/server/api/routers/coaches.ts`.

## Router: `calendarRouter`

File: `src/server/api/routers/calendar.ts`

Most mutations use `facilityProcedure` (FACILITY + ADMIN only). Coach slot mutations use a `coachProcedure` (COACH users, restricted to `COACHING_SLOT` event type). Queries use `protectedProcedure` (any authenticated user) with club-scoping logic to ensure users only see their own club's data. Public queries (for unauthenticated users) use `publicProcedure`.

## Shared Helpers

These follow the pattern in `src/server/utils/utils.ts`:

```typescript
/**
 * Helper to verify the current user belongs to the specified club
 * Used by read procedures to scope data to the user's club
 */
function requireSameClub(user: User, clubShortName: string): void {
  if (user.clubShortName !== clubShortName && !isAdmin(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only access your own club's calendar",
    });
  }
}

/**
 * Default colors from globals.css design tokens.
 * Used when resource/event has no color set.
 */
const DEFAULT_COLOR = "#4F46E5";        // --primary: rgb(79 70 229)
const DEFAULT_BG_COLOR = "#EFF6FF";     // --accent: rgb(239 246 255)
```

---

## Resource Type Procedures

### `createResourceType`

**Procedure**: `facilityProcedure` (FACILITY + ADMIN)

**Input**:
```typescript
z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})
```

**Logic**:
1. Get current user from context (already available via `facilityProcedure` middleware — `ctx.user`)
2. Create `ClubResourceType` with `clubShortName` from `ctx.user.clubShortName`
3. Handle unique constraint violation (duplicate name) with friendly error

**Output**: The created `ClubResourceType`

---

### `getResourceTypes`

**Procedure**: `protectedProcedure` (any authenticated user)

**Input**: None (uses caller's `clubShortName`)

**Logic**:
1. Get current user via `getCurrentUser(ctx)`
2. Query `ClubResourceType` where `clubShortName` matches user's club
3. Include count of resources per type
4. Order by `name` ascending

**Output**:
```typescript
{
  resourceTypes: Array<{
    resourceTypeId: string;
    name: string;
    color: string | null;
    backgroundColor: string | null;
    _count: { resources: number };
  }>;
}
```

---

### `updateResourceType`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceTypeId: z.string(),
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
})
```

**Logic**:
1. Verify resource type exists and belongs to user's club
2. Update fields
3. Handle unique constraint on name change

---

### `deleteResourceType`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceTypeId: z.string(),
})
```

**Logic**:
1. Verify resource type exists and belongs to user's club
2. Check if any active resources use this type (`Restrict` in DB, but give friendly error)
3. Delete the type

---

## Resource Procedures

### `createResource`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceTypeId: z.string(),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
  businessHours: z.array(z.object({
    daysOfWeek: z.array(z.enum([
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    ])).min(1),
    startTime: z.number().int().min(0).max(23),
    endTime: z.number().int().min(0).max(23),
  })).optional(),
})
```

**Logic**:
1. Verify `resourceTypeId` belongs to user's club
2. Create `ClubResource` with `clubShortName` from `ctx.user`
3. If `businessHours` provided, create `ResourceBusinessHours` entries in a transaction
4. If `position` not provided, auto-assign next position (max existing + 1)

**Output**: Created resource with business hours included

---

### `getResources`

**Procedure**: `protectedProcedure`

**Input**: None (uses caller's club)

**Logic**:
1. Get current user
2. Query `ClubResource` where `clubShortName` matches and `isActive` is true
3. Include `resourceType` and `businessHours`
4. Order by `position` ascending

**Output**:
```typescript
{
  resources: Array<{
    resourceId: string;
    title: string;
    description: string | null;
    color: string | null;           // Raw from resource, frontend falls back to DEFAULT_COLOR
    backgroundColor: string | null; // Raw from resource, frontend falls back to DEFAULT_BG_COLOR
    position: number;
    resourceType: { resourceTypeId: string; name: string };
    businessHours: Array<{
      daysOfWeek: string[];
      startTime: number;
      endTime: number;
    }>;
  }>;
}
```

**Note**: Colors are passed through as-is from the DB. The frontend applies `DEFAULT_COLOR` / `DEFAULT_BG_COLOR` fallbacks during transformation (see `frontend-integration.md`).

---

### `updateResource`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceId: z.string(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().nullable().optional(),
  resourceTypeId: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})
```

**Logic**:
1. Verify resource exists and belongs to user's club
2. If `resourceTypeId` changing, verify new type belongs to same club
3. Update fields

---

### `updateResourceBusinessHours`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceId: z.string(),
  businessHours: z.array(z.object({
    daysOfWeek: z.array(z.enum([
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    ])).min(1),
    startTime: z.number().int().min(0).max(23),
    endTime: z.number().int().min(0).max(23),
  })),
})
```

**Logic**:
1. Verify resource exists and belongs to user's club
2. In a transaction: delete all existing `ResourceBusinessHours` for this resource, then create new ones
3. Validate `startTime < endTime` for each entry (Zod refine)

**Note**: Replace-all strategy is simpler than individual CRUD for business hours entries.

---

### `deleteResource`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  resourceId: z.string(),
})
```

**Logic**:
1. Verify resource exists and belongs to user's club
2. Set `isActive = false` (soft deactivate)
3. Events remain but resource won't appear in calendar

---

## Event Procedures

### `createEvent`

**Procedure**: `facilityProcedure` for `BLOCK` and `BOOKABLE` events. Coach slot creation uses a separate `createCoachSlot` procedure (see below).

**Input**:
```typescript
z.object({
  resourceId: z.string().optional(),
  resourceIds: z.array(z.string()).optional(), // For cross-resource events
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(2000).trim().optional(),
  start: z.date(),
  end: z.date(),
  allDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  rrule: z.string().max(500).optional(), // RFC 5545 RRULE string
  // Bookable event fields (Phase 2.5+, ignored in V1)
  eventType: z.enum(["BLOCK", "BOOKABLE"]).default("BLOCK"),
  isPublic: z.boolean().default(false),
  maxParticipants: z.number().int().positive().optional(),
  registrationType: z.enum(["PER_INSTANCE", "PER_SERIES"]).optional(),
  productId: z.string().optional(),
})
```

**Logic**:
1. Validate `end > start` (unless `allDay`)
2. If `resourceId` provided, verify it belongs to user's club and is active
3. If `resourceIds` provided, verify all belong to user's club and are active
4. Generate `uid` as `${eventId}@shuttlementor.com`
5. Create `CalendarEvent` with `clubShortName` and `createdByUserId` from `ctx.user`
6. If `rrule` provided, validate it parses correctly with `RRule.fromString()`
7. `isBlocking` defaults to `true` for both `BLOCK` and `BOOKABLE` events
8. If `eventType` is `BOOKABLE`, `productId` should be provided (validated in Phase 2.5+)

**Output**: Created event

---

### `createCoachSlot`

**Procedure**: `coachProcedure` (COACH users only)

**Input**:
```typescript
z.object({
  resourceId: z.string(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(2000).trim().optional(),
  start: z.date(),
  end: z.date(),
  rrule: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  maxParticipants: z.number().int().positive().default(1), // Typically 1 for 1-on-1
  productId: z.string().optional(),
})
```

**Logic**:
1. Validate `end > start`
2. Verify `resourceId` belongs to coach's club and is active
3. Create `CalendarEvent` with `eventType = COACHING_SLOT`, `isBlocking = false`, `createdByUserId` from `ctx.user`
4. Generate `uid` as `${eventId}@shuttlementor.com`
5. If `rrule` provided, validate with `RRule.fromString()`

**Note**: Coach slots are non-blocking when created. They transition to blocking when purchased (handled by Polar webhook in Phase 3).

**Output**: Created event

---

### `updateCoachSlot`

**Procedure**: `coachProcedure` (COACH users only)

**Input**:
```typescript
z.object({
  eventId: z.string(),
  title: z.string().min(1).max(500).trim().optional(),
  description: z.string().max(2000).trim().nullable().optional(),
  resourceId: z.string().optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  isPublic: z.boolean().optional(),
  maxParticipants: z.number().int().positive().optional(),
  rrule: z.string().max(500).nullable().optional(),
})
```

**Logic**:
1. Verify event exists, belongs to coach's club, `eventType = COACHING_SLOT`, and `createdByUserId` matches `ctx.user.userId`
2. If `resourceId` changing, verify new resource belongs to same club and is active
3. If `rrule` changing, validate with `RRule.fromString()`
4. Update fields

**Note**: Coaches can only update their own slots. Facility users use `updateEvent` for BLOCK/BOOKABLE events.

---

### `deleteCoachSlot`

**Procedure**: `coachProcedure` (COACH users only)

**Input**:
```typescript
z.object({
  eventId: z.string(),
})
```

**Logic**:
1. Verify event exists, belongs to coach's club, `eventType = COACHING_SLOT`, and `createdByUserId` matches `ctx.user.userId`
2. Soft delete: set `isDeleted = true`, `deletedAt = now()`
3. If base recurring event, also soft-delete all modified instances

**Note**: If the slot has confirmed registrations, the coach should be warned (frontend) but deletion is still allowed (soft delete preserves data for refund processing).

---

### `getEvents`

**Procedure**: `protectedProcedure`

**Input**:
```typescript
z.object({
  startDate: z.date(),
  endDate: z.date(),
})
```

**Logic**:
1. Get current user
2. Query `CalendarEvent` where:
   - `clubShortName` matches user's club
   - `isDeleted` is false
   - For **non-recurring events**: `start < endDate AND end > startDate` (overlaps with view range)
   - For **recurring events**: include base events (`rrule != null`) whose RRULE has no `until` OR whose `until >= startDate`, AND whose `start < endDate` (skip expired series AND series that haven't begun yet)
   - Include modified instances (`parentEventId != null`) linked to included base events
3. Include `resource` relation (title, color)
4. Include `product` relation (priceInCents) and `_count.registrations` for capacity display
5. Include `createdByUser` relation (firstName) for coach name display

**Output**:
```typescript
{
  events: Array<{
    eventId: string;
    resourceId: string | null;
    title: string;
    description: string | null;
    start: Date;
    end: Date;
    allDay: boolean;
    color: string | null;
    backgroundColor: string | null;
    uid: string;
    rrule: string | null;
    exdates: Date[];
    recurrenceId: string | null;
    parentEventId: string | null;
    // Bookable fields (present from V1 with defaults, used from Phase 2.5+)
    eventType: "BLOCK" | "BOOKABLE" | "COACHING_SLOT";
    isBlocking: boolean;
    isPublic: boolean;
    maxParticipants: number | null;
    productId: string | null;
    product: { priceInCents: number } | null;
    _count: { registrations: number }; // make sure only registrations that are not cancelled are counted
    createdByUser: { firstName: string | null };
  }>;
}
```

**Important**: The frontend converts this into `CalendarEvent[]` for ilamy:
- `eventId` → `id`
- `rrule` string → parsed `RRule` options object via `RRule.fromString()`
- `exdates` → `Date[]` for ilamy's `exdates` property
- `recurrenceId` → ilamy's `recurrenceId`
- `uid` → ilamy's `uid`

---

### `updateEvent`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  eventId: z.string(),
  title: z.string().min(1).max(500).trim().optional(),
  description: z.string().max(2000).trim().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  allDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  rrule: z.string().max(500).nullable().optional(),
  exdates: z.array(z.date()).optional(), // V2: update exception dates
})
```

**Logic**:
1. Verify event exists, belongs to user's club, and is not deleted
2. If `resourceId` changing, verify new resource belongs to same club
3. If `rrule` changing, validate with `RRule.fromString()`
4. Update fields
5. V1: only whole-series updates (no `recurrenceId` handling)

---

### `deleteEvent`

**Procedure**: `facilityProcedure`

**Input**:
```typescript
z.object({
  eventId: z.string(),
})
```

**Logic**:
1. Verify event exists and belongs to user's club
2. Soft delete: set `isDeleted = true`, `deletedAt = now()`
3. If this is a base recurring event, also soft-delete all modified instances (`parentEventId = eventId`)

---

### `checkConflicts`

**Procedure**: `protectedProcedure`

**Input**:
```typescript
z.object({
  resourceId: z.string(),
  start: z.date(),
  end: z.date(),
  excludeEventId: z.string().optional(), // Exclude current event when editing
})
```

**Logic**:
1. Verify resource belongs to user's club
2. Query non-deleted, **blocking** (`isBlocking = true`), non-recurring events on this resource that overlap with `[start, end)`
3. For **blocking** recurring events on this resource, load their RRULEs and check if any instance overlaps (server-side expansion for conflict check only)
4. Non-blocking events (open coach slots) are **excluded** from conflict results
5. Return list of conflicting events

**Output**:
```typescript
{
  hasConflicts: boolean;
  conflicts: Array<{
    eventId: string;
    title: string;
    start: Date;
    end: Date;
  }>;
}
```

**Note**: This is a **warning-only** check. The frontend shows a dialog but still allows saving.

### Conflict Detection Edge Cases

- **RRULE modification**: When a recurring event's RRULE is modified via `updateEvent`, `checkConflicts` does NOT retroactively re-validate all future instances. The conflict check runs only when creating or moving an event. If a facility user changes an RRULE and introduces new conflicts, they'll see warnings the next time they create/move events on that resource.
- **Timezone**: All event times are stored in UTC (see `database-schema.md` — UTC Standardization). Conflict detection compares UTC times directly, eliminating timezone edge cases.
- **Modified instances (V2)**: See `recurrence-strategy.md` — V2 Note for how exdated and modified instances affect conflict detection.

---

### `getPublicEvents` (Phase 2.5+)

**Procedure**: `publicProcedure` (unauthenticated)

**Input**:
```typescript
z.object({
  clubShortName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
})
```

**Logic**:
1. Query `CalendarEvent` where `clubShortName` matches, `isDeleted` is false
2. Filter: **only** events where `isPublic = true` — `BLOCK` events are **never returned** to the public API
3. Return full details for matching `BOOKABLE` and `COACHING_SLOT` events (title, description, capacity, product info, coach name)
4. Include registration counts for capacity display (aggregate `EventRegistration` where `status = CONFIRMED`)
5. Include `resource` relation (title, color)
6. Include `createdByUser` relation (firstName) for coach name on `COACHING_SLOT` events
7. Apply same recurring event filter as `getEvents`: `start < endDate` AND (`until` is null OR `until >= startDate`)

> **Design Decision**: `BLOCK` events are completely excluded from the public API. Public users should not know about internal scheduling blocks. Empty time slots on the public calendar simply appear as available time — which is correct, since those slots aren't bookable anyway.

**Output**:
```typescript
{
  events: Array<{
    eventId: string;
    resourceId: string | null;
    eventType: "BOOKABLE" | "COACHING_SLOT";
    title: string;
    description: string | null;
    start: Date;
    end: Date;
    maxParticipants: number | null;
    currentRegistrations: number;
    priceInCents: number | null;
    productId: string | null;
    coachName: string | null;
    // Recurrence
    rrule: string | null;
    uid: string;
  }>;
}
```

---

### `getPublicResources` (Phase 2.5+)

**Procedure**: `publicProcedure` (unauthenticated)

**Input**:
```typescript
z.object({
  clubShortName: z.string(),
})
```

**Logic**:
1. Query `ClubResource` where `clubShortName` matches and `isActive` is true
2. Include `businessHours`
3. Order by `position` ascending

**Output**: Same shape as `getResources` but without auth requirement.

---

## Router Registration

Add to `src/server/api/root.ts`:

```typescript
import { calendarRouter } from "~/server/api/routers/calendar";

export const appRouter = createTRPCRouter({
  // ... existing routers
  calendar: calendarRouter,
});
```

## Error Handling Patterns

Follow existing patterns from `coaches.ts` and `user.ts`:

| Scenario                     | Error Code    | Message                                                  |
| :--------------------------- | :------------ | :------------------------------------------------------- |
| Resource/event not found     | `NOT_FOUND`   | "Resource not found" / "Event not found"                 |
| Wrong club                   | `FORBIDDEN`   | "You can only access your own club's calendar"           |
| Duplicate resource type name | `CONFLICT`    | "A resource type with this name already exists"          |
| Resource type in use         | `BAD_REQUEST` | "Cannot delete resource type that has active resources"  |
| Invalid RRULE                | `BAD_REQUEST` | "Invalid recurrence rule format"                         |
| Invalid time range           | `BAD_REQUEST` | "End time must be after start time"                      |
