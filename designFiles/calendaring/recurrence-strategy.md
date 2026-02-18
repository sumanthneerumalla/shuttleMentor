# Recurrence Strategy — Calendaring Feature

This document explains how recurring events are stored, loaded, expanded, and modified. It covers both the V1 (whole-series only) and V2 (per-instance) approaches.

## Core Principle

**Store the rule, expand on the client.**

We store the RRULE string and metadata in the database. The `@ilamy/calendar` library (powered by `rrule.js`) handles expanding recurring events into individual instances on the client side, automatically generating only the instances needed for the current view range.

This approach means:
- No server-side instance generation
- No storing hundreds of individual event rows for a daily recurring event
- Compact storage: one DB row per recurring series (plus one row per modified instance in V2)
- The calendar handles navigation, view changes, and instance display transparently

## Storage Format

### Base Recurring Event (DB → `CalendarEvent` row)

| DB Field         | Example Value                                          | Purpose                                     |
| :--------------- | :----------------------------------------------------- | :------------------------------------------ |
| `eventId`        | `"clxyz123"`                                          | Primary key                                 |
| `uid`            | `"clxyz123@shuttlementor.com"`                        | iCal UID, links base + modified instances   |
| `title`          | `"Open Play"`                                         | Event title                                 |
| `start`          | `2025-03-03T18:00:00Z`                                 | Start of the **first** occurrence           |
| `end`            | `2025-03-03T20:00:00Z`                                 | End of the **first** occurrence             |
| `rrule`          | `"FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20251231T235959Z"` | RFC 5545 RRULE string                       |
| `exdates`        | `[2025-03-17T18:00:00Z, 2025-04-07T18:00:00Z]`        | Dates to skip (V2)                          |
| `recurrenceId`   | `null`                                                 | Not a modified instance                     |
| `parentEventId`  | `null`                                                 | Not a modified instance                     |
| `resourceId`     | `"court-1-id"`                                        | Assigned resource                           |

### Modified Instance (V2 — DB → separate `CalendarEvent` row)

| DB Field         | Example Value                            | Purpose                                  |
| :--------------- | :--------------------------------------- | :--------------------------------------- |
| `eventId`        | `"clxyz456"`                            | Its own primary key                      |
| `uid`            | `"clxyz123@shuttlementor.com"`          | **Same** UID as the base event           |
| `title`          | `"Extended Open Play + Tournament Prep"` | Override title                           |
| `start`          | `2025-03-19T17:00:00Z`                   | Override start (different from normal)   |
| `end`            | `2025-03-19T21:00:00Z`                   | Override end (longer)                    |
| `rrule`          | `null`                                   | Not recurring itself                     |
| `exdates`        | `[]`                                     | Not applicable                           |
| `recurrenceId`   | `"2025-03-19T18:00:00.000Z"`            | Original occurrence time it replaces     |
| `parentEventId`  | `"clxyz123"`                            | FK to the base event                     |
| `resourceId`     | `"court-1-id"`                          | Same or different resource               |

## Data Flow

### Creating a Recurring Event (V1)

```
User fills form → onEventAdd callback fires
  → Frontend serializes RRULE: new RRule({ freq: RRule.WEEKLY, ... }).toString()
  → tRPC createEvent mutation sends: { title, start, end, resourceId, rrule: "FREQ=WEEKLY;..." }
  → Server validates RRULE with RRule.fromString(), creates CalendarEvent row
  → Frontend invalidates query cache
  → Fresh data fetched, transformed, passed to calendar
  → Calendar auto-expands RRULE into visible instances
```

### Loading Events on Login

```
CalendarClient mounts → useQuery fetches getEvents({ startDate, endDate })
  → Server returns:
    - Non-recurring events in [startDate, endDate] range
    - Base recurring events whose RRULE has no `until` OR whose `until` >= startDate,
      AND whose `start` < endDate (skip expired series AND series that haven't begun yet)
    - Modified instances linked to included base events (V2)
  → Frontend transforms:
    - eventId → id
    - rrule string → RRule.fromString().origOptions (rrule.js options object)
    - exdates → Date[]
    - recurrenceId → string (for ilamy override detection)
    - uid → uid (for ilamy series linking)
  → IlamyResourceCalendar receives events[], auto-generates recurring instances
```

### RRULE String ↔ ilamy Object Conversion

**DB → Frontend (load):**
```typescript
import { RRule } from "rrule";

function parseRRuleForCalendar(rruleString: string): object {
  const rule = RRule.fromString(rruleString);
  return rule.origOptions;
  // Returns: { freq: 2, interval: 1, byweekday: [0, 2, 4], dtstart: Date, until: Date }
}
```

**Frontend → DB (save):**
```typescript
import { RRule } from "rrule";

function serializeRRule(rruleOptions: Partial<RRuleOptions>): string {
  const rule = new RRule(rruleOptions);
  return rule.toString();
  // Returns: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20251231T235959Z"
  // Strip the "RRULE:" prefix before storing if needed
}
```

**RRULE prefix convention:** Always store with the `RRULE:` prefix (e.g., `"RRULE:FREQ=WEEKLY;BYDAY=MO"`). `rrule.js` `.toString()` produces this format. `.fromString()` accepts both with and without. Storing with the prefix ensures RFC 5545 compliance and iCal export compatibility.

## V1 Operations (Whole-Series Only)

### Edit Entire Series

When a user edits a recurring event in V1, ALL occurrences change:

