# Role System Evolution: PLATFORM_ADMIN + CLUB_ADMIN

## Context

The current role system has 4 roles (STUDENT, COACH, ADMIN, FACILITY) where ADMIN is overloaded — it serves as both platform owner and club administrator. We need to split this into a clear hierarchy so club owners can manage their facilities and staff without having platform-level powers. This also enables the user management feature (M3) where admins/staff can create and invite users.

## Role Hierarchy (New)

| Role | Scope | Can Assign | Can Manage |
|------|-------|-----------|------------|
| PLATFORM_ADMIN | All clubs/facilities | Any role | Everything + DB access |
| CLUB_ADMIN | Own club's facilities (via UserClub) | Up to FACILITY | Facilities, resources, events, users, products, coaching slots |
| FACILITY | Own facilities (via UserClub) | STUDENT, COACH | Resources, events, products |
| COACH | Own facilities (via UserClub) | — | Own coaching slots |
| STUDENT | Own facilities (via UserClub) | — | Own collections, registrations |

Key rules:
- PLATFORM_ADMIN bypasses all club/facility scoping.
- CLUB_ADMIN is scoped to their UserClub memberships only — **never** bypasses club scoping.
- CLUB_ADMIN can create all event types including COACHING_SLOT.
- CLUB_ADMIN sees both student and coach profiles.
- CLUB_ADMIN can edit/delete collections, assign coaches — within their club only.
- CLUB_ADMIN and PLATFORM_ADMIN appear in coach listings if they have a coach profile.

## Scoping Rules (Critical)

Any function that checks "is this user allowed to bypass club scoping?" must use `isPlatformAdmin()`, NOT `isAnyAdmin()`. `isAnyAdmin()` is for feature access (can this user see admin UI?), not scope bypass.

| Helper | Meaning | Use for |
|--------|---------|---------|
| `isPlatformAdmin()` | Platform owner only | Club scoping bypass, DB access, cross-club operations |
| `isClubAdmin()` | Club owner only | Rarely used alone |
| `isAnyAdmin()` | Either admin type | Feature access (admin dashboard, both profiles, admin UI sections) |
| `isFacilityOrAbove()` | FACILITY + CLUB_ADMIN + PLATFORM_ADMIN | Resource/event/product management gates |
| `isStaffOrAbove()` | Above + COACH | Event creation (any type) |
| `hasCoachingAccess()` | COACH + CLUB_ADMIN + PLATFORM_ADMIN | Coaching notes, dashboard metrics, media access |

All helpers live in `src/lib/utils.ts` (client-safe). `src/server/utils/utils.ts` re-exports them.

## Phase 1: Schema + Migration + Backend

### 1a. Prisma Schema — ✅ DONE
**File:** `prisma/schema.prisma`
- Enum changed: removed `ADMIN`, added `PLATFORM_ADMIN` and `CLUB_ADMIN`

### 1b. Migration SQL — ✅ DONE
**File:** `prisma/migrations/20260325000000_role_system_evolution/migration.sql`
- Creates new enum type, converts columns to text, backfills ADMIN→PLATFORM_ADMIN, converts to new enum, drops old
- Already applied to local dev DB

### 1c. Backend Auth Helpers — ✅ DONE
**File:** `src/lib/utils.ts` — role helpers defined here (client-safe)
**File:** `src/server/utils/utils.ts` — re-exports from lib, plus `isAdmin()` deprecated alias

### 1d. Procedure Middleware — ✅ DONE
**File:** `src/server/api/trpc.ts`
- `adminProcedure` → PLATFORM_ADMIN only
- `clubAdminProcedure` → new, PLATFORM_ADMIN or CLUB_ADMIN
- `facilityProcedure` → FACILITY, CLUB_ADMIN, or PLATFORM_ADMIN
- `staffProcedure` → above + COACH
- `coachProcedure` → COACH only (unchanged)
- Added `requireRole()` internal helper to reduce duplication

### 1e. Router Updates — ✅ DONE

**Already committed (`phase 1e` commit):**
- Initial ADMIN → PLATFORM_ADMIN replacement across all routers

**Uncommitted fixes still needed:**

#### `src/server/api/routers/calendar.ts` — ✅ FIXED (uncommitted)
- Import updated: uses `isAnyAdmin, isFacilityOrAbove, isPlatformAdmin, isSameClub`
- All 6 inline `isFacilityOrAdmin` checks replaced with `isFacilityOrAbove(user)`
- `requireSameClub()` uses `isPlatformAdmin()` (not isAnyAdmin) for club bypass

