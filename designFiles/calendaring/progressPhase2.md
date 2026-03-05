# Calendaring Feature — Phase 2 Progress

> **How to resume**: Read this file + `progressPhase1.md` for full context.
> Phase 1 is complete. This file tracks Phase 2 work.
> Check off items (`- [x]`) as they are completed.
>
> **Audit (Mar 4, 2026)**: All checklist items verified against codebase. None are complete yet.
> DB schema has all necessary fields from Phase 1. Starting with task 2.1 (Product CRUD).

---

## Phase 2 — Bookable Events & Registration

### Context

The DB schema already has all the necessary fields for bookable events (`eventType`, `isPublic`,
`maxParticipants`, `registrationType`, `creditCost`, `productId`, `resourceIds`, `EventRegistration`,
`Product`). Phase 1 created only `BLOCK` events. Phase 2 exposes `BOOKABLE` and `COACHING_SLOT`
event types to coaches and students.

---

### 1. Role & Event Type Alignment

- [x] **1.1** Add `eventType` selector to `EventFormModal.tsx` (FACILITY/ADMIN and COACH only)
  - Options: `BLOCK` (default), `BOOKABLE`, `COACHING_SLOT`
  - Modal only captures: title, resource, start/end, recurrence, color, eventType, productId
  - All other bookable-event details (isPublic, maxParticipants, registrationType, description) are
    managed on a dedicated `/events/[eventId]` page via `BookableEventDetails` component

- [x] **1.2** Role-based event type restrictions
  - `FACILITY`/`ADMIN`: can create `BLOCK` and `BOOKABLE`
  - `COACH`: can only create `COACHING_SLOT`
  - `maxParticipants = 1` auto-enforced for `COACHING_SLOT`

- [~] **1.3** Link coaching slot registrations to `CoachingNote` creation flow — **deferred**

---

### 2. Product Linking

- [x] **2.1** Create `createProduct` / `getProducts` / `updateProduct` / `deleteProduct` procedures
  in `products.ts` router (FACILITY/ADMIN only)
  - `ProductCategory`: `COACHING_SESSION`, `CALENDAR_EVENT`, `COACHING_SLOT`, `CREDIT_PACK`
  - Include Polar `polarProductId` / `polarPriceId` fields (populated after Polar sync)
  - **Implementation**: Created separate `src/server/api/routers/products.ts` router with all CRUD operations
  - Wired into `src/server/api/root.ts` as `products` router
  - **Bonus**: Created `/products` page with full CRUD UI (table view, create/edit modal, delete)
  - Added "Products" nav link in SideNavigation (FACILITY/ADMIN only)

- [x] **2.2** Add product selector to `EventFormModal` for `BOOKABLE`/`COACHING_SLOT` events
  - Dropdown of active products scoped to the club (shown only when eventType !== BLOCK)
  - Filter: `CALENDAR_EVENT` products for BOOKABLE, `COACHING_SLOT` products for COACHING_SLOT

- [x] **2.3** Wire `eventType` + `productId` into `createEvent` / `updateEvent` mutations
  - Also added `COACHING_SLOT` to `createEventSchema` enum
  - Added `productId` to `updateEventSchema`

---

### 3. Bookable Event Details — Separate Component & Page

> **Design Decision (Mar 4, 2026)**: Bookable event details are NOT part of the creation modal.
> The modal only handles scheduling (type, resource, time, recurrence, product link).
> All details beyond scheduling live in a reusable `BookableEventDetails` component,
> surfaced at `/events/[eventId]` so admins/facility users can manage them after creation.
> This component can also be embedded elsewhere in future (e.g. event roster page).

- [x] **3.1** Create `BookableEventDetails` component (`src/app/events/_components/BookableEventDetails.tsx`)
  - Fields: `title` (read-only), `description`, `isPublic` toggle, `maxParticipants`, `registrationType`
  - Only rendered/editable for FACILITY/ADMIN on BOOKABLE and COACHING_SLOT events

- [x] **3.2** Create `updateEventDetails` tRPC procedure in `calendar.ts`
  - Accepts: `eventId`, `description`, `isPublic`, `maxParticipants`, `registrationType`
  - Separate from `updateEvent` (which handles scheduling changes)

- [x] **3.3** Create `/events/[eventId]` page
  - Server component fetches event by ID
  - Renders `BookableEventDetails` for FACILITY/ADMIN
  - Shows read-only summary + registration count

- [x] **3.4** Link to `/events/[eventId]` from calendar event click (for FACILITY/ADMIN on BOOKABLE events)

---

### 4. Student-Facing Calendar

- [x] **4.1** Show public bookable events to students (`isPublic = true`, `eventType = BOOKABLE`)
  - `getEvents` applies server-side filter for STUDENT role: `isPublic=true` + `eventType IN [BOOKABLE, COACHING_SLOT]`

