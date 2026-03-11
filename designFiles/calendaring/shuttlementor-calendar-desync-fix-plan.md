# ShuttleMentor Calendar Desync Fix Plan

## Purpose

This document captures the remaining ShuttleMentor-side calendar bugs after separating out the two ilamy library issues:

- stock header dropdowns not firing `onDateChange`
- stock prev/next navigation firing `onDateChange` at the wrong time

Those are real ilamy issues, but ShuttleMentor also has its own desync paths that need to be fixed locally.

This plan is intentionally scoped to the smallest clean set of changes.

## Current State

Right now ShuttleMentor is back on the stock ilamy header and the Tailwind `@source` path fix restored the normal desktop header layout.

The remaining app-side problems are:

1. `year` view desync in the standard calendar
2. remount/reset desync when switching between standard and resource calendars
3. timezone mismatch risk when computing the fetch window

These should be fixed in ShuttleMentor even if ilamy is patched later.

## Goals

- keep the code changes concentrated in `src/app/calendar/CalendarClient.tsx`
- avoid a custom header
- avoid wrapper components or duplicated calendar state
- keep the fetch-by-range architecture intact
- keep the solution understandable and low-maintenance

## Bug 1: `year` View Desync

### Problem

The standard ilamy calendar supports `year` view, but ShuttleMentor does not track it correctly.

Current behavior:

- ilamy can enter `year` view in the standard calendar
- ShuttleMentor stores `currentView` as only `"month" | "week" | "day"`
- `handleViewChange` explicitly ignores `"year"`
- the fetch range stays based on the previous unit

Result:

- the visible calendar can be in year view
- the backend query range can still be month/week/day-based

### Minimal Fix

In `CalendarClient.tsx`:

- change `currentView` state to `"month" | "week" | "day" | "year"`
- update `handleViewChange` to accept and store `"year"`
- add a `year` branch to `viewRange`

### Recommended Fetch Range For `year`

Use the same simple pattern already used for other views:

- `startDate = currentDate.startOf("year").subtract(1, "week")`
- `endDate = currentDate.endOf("year").add(1, "week")`

That keeps behavior consistent with the existing buffer strategy.

### Effort

Low.

## Bug 2: Remount / Reset Desync When Switching Calendar Modes

### Problem

ShuttleMentor renders different uncontrolled calendar instances for:

- student standard calendar
- staff resource calendar
- staff standard calendar

These instances have different `key` values, so switching modes remounts them.

ilamy only reads `initialDate` once on mount. ShuttleMentor currently does not pass `initialDate` at all.

Result:

- parent fetch state may still point to one date
- newly mounted calendar instance may reset to "today"

### Minimal Fix

Pass `initialDate={currentDate}` to all calendar instances in `CalendarClient.tsx`.

This does not make ilamy fully controlled. It only ensures that a newly mounted instance starts on the same date ShuttleMentor already tracks.

### Additional Resource-Mode Guard

Because resource calendars do not support `year` view, when toggling from standard to resource:

- if `currentView === "year"`, coerce it to `"month"` before rendering the resource calendar

This prevents a resource-calendar remount into an unsupported view and keeps fetch state aligned.

### Effort

Low.

## Bug 3: Timezone Mismatch Risk In Initial Fetch Range

### Problem

ShuttleMentor initializes parent date state with:

```ts
const [currentDate, setCurrentDate] = useState(dayjs());
```

But the user timezone is derived later from profile data:

```ts
const userTimezone = user?.timeZone ?? dayjs.tz.guess();
```

Also, `dayjs.tz.setDefault()` inside ilamy does not change plain `dayjs()` calls in ShuttleMentor.

Result:

- if browser timezone and saved user timezone differ
- the initial parent fetch range can be computed in the wrong timezone
- the wrong events can be fetched near day/week boundaries

This can look like a calendar sync issue even when callbacks are working.

### Minimal Fix

Keep one date state, but normalize fetch calculations to the user timezone:

1. derive `userTimezone` first
2. derive `effectiveCurrentDate = currentDate.tz(userTimezone)`
3. compute `viewRange` from `effectiveCurrentDate`

Optionally:

- avoid firing the event query until the user profile has loaded, so timezone is known before the first range is computed

That can be done by adding an `enabled` condition to the query if needed.

### Recommendation

This is worth fixing, but it should stay lightweight. Do not create a second timezone-specific state variable unless real behavior requires it.

### Effort

Low to medium.

## Proposed Implementation Scope

Primary code changes:

- `src/app/calendar/CalendarClient.tsx`

Optional tests:

- add focused tests around view-range derivation and mode switching if a local test harness already exists

No new components are required.

## Proposed Change Set

### 1. Extend view state

- update `currentView` union to include `"year"`
- stop dropping `"year"` in `handleViewChange`
- add `year` logic to `viewRange`

### 2. Preserve date across remounts

- pass `initialDate={currentDate}` to:
  - student `IlamyCalendar`
  - staff `IlamyResourceCalendar`
  - staff standard `IlamyCalendar`

### 3. Prevent unsupported resource year mode

- when switching into resource mode, coerce `currentView` from `"year"` to `"month"`

### 4. Normalize fetch range to user timezone

- compute range from `currentDate.tz(userTimezone)`
- consider waiting until profile load finishes before the first event query

## What We Should Not Do

- do not reintroduce a custom header
- do not create separate date states for each calendar mode
- do not add sync effects between multiple uncontrolled calendar instances
- do not build a workaround that duplicates ilamy navigation logic

## Relationship To ilamy Fixes

Even after these ShuttleMentor changes, the two ilamy issues still matter:

1. stock header dropdowns should fire `onDateChange`
2. stock prev/next should not call `onDateChange` from inside a state updater

But those should stay tracked separately as library issues.

## Recommended Order

1. Fix `year` view support in parent state
2. Pass `initialDate` and handle resource-mode year coercion
3. Normalize the fetch range to user timezone
4. Re-test navigation flows after the ilamy upstream fixes land

## Expected Outcome

After the ShuttleMentor changes:

- standard calendar year view stays in sync with fetched data
- switching between standard and resource views no longer resets the visible date unexpectedly
- initial fetch ranges are less likely to be wrong for users whose saved timezone differs from the browser timezone

The result should stay clean:

- one main file changed
- no custom header
- no extra abstraction layer
- no duplicated calendar logic