```
User clicks event → event form opens (populated with base event data)
  → User changes title, time, or RRULE
  → onEventUpdate fires with updated CalendarEvent
  → Frontend calls updateEvent mutation with base event's eventId
  → Server updates the single CalendarEvent row
  → All generated instances reflect the change automatically
```

### Delete Entire Series

```
User clicks delete → confirmation dialog
  → onEventDelete fires
  → Frontend calls deleteEvent mutation with base event's eventId
  → Server soft-deletes the CalendarEvent row (and any modified instances via cascade)
  → Series disappears from calendar
```

### What V1 Does NOT Support

- Editing a single occurrence (no exdates, no modified instances created)
- Deleting a single occurrence (no exdates added)
- "Edit this and all future" (series splitting)

These are designed into the schema but not implemented in V1 UI or API.

## V2 Operations (Per-Instance — Future)

### Cancel a Single Occurrence

```
User clicks specific instance → "Delete this occurrence" option
  → Frontend adds the instance's start time to base event's exdates array
  → Calls updateEvent with { eventId: baseId, exdates: [...existing, thisDate] }
  → Server updates exdates on the base CalendarEvent
  → Calendar skips that date on next render
```

### Modify a Single Occurrence

```
User clicks specific instance → "Edit this occurrence" option
  → User changes title/time/duration
  → Frontend creates a new event with:
    - uid: same as base event
    - recurrenceId: original occurrence time (ISO string)
    - parentEventId: base event's eventId
    - No rrule (it's a one-off override)
  → Calls createEvent mutation (as a modified instance)
  → Also adds original time to base event's exdates
  → Calendar replaces the generated instance with the override
```

### V2 Note: Conflict Detection with Modified Instances

When V2 is implemented, the `checkConflicts` procedure must also:
1. Exclude exdated occurrence times from the expanded RRULE instances
2. Include modified instances (rows with `parentEventId != null`) as separate conflict candidates with their own start/end times
3. Avoid double-counting: if an occurrence is exdated AND has a modified instance, only check the modified instance

### Edit This and All Future (Series Split)

```
User picks "Edit this and all future" on occurrence at date X
  → Frontend:
    1. Updates base event's RRULE to end BEFORE date X (sets `until` to day before X)
    2. Creates NEW base recurring event starting at date X with the modified properties
  → Two separate series in the DB, visually seamless
```

## Server-Side RRULE Validation

The server validates RRULE strings on create/update:

```typescript
import { RRule } from "rrule";

function validateRRule(rruleString: string): void {
  try {
    const rule = RRule.fromString(rruleString);
    // Ensure the rule generates at least one occurrence
    const firstOccurrence = rule.all((_, i) => i < 1);
    if (firstOccurrence.length === 0) {
      throw new Error("Rule generates no occurrences");
    }
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid recurrence rule: " + (error as Error).message,
    });
  }
}
```

## Conflict Detection with Recurring Events

For the `checkConflicts` procedure, recurring events need server-side expansion within the query range:

```typescript
// For recurring events on the same resource, expand instances in the conflict range
function getRecurringConflicts(
  baseEvent: CalendarEvent,
  checkStart: Date,
  checkEnd: Date,
): Array<{ start: Date; end: Date }> {
  if (!baseEvent.rrule) return [];

  const rule = RRule.fromString(baseEvent.rrule);
  const duration = baseEvent.end.getTime() - baseEvent.start.getTime();

  // Get instances in the range
  const instances = rule.between(checkStart, checkEnd, true);

  // Filter out exdated instances
  const exdateSet = new Set(baseEvent.exdates.map((d) => d.toISOString()));

  return instances
    .filter((d) => !exdateSet.has(d.toISOString()))
    .map((instanceStart) => ({
      start: instanceStart,
      end: new Date(instanceStart.getTime() + duration),
    }));
}
```

## Timezone Handling

- **Storage**: All `DateTime` fields stored in **UTC** in PostgreSQL (see `database-schema.md` — UTC Standardization)
- **Display**: The user's `timeZone` preference (from `User.timeZone`) is passed to the ilamy calendar's `timezone` prop
- **RRULE `dtstart`**: Stored in UTC; ilamy + rrule.js handle timezone conversion for display
- **Conflict detection**: Compares UTC times directly, eliminating timezone edge cases (e.g., 6PM EST vs 6PM PST are different UTC times). User models in the db have the `timeZone` field to store the user's timezone.
- **Best practice**: Use `dayjs.utc()` for creating dates when serializing to/from the DB

## iCal Export Compatibility

ilamy Calendar has **built-in iCal export** — no additional library needed:
- **Desktop**: "Export" button in the top-right corner of the calendar header
- **Mobile**: Menu (☰) → "Export Calendar (.ics)"
- **Supported properties**: `SUMMARY`, `DESCRIPTION`, `LOCATION`, `DTSTART`, `DTEND`, `UID`, `VALUE=DATE` (all-day), `RRULE`, `EXDATE`, `RECURRENCE-ID`
- **Compatibility**: Google Calendar, Apple Calendar, Microsoft Outlook, Thunderbird, any RFC 5545 compliant app

Because our schema stores:
- `uid` — maps to iCal `UID`
- `rrule` — maps to iCal `RRULE` (stored with `RRULE:` prefix)
- `exdates` — maps to iCal `EXDATE`
- `recurrenceId` — maps to iCal `RECURRENCE-ID`

...the export is automatically RFC 5545 compliant with zero additional work. This is available from **Phase 1** since ilamy renders the export button natively.
