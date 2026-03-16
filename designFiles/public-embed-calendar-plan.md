# Public & Embeddable Calendar — Implementation Plan (C4 + C5)

> **Status**: Planning complete, ready to implement from clean commit.
> **Related docs**: `progressPhase2_5.md` (tracks C4/C5 as priority items), `multi-facility-schema-analysis.md` (future `facilityId` URL param extension).

---

## Clarifications & Terminology

### What is "chrome"?
Chrome = the application shell that surrounds the actual content: the top navbar, the left sidebar, and the footer. For the embed widget, we want zero chrome — just the raw calendar. For the public club calendar page, we want the standard public NavBar but no sidebar.

### Will the public club calendar show events to logged-in users?
Yes — both logged-in and anonymous visitors see the same data: **only `isPublic: true` BOOKABLE and COACHING_SLOT events**. The `getPublicEvents` procedure does not check auth at all. Staff-only events (BLOCK, private BOOKABLE, COACHING_SLOT with `isPublic: false`) are never surfaced through this path. If a logged-in staff member wants to see everything, they use `/calendar` (the internal calendar).

### Does the register button already exist on `/events/[eventId]`?
Yes. `BookableEventDetails` already shows a "Register" button. If the visitor is not signed in, Clerk's sign-in flow handles the redirect. **No additional CTA work is needed for C4/C5.** The "contact to book" concern from the previous discussion is therefore not applicable — the existing registration flow covers it.

### Does `IlamyResourceCalendar` support orientation?
**Yes — confirmed from source.** The `orientation` prop is a first-class prop on `IlamyResourceCalendar`:
- `"horizontal"` — resources are **rows**, time is **columns** (default)
- `"vertical"` — resources are **columns**, time is **rows**

This is passed through `IlamyResourceCalendarProps` → `ResourceCalendarProvider` → context → consumed by the view components.

---

## Technical Investigation Results

### Claim 1: "AuthedLayout will get in the way for `/club/[clubShortName]/calendar`"
**Partially true, but easy to fix.** `AuthedLayout.tsx` determines public vs. authenticated layout via `isPublicPage`:

```ts
const isPublicPage =
  pathname === "/" ||
  pathname.startsWith("/resources") ||
  isClubLandingShortUrlPathname(pathname) ||
  isClubLandingInternalPathname(pathname);
```

`/club/[clubShortName]/calendar` matches `isClubLandingInternalPathname` only if that helper matches `/club/[clubShortName]/calendar` — **it depends on how the regex is written**. Currently `isClubLandingInternalPathname` matches `/club/[slug]` exactly. So `/club/[slug]/calendar` would NOT match and would get the sidebar layout.

**Fix**: Add `pathname.startsWith("/club/")` check inside `isPublicPage` — or more precisely, exclude `/club/*` paths from the sidebar since they are all public-facing club pages. This is a one-line change to `AuthedLayout.tsx`.

### Claim 2: "`/embed/...` cannot be fully stripped with only an `embed/layout.tsx`"
**Confirmed true.** The root `layout.tsx` always wraps everything in `ClerkProvider`, `TRPCReactProvider`, `AuthedLayout`, and `Footer`. A nested `embed/layout.tsx` cannot override what the root layout already renders above it.

**Correct solution: Next.js Route Groups.** Reorganize using `(app)` and `(embed)` route groups, each with their own `layout.tsx`. This is the idiomatic Next.js App Router pattern for this exact use case. **See Route Group Structure below.**

The faster but messier alternative — making `AuthedLayout` and `Footer` path-aware for `/embed/*` — works but pollutes the layout component with embed-specific concerns. Route groups are cleaner and are the right long-term architecture.

### Claim 3: "The `X-Frame-Options` header may not be needed yet"
**Confirmed true.** `next.config.js` currently sets no `X-Frame-Options` or CSP headers. Next.js itself does not set `X-Frame-Options` by default. So embedding will work today without any header changes. **No header work needed.**

---

## Route Group Structure

This is the architectural change needed to support the embed layout properly.

### Current structure
```
src/app/
  layout.tsx          ← ClerkProvider + TRPCReactProvider + AuthedLayout + Footer (wraps EVERYTHING)
  page.tsx
  calendar/
  club/[clubShortName]/
  ...
```

### Target structure
```
src/app/
  layout.tsx          ← MINIMAL: just <html><body> (no providers, no chrome)
  (app)/
    layout.tsx        ← ClerkProvider + TRPCReactProvider + AuthedLayout + Footer
    page.tsx          ← moved here
    calendar/         ← moved here
    club/[clubShortName]/  ← moved here
    coaches/          ← moved here
    dashboard/        ← moved here
    database/         ← moved here
    events/           ← moved here
    products/         ← moved here
    profile/          ← moved here
    resources/        ← moved here
    video-collections/ ← moved here
  (embed)/
    layout.tsx        ← TRPCReactProvider only (no Clerk, no AuthedLayout, no Footer)
    embed/
      [clubShortName]/
        calendar/
          page.tsx
```