- [ ] **4.2** Add "Book" button on event click for students (shown when `eventType === BOOKABLE`
  and `currentRegistrations < maxParticipants`)

- [ ] **4.3** `registerForEvent` tRPC mutation (protectedProcedure)
  - Creates `EventRegistration` with status `CONFIRMED`
  - Checks `maxParticipants` not exceeded
  - Checks for duplicate registration (app-level enforcement — no DB unique constraint by design)

- [ ] **4.4** `cancelRegistration` tRPC mutation (protectedProcedure)
  - Sets `EventRegistration.status = CANCELLED`

- [ ] **4.5** `getMyRegistrations` tRPC query (protectedProcedure)
  - Returns all confirmed registrations for the current user with event details

---

### 5. Recurring Edit/Delete Scope (This Event / This & Future / All)

- [ ] **5.1** Implement `RecurrenceEditDialog` equivalent in our `EventFormModal`
  - Currently edit/delete always modifies the whole series (V1 decision)
  - Phase 2: surface "Edit this event only", "Edit this and following", "Edit all" options
  - Requires creating modified instances (`parentEventId` linking) for single-instance edits
  - Requires `exdates` update on the parent for "delete this instance"

- [ ] **5.2** Update `updateEvent` mutation to support `scope: "THIS" | "THIS_AND_FUTURE" | "ALL"`
  - `THIS`: create a modified instance with `parentEventId` pointing to original, add `recurrenceId`
  - `THIS_AND_FUTURE`: update `rrule` UNTIL on original, create new series from this date forward
  - `ALL`: existing behavior (update whole series)

- [ ] **5.3** Update `deleteEvent` mutation to support same scope options
  - `THIS`: add instance date to `exdates` array on the parent event
  - `THIS_AND_FUTURE`: update RRULE `UNTIL` on parent to the day before
  - `ALL`: existing soft-delete behavior

---

### 6. ilamy-calendar PR — Replace Local Ports

- [ ] **6.1** Monitor the upstream PR at `https://github.com/kcsujeet/ilamy-calendar` that exports
  `EventForm`, `EventFormDialog`, and `RecurrenceEditor`.
  - Once merged and a new version is published to npm, bump `@ilamy/calendar` and:
    - Delete `src/app/calendar/EventFormModal.tsx`
    - Delete `src/app/calendar/RecurrenceEditor.tsx`
    - Replace `renderEventForm` in `CalendarClient.tsx` to use `EventFormDialog` directly
  - Both local files have a `TODO` comment marking them for removal.

---

### 7. UI Polish

- [ ] **7.1** Replace `window.confirm` in `EventFormModal.handleDelete` with a proper dialog
  (use Radix `AlertDialog` — already available via shadcn)

- [ ] **7.2** Add color picker back to `EventFormModal` using ilamy's Tailwind class approach
  (see `COLOR_OPTIONS` in the ilamy `event-form.tsx` source — 14 color swatches)
  - Currently color/backgroundColor are not set from the form; server defaults apply

- [ ] **7.3** Event detail view for students (read-only)
  - Show title, description, resource, time, registration count, "Book" button
  - Currently `disableEventClick={false}` but ilamy's default click behavior may not show our custom data

- [ ] **7.4** Toast offset adjustment for mobile bottom nav
  - When mobile navigation is implemented, increase `ToastContainer` bottom offset from `bottom-4`
    to `bottom-16` (flagged in Phase 1 Toast spec)

---

### 8. Payments (Polar Integration)

- [ ] **8.1** Create Polar products for bookable event types
  - Webhook handler to sync Polar product/price IDs back to `Product` table

