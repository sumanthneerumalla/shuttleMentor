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
> **Guiding principle for Phase 3**: Platform hardening, UX polish, and multi-club architecture.
> No new major feature domains — consolidate what exists, fix structural debt, and unlock
> coaches/students as first-class citizens with proper profile pages.

---

## 1. Multi-Club Architecture (Club Table Migration)

> **Context**: `User.clubShortName` is currently a plain `String` FK to `Club.clubShortName`.
> This means a user can only belong to one club. The `Club` model already exists as a proper
> table (with `clubShortName` PK and `clubName`). The migration needed is to the relationship
> model, not the `Club` table itself.

- [ ] **1.1** Add `UserClub` join table — many-to-many between `User` and `Club`
  - Fields: `userId`, `clubShortName`, `joinedAt`, `isPrimary Boolean @default(false)`
  - Keep existing `User.clubShortName` as "primary club" for backward compatibility during migration
  - Prisma migration: create join table, backfill from existing `User.clubShortName`

- [ ] **1.2** Add `/select-organization` page
  - Browse available clubs; join/leave; set primary
  - Requires `UserClub` join table (1.1)

- [ ] **1.3** Clean up `src/app/profile/page.tsx` club fields
  - Replace free-text club ID/name inputs with a dropdown of clubs from `getAvailableClubs`
  - Remove `validateClubFieldsRealTime`, `handleClubIdChange`, `handleClubNameChange`
  - Blocked on 1.1 (need club list to be queryable)

- [ ] **1.4** Review `src/server/utils/validation.ts` club validation after 1.1
  - `validateAndGetClub` already does DB lookup — may be sufficient
  - Remove any remaining hardcoded club logic

> **Decision needed before starting 1.1**: Do you want to keep `User.clubShortName` as a
> denormalized "primary club" field alongside the join table, or fully migrate to join-table-only
> with a `primaryClub` relation? The denormalized approach is simpler to migrate; the pure
> relation approach is cleaner long-term.

---

## 2. Coach Profile Pages

- [ ] **2.1** Create `/coaches` page — public listing of coaches in a club
  - Server component; fetches `CoachProfile` list filtered by club
  - Cards: avatar, displayUsername, bio excerpt, rate, specialties tags
  - Use shadcn `Card` + `Avatar` components

- [ ] **2.2** Create `/coaches/[coachProfileId]` page — full coach profile
  - Bio, experience, specialties, teaching styles, rate
  - Read-only for visitors; edit controls shown to coach owner + admin
  - Profile picture upload for coaches (see 3.1)

- [ ] **2.3** Link coach name on event detail page → `/coaches/[coachProfileId]`
  - Currently shows `coachName` as plain text in `EventDetailClient`

---

## 3. Profile & Media Improvements

- [ ] **3.1** Coach profile picture upload on `/coaches/[coachProfileId]`
  - Reuse existing `updateCoachProfile` mutation with `profileImage` field (already supports base64)
  - Add image picker UI on the edit view of the coach profile page

- [ ] **3.2** Fix `coachingNotes.getNotesByMedia` edit/delete UI gating
  - Backend now returns `coach.userId` on each note (done in session cleanup)
  - **Still needed**: update `CoachingNotesList` to accept `currentUserId?: string` prop and use
    `canEdit = userType === ADMIN || note.coach.userId === currentUserId` instead of
    `canEdit = userType === COACH || userType === ADMIN`
  - Pass `currentUserId` from `VideoCollectionDisplay` (already queries `user.userId`)

- [ ] **3.3** Consolidate `binaryToBase64DataUrl` call sites
  - Currently called in ~5 places (user profile, coach profile, `getNotesByMedia` — now fixed)
  - Audit remaining: `getOrCreateProfile`, `updateProfile`, `getCoachProfile` if it exists
  - Extract a `formatUserForFrontend` helper in `user.ts` to DRY up the pattern

---

## 4. Video Collections Improvements

- [ ] **4.1** Paginate video collections list
  - `getVideoCollections` (or equivalent) should support cursor-based pagination
  - `video-collections/page.tsx` currently does direct DB queries — move to paginated tRPC endpoint

- [ ] **4.2** Editable video collection title and description
  - Add `updateVideoCollection` mutation (title, description only — not video URLs)
  - Inline edit UI in `VideoCollectionDisplay` header for collection owner + admin

- [ ] **4.3** Coach-scoped collection visibility
  - Coaches should only see collections assigned to them (`assignedCoachId = coach.userId`)
  - `getVideoCollections` query needs role-based filter (already partially done; audit and confirm)

- [ ] **4.4** Facility/admin can assign coach to a collection
  - `updateVideoCollection` mutation needs `assignedCoachId` field
  - `CoachSelector` already exists; confirm facility/admin path in `canAssignCoach` logic
    (fixed in session cleanup — `isFacilitySameClub` already covers this)

---

## 5. Security & Architecture Hardening

- [ ] **5.1** Middleware short-URL rewrite — remove `CLUB_LANDING_SHORTNAMES` from middleware
  - `src/middleware.ts` still uses the hardcoded array (only `AuthedLayout` was fixed)
  - Choose one of: B1 (remove short URLs), B3 (cached DB lookup), or B4 (keep array in middleware only)
  - **Recommendation**: B4 for now (middleware is server-side only, no client leak) — move array
    from `clubLanding.ts` to `middleware.ts` directly and delete `clubLanding.ts`