#### `src/server/api/routers/user.ts` — ✅ FIXED (uncommitted)
- Import updated: uses `isAnyAdmin, isPlatformAdmin`
- `getOrCreateProfile` line 302: `isAnyAdmin(user)` for dual profile creation
- `switchUserType` line 512: added `|| input.userType === UserType.CLUB_ADMIN` for dual profiles
- `getCoachDashboardMetrics` line 702: `!isAnyAdmin(user)` for access check
- `updateProfile` club change: `isPlatformAdmin(currentUser)` (club bypass)
- `getAvailableClubs` scope=all: `isPlatformAdmin(user)` (club bypass)

#### `src/server/api/routers/videoCollection.ts` — ✅ FIXED (uncommitted)
- Import updated: uses `isAnyAdmin, isClubAdmin, isFacilityOrAbove, isPlatformAdmin, isSameClub`
- `buildUserCollectionWhere`: CLUB_ADMIN case added with club scoping (`user.clubShortName` filter)
- `eligibleVideoCollectionOwners` gate: uses `isFacilityOrAbove(user)`
- `getAllMediaForCoaches`: 3-tier ternary — PLATFORM_ADMIN sees all, CLUB_ADMIN sees their club, COACH sees assigned only
- `updateVideoCollection`: `isClubAdminSameClub` added to `canEdit` check; query selects `user.clubShortName`
- `deleteCollection`: `userIsAdmin` uses `isPlatformAdmin || isClubAdmin+isSameClub`; query includes `user.clubShortName`
- `addMedia`: same pattern; query includes `user.clubShortName`
- `deleteMedia`: same pattern; query includes `collection.user.clubShortName`
- `assignCoach`: `isClubAdminSameClub` added to auth check (query already included `user.clubShortName`)

#### `src/server/api/routers/coachingNotes.ts` — ✅ FIXED (uncommitted)
- `hasCoachingPrivileges`: includes CLUB_ADMIN
- Admin override checks: uses `!isAnyAdmin(user)`

#### `src/server/api/routers/coaches.ts` — ✅ FIXED (uncommitted)
- Coach listing queries: include CLUB_ADMIN in `in: ["COACH", "CLUB_ADMIN", "PLATFORM_ADMIN"]`
- Validation filter: includes CLUB_ADMIN

#### `src/server/api/routers/products.ts` — ✅ FIXED (uncommitted)
- Club bypass check: uses `isPlatformAdmin(ctx.user)` (correct — CLUB_ADMIN doesn't bypass club scoping, they're already in the same club via facilityProcedure)

### 1f. Frontend Component Updates — ⚠️ IN PROGRESS

**Pattern: all frontend inline role checks should use helpers from `~/lib/utils`**

| File | Status | Helper Used |
|------|--------|-------------|
| `CalendarClient.tsx` | ✅ Fixed | `isFacilityOrAbove` |
| `EventFormModal.tsx` | ✅ Fixed | `isFacilityOrAbove` |
| `EventDetailClient.tsx` | ✅ Fixed | `isFacilityOrAbove` |
| `ProductsClient.tsx` | ✅ Fixed | `isFacilityOrAbove` |
| `DashboardClient.tsx` | ✅ Fixed | `hasCoachingAccess`, `isAnyAdmin` |
| `HomeClient.tsx` | ✅ Fixed | `isAnyAdmin` |
| `coaches/[username]/page.tsx` | ✅ Fixed | `isAnyAdmin` |
| `profile/page.tsx` | ✅ Fixed | `isAnyAdmin` |
| `VideoCollectionDisplay.tsx` | ✅ Fixed | `isAnyAdmin` |
| `VideoCollectionForm.tsx` | ✅ Fixed | `isFacilityOrAbove`, `isAnyAdmin` |
| `VideoCollectionsListing.tsx` | ✅ Fixed | `hasCoachingAccess`, `isFacilityOrAbove` |
| `CoachingNoteModal.tsx` | ✅ Fixed | `hasCoachingAccess` |
| `CoachingNotesList.tsx` | ✅ Fixed | `hasCoachingAccess`, `isAnyAdmin` |
| `SideNavigation.tsx` | ✅ Fixed | `CLUB_ADMIN` added to ALL_TYPES and nav arrays |
| `admin/page.tsx` | ✅ Fixed | `isFacilityOrAbove` (server guard) |
| `admin/facilities/page.tsx` | ✅ Fixed | `isFacilityOrAbove` (server guard) |
| `calendar/resources/page.tsx` | ✅ Fixed | `isFacilityOrAbove` (server guard) |