> **Route groups** (folders with parentheses) do not affect the URL — `/calendar` stays `/calendar`, `/embed/cba/calendar` stays `/embed/cba/calendar`. They only affect which layout wraps which pages.

---

## URL Parameter Design

### C4 — Public Club Calendar
```
/club/[clubShortName]/calendar
  ?view=week|month|day          (default: month)
  ?mode=standard|resource       (default: standard)
  ?orientation=horizontal|vertical  (only relevant when mode=resource, default: horizontal)
  ?facility=[facilityId]        (FUTURE — reserved, no-op until multi-facility schema lands)
```

### C5 — Embeddable Calendar
```
/embed/[clubShortName]/calendar
  ?view=week|month|day          (default: month)
  ?mode=standard|resource       (default: standard)
  ?orientation=horizontal|vertical  (only relevant when mode=resource, default: horizontal)
  ?facility=[facilityId]        (FUTURE — reserved, no-op until multi-facility schema lands)
```

### Future `facility` param note
A `// TODO(multi-facility): when ClubFacility schema lands, wire ?facility=[facilityId] to filter getPublicEvents and getPublicResources` comment will be added in the `PublicCalendarClient` component so this is clearly documented for later. See `multi-facility-schema-analysis.md` for the schema design.

---

## Components to Build

### 1. `PublicCalendarClient` (shared between C4 and C5)

**Path**: `src/app/_components/public/PublicCalendarClient.tsx`

**Props**:
```ts
interface PublicCalendarClientProps {
  clubShortName: string;
  initialView?: "month" | "week" | "day";
  initialMode?: "standard" | "resource";
  initialOrientation?: "horizontal" | "vertical";
  embedMode?: boolean; // true = zero chrome, no event navigation chrome
  // facilityId?: string; // FUTURE — reserved
}
```

**Behaviour**:
- Calls `api.calendar.getPublicEvents` and `api.calendar.getPublicResources` (both already exist, both are `publicProcedure`)
- Manages local `currentDate`, `currentView`, `calendarMode`, `orientation` state (initialized from props → URL params)
- `disableDragAndDrop={true}`, `disableCellClick={true}` — read-only
- `onEventClick` → `router.push('/events/[eventId]')` (same as student view in internal calendar)
- When `mode=resource`, uses `IlamyResourceCalendar` with `orientation` prop
- When `mode=standard`, uses `IlamyCalendar`
- If only one mode of events exists (e.g. no resources), gracefully hides the mode toggle
- `renderEvent` → uses the **same capacity badge component built for C1** (see C1 below)
- Timezone: derived from `dayjs.tz.guess()` — no user profile needed since this is public

### 2. C4 — Public Calendar Page

**Path**: `src/app/(app)/club/[clubShortName]/calendar/page.tsx`

**Type**: Server Component

```tsx
// Reads searchParams for view/mode/orientation
// Validates clubShortName exists (db.club.findUnique — same as club landing page)
// Calls notFound() if club not found
// Renders PublicCalendarClient with props from searchParams
// No auth required
```

**Layout behaviour**: Falls inside `(app)/layout.tsx` which has `AuthedLayout`. `AuthedLayout` needs a one-line fix to treat `/club/*` as a public page (no sidebar).

### 3. C5 — Embed Calendar Page

**Path**: `src/app/(embed)/embed/[clubShortName]/calendar/page.tsx`

**Type**: Server Component — same as C4 but:
- Falls inside `(embed)/layout.tsx` (TRPC only, no Clerk, no AuthedLayout, no Footer)
- `embedMode={true}` passed to `PublicCalendarClient`
- In `embedMode`, the component renders with `h-screen w-screen overflow-hidden` and no outer padding/border

---

## `AuthedLayout` Fix (one line)

In `isPublicPage`, change:
```ts
isClubLandingInternalPathname(pathname)
```
to:
```ts
pathname.startsWith("/club/")
```

This makes all `/club/*` sub-paths (including `/club/cba/calendar`) render without a sidebar. The `clubShortName` extraction for NavBar sign-in redirect only applies to the exact club landing page, which still works because the match regex `^\/club\/([^/]+)` still extracts the slug correctly.

---

## C1 — `renderEvent` Capacity Badge Component

Build this first — it's used by both the internal calendar (`CalendarClient.tsx`) and `PublicCalendarClient`.

**Path**: `src/app/_components/shared/CalendarEventBadge.tsx`

**Props**: Receives the ilamy `CalendarEvent` object. Reads from `event.data`:
- `eventType` — show badge only for BOOKABLE / COACHING_SLOT
- `maxParticipants` — if null, no capacity display
- `currentRegistrations`
- `priceInCents` / currency

**Display**:
- Event title (truncated)
- If BOOKABLE/COACHING_SLOT + has `maxParticipants`: `"{currentRegistrations}/{maxParticipants} spots"`
- If has `priceInCents`: formatted price (e.g. "$15")
- If full (`currentRegistrations >= maxParticipants`): "Full" badge in red

**Used in**: `commonCalendarProps.renderEvent` in `CalendarClient.tsx` and in `PublicCalendarClient`.

---

## Build Order

