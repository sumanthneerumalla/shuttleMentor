# Frontend Integration — Calendaring Feature

This document covers the `/calendar` page, `@ilamy/calendar` component integration, component architecture, and navigation changes.

## Package Installation

```bash
npm install @ilamy/calendar
```

`rrule` is bundled with `@ilamy/calendar` but should also be installed as a direct dependency for server-side RRULE validation:

```bash
npm install rrule
```

## Tailwind CSS Configuration

Add the `@source` directive to `src/styles/globals.css` so Tailwind scans the calendar package for utility classes:

```css
@source "../node_modules/@ilamy/calendar/dist";
```

This line goes near the top of the file, after `@import "tailwindcss";`.

## Day.js Configuration (Optional)

If the project uses Day.js elsewhere, extend the required plugins. Create or update a config file:

```typescript
// src/lib/dayjs-config.ts
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);
dayjs.extend(utc);
```

Import this file early in the app (e.g., in the calendar page client component).

## Navigation Changes

### SideNavigation

Add a "Calendar" nav item in `src/app/_components/client/authed/SideNavigation.tsx`. It should be visible to **all user types** (read-only for STUDENT/COACH, full access for FACILITY/ADMIN).

```typescript
{
  label: "Calendar",
  href: "/calendar",
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  userTypes: [UserType.STUDENT, UserType.COACH, UserType.FACILITY, UserType.ADMIN],
},
```

Place it after "Dashboard" and before "Video Collections" in the nav items array.

## Read-Only Access Control

Access control varies by user role. STUDENT users are read-only. COACH users can create/edit/delete their own `COACHING_SLOT` events on any active club resource. FACILITY and ADMIN users have full editing capabilities including resource management.

### 1. Component-Level Controls

In `CalendarClient.tsx`, we determine the user's editing capabilities:

```typescript
const isStudent = user?.userType === "STUDENT";
const isCoach = user?.userType === "COACH";
const isFacilityOrAdmin = user?.userType === "FACILITY" || user?.userType === "ADMIN";
const canCreateEvents = isCoach || isFacilityOrAdmin;

return (
  <IlamyResourceCalendar
    // Students can't interact; coaches and facility can
    disableCellClick={isStudent}
    disableDragAndDrop={isStudent}      // Coaches can drag their own slots (frontend filters)
    disableEventClick={false}            // All users can view event details
    // Event callbacks for coaches (COACHING_SLOT only) and facility (all types)
    onEventAdd={canCreateEvents ? handleEventAdd : undefined}
    onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
    onEventDelete={canCreateEvents ? handleEventDelete : undefined}
    // Custom event form for coaches and facility
    renderEventForm={canCreateEvents ? renderEventForm : undefined}
  />
);
```

**Note**: Coach users can only create `COACHING_SLOT` events. The event form UI should restrict the event type selector for coaches. Server-side enforcement is handled by `coachProcedure` (which rejects non-COACHING_SLOT types) and `facilityProcedure` (for BLOCK/BOOKABLE).

### 2. Server-Level Authorization

tRPC procedures enforce access control:

- **BLOCK/BOOKABLE mutations** (createEvent, updateEvent, deleteEvent) use `facilityProcedure` — only FACILITY + ADMIN
- **COACHING_SLOT mutations** (createCoachSlot) use `coachProcedure` — only COACH users, restricted to their own slots
- **Queries** (getEvents, getResources) use `protectedProcedure` — any authenticated user, scoped to their club
- **Public queries** (getPublicEvents, getPublicResources) use `publicProcedure` — unauthenticated, scoped to a specific club

### 3. Resource Management UI

Resource management panels (create/edit resources, business hours) are only rendered for facility users:

```typescript
{isFacilityOrAdmin && (
  <button onClick={() => setShowResourcePanel(true)}>
    Manage Resources
  </button>
)}
```

### 4. Access Matrix