### 1g. Remove old ADMIN enum value — ✅ DONE (in migration)

## Remaining Work Before Commit

### Phase 1 — ✅ COMPLETE

All verification checks passed:
- [x] `npx tsc --noEmit` — 0 errors
- [x] No `"ADMIN"` string literals remain (grep returns 0 results)
- [x] No `UserType.ADMIN` references
- [x] `isAdmin()` only in deprecated alias definition in `utils.ts` (delegates to `isPlatformAdmin`)
- [x] All club-bypass checks use `isPlatformAdmin()`, not `isAnyAdmin()`
- [x] CLUB_ADMIN in videoCollection gets club-scoped access (not global)

## Uncommitted Files (for next agent to review and commit)

```
src/server/api/routers/calendar.ts      — router helper imports + isFacilityOrAbove
src/server/api/routers/user.ts          — isAnyAdmin for profiles, isPlatformAdmin for bypass
src/server/api/routers/videoCollection.ts — CLUB_ADMIN scoping (partially done)
src/server/api/routers/coachingNotes.ts  — CLUB_ADMIN coaching privileges
src/server/api/routers/coaches.ts       — CLUB_ADMIN in coach listings
src/server/api/routers/products.ts      — isPlatformAdmin for club bypass
src/server/utils/utils.ts               — re-exports from lib, club-scoped access fix
src/lib/utils.ts                        — role helpers + hasCoachingAccess
src/app/(app)/calendar/CalendarClient.tsx
src/app/(app)/calendar/EventFormModal.tsx
src/app/(app)/events/[eventId]/EventDetailClient.tsx
src/app/(app)/dashboard/DashboardClient.tsx
src/app/(app)/home/HomeClient.tsx
src/app/(app)/products/ProductsClient.tsx
src/app/(app)/profile/page.tsx
src/app/(app)/coaches/[username]/page.tsx
src/app/(app)/admin/page.tsx
src/app/(app)/admin/facilities/page.tsx
src/app/(app)/calendar/resources/page.tsx
src/app/_components/client/authed/SideNavigation.tsx
src/app/_components/client/authed/VideoCollectionDisplay.tsx
src/app/_components/client/authed/VideoCollectionForm.tsx
src/app/_components/client/authed/CoachingNoteModal.tsx
src/app/_components/client/authed/CoachingNotesList.tsx
src/app/_components/video-collections/VideoCollectionsListing.tsx
prisma/schema.prisma (already committed)
prisma/migrations/20260325000000_role_system_evolution/ (already committed)
prisma/scripts/create-admin-user.js
designFiles/role-system-evolution.md
```

## Phase 2: User Management Page (not started)

### 2a. New tRPC Procedures
**File:** `src/server/api/routers/user.ts`

- `listClubUsers` — gated by `facilityProcedure`. Returns users in caller's club with per-facility roles.
- `createUser` — gated by `facilityProcedure` (FACILITY, CLUB_ADMIN, PLATFORM_ADMIN).
  1. Calls `clerkClient.users.createUser({ emailAddress, firstName, lastName, skipPasswordRequirement: true })` → gets `clerkUserId` immediately
  2. Creates shuttlementor `User` row with the `clerkUserId`
  3. Creates `UserClub` row(s) for specified facility with assigned role
  4. Role ceiling enforced via `canAssignRole()` — FACILITY can assign STUDENT/COACH, CLUB_ADMIN up to FACILITY
  5. Clerk sends welcome email, user sets password on first login
- `updateUserRole` — gated by `clubAdminProcedure`. Changes UserClub.role. Ceiling enforced.
- `addUserToFacility` — gated by `clubAdminProcedure`. Creates new UserClub row.
- `removeUserFromFacility` — gated by `clubAdminProcedure`. Deletes UserClub row (NOT user deletion).

### 2b. Admin Users Page
- `src/app/(app)/admin/users/page.tsx` — server guard (FACILITY/CLUB_ADMIN/PLATFORM_ADMIN)
- `src/app/(app)/admin/users/UsersClient.tsx` — user list table, create user modal, role edit, facility assignment

## Phase 3b: "Create My Club" Flow (Online Coach Support)

No schema changes needed — uses existing Club, ClubFacility, UserClub models.

**New procedure:** `createMyClub` — gated by `protectedProcedure` (any authenticated user)
- Creates Club row with user-chosen name/shortname
- Creates default ClubFacility ("Main")
- Creates UserClub row with CLUB_ADMIN role
- Sets User.clubShortName and activeFacilityId

