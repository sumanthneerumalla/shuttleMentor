# Shuttlementor — Phase 3 Progress

> **Related design docs**: [`designFiles/calendaring/README.md`](./calendaring/README.md) is the
> master calendaring design document and defines its own internal phase numbering
> (calendaring Phase 3 = Polar payments; calendaring Phase 5 = Credits). The phases in
> *this* document are product-wide sprint phases, not calendaring-specific ones.
> When working on payments or credits, cross-reference the calendaring README phases.
>
> **Prerequisites**: Phase 2 complete (bookable events, registration flow, recurring scope).
> Read [`progressPhase2.md`](./calendaring/progressPhase2.md) for Phase 2 context.
>
> **Guiding principle for Phase 3**: Complete calendaring feature surface (non-payment items first),
> then Polar payments integration. Platform hardening items are optional and can be picked
> from at any time — see [Optional: Platform Polish](#optional-platform-polish) at the bottom.

---

## Priority 1 — Calendaring: Remaining Phase 2.5 Items

> No payment integration required. These complete the bookable events feature surface.

- [ ] **C1** Custom `renderEvent` with capacity badges and price display
  - Calendar event cells should show remaining spots (e.g. "3/10") and price for `BOOKABLE`/`COACHING_SLOT` events
  - Requires `renderEvent` prop on `IlamyCalendar`/`IlamyResourceCalendar`
  - Data already available in the event's `.data` payload from `getEvents`

- [ ] **C2** Share links — deep link to a specific event
  - `/events/[eventId]` already exists and works unauthenticated; share links are just links to that page
  - Add a "Copy link" button to the event detail view and the event slide-over panel in the calendar
  - No backend work needed

- [x] **C3** `staffProcedure` — coach slot creation access control ✓ Done
  - Added `staffProcedure` to `trpc.ts` (FACILITY | ADMIN | COACH)
  - Swapped `createEvent`, `updateEvent`, `deleteEvent`, `getEventRegistrations` from `protectedProcedure` to `staffProcedure`
  - Removed duplicate inline role guards; ownership/type restrictions remain as business logic

- [ ] **C4** Public calendar standalone page (`/club/[clubShortName]/calendar`)
  - Read-only calendar showing only `isPublic` BOOKABLE/COACHING_SLOT events for unauthenticated visitors
  - No sidebar or auth required; add `getPublicEvents` + `getPublicResources` `publicProcedure` variants
  - Defer until embeddable calendar widget is done (build both together as `/calendar` + `/embed`)
  - Links from club landing page

- [ ] **C5** Embeddable calendar widget (`/embed/[clubShortName]/calendar`)
  - Same data as public calendar (`/club/[clubShortName]/calendar`) but minimal chrome for `<iframe>` embedding
  - Build C4 and C5 in the same pass
  - See calendaring README Phase 3 item 6

---

## Priority 2 — Calendaring: Registration Migration (Recurring Events)

> Guards are in place (TODO comments added in Phase 2). Implement when scope-split on
> registerable recurring events is needed in production.

- [ ] **R1** `THIS` scope on BOOKABLE/COACHING_SLOT with active registrations
  - Create detached occurrence event (`parentEventId = eventId`)
  - Migrate registrations to new event, cancel originals
  - Remove the `instanceRegs > 0` block guard in `updateEvent` and `deleteEvent`

- [ ] **R2** `THIS_AND_FUTURE` scope on BOOKABLE/COACHING_SLOT
  - Re-point forward registrations (`instanceDate >= split point`) to new series `eventId`
  - Remove the BOOKABLE/COACHING_SLOT guard block

---

## Priority 3 — Payments: Polar Integration

> See calendaring README Phase 3 for full design. All items below are Polar-dependent.

- [ ] **P1** Polar product sync
  - Webhook handler to write `polarProductId` / `polarPriceId` back to `Product` table
  - Sync product price/title changes from Polar dashboard

- [ ] **P2** Checkout flow for BOOKABLE events
  - Redirect to Polar checkout with `eventId` + `instanceDate` in metadata
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`
  - `isPublic` toggle in event creation UI (needed for public calendar to surface the event)

- [ ] **P3** Capacity enforcement on checkout
  - Prevent checkout when `maxParticipants` is reached
  - Guard in `registerForEvent` mutation and on checkout redirect

- [ ] **P4** `isBlocking` auto-transition for coaching slots on purchase
  - When a `COACHING_SLOT` registration is confirmed, set `isBlocking = true` on the event
  - Reverse on cancellation/refund

- [ ] **P5** Credit pack support (`ProductCategory.CREDIT_PACK`) — Phase 5
  - Track credit balance per user (new `UserCredit` table or field on `User`)
  - Deduct on `registerForEvent` when `event.creditCost > 0`
  - Return credit on `RESCHEDULED` status transition

- [ ] **P6** Walk-in billing for `CHECKED_IN` without prior `REGISTERED` — Phase 5
  - Charge/deduct credit at check-in time for walk-ins
  - Requires credit pack system (P5) to be live first

---

## Open Technical Debt

| Item | Status | Notes |
|------|--------|-------|
| `VideoCollectionDisplay` `userType` prop removed | Done | Fixed |
| `INFO` unused import in `VideoCollectionDisplay` | Done | Fixed |
| Input schemas extracted in `user.ts` | Done | Fixed |
| `firstName`/`lastName` regex validation | Done | Added `\p{L}\p{M}' -` pattern |
| `timeZone` regex validation | Done | Added IANA tz pattern |
| `canCreateNotes` edit/delete UI gating | Done | `currentUserId` prop in `CoachingNotesList` |
| `staffProcedure` / `coachProcedure` audit | Done | `staffProcedure` added; 4 procedures swapped |
| `getNotesByMedia` base64 server-side | Deferred | Reverted at user request |
| `club/[clubShortName]` server-side 404 | Deferred | See platform item S1 below |
| `AuthedLayout` client bundle club list leak | Deferred | See platform item S1 below |

---

## Suggested Start Order

1. **C1** — `renderEvent` capacity badges (no schema change, UI only)
2. **C2** — Share links / copy-link button (UI only, ~30 min)
3. **C4 + C5** — Public calendar + embeddable widget (build together)
4. **R1 + R2** — Registration migration for recurring events (when needed in production)
5. **P1 → P4** — Polar payments (P3 public calendar needed as prerequisite for P2)

---

---

## Optional: Platform Polish

> Pick-and-choose items. None are blockers for any calendaring work.
> Tackle these opportunistically between calendaring milestones.

### Coach Profile Pages

- [ ] **A1** Create `/coaches` page — public listing of coaches in a club
  - Server component; fetches `CoachProfile` list filtered by club
  - Cards: avatar, displayUsername, bio excerpt, rate, specialties tags

- [ ] **A2** Create `/coaches/[coachProfileId]` page — full coach profile
  - Bio, experience, specialties, teaching styles, rate
  - Read-only for visitors; edit controls shown to coach owner + admin

- [ ] **A3** Coach profile picture upload on `/coaches/[coachProfileId]`
  - Reuse existing `updateCoachProfile` mutation (already supports base64)

- [ ] **A4** Link coach name on event detail page → `/coaches/[coachProfileId]`
  - Currently shows `coachName` as plain text in `EventDetailClient`

### Video Collections

- [ ] **B1** Paginate video collections list
  - `video-collections/page.tsx` currently does direct DB queries — move to paginated tRPC endpoint

- [ ] **B2** Editable video collection title and description
  - Add `updateVideoCollection` mutation; inline edit UI in `VideoCollectionDisplay` header

- [ ] **B3** Coach-scoped collection visibility audit
  - Confirm `getVideoCollections` filters correctly by `assignedCoachId` for coaches

### Security & Architecture

- [ ] **S1** Middleware short-URL rewrite — move `CLUB_LANDING_SHORTNAMES` to `middleware.ts` only
  - `AuthedLayout` leak already fixed; `src/middleware.ts` still uses the hardcoded array
  - Recommendation: B4 — move array into `middleware.ts` directly, delete `clubLanding.ts`

- [ ] **S2** Server-side 404 for unknown club short names
  - `src/app/club/[clubShortName]/page.tsx` — query `Club` table; call `notFound()` if missing

- [ ] **S3** Coaching notes backend auth audit
  - Confirm `updateNote` / `deleteNote` check `note.coachId === user.userId || isAdmin`

### Multi-Club Architecture

> Requires schema decision before starting. Ask before implementing.

- [ ] **M1** Add `UserClub` join table — many-to-many between `User` and `Club`
  - Keep `User.clubShortName` as denormalized primary club for backward compatibility

- [ ] **M2** Add `/select-organization` page (blocked on M1)

- [ ] **M3** Replace free-text club fields on profile page with dropdown (blocked on M1)

### UI Consolidation

- [ ] **U1** Migrate to shadcn/Radix sidebar (replace `SideNavigation.tsx`)
- [ ] **U2** Migrate to shadcn/Radix navbar (replace `NavBar.tsx`)
- [ ] **U3** Replace coaching notes modal with Radix `Dialog` (`CoachingNoteModal.tsx`)
- [ ] **U4** Standardize error panels — shared `ErrorBanner` component
- [ ] **U5** Reduce nested `glass-panel` in `VideoCollectionDisplay`

### Dashboard & Metrics

- [ ] **D1** Audit and minimize `src/app/dashboard/page.tsx`
- [ ] **D2** Simplify `getCoachDashboardMetrics` — use `count` query for `uniqueStudentsWithMedia`
- [ ] **D3** Consolidate `binaryToBase64DataUrl` — extract `formatUserForFrontend` helper in `user.ts`