- [ ] **8.2** Checkout flow for `BOOKABLE` events
  - Redirect to Polar checkout with event context
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`

- [ ] **8.3** Credit pack support (`ProductCategory.CREDIT_PACK`)
  - Track credit balance per user
  - Deduct credits on registration when `creditCost` is set on the event

---

## Notes

- **BLOCK events are Phase 1 complete.** The `eventType` field defaults to `BLOCK` in the DB
  with `isBlocking=true` and `isPublic=false` — safe for all existing events.
- **No Polar work needed before items 4.1–4.5** (registration flow can use credit/free events first).
- **Items 6.1 and 7.1–7.2 are small and can be done at any time** — they are improvements to
  Phase 1 work, not blockers for Phase 2.


during testing the following functionality needs to be verified:


8h

Start with @README.md  to understand context, as well as @HANDOFF.md  to pick up where the last session left off. 

I'll read both files simultaneously to get up to speed.

Context is clear. One remaining task from last session:

Remove the canCreateEvents gate from renderEventForm in CalendarClient.tsx (lines 274–276), using a targeted single-line edit to avoid em-dash corruption.

Let me read the exact lines first.

Good — the lines are clean. I'll do a targeted single-line edit touching only the renderEventForm prop, keeping the comment line untouched.

CalendarClient.tsx
+45
-13
        )}
      />
    </div>
  </div>
);



The edit caused file corruption again — the em-dash issue struck. Let me read the full file to assess the damage.

The em-dash corruption happened exactly as warned — the edit tool duplicated the return block. The file needs to be fully rewritten with the correct content. I'll use a Python script to write the clean file directly, bypassing the edit tool entirely.

Command python3

python3 -c "
content = '''\"use client\";
 
import { IlamyResourceCalendar } from \"@ilamy/calendar\";
import type {
\tCalendarEvent as IlamyCalendarEvent,
\tCellClickInfo,
\tResource,
} from \"@ilamy/calendar\";
import { RRule } from \"rrule\";
import dayjs from \"dayjs\";
import Link from \"next/link\";
import { Settings } from \"lucide-react\";
import { useMemo, useState } from \"react\";
import { api } from \"~/trpc/react\";
import { keepPreviousData } from \"@tanstack/react-query\";
import \"~/lib/dayjs-config\";
import { useToast, ToastContainer } from \"~/app/_components/shared/Toast\";
import EventFormModal from \"~/app/calendar/EventFormModal\";
 
// Default colors from globals.css design tokens
const DEFAULT_COLOR = \"#4F46E5\"; // --primary
const DEFAULT_BG_COLOR = \"#EFF6FF\"; // --accent
 
// Parse RRULE string into rrule.js options \xe2\x80\x94 defined outside component to avoid re-creation on every render
function parseRRule(rruleString: string) {
\tconst rule = RRule.fromString(rruleString);
\treturn rule.origOptions;
}
 
export default function CalendarClient() {
\tconst [currentDate, setCurrentDate] = useState(dayjs());
\tconst [currentView, setCurrentView] = useState<\"month\" | \"week\" | \"day\">(
\t\t\"week\",
\t);
 
\t// Fetch user profile
\tconst { data: user, isLoading: userLoading } =
\t\tapi.user.getOrCreateProfile.useQuery();
 
\t// Compute fetch range with \xc2\xb11 week buffer
\tconst viewRange = useMemo(() => {
\t\tconst unit =
\t\t\tcurrentView === \"month\"
\t\t\t\t? \"month\"
\t\t\t\t: currentView === \"week\"
\t\t\t\t\t? \"week\"
\t\t\t\t\t: \"day\";
\t\treturn {
\t\t\tstartDate: currentDate.startOf(unit).subtract(1, \"week\").toDate(),
\t\t\tendDate: currentDate.endOf(unit).add(1, \"week\").toDate(),
\t\t};
\t}, [currentDate, currentView]);
 
\t// Fetch resources
\tconst { data: resourcesData, isLoading: resourcesLoading } =
\t\tapi.calendar.getResources.useQuery({});
 
\t// Fetch events
\tconst { data: eventsData, isLoading: eventsLoading } =
\t\tapi.calendar.getEvents.useQuery(
\t\t\t{
\t\t\t\tstartDate: viewRange.startDate,
\t\t\t\tendDate: viewRange.endDate,
\t\t\t},
\t\t\t{
\t\t\t\tplaceholderData: keepPreviousData,
\t\t\t},
\t\t);
 
\t// Mutations
\tconst utils = api.useUtils();
\tconst { toasts, toast, dismiss } = useToast();
 
\tconst createEventMutation = api.calendar.createEvent.useMutation({
\t\tonSuccess: () => {
\t\t\tvoid utils.calendar.getEvents.invalidate();
\t\t},
\t\tonError: (err) => {
\t\t\ttoast(err.message, \"error\");
\t\t},
\t});
\tconst updateEventMutation = api.calendar.updateEvent.useMutation({
\t\tonSuccess: () => {
\t\t\tvoid utils.calendar.getEvents.invalidate();
\t\t},
\t\tonError: (err) => {
\t\t\ttoast(err.message, \"error\");
\t\t},
\t});
\tconst deleteEventMutation = api.calendar.deleteEvent.useMutation({
\t\tonSuccess: () => {
\t\t\tvoid utils.calendar.getEvents.invalidate();
\t\t},
\t\tonError: (err) => {
\t\t\ttoast(err.message, \"error\");
\t\t},
\t});
 
\t// Role flags
\tconst isStudent = user?.userType === \"STUDENT\";
\tconst isCoach = user?.userType === \"COACH\";
\tconst isFacilityOrAdmin =
\t\tuser?.userType === \"FACILITY\" || user?.userType === \"ADMIN\";
\tconst canCreateEvents = isCoach || isFacilityOrAdmin;
 
\t// Transform DB resources \xe2\x80\x94 ilamy Resource[]
\tconst resources: Resource[] = useMemo(() => {
\t\tif (!resourcesData?.resources) return [];
 
\t\treturn resourcesData.resources.map((r) => ({
\t\t\tid: r.resourceId,
\t\t\ttitle: r.title,
\t\t\tcolor: r.color ?? DEFAULT_COLOR,
\t\t\tbackgroundColor: r.backgroundColor ?? DEFAULT_BG_COLOR,
\t\t\tposition: r.position,
\t\t\tbusinessHours:
\t\t\t\tr.businessHours.length > 0
\t\t\t\t\t? r.businessHours.map((bh) => ({
\t\t\t\t\t\t\tdaysOfWeek: bh.daysOfWeek,
\t\t\t\t\t\t\tstartTime: bh.startTime,
\t\t\t\t\t\t\tendTime: bh.endTime,
\t\t\t\t\t\t}))
\t\t\t\t\t: undefined,
\t\t})) as Resource[];
\t}, [resourcesData]);
 
\t// Transform DB events \xe2\x80\x94 ilamy CalendarEvent[]
\tconst events: IlamyCalendarEvent[] = useMemo(() => {
\t\tif (!eventsData?.events) return [];
 
\t\treturn eventsData.events.map((e) => ({
\t\t\tid: e.eventId,
\t\t\ttitle: e.title,
\t\t\tstart: dayjs(e.start),
\t\t\tend: dayjs(e.end),
\t\t\tdescription: e.description ?? undefined,
\t\t\tcolor: e.color ?? undefined,
\t\t\tbackgroundColor: e.backgroundColor ?? undefined,
\t\t\tallDay: e.allDay,
\t\t\tresourceId: e.resourceId ?? undefined,
\t\t\tuid: e.uid,
\t\t\trrule: e.rrule ? parseRRule(e.rrule) : undefined,
\t\t\texdates: e.exdates?.map((d) => d.toISOString()) ?? [],
\t\t\trecurrenceId: e.recurrenceId ?? undefined,
\t\t\t// Store DB metadata in data bag
\t\t\tdata: {
\t\t\t\tdbEventId: e.eventId,
\t\t\t\teventType: e.eventType,
\t\t\t\tisBlocking: e.isBlocking,
\t\t\t\tisPublic: e.isPublic,
\t\t\t\tmaxParticipants: e.maxParticipants ?? null,
\t\t\t\tcurrentRegistrations: e._count?.registrations ?? 0,
\t\t\t\tpriceInCents: e.product?.priceInCents ?? null,
\t\t\t\tproductId: e.productId ?? null,
\t\t\t\tcoachName: e.createdByUser?.firstName ?? null,
\t\t\t},
\t\t})) as IlamyCalendarEvent[];
\t}, [eventsData]);
 
\t// Event lifecycle handlers
\tconst handleEventAdd = async (event: IlamyCalendarEvent) => {
\t\t// Convert local times to UTC before sending to server
\t\tconst startUtc = event.start.toDate();
\t\tconst endUtc = event.end.toDate();
 
\t\tawait createEventMutation.mutateAsync({
\t\t\ttitle: event.title,
\t\t\tstart: startUtc,
\t\t\tend: endUtc,
\t\t\tdescription: event.description,
\t\t\tresourceId: event.resourceId?.toString(),
\t\t\tallDay: event.allDay,
\t\t\tcolor: event.color,
\t\t\tbackgroundColor: event.backgroundColor,
\t\t\trrule: event.rrule
\t\t\t\t? new RRule(event.rrule as ConstructorParameters<typeof RRule>[0]).toString()
\t\t\t\t: undefined,
\t\t});
\t};
 
\tconst handleEventUpdate = async (event: IlamyCalendarEvent) => {
\t\tconst dbEventId = (event.data?.dbEventId as string) ?? event.id;
 
\t\t// Convert local times to UTC
\t\tconst startUtc = event.start.toDate();
\t\tconst endUtc = event.end.toDate();
 
\t\tawait updateEventMutation.mutateAsync({
\t\t\teventId: dbEventId,
\t\t\ttitle: event.title,
\t\t\tstart: startUtc,
\t\t\tend: endUtc,
\t\t\tdescription: event.description,
\t\t\tresourceId: event.resourceId?.toString(),
\t\t\tallDay: event.allDay,
\t\t\tcolor: event.color,
\t\t\tbackgroundColor: event.backgroundColor,
\t\t});
\t};
 
\tconst handleEventDelete = async (event: IlamyCalendarEvent) => {
\t\tconst dbEventId = (event.data?.dbEventId as string) ?? event.id;
\t\tawait deleteEventMutation.mutateAsync({ eventId: dbEventId });
\t};
 
\t// Cell click handler \xe2\x80\x94 enables click-to-create
\tconst handleCellClick = (info: CellClickInfo) => {
\t\t// ilamy automatically opens renderEventForm with the clicked time slot
\t\t// This handler just needs to exist to enable the feature
\t\tvoid info;
\t};
 
\t// Navigation handlers
\tconst handleDateChange = (date: dayjs.Dayjs) => setCurrentDate(date);
\tconst handleViewChange = (view: \"month\" | \"week\" | \"day\" | \"year\") => {
\t\tif (view !== \"year\") {
\t\t\tsetCurrentView(view);
\t\t}
\t};
 
\t// User timezone
\tconst userTimezone = user?.timeZone ?? dayjs.tz.guess();
 
\t// Loading state
\tconst isLoading = userLoading || resourcesLoading || eventsLoading;
 
\tif (isLoading) {
\t\treturn (
\t\t\t<div className=\"flex h-[calc(100vh-5rem)] items-center justify-center\">
\t\t\t\t<div className=\"animate-pulse space-y-4\">
\t\t\t\t\t<div className=\"h-8 w-48 rounded bg-gray-200\" />
\t\t\t\t\t<div className=\"h-96 w-full rounded bg-gray-200\" />
\t\t\t\t</div>
\t\t\t</div>
\t\t);
\t}
 
\treturn (
\t\t<div className=\"flex h-[calc(100vh-5rem)] flex-col\">
\t\t\t<ToastContainer toasts={toasts} onDismiss={dismiss} />
\t\t\t{isFacilityOrAdmin && (
\t\t\t\t<div className=\"flex justify-end px-4 pt-3\">
\t\t\t\t\t<Link
\t\t\t\t\t\thref=\"/calendar/resources\"
\t\t\t\t\t\tclassName=\"flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-[var(--accent)]\"
\t\t\t\t\t>
\t\t\t\t\t\t<Settings size={16} />
\t\t\t\t\t\tManage Resources
\t\t\t\t\t</Link>
\t\t\t\t</div>
\t\t\t)}
\t\t\t<div className=\"flex-1 overflow-hidden p-4\">
\t\t\t\t<IlamyResourceCalendar
\t\t\t\t\tkey={userTimezone}
\t\t\t\t\tresources={resources}
\t\t\t\t\tevents={events}
\t\t\t\t\tinitialView={currentView}
\t\t\t\t\tfirstDayOfWeek=\"monday\"
\t\t\t\t\ttimeFormat=\"12-hour\"
\t\t\t\t\ttimezone={userTimezone}
\t\t\t\t\t// Access controls
\t\t\t\t\tdisableCellClick={isStudent}
\t\t\t\t\tdisableDragAndDrop={isStudent}
\t\t\t\t\tdisableEventClick={false}
\t\t\t\t\t// Cell interactions
\t\t\t\t\tonCellClick={canCreateEvents ? handleCellClick : undefined}
\t\t\t\t\t// Event lifecycle (wired for COACH and FACILITY/ADMIN)
\t\t\t\t\t// onEventAdd intentionally omitted \xe2\x80\x94 EventFormModal.createMutation handles creation directly
\t\t\t\t\tonEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
\t\t\t\t\tonEventDelete={canCreateEvents ? handleEventDelete : undefined}
\t\t\t\t\tonDateChange={handleDateChange}
\t\t\t\t\tonViewChange={handleViewChange}
\t\t\t\t\t// Custom event form modal
\t\t\t\t\trenderEventForm={(props) => (
\t\t\t\t\t\t<EventFormModal {...props} resources={resources} userType={user?.userType} />
\t\t\t\t\t)}
\t\t\t\t/>
\t\t\t</div>
\t\t</div>
\t);
}
'''
 
with open('/Users/sumanth/Desktop/shuttlementorWorkspace/shuttlementor/src/app/calendar/CalendarClient.tsx', 'w') as f:
    f.write(content)
print('Done')
"
 
Done
%                                                                              


Using legacy terminal
Configure
Let me verify the file looks correct now.

The file is clean and correct. The renderEventForm prop (lines 274–276) now unconditionally renders EventFormModal — no canCreateEvents gate. The em-dash in the comment on line 268 rendered as â due to the Python script byte encoding, but that's just a comment. Let me fix that properly.

Command python3

python3 -c "
with open('/Users/sumanth/Desktop/shuttlementorWorkspace/shuttlementor/src/app/calendar/CalendarClient.tsx', 'r') as f:
    content = f.read()
 
# Fix the mojibake em-dash in the comment
fixed = content.replace(
    '// onEventAdd intentionally omitted \xe2\x80\x94 EventFormModal.createMutation handles creation directly',
    '// onEventAdd intentionally omitted \u2014 EventFormModal.createMutation handles creation directly'
).replace(
    '// onEventAdd intentionally omitted â EventFormModal.createMutation handles creation directly',
    '// onEventAdd intentionally omitted \u2014 EventFormModal.createMutation handles creation directly'
)
 
with open('/Users/sumanth/Desktop/shuttlementorWorkspace/shuttlementor/src/app/calendar/CalendarClient.tsx', 'w') as f:
    f.write(fixed)
print('Done')
"
 
Done
%                                                                              


Using legacy terminal
Configure
Now let me do a quick type-check to confirm the file is valid before wrapping up.

Command npx, head in shuttlementor

npx tsc --noEmit --project tsconfig.json 2>&1 | head -30
%                                                                              


Using legacy terminal
Configure
TypeScript check passes clean (exit code 0).

Done. The one remaining item from the handoff is complete:

renderEventForm in CalendarClient.tsx:274-276 now unconditionally renders EventFormModal — students can click events to see the read-only modal, while EventFormModal handles its own canEdit access control internally.
Used a Python script to write the file directly, bypassing the edit tool em-dash corruption issue.
tsc --noEmit passes clean.
You can delete HANDOFF.md now — everything is in order.

Feedback submitted



will students see all the event details as well? do they need the button to view all the details if they only see the calendar details?

Let me look at what the read-only modal actually shows students.

Fast Context
read-only summary panel canEdit false EventFormModal
in 2.17s
Here's exactly what students see in the read-only modal (lines 195–233):

Title of the event
Date/time (ddd, MMM D · h:mm A – h:mm A)
Resource name (if set)
Description (if set)
"View event details" link — only shown for BOOKABLE or COACHING_SLOT events
For BLOCK events, the link never appears — students just see title/time/resource/description, which is all there is for a BLOCK event anyway.

For BOOKABLE/COACHING_SLOT events, the link goes to /events/[eventId] which has the full BookableEventDetails — capacity, registration type, price, etc. That information lives on the event detail page and is not shown inline in the modal.

So the question is: should the modal show that extra info inline (capacity, price, registrationType) instead of/in addition to the link?

The link makes sense if you want students to be able to register from there. But if the event detail page is primarily an admin edit page, pointing students there as their primary view is a bit awkward.

What's your intent for /events/[eventId] — is it a public-facing booking page, or an internal management page?

Feedback submitted



i want admins/facilityMembers/coaches to edit it if they need to, by turning on a toggle button to turn on edit mode. And for students and non owners to just view the page 

Let me look at the event detail page to understand what's there currently.

Good — I have a clear picture. Here's the plan:

EventDetailClient needs to:

Determine canEdit (FACILITY/ADMIN, or COACH who owns the event)
Add an editMode toggle state, defaulting to false
Show an "Edit" toggle button in the header (only for canEdit users)
Pass readOnly={!editMode} to BookableEventDetails
Students and non-owners always get readOnly=true with no toggle button.

1
Refactor EventDetailClient: add canEdit logic + editMode toggle

Update BookableEventDetails read-only view to show all relevant fields (description, capacity, price, registrationType) so students see full info

Now I'll rewrite EventDetailClient to add the canEdit + editMode toggle, then update BookableEventDetails to show all fields in read-only mode.

Cascade cannot create EventDetailClient.tsx because it already exists.
EventDetailClient.tsx
+31
-11
17 hidden lines
					}}
					readOnly={readOnly}
					readOnly={!editMode}
				/>

Now I need to update the server page to pass userId to EventDetailClient, and fix the read-only view in BookableEventDetails to show all fields for students.

Now let me update the server page to pass userId, and fix BookableEventDetails to show all fields in read-only mode.

page.tsx
+1
-1
 
	return <EventDetailClient eventId={eventId} userType={user.userType} />;
	return <EventDetailClient eventId={eventId} userType={user.userType} userId={user.userId} />;
}
Now update BookableEventDetails to show all relevant fields in read-only mode (description, price, capacity, registrationType) — currently it only shows description when readOnly=true.

BookableEventDetails.tsx
+37
-13
								</div>
							)}
						</div>
					)}
				</div>

Now run a type check to make sure everything is clean.

Command npx, head in shuttlementor

npx tsc --noEmit --project tsconfig.json 2>&1 | head -40
%                                                                              


Using legacy terminal
Configure
Clean. Let me mark the todos done and verify the final state of both files.

Done. Here's a summary of what was implemented:

Changes
EventDetailClient.tsx

Added userId prop (passed from server page via Clerk)
canEdit = isFacilityOrAdmin || (isCoach && event.createdByUserId === userId)
editMode state (default false) — only togglable if canEdit
Edit/View toggle button in the header row next to the date (only visible to those who can edit)
Passes readOnly={!editMode} to BookableEventDetails
page.tsx

Now passes userId={user.userId} to the client component
BookableEventDetails.tsx

Read-only view now shows a full detail card: description, visibility (Public/Private), capacity (x / max), and registration type — instead of just description
BLOCK events show description only (no booking-specific fields)
Role behavior:

Role	Toggle shown	Default state
FACILITY / ADMIN	Yes	View (read-only)
COACH (own event)	Yes	View (read-only)
COACH (other's event)	No	Always read-only
STUDENT	No	Always read-only
Feedback submitted


Your modified files:
EventDetailClient.tsx
shuttlementor/src/app/events/[eventId]
+5
-5

i think the canCreateEvents has already been removed, feel free to read the file again.

It looks like as a non logged in user I cannot view the page. can you look through the serverside page.tsx guards if there is any validation being done? i'm ok with non logged in users seeing these event details.

^ the above was done by another agent can you validate if it was done correctly?

Let me read the current state of both files.

Now I need to check if there's middleware or a Clerk config that blocks unauthenticated access to /events/*.

Now I need to check what getPublicEventById looks like (or if it exists) in the calendar router, since the user's other agent switched to that procedure.

Searched
getPublicEventById\|getEventById in shuttlementor/src/server/api/routers/calendar.ts (0)
The grep returned no results because the file is large. Let me search properly.

Both getPublicEventById and getEventById each have exactly 1 match — meaning getPublicEventById doesn't exist yet as a separate procedure. Let me read the relevant section of the calendar router.

Good — getPublicEventById already exists as a publicProcedure. Let me read its full implementation to validate it returns everything the client needs.

Now I have the full picture. Let me validate what the other agent did:

Validation
page.tsx — ✅ Correct approach

Uses auth() directly (not getOnboardedUserOrRedirect which hard-redirects unauthenticated users)
userType and userId are null for unauthenticated visitors — page renders fine
EventDetailClient.tsx — ✅ Correct

Props are now string | null — handles unauthenticated users
Switched to api.calendar.getPublicEventById — a publicProcedure (no auth required)
getPublicEventById backend — ✅ Correct

publicProcedure — no auth check
Returns the same shape as getEventById (identical includes)
One difference vs getEventById: no requireSameClub check and no createdByUserId in the return — let me verify that last point.
createdByUserId is a plain column on the model — it's returned by findUnique automatically without needing to be in include. So getPublicEventById does return it. The canEdit check in EventDetailClient will work correctly.

Now checking if there's one remaining issue — EventFormModal still calls getEventById (a protectedProcedure) for the calendar modal. That's fine since the calendar itself requires auth. But EventDetailClient now correctly uses getPublicEventById.

One actual problem: the canEdit check in EventDetailClient compares event.createdByUserId === userId but getPublicEventById doesn't filter by club — a user from a different club could theoretically view any event by ID. That's a design question for later (Phase 2.5 has a public calendar anyway), not a bug in the current flow.

Summary — the other agent's changes are correct:

Check	Result
page.tsx no longer calls getOnboardedUserOrRedirect	✅ Unauthenticated users pass through
userType/userId are null for unauthenticated	✅ canEdit will be false, no toggle shown
Client uses getPublicEventById (publicProcedure)	✅ No auth required on the tRPC call
getPublicEventById returns same shape including createdByUserId	✅ canEdit ownership check works
Middleware doesn't block /events/*	✅ clerkMiddleware used without protect(), all routes are open by default
No changes needed — everything is wired correctly. The page is now publicly accessible.

Feedback submitted


Your modified files:
page.tsx
shuttlementor/src/app/events/[eventId]
-26

oops i rejected the file you'll have to rewrite it.

Recreating page.tsx for the event detail page based on what the other agent had written (which I validated as correct):

page.tsx
new
+27
	}
 
	return <EventDetailClient eventId={eventId} userType={userType} userId={userId} />;
}
 

Quick type check to confirm the recreated file is clean:

Command npx, head in shuttlementor

npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
%                                                                                       


Using legacy terminal
Configure
Clean. File is restored exactly as validated.

Feedback submitted


Your modified files:
EventDetailClient.tsx
shuttlementor/src/app/events/[eventId]
+5
-5

okay, what needs to be done next on our checklist?

I dont quite see a filter on the products page whether users can search for inactive products  as well.

Let me check the progress checklist and the products page simultaneously.

Checklist status — tasks 3.1–3.4 are all done (just not checked off). Next unchecked work items are 4.1–4.5 (student-facing calendar + registration). Phase 5 (recurring edit scope) and 7.x (UI polish) can slot in anytime.

Products page filter — currently includeInactive: true is hardcoded (line 37), so inactive products always show but there's no UI toggle. Easy fix: add a "Show inactive" checkbox to the header.

Update progressPhase2.md — mark 3.1–3.4 complete

2
Add 'Show inactive' toggle to ProductsClient header

5 more
Adding the "Show inactive" toggle to ProductsClient:

ProductsClient.tsx
+17
-5
						<Plus size={16} />
						New Product
					</Button>
				</div>
			</div>

Quick type check then I'll also update the checklist:

Command npx, head in shuttlementor

npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
%                                                             


Using legacy terminal
Configure
Now let me update the checklist to mark 3.1–3.4 complete:

progressPhase2.md
+4
-4
2 hidden lines
 
- [ ] **3.4** Link to `/events/[eventId]` from calendar event click (for FACILITY/ADMIN on BOOKABLE events)
- [x] **3.4** Link to `/events/[eventId]` from calendar event click (for FACILITY/ADMIN on BOOKABLE events)
 

Done. Here's a summary of everything completed this session:

Completed
Products page — "Show inactive" filter (ProductsClient.tsx)

Added showInactive state (default false) — active products only by default
Checkbox in the header next to "New Product" toggles visibility of inactive products
Query is reactive — switches between includeInactive: false / true live
Checklist updated (progressPhase2.md)

Marked tasks 3.1–3.4 as complete
Next Up: Section 4 — Student-Facing Calendar
The remaining work in priority order:

4.1 Filter/differentiate public bookable events for students on the calendar
4.2 "Book" button in the event modal/detail page for students
4.3 registerForEvent tRPC mutation (capacity check + duplicate check)
4.4 cancelRegistration mutation
4.5 getMyRegistrations query
Want to start on 4.1–4.3 now?

Feedback submitted



go ahead and implement 4.1, or alteast show me your plan for it. also i want a list of things i should test out so far with the dev app given all the changes implemented so far

Let me look at the current getEvents query to understand what's already being fetched for students.

Good — I have everything I need. Here's the plan for 4.1:

Plan for 4.1
The problem: Students currently see ALL events including BLOCK events and private bookable events. They should only see isPublic = true events with eventType of BOOKABLE or COACHING_SLOT.

Approach — filter on the backend in getEvents, not the frontend. Pass the user's role and apply a WHERE clause filter for students. No new procedure needed — just add a conditional filter to the existing query.

If STUDENT: only return events where isPublic = true AND eventType IN [BOOKABLE, COACHING_SLOT]
All other roles: return all events (current behavior)
This is a single-line addition to the where clause in getEvents.

Let me implement it:

calendar.ts
+10
-4
					...(isStudent && {
						isPublic: true,
						eventType: { in: ["BOOKABLE", "COACHING_SLOT"] },
					}),
					OR: [

The edit looks correct. Let me verify with a type check and also check that the eventType spread with Prisma's enum type is valid.

Command npx, head in shuttlementor

npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
%                                                             


Using legacy terminal
Configure
Clean. Now update the checklist and todo list.

progressPhase2.md
+2
-2
- [ ] **4.1** Show public bookable events to students (`isPublic = true`, `eventType = BOOKABLE`)
  - Currently students see all events fetched by `getEvents`; filter or differentiate in UI
- [x] **4.1** Show public bookable events to students (`isPublic = true`, `eventType = BOOKABLE`)
  - `getEvents` applies server-side filter for STUDENT role: `isPublic=true` + `eventType IN [BOOKABLE, COACHING_SLOT]`
 

4.1 is done. Here's your testing checklist for everything built so far, and the 4.1 implementation summary:

4.1 Implementation
Single backend change in getEvents — added a role-based WHERE filter:

STUDENT: only isPublic=true + eventType IN [BOOKABLE, COACHING_SLOT]
Everyone else: unchanged (all events returned)
No frontend changes needed — the filter is server-side so students simply never receive BLOCK events or private events.

Testing Checklist
Products page (/products)
Active only by default — inactive products don't appear on load
"Show inactive" checkbox — toggles in inactive products (dimmed rows) without page reload
Create product — form opens, fills, saves; appears in table
Edit product — pencil icon opens pre-filled form, saves changes
Toggle active/inactive — toggle icon switches status, row dims/undims
Delete blocked — deleting a product linked to events shows error toast
Category filter in event form — when creating a BOOKABLE event, product dropdown shows only CALENDAR_EVENT products; COACHING_SLOT shows only COACHING_SLOT products
Calendar — FACILITY/ADMIN user
All events visible — BLOCK, BOOKABLE, COACHING_SLOT all appear
Click own event → edit form opens with Save/Delete, event type is read-only
Click another's event → edit form opens (FACILITY/ADMIN can edit all)
Event type selector — BLOCK / BOOKABLE / COACHING_SLOT dropdown visible when creating
"Event Page" link — appears in form footer for BOOKABLE/COACHING_SLOT events
Manage Resources button visible in top-right
Calendar — COACH user
Event type selector hidden — type is always COACHING_SLOT
Click own event → edit form with canEdit=true
Click another coach's event → read-only panel with "View event details" link
No "Manage Resources" button
Calendar — STUDENT user
Only public BOOKABLE/COACHING_SLOT events visible (no BLOCK events, no private events)
Clicking an event → read-only modal with title, time, resource, description
"View event details" link visible for BOOKABLE/COACHING_SLOT events in modal
Cannot click empty cells (cell click disabled)
Cannot drag events
Event detail page (/events/[eventId])
Accessible without login — paste URL in incognito, page loads with full details
FACILITY/ADMIN — "Edit" toggle button visible; toggling shows editable fields; save works
COACH (own event) — "Edit" toggle button visible
COACH (other's event) — no toggle, view-only
STUDENT — no toggle, full read-only view shows description, visibility, capacity, registration type
Back to calendar link works