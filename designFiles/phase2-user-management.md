# Phase 2: User Management Page — Implementation Plan

## Context

Phase 1 split the old ADMIN role into PLATFORM_ADMIN and CLUB_ADMIN (see [role-system-evolution.md](./role-system-evolution.md)). Phase 2 builds the admin user management page where FACILITY/CLUB_ADMIN/PLATFORM_ADMIN users can view, create, and manage users within their club.

## Step 1: Move `canAssignRole` / `assignableRoles` to shared utils

Move `ROLE_HIERARCHY`, `canAssignRole()`, and `assignableRoles()` from `src/server/utils/utils.ts` → `src/lib/utils.ts` so they're importable from client components. Re-export from `server/utils/utils.ts` for backward compat.

**Files:** `src/lib/utils.ts`, `src/server/utils/utils.ts`

## Step 2: Backend — 6 new tRPC procedures in `src/server/api/routers/user.ts`

Import `facilityProcedure` and `clubAdminProcedure` from `~/server/api/trpc`.

### 2a. `listClubUsers` — `facilityProcedure`

**Input:** `{ page, limit (10-50), search?, facilityId?, role?, sortBy?, sortOrder? }`

**Query:** On `User` model with `clubMemberships: { some: { clubShortName, ...filters } }`. Include `clubMemberships` scoped to this club with facility info. Use `Promise.all([count, findMany])` pagination pattern from `videoCollection.getAll`.

**Returns:** `{ users: UserWithMemberships[], pagination: { total, page, limit, pageCount } }`

### 2b. `createUser` — `facilityProcedure`

**Input:** `{ firstName, lastName, email, role, facilityId }`

**Logic:**
1. Validate `canAssignRole(ctx.user.userType, input.role)`
2. Validate facility belongs to caller's club
3. Import `clerkClient` from `@clerk/nextjs/server`
4. Try `clerkClient.users.createUser({ emailAddress: [email], firstName, lastName })`
5. On success: create `User` row + `UserClub` row
6. **If email exists in Clerk:** find existing Clerk user → find existing local `User` row → just create `UserClub` row (no new User needed). If already at this facility, error.

### 2c. `updateUserRole` — `clubAdminProcedure`

**Input:** `{ userId, facilityId, newRole }`

Validate ceiling via `canAssignRole()`. Update `UserClub.role`. **Safety check:** only update `User.userType` if BOTH `facilityId === targetUser.activeFacilityId` AND `ctx.user.clubShortName === targetUser.clubShortName`. This prevents bleeding the role change into a different club context.

### 2d. `updateUserProfile` — `facilityProcedure`

**Input:** `{ userId, firstName?, lastName?, email? }`

Validate target user is in same club (or caller is PLATFORM_ADMIN). Update `User` fields.

### 2e. `addUserToFacility` — `facilityProcedure`

**Input:** `{ userId, facilityId, role }`

Validate ceiling + facility in caller's club. Create `UserClub` row. Gated by `facilityProcedure` (not clubAdminProcedure) so FACILITY users can manage this.

### 2f. `removeUserFromFacility` — `facilityProcedure`

**Input:** `{ userId, facilityId }`

Delete `UserClub` row. If deleted facility was user's `activeFacilityId`, switch to another facility in the club or clear it. Gated by `facilityProcedure` so FACILITY users can manage this. No warning for last facility removal.

### Procedure usage (not chained — each is an independent mutation from a separate UI action):
- `updateUserRole` — admin changes the role dropdown next to a facility in the edit modal
- `updateUserProfile` — admin edits name/email fields and hits save in the edit modal
- `addUserToFacility` / `removeUserFromFacility` — admin checks/unchecks a facility checkbox in the edit modal

## Step 3: Frontend — Users page

### 3a. `src/app/(app)/admin/users/page.tsx` — server guard

Copy pattern from `admin/facilities/page.tsx`: `getOnboardedUserOrRedirect()` + `isFacilityOrAbove()` guard.

### 3b. `src/app/(app)/admin/users/UsersClient.tsx` — main component

**State (URL-driven, following VideoCollectionsListing pattern):**
- `searchInput` + `debouncedSearch` (300ms debounce) — synced to URL `?search=`
- `page`, `limit`, `facilityFilter`, `roleFilter` — all from URL params
- `viewMode`: `"table" | "cards"` (local state)
- `isCreateOpen`, `editingUser` for modals

**Data fetching + caching strategy:**
```typescript
const { data, isLoading } = api.user.listClubUsers.useQuery(
  { page, limit, search, facilityId, role },
  { staleTime: 30_000 }  // 30s — cached pages don't refetch on revisit
);

// Prefetch next page for instant forward navigation
useEffect(() => {
  if (data?.pagination.page < data?.pagination.pageCount) {
    void utils.user.listClubUsers.prefetch(
      { page: page + 1, limit, search, facilityId, role },
      { staleTime: 30_000 }
    );
  }
}, [data]);
```