| Feature                      | STUDENT        | COACH          | FACILITY/ADMIN | Public (unauthed)                     |
| :--------------------------- | :------------- | :------------- | :------------- | :-------------------------------------|
| View calendar                | ✅ (read-only) | ✅             | ✅ (full)      | ✅ (`isPublic` events only, no BLOCKs)  |
| Click events to see details  | ✅             | ✅             | ✅             | ✅ (`isPublic` events only)             |
| Navigate dates/views         | ✅             | ✅             | ✅             | ✅                                      |
| Create BLOCK events          | ❌             | ❌             | ✅             | ❌                                      |
| Create BOOKABLE events       | ❌             | ❌             | ✅             | ❌                                      |
| Create COACHING_SLOT events  | ❌             | ✅ (own slots) | ❌             | ❌                                      |
| Edit own events              | ❌             | ✅ (own slots) | ✅ (all)       | ❌                                      |
| Delete own events            | ❌             | ✅ (own slots) | ✅ (all)       | ❌                                      |
| Drag/drop events             | ❌             | ✅ (own slots) | ✅             | ❌                                      |
| Manage resources/types       | ❌             | ❌             | ✅             | ❌                                      |
| Set business hours           | ❌             | ❌             | ✅             | ❌                                      |
| See capacity/price on events | ✅             | ✅             | ✅             | ✅                                      |
| Book/purchase events         | ✅ (via Polar) | ✅ (via Polar) | ✅             | ✅ (via Polar)                          |

## Page Architecture

### `/calendar` Route

Follow the existing server/client component pattern used by `/dashboard`:

```
src/app/calendar/
├── page.tsx              # Server component with OnboardedGuard
└── CalendarClient.tsx    # Client component with calendar UI
```

#### `page.tsx` (Server Component)

```typescript
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import CalendarClient from "~/app/calendar/CalendarClient";

export default function CalendarPage() {
  return (
    <OnboardedGuard>
      <CalendarClient />
    </OnboardedGuard>
  );
}
```

#### `CalendarClient.tsx` (Client Component)

This is the main calendar page. It:
1. Fetches resources and events from tRPC
2. Transforms DB data into `@ilamy/calendar` format
3. Renders `IlamyResourceCalendar`
4. Handles event lifecycle callbacks (create, update, delete)
5. Shows conflict warnings
6. Controls read-only mode based on user type

## Component Design

### CalendarClient — High-Level Structure

```typescript
"use client";

import { IlamyResourceCalendar } from "@ilamy/calendar";
import type { CalendarEvent, Resource, CellClickInfo } from "@ilamy/calendar";
import { RRule } from "rrule";
import { api } from "~/trpc/react";

export default function CalendarClient() {
  const { data: user } = api.user.getOrCreateProfile.useQuery();
  const { data: resourcesData } = api.calendar.getResources.useQuery();
  const { data: eventsData } = api.calendar.getEvents.useQuery({
    startDate: viewStartDate,
    endDate: viewEndDate,
  });

  const isStudent = user?.userType === "STUDENT";
  const isCoach = user?.userType === "COACH";
  const isFacilityOrAdmin = user?.userType === "FACILITY" || user?.userType === "ADMIN";
  const canCreateEvents = isCoach || isFacilityOrAdmin;

  // Transform DB resources → ilamy Resource[]
  // > **Future Optimization**: Wrap in useMemo to prevent re-computation on unrelated re-renders
  const resources: Resource[] = transformResources(resourcesData);

  // Transform DB events → ilamy CalendarEvent[]
  // > **Future Optimization**: Wrap in useMemo — RRULE parsing is expensive
  const events: CalendarEvent[] = transformEvents(eventsData);

  return (
    <div className="h-[calc(100vh-5rem)] p-4">
      <IlamyResourceCalendar
        resources={resources}
        events={events}
        initialView="week"
        firstDayOfWeek="monday"
        timeFormat="12-hour"
        timezone={user?.timeZone ?? undefined}
        // Access controls
        disableCellClick={isStudent}
        disableDragAndDrop={isStudent}
        disableEventClick={false} // Always allow viewing event details
        // Event lifecycle (wired for COACH and FACILITY/ADMIN)
        onEventAdd={canCreateEvents ? handleEventAdd : undefined}
        onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
        onEventDelete={canCreateEvents ? handleEventDelete : undefined}
        onDateChange={handleDateChange}
        onEventClick={handleEventClick}
        // Custom event form for COACH and FACILITY/ADMIN
        renderEventForm={canCreateEvents ? renderEventForm : undefined}
        // Custom event rendering for capacity/price display (Phase 2.5+)
        renderEvent={renderEvent}
      />
    </div>
  );
}
```