### Step 1 — Route group refactor (architectural prerequisite)
- Create `src/app/(app)/layout.tsx` — move `ClerkProvider + TRPCReactProvider + AuthedLayout + Footer` here from root layout
- Make `src/app/layout.tsx` minimal (just `<html><body>`)
- Move all existing page directories into `(app)/` — this is a filesystem move, **no URL changes**
- Create `src/app/(embed)/layout.tsx` — `TRPCReactProvider` only
- **Verify**: existing routes still work, Clerk auth still works

### Step 2 — `AuthedLayout` public path fix
- Change `isClubLandingInternalPathname(pathname)` → `pathname.startsWith("/club/")` in `isPublicPage`

### Step 3 — C1: `CalendarEventBadge` component
- Build `src/app/_components/shared/CalendarEventBadge.tsx`
- Wire into `commonCalendarProps.renderEvent` in `CalendarClient.tsx`
- Verify it renders in the internal staff/student calendar

### Step 4 — `PublicCalendarClient`
- Build `src/app/_components/public/PublicCalendarClient.tsx`
- Uses `getPublicEvents` + `getPublicResources`
- URL param → prop wiring
- Add `// TODO(multi-facility)` comment for `facilityId` param
- `onEventClick` → `/events/[eventId]`

### Step 5 — C4: Public club calendar page
- `src/app/(app)/club/[clubShortName]/calendar/page.tsx`
- Server component; reads `searchParams`; calls `notFound()` for unknown clubs

### Step 6 — C5: Embed calendar page
- `src/app/(embed)/embed/[clubShortName]/calendar/page.tsx`
- Server component; same structure as C4 + `embedMode={true}`

### Step 7 — Link from club landing page
- Add "View Calendar" button on `src/app/(app)/club/[clubShortName]/page.tsx` linking to `/club/[clubShortName]/calendar`

---

## isPublic Default Behaviour

**Requirement**: All BOOKABLE and COACHING_SLOT events are publicly visible by default. The per-event `isPublic` toggle in `BookableEventDetails` has been commented out.

**Implementation**:
- `BookableEventDetails.tsx` — `isPublic` state hardcoded to `true`; toggle UI commented out with a note explaining how to re-enable
- The `updateEventDetails` mutation still accepts `isPublic` in its input, so existing DB records are unaffected
- Any existing events with `isPublic: false` in the DB will be saved as `true` on next edit — this is intentional

**To re-enable per-event control**: Uncomment the toggle block in `BookableEventDetails.tsx` and restore `useState(event.isPublic)`.

---

## What Does NOT Need to Change

- `getPublicEvents` and `getPublicResources` tRPC procedures — already complete
- `middleware.ts` — no changes needed; Clerk middleware does not block these routes
- `next.config.js` — no header changes needed
- `prisma/schema.prisma` — no changes needed for C4/C5
- `/events/[eventId]` page — already public, already has Register button with Clerk redirect

---

## Open Questions (decided)

| Question | Decision |
|---|---|
| Resource view on public calendar? | Yes — togglable via `?mode=resource` URL param |
| Orientation control? | Yes — `?orientation=horizontal\|vertical`, `IlamyResourceCalendar orientation` prop confirmed |
| Event click behaviour? | Navigate to `/events/[eventId]` |
| Logged-in users see extra events on public calendar? | No — always `isPublic: true` only, regardless of auth |
| Club shortname in embed URL? | Yes |
| iframe headers needed? | Not currently — no `X-Frame-Options` set by default |
| `facility` URL param? | Reserved/no-op now; `TODO(multi-facility)` comment in code |
| Default view on public/embed? | `month` (better for narrow containers) |

---

## Embed Usage Example

A club admin would embed the calendar like this:

```html
<!-- Standard view, default month -->
<iframe src="https://shuttlementor.com/embed/cba/calendar" width="100%" height="600" frameborder="0"></iframe>

<!-- Resource view, vertical orientation, week view -->
<iframe src="https://shuttlementor.com/embed/cba/calendar?mode=resource&orientation=vertical&view=week" width="100%" height="600" frameborder="0"></iframe>
```

---

## Files To Create / Modify Summary

| Action | File |
|---|---|
| **Create** | `src/app/layout.tsx` (minimal shell, replace current) |
| **Create** | `src/app/(app)/layout.tsx` (current root layout content) |
| **Move** all existing page dirs into | `src/app/(app)/` |
| **Modify** | `src/app/(app)/_components/client/layouts/AuthedLayout.tsx` — public path fix |
| **Create** | `src/app/(embed)/layout.tsx` |
| **Create** | `src/app/_components/shared/CalendarEventBadge.tsx` |
| **Create** | `src/app/_components/public/PublicCalendarClient.tsx` |
| **Create** | `src/app/(app)/club/[clubShortName]/calendar/page.tsx` |
| **Create** | `src/app/(embed)/embed/[clubShortName]/calendar/page.tsx` |
| **Modify** | `src/app/(app)/calendar/CalendarClient.tsx` — wire `renderEvent` with badge |
| **Modify** | `src/app/(app)/club/[clubShortName]/page.tsx` — add "View Calendar" link |