**New page:** `/create-club` — form for club name, optional facility details

## Phase 4: User Tags (for grouping/email)

### Schema
**File:** `prisma/schema.prisma`

```
model UserTag {
  id            String   @id @default(cuid())
  clubShortName String
  name          String   @db.VarChar(100)
  color         String?  @db.VarChar(20)
  club  Club  @relation(...)
  users UserClubTag[]
  @@unique([clubShortName, name])
  @@index([clubShortName])
}

model UserClubTag {
  id         String @id @default(cuid())
  userClubId String
  tagId      String
  userClub UserClub @relation(...)
  tag      UserTag  @relation(...)
  @@unique([userClubId, tagId])
}
```

## Coach Profile Toggle

Add to CoachProfile:
- `isActive Boolean @default(true)` — single flag controlling both assignability and public listing visibility. When false: excluded from `assignCoach` validation and hidden from coach listing queries. Toggleable by CLUB_ADMIN (own club) and PLATFORM_ADMIN.

Current interim behavior (until `isActive` is added): coachProfile existence is used as the gate.

`isPublic` was considered but dropped — `isActive` covers both use cases (internal assignability + public discoverability). Add a separate visibility flag later only if the two need to diverge.

## Settled Decisions

1. **Clerk integration:** Use `clerkClient.users.createUser()` directly — no PendingInvitation table needed.
2. **CLUB_ADMIN profile visibility:** Both profiles, same as PLATFORM_ADMIN.
3. **CLUB_ADMIN coaching slots:** Yes — all event types including COACHING_SLOT.
4. **CLUB_ADMIN in coach listings:** Yes, if they have a coach profile **and** `coachProfile.isActive` is true.
5. **CLUB_ADMIN collection management:** Full admin over their club's collections (edit, delete, assign coaches) — club-scoped only.
6. **Club scoping bypass:** Only PLATFORM_ADMIN. Never CLUB_ADMIN.

## Implementation Guidelines

- **Minimize code:** Use helpers from `~/lib/utils`. No inline role checks.
- **Review before commit:** Check: clean design, no dead code, helpers used consistently.
- **Commit separately:** Schema/migration, then backend routers, then frontend components.
- **Persist progress:** Update this doc after each commit.

## Progress Checklist

### Phase 1: Schema + Backend
- [x] 1a. Update UserType enum in schema
- [x] 1b. Migration SQL (add PLATFORM_ADMIN, CLUB_ADMIN, backfill)
- [x] 1c. Backend auth helpers in lib/utils.ts + server re-exports
- [x] 1d. Procedure middleware (adminProcedure, clubAdminProcedure, facilityProcedure, staffProcedure)
- [x] 1e. Router updates — all routers updated including videoCollection.ts CLUB_ADMIN scoping
- [x] 1f. Frontend component updates — all files updated with helpers
- [x] 1g. Remove old ADMIN enum value (done in migration)

### Phase 2: User Management
- [ ] 2a. tRPC procedures (listClubUsers, createUser, updateUserRole, addUserToFacility, removeUserFromFacility)
- [ ] 2b. Admin users page + client component

### Phase 3: Online Coach Support
- [ ] 3a. createMyClub procedure
- [ ] 3b. /create-club page

### Phase 4: User Tags
- [ ] 4a. UserTag + UserClubTag schema + migration
- [ ] 4b. Tag CRUD procedures
- [ ] 4c. Tag UI on admin users page

### Coach Profile Toggle
- [ ] CoachProfile.isActive column + migration
- [ ] Update `assignCoach` validation to check `coachProfile.isActive` (currently uses coachProfile existence)
- [ ] Update coach listing queries to filter by `isActive`
- [ ] Toggle UI for admins

## Verification

- [ ] All existing ADMIN users become PLATFORM_ADMIN after migration
- [ ] PLATFORM_ADMIN retains all current superpowers (cross-club access, DB studio)
- [ ] CLUB_ADMIN can manage facilities/resources/events/users within their club only
- [ ] CLUB_ADMIN cannot access other clubs, cannot assign CLUB_ADMIN or PLATFORM_ADMIN roles
- [ ] FACILITY can create STUDENT and COACH users
- [ ] TypeScript compiles clean (no unhandled enum cases)
- [ ] All server guards use helpers, no leftover `UserType.ADMIN` or `"ADMIN"` references
- [ ] All club-bypass checks use `isPlatformAdmin()`, not `isAnyAdmin()`