### Data Transformation Functions

#### `transformResources(data) → Resource[]`

```typescript
// Default colors from globals.css design tokens
const DEFAULT_COLOR = "#4F46E5";        // --primary
const DEFAULT_BG_COLOR = "#EFF6FF";     // --accent

function transformResources(data: ResourcesQueryResult): Resource[] {
  if (!data?.resources) return [];

  return data.resources.map((r) => ({
    id: r.resourceId,
    title: r.title,
    color: r.color ?? DEFAULT_COLOR,
    backgroundColor: r.backgroundColor ?? DEFAULT_BG_COLOR,
    position: r.position,
    // Transform business hours to ilamy format
    businessHours: r.businessHours.length > 0
      ? r.businessHours.map((bh) => ({
          daysOfWeek: bh.daysOfWeek as BusinessHourDay[],
          startTime: bh.startTime,
          endTime: bh.endTime,
        }))
      : undefined,
  }));
}
```

#### `transformEvents(data) → CalendarEvent[]`

```typescript
function transformEvents(data: EventsQueryResult): CalendarEvent[] {
  if (!data?.events) return [];

  return data.events.map((e) => ({
    id: e.eventId,
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    description: e.description ?? undefined,
    color: e.color ?? undefined,
    backgroundColor: e.backgroundColor ?? undefined,
    allDay: e.allDay,
    resourceId: e.resourceId ?? undefined,
    uid: e.uid,
    // Parse RRULE string into rrule.js options
    rrule: e.rrule ? parseRRule(e.rrule) : undefined,
    exdates: e.exdates?.map((d) => new Date(d)) ?? [],
    recurrenceId: e.recurrenceId ?? undefined,
    // Store DB metadata in data bag for renderEvent and mutation callbacks
    data: {
      dbEventId: e.eventId,
      eventType: e.eventType,           // "BLOCK" | "BOOKABLE" | "COACHING_SLOT"
      isBlocking: e.isBlocking,
      isPublic: e.isPublic,
      maxParticipants: e.maxParticipants ?? null,
      currentRegistrations: e._count?.registrations ?? 0, // Aggregated from server
      priceInCents: e.product?.priceInCents ?? null,
      productId: e.productId ?? null,
      coachName: e.createdByUser?.firstName ?? null,
    },
  }));
}

function parseRRule(rruleString: string): RRuleOptions {
  const rule = RRule.fromString(rruleString);
  return rule.origOptions;
}
```

### Event Lifecycle Handlers