React Query (used by tRPC) caches by query key. Going page 2→3→back to 2 renders from cache instantly. No custom dictionary needed.

**UI layout:**
```
Header: "Users" title + Create User button
Filters: [Search input] [Facility dropdown] [Role dropdown] [Page size] [View toggle]
Content: Table view OR Card/badge view (toggled)
Footer: Pagination (Showing X-Y of Z, Prev/Next, page number)
```

**Table view columns:** Name | Email | Role(s) as color-coded badges | Facilities | Edit button

**Card view:** Cards with name, email, role badges. Color coding: STUDENT=gray, COACH=blue, FACILITY=green, CLUB_ADMIN=purple, PLATFORM_ADMIN=red.

**Reuse patterns from:**
- `VideoCollectionsListing.tsx` — debounced search, URL sync, pagination, page size selector
- `CoachesListing.tsx` — pagination buttons
- `CoachCard.tsx` — badge/pill styling (`rounded-full bg-gray-100 px-2 py-1 text-xs`)

### 3c. Create User Modal

Uses `Dialog` from `~/app/_components/shared/dialog.tsx`.

Fields: firstName, lastName, email (`<Input>`), role (select from `assignableRoles(user.userType)` imported from `~/lib/utils`), facility (select from club facilities).

Calls `api.user.createUser.useMutation()`, invalidates `listClubUsers` on success.

### 3d. Edit User Modal

Uses `Dialog`. Accessible to FACILITY/CLUB_ADMIN/PLATFORM_ADMIN (all can edit profiles and facility assignments).

**Profile section:** firstName, lastName, email fields. Save calls `updateUserProfile`.

**Facility & Roles section:** Multi-select checklist of all club facilities. Each checked facility shows a role dropdown (filtered by `assignableRoles(caller.userType)`). Checking a facility calls `addUserToFacility`. Unchecking calls `removeUserFromFacility`. Changing a role dropdown calls `updateUserRole`.

## Step 4: No changes needed

- Nav: "Users" link already in `SideNavigation.tsx` (line 154-161) and `admin/page.tsx` quick links
- Router registration: procedures added to existing `userRouter`, already in `root.ts`

## Follow-up: Extract reusable components (not in this PR)

After Phase 2 ships, extract common patterns across CoachesListing, VideoCollectionsListing, and UsersClient:
- `<PaginatedControls>` — "Showing X-Y of Z", prev/next buttons, page size selector
- `<DebouncedSearchInput>` — search icon input with debounce + URL sync
- `<FilterBar>` — generic dropdown filter row

This would deduplicate ~50 lines per page that currently repeats.

## Implementation Order

1. Step 1 — move shared utils (small, safe)
2. Step 2a — `listClubUsers` query
3. Step 3a+3b — page guard + UsersClient with table, search, filters, pagination
4. Step 2b + 3c — `createUser` + CreateUserModal
5. Steps 2c-2f + 3d — role/profile/facility mutations + EditUserModal
6. Card/badge view toggle + polish

## Verification

- TypeScript: `npx tsc --noEmit` passes
- Create user flow: admin creates user → appears in list → Clerk account created
- Existing email flow: admin enters existing email → user gets added to club (no duplicate)
- Role ceiling: FACILITY cannot assign FACILITY or above
- Role update safety: changing role at facility X doesn't affect user's role at club Y
- Search: typeahead finds users by partial name/email
- Filters: facility and role dropdowns filter correctly
- Pagination: page nav works, back button renders from cache, next page prefetched
- Edit modal: profile changes persist, role changes update UserClub + User.userType (only when safe)
- Facility checklist: add/remove facilities works for FACILITY+ users, last facility removal allowed
- View toggle: table ↔ card view works

## Settled Decisions

1. **`listClubUsers` row shape:** One row per user, all facility roles inline. Scoped to caller's club.
2. **`createUser` minimum input:** firstName, lastName, email, role, facilityId.
3. **`createUser` existing email:** Find existing Clerk user → find local User → just add UserClub row.
4. **Role ceiling:** PLATFORM_ADMIN→CLUB_ADMIN, CLUB_ADMIN→FACILITY, FACILITY→COACH.
5. **`updateUserRole` safety:** Only sync User.userType when activeFacilityId AND clubShortName both match.
6. **`removeUserFromFacility` last facility:** Let it happen silently.
7. **Pagination:** 10-50 per page, URL-driven, React Query cache + prefetch next page.
8. **View toggle:** Table rows vs badge/card view.
9. **Edit modal facility management:** Multi-select checklist of all club facilities.
10. **Facility management permissions:** `facilityProcedure` — FACILITY users can add/remove users from facilities.
11. **Profile editing:** FACILITY/CLUB_ADMIN/PLATFORM_ADMIN can edit user name/email from edit modal.
12. **Common components follow-up:** Extract PaginatedControls, DebouncedSearchInput, FilterBar after Phase 2 ships.