- [ ] **5.2** Remove `clubLanding.ts` after 5.1
  - File will be unused once `AuthedLayout` (done) and `middleware.ts` (5.1) are updated

- [ ] **5.3** Coaching notes edit/delete backend auth audit
  - Confirm that `updateNote` and `deleteNote` mutations check `note.coachId === user.userId || isAdmin`
  - No UI change needed if backend is already correct; just verify

---

## 6. UI Component Consolidation

- [ ] **6.1** Migrate to shadcn/Radix sidebar
  - Replace `SideNavigation.tsx` with shadcn `Sidebar` component
  - Resolves dropdown chevron/section issues noted in `nextSteps.md`

- [ ] **6.2** Migrate to shadcn/Radix navbar
  - Replace `NavBar.tsx` with shadcn `NavigationMenu` or equivalent
  - Resolves dropdown issues

- [ ] **6.3** Replace coaching notes modal with Radix `Dialog`
  - Focus trap, focus restore, escape handling, aria attributes
  - Affects: `CoachingNoteModal.tsx`
  - Reuse existing shadcn `Dialog` already available in the project

- [ ] **6.4** Standardize error panels
  - `CoachSelector.tsx` and `CoachingNoteForm.tsx` have different error panel styles
  - Create a shared `ErrorBanner` component using a consistent global class

- [ ] **6.5** Reduce nested `glass-panel` in `VideoCollectionDisplay`
  - Outer `glass-panel p-6` + inner `glass-panel p-6` for coaching notes doubles border/shadow
  - Replace inner with `panel-muted` or spacing only

---

## 7. Dashboard Cleanup

- [ ] **7.1** Review and minimize `src/app/dashboard/page.tsx`
  - Currently large — audit for dead code and simplify

- [ ] **7.2** Clean up `getCoachDashboardMetrics`
  - Logic for `uniqueStudentsWithMedia` can be simplified to a `count` query
  - Consider splitting into separate queries for better cache granularity

---

## 8. Registration Migration (Recurring Events)

> Carried forward from Phase 2. Guards are in place. Implement when scope-split on registerable
> events is needed in production.

- [ ] **8.1** `THIS` scope on BOOKABLE/COACHING_SLOT with active registrations
  - Create detached occurrence event (`parentEventId = eventId`)
  - Migrate registrations to new event, cancel originals
  - Remove the `instanceRegs > 0` block guard in `updateEvent` and `deleteEvent`

- [ ] **8.2** `THIS_AND_FUTURE` scope on BOOKABLE/COACHING_SLOT
  - Re-point forward registrations (`instanceDate >= split point`) to new series `eventId`
  - Remove the BOOKABLE/COACHING_SLOT guard block

---

## 9. Payments — Polar Integration (Phase 8)

- [ ] **9.1** Polar product sync webhook
  - Webhook handler to write `polarProductId` / `polarPriceId` back to `Product` table

- [ ] **9.2** Checkout flow for BOOKABLE events
  - Redirect to Polar checkout with `eventId` + `instanceDate` in metadata
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`

- [ ] **9.3** Credit pack support (`ProductCategory.CREDIT_PACK`)
  - Track credit balance per user (new `UserCredit` table or field on `User`)
  - Deduct on `registerForEvent` when `event.creditCost > 0`
  - Return credit on `RESCHEDULED` status transition

- [ ] **9.4** Walk-in billing for `CHECKED_IN` without prior `REGISTERED`
  - Charge/deduct credit at check-in time for walk-ins
  - Requires credit pack system (9.3) to be live first

---

## Open Technical Debt (from nextSteps.md)

| Item | File(s) | Notes |
|------|---------|-------|
| `VideoCollectionDisplay` `userType` prop removed | Done | Fixed in session |
| `getNotesByMedia` base64 server-side | Done | Fixed in session |
| `INFO` unused import in `VideoCollectionDisplay` | Done | Fixed in session |
| Input schemas extracted in `user.ts` | Done | Fixed in session |
| `firstName`/`lastName` regex validation in `updateProfileSchema` | Done | Added `\p{L}\p{M}' -` pattern |
| `timeZone` regex validation in `updateProfileSchema` | Done | Added IANA tz pattern |
| `club/[clubShortName]` server-side 404 | Done | Fixed in session |
| `AuthedLayout` client bundle club list leak | Done | Fixed in session |
| `canCreateNotes` edit/delete UI gating | 3.2 above | Needs `currentUserId` prop |
| Paginate video collections | 4.1 above | |
| Coach profile picture upload | 3.1 above | |
| `video-collections/page.tsx` direct DB queries | 4.1 above | |
| shadcn sidebar/navbar migration | 6.1, 6.2 above | |
| Focus trap on coaching notes modal | 6.3 above | |
| Verbose styling in coaching components | 6.4, 6.5 above | |
| `dashboard/page.tsx` cleanup | 7.1 above | |

---

## Suggested Start Order for Next Session

1. **3.2** — Fix `CoachingNotesList` edit/delete gating (backend already done, 1 component change)
2. **4.2** — Editable video collection title/description (small mutation + inline edit UI)
3. **2.1 + 2.2** — Coach profile pages (new pages, no schema changes needed)
4. **1.1+** — Multi-club architecture (requires schema decision first — ask user)