```typescript
// CREATE
const createEventMutation = api.calendar.createEvent.useMutation({
  onSuccess: () => utils.calendar.getEvents.invalidate(),
});

const handleEventAdd = async (event: CalendarEvent) => {
  // Check for conflicts first
  if (event.resourceId) {
    const conflicts = await checkConflicts(event);
    if (conflicts?.hasConflicts) {
      const proceed = await showConflictWarning(conflicts.conflicts);
      if (!proceed) return;
    }
  }

  await createEventMutation.mutateAsync({
    title: event.title,
    start: event.start instanceof Date ? event.start : event.start.toDate(),
    end: event.end instanceof Date ? event.end : event.end.toDate(),
    description: event.description,
    resourceId: event.resourceId?.toString(),
    allDay: event.allDay,
    color: event.color,
    backgroundColor: event.backgroundColor,
    rrule: event.rrule ? new RRule(event.rrule).toString() : undefined,
  });
};

// UPDATE (whole series in V1)
const updateEventMutation = api.calendar.updateEvent.useMutation({
  onSuccess: () => utils.calendar.getEvents.invalidate(),
});

const handleEventUpdate = async (event: CalendarEvent) => {
  const dbEventId = event.data?.dbEventId ?? event.id;

  await updateEventMutation.mutateAsync({
    eventId: dbEventId,
    title: event.title,
    start: event.start instanceof Date ? event.start : event.start.toDate(),
    end: event.end instanceof Date ? event.end : event.end.toDate(),
    description: event.description,
    resourceId: event.resourceId?.toString(),
    allDay: event.allDay,
  });
};

// DELETE (whole series in V1)
const deleteEventMutation = api.calendar.deleteEvent.useMutation({
  onSuccess: () => utils.calendar.getEvents.invalidate(),
});

const handleEventDelete = async (event: CalendarEvent) => {
  const dbEventId = event.data?.dbEventId ?? event.id;
  await deleteEventMutation.mutateAsync({ eventId: dbEventId });
};
```

### Conflict Warning Dialog

When `checkConflicts` returns overlapping events, show a dialog:

```typescript
function ConflictWarningDialog({
  conflicts,
  onConfirm,
  onCancel,
}: {
  conflicts: ConflictEvent[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-bold text-lg mb-2">Scheduling Conflict</h3>
      <p className="text-gray-600 mb-4">
        This time slot overlaps with {conflicts.length} existing event(s):
      </p>
      <ul className="space-y-2 mb-4">
        {conflicts.map((c) => (
          <li key={c.eventId} className="text-sm">
            <strong>{c.title}</strong> — {formatTime(c.start)} to {formatTime(c.end)}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="nav-button">Cancel</button>
        <button onClick={onConfirm} className="nav-button bg-[var(--primary)] text-white">
          Save Anyway
        </button>
      </div>
    </div>
  );
}
```

### Resource Management UI

A settings panel accessible from the calendar page (gear icon or "Manage Resources" button), visible only to FACILITY/ADMIN. This could be a modal or a slide-out panel.

**Sections:**
1. **Resource Types** — list, create, edit, delete
2. **Resources** — list by type, create, edit, deactivate, reorder (drag to change `position`)
3. **Business Hours** — per-resource configuration with day/time selectors

This is a separate client component:

```
src/app/calendar/
├── page.tsx
├── CalendarClient.tsx
└── ResourceManager.tsx    # Resource/type management panel
```

## Date Range Management & Navigation

ilamy is a **controlled component** — it has no internal data fetching. We pass `events` and `resources` as props, and use ilamy's callbacks to know when to re-fetch.

### How ilamy navigation works

- **`onDateChange(date: dayjs.Dayjs)`** — fires when the user clicks prev/next or clicks a date
- **`onViewChange(view: 'month' | 'week' | 'day' | 'year')`** — fires when the user switches views
- ilamy handles all internal rendering (scrolling, expanding recurring events for the visible range) — we just need to keep the data fresh

### Data fetching strategy

When the user navigates to a new date range, we need to fetch events for that range from the backend. The pattern:

```typescript
const [currentDate, setCurrentDate] = useState(dayjs());
const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('week');

// Compute fetch range with buffer (±1 week prevents flash on navigation)
const viewRange = useMemo(() => {
  const unit = currentView === 'month' ? 'month' : currentView === 'week' ? 'week' : 'day';
  return {
    startDate: currentDate.startOf(unit).subtract(1, 'week').toDate(),
    endDate: currentDate.endOf(unit).add(1, 'week').toDate(),
  };
}, [currentDate, currentView]);

// tRPC query — automatically re-fetches when viewRange changes
const { data: eventsData, isLoading } = api.calendar.getEvents.useQuery(
  { startDate: viewRange.startDate, endDate: viewRange.endDate },
  { keepPreviousData: true } // Show old data while new range loads (smooth transition)
);

// Resources don't depend on date range — fetch once
const { data: resourcesData } = api.calendar.getResources.useQuery();

// Navigation handlers
const handleDateChange = (date: dayjs.Dayjs) => setCurrentDate(date);
const handleViewChange = (view: 'month' | 'week' | 'day' | 'year') => setCurrentView(view);
```

### What happens on navigation

```
User clicks "Next Month"
  → ilamy fires onDateChange(newDate)
  → setCurrentDate(newDate)
  → viewRange recomputes via useMemo
  → tRPC query input changes → automatic re-fetch
  → keepPreviousData: true → old events stay visible during fetch
  → New data arrives → transformEvents runs → calendar re-renders
```

### Recurring events and navigation

For recurring events, the server returns the **base event** (with RRULE) whenever the series overlaps the requested date range. ilamy expands instances client-side for the visible view. When navigating to a new month:

- If the recurring series spans both months, the server returns the same base event again
- tRPC's query cache deduplicates — no wasted bandwidth
- ilamy re-expands only the instances needed for the new view range

The **±1 week buffer** means when viewing March and clicking "Next" to April, April's first week was already fetched.

### Resources are fetched once

Resources don't change based on date range. They're fetched once on mount and only re-fetched after mutations (create/update/delete resource). No re-fetch on navigation.

## Timezone Configuration

ilamy supports timezone display via the `timezone` prop (IANA string like `"America/New_York"`).

> **Timezone Source of Truth**: The user's timezone is always read from `user.timeZone` in the database (set via their profile settings). ilamy has **no built-in timezone picker** — the `timezone` prop is purely developer-controlled. The UI is responsible for translating all backend UTC times to the user's timezone on display, and converting user-entered local times back to UTC before sending to the backend. For unauthenticated public calendar visitors, fall back to `dayjs.tz.guess()` (browser-detected timezone).

### How it works

- ilamy calls `dayjs.tz.setDefault(timezone)` internally
- All event times are converted from UTC to the display timezone for rendering
- The `timezone` prop requires dayjs plugins: `utc`, `timezone`, `isSameOrAfter`, `isSameOrBefore` (configured in `src/lib/dayjs-config.ts`)

### Key implementation detail: `key` prop for timezone changes

Because dayjs operates outside the React lifecycle, changing the `timezone` prop alone won't trigger a re-render. **You must change the component `key`** to force a full re-mount:

```typescript
const userTimezone = user?.timeZone ?? dayjs.tz.guess(); // Fallback to browser TZ

<IlamyResourceCalendar
  key={userTimezone}  // Forces re-mount when timezone changes
  timezone={userTimezone}
  // ...other props
/>
```

### Timezone scenarios

| Scenario                               | `timezone` value                                    | Behavior                                    |
| :------------------------------------- | :-------------------------------------------------- | :------------------------------------------ |
| Authenticated user with `timeZone` set | `user.timeZone` (e.g., `"America/New_York"`)        | Events display in user's preferred timezone |
| Authenticated user without `timeZone`  | `dayjs.tz.guess()`                                  | Falls back to browser's local timezone      |
| Public calendar (unauthenticated)      | `dayjs.tz.guess()`                                  | Uses visitor's browser timezone             |
| User changes timezone in profile       | New `user.timeZone` → `key` changes → re-mount      | Calendar re-renders with new timezone       |

### Frontend → Backend UTC conversion

When a user creates or edits an event, the frontend must convert local times to UTC before sending to the server:

```typescript
const handleEventAdd = async (event: CalendarEvent) => {
  // ilamy gives us times in the display timezone
  // Convert to UTC for storage
  const startUtc = dayjs(event.start).utc().toDate();
  const endUtc = dayjs(event.end).utc().toDate();

  await createEventMutation.mutateAsync({
    title: event.title,
    start: startUtc,
    end: endUtc,
    // ...other fields
  });
};
```

> **Note**: ilamy's `onEventAdd` / `onEventUpdate` callbacks return `Date` objects in the display timezone. Always convert to UTC before sending to the backend. The backend stores everything in UTC (see `database-schema.md` — UTC Standardization).

## Styling Notes

- The calendar container needs a **fixed height** for sticky headers: `h-[calc(100vh-5rem)]` (accounts for navbar + padding)
- ilamy Calendar ships zero CSS — all styling comes from Tailwind utilities scanned via the `@source` directive
- Event colors use `color` (text) and `backgroundColor` (background) from the event/resource data
- Use the app's existing CSS variables (`--primary`, `--accent`, etc.) in custom components (conflict dialog, resource manager)
- Follow the existing `glass-card` / `glass-panel` patterns for modals and panels

## Loading States

Follow existing patterns:

```typescript
if (isLoading) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-96 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}
```

## Error Handling

Use tRPC's built-in error handling. Show toast notifications for mutation errors:

```typescript
const createEventMutation = api.calendar.createEvent.useMutation({
  onSuccess: () => {
    utils.calendar.getEvents.invalidate();
  },
  onError: (error) => {
    // Show error toast/notification
    console.error("Failed to create event:", error.message);
  },
});
```

---

## Public Calendar Page (Phase 2.5)

### Route: `/club/[clubShortName]/calendar`

A standalone public page — no auth required. Uses `getPublicEvents` and `getPublicResources`.

```
src/app/club/[clubShortName]/calendar/
├── page.tsx              # Server component (no OnboardedGuard)
└── PublicCalendarClient.tsx  # Client component
```

#### `page.tsx`

```typescript
import PublicCalendarClient from "./PublicCalendarClient";

export default function PublicCalendarPage({
  params,
}: {
  params: { clubShortName: string };
}) {
  return <PublicCalendarClient clubShortName={params.clubShortName} />;
}

// SEO metadata
export async function generateMetadata({ params }: { params: { clubShortName: string } }) {
  return {
    title: `${params.clubShortName} — Calendar`,
    description: `View upcoming events and book sessions at ${params.clubShortName}`,
  };
}
```

#### `PublicCalendarClient.tsx`

Similar to `CalendarClient` but:
- Uses `getPublicEvents` / `getPublicResources` (no auth)
- All editing disabled (`disableCellClick`, `disableDragAndDrop` = true, no event callbacks)
- Only `isPublic` BOOKABLE/COACHING_SLOT events are returned (BLOCK events are never sent by the API)
- `renderEvent` shows full details + "Book" CTA for bookable events
- Event click opens a detail modal with booking link (Polar checkout URL)

#### Middleware

No auth redirect needed — this route is public. Add to `src/middleware.ts` public route matcher if Clerk middleware currently blocks unauthenticated access to `/club/*` routes.

### Share Links (Phase 2.5)

Deep link to a specific event: `/club/[clubShortName]/calendar?event=[eventId]`

The `PublicCalendarClient` reads the `event` query param on mount. If present, it scrolls to the event's date and opens the event detail modal automatically. Share buttons (copy link) appear on the event detail modal.

---

## Embeddable Calendar Widget (Phase 3)

### Route: `/embed/[clubShortName]/calendar`

An `<iframe>`-friendly version of the public calendar with a minimal layout (no nav, no header, no footer).

```
src/app/embed/[clubShortName]/calendar/
├── layout.tsx            # Minimal layout (no SideNavigation, no Clerk)
└── page.tsx              # Reuses PublicCalendarClient
```

#### `layout.tsx` (Minimal Embed Layout)

```typescript
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
```

#### CORS / CSP Headers

Set via Next.js middleware for `/embed/*` routes:

```typescript
// In src/middleware.ts
if (request.nextUrl.pathname.startsWith('/embed/')) {
  const response = NextResponse.next();
  // Allow embedding from any domain
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Content-Security-Policy', "frame-ancestors *");
  return response;
}
```

All other routes keep the default `X-Frame-Options: DENY`.

#### Club Embed Snippet

Clubs paste this into their website:

```html
<iframe
  src="https://shuttlementor.com/embed/CLUB_SHORT_NAME/calendar"
  width="100%"
  height="700"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>
```

---

## Badge / Chiclet Embeds (Phase 4)

### Concept

Lightweight, standalone UI components that display upcoming bookable events as cards/badges. Not dependent on `@ilamy/calendar` — these are simple React components (or a bundled JS widget) that query the same `getPublicEvents` endpoint.

### Use Cases

1. **On our own UI**: Show upcoming bookable events as badges on the club landing page or dashboard
2. **On club websites**: Embeddable `<script>` tag that renders event cards into a target `<div>`

### Badge Data Shape

```typescript
interface EventBadge {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  resourceName: string | null;
  maxParticipants: number | null;
  currentRegistrations: number;
  priceInCents: number | null;
  coachName: string | null;  // For COACHING_SLOT events
  bookingUrl: string;        // Polar checkout URL or /club/X/calendar?event=Y
}
```

### Visual Design

```
┌─────────────────────────────┐
│ 🏸 Drop-In Badminton        │
│ Tue, Mar 4 · 6:00–8:00 PM  │
│ Court 1 · 7/10 spots filled │
│ Free · [Register →]         │
└─────────────────────────────┘
```

For coaching slots:
```
┌─────────────────────────────┐
│ Training with Coach Alex    │
│ Wed, Mar 5 · 4:00–5:00 PM  │
│ Court 2 · 1 spot available  │
│ $25.00 · [Book →]           │
└─────────────────────────────┘
```

### Architecture

- **Internal badges** (our UI): React component `<EventBadgeList clubShortName={...} limit={5} />` that calls `getPublicEvents` and renders cards. Lives in `src/app/_components/shared/EventBadgeList.tsx`.
- **External embed** (`<script>` tag): A bundled JS file served from `/embed/widget.js` that:
  1. Reads `data-club` attribute from the target `<div>`
  2. Fetches from our public API (needs CORS headers on `getPublicEvents` / `getPublicResources`)
  3. Renders event cards into the target element
  4. CTA buttons link to the public calendar page or Polar checkout

#### CORS for Script Embeds

Public tRPC endpoints need CORS headers for cross-origin `<script>` requests:

```typescript
// In src/middleware.ts — for public API routes
if (request.nextUrl.pathname.includes('/api/trpc/calendar.getPublic')) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
```

#### Club Script Snippet

```html
<div id="shuttlementor-events" data-club="CLUB_SHORT_NAME" data-limit="5"></div>
<script src="https://shuttlementor.com/embed/widget.js" async></script>
```

---

> **Future Optimization — Memoize Data Transformations**
>
> The `transformResources` and `transformEvents` calls in `CalendarClient.tsx` run on every render. For better performance, wrap them in `useMemo` keyed on the query data. This prevents expensive re-computation (especially RRULE parsing) when unrelated state changes trigger re-renders. Not critical for V1 with small event counts, but important as event volume grows.

> **Future Optimization — Overbooking Race Condition**
>
> The Polar webhook handler that creates `EventRegistration` rows must be atomic in production. If two users book the last slot simultaneously, both could pay successfully. The webhook handler should: (1) run in a DB transaction, (2) lock relevant rows, (3) re-count confirmed registrations, (4) check against `maxParticipants`, (5) only then create the registration. If capacity is full, log the issue for manual refund or trigger automated refund via Polar API. Critical for booking integrity at scale.
