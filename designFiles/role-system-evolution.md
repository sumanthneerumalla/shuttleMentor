# Role System Evolution: PLATFORM_ADMIN + CLUB_ADMIN

## Context

The current role system has 4 roles (STUDENT, COACH, ADMIN, FACILITY) where ADMIN is overloaded — it serves as both platform owner and club administrator. We need to split this into a clear hierarchy so club owners can manage their facilities and staff without having platform-level powers. This also enables the user management feature (M3) where admins/staff can create and invite users.

## Role Hierarchy (New)

| Role | Scope | Can Assign | Can Manage |
|------|-------|-----------|------------|
| PLATFORM_ADMIN | All clubs/facilities | Any role | Everything + DB access |
| CLUB_ADMIN | Own club's facilities (via UserClub) | Up to FACILITY | Facilities, resources, events, users, products |
| FACILITY | Own facilities (via UserClub) | STUDENT, COACH | Resources, events, products |
| COACH | Own facilities (via UserClub) | — | Own coaching slots |
| STUDENT | Own facilities (via UserClub) | — | Own collections, registrations |

Key rules:
- PLATFORM_ADMIN bypasses all club/facility scoping.
- CLUB_ADMIN is scoped to their UserClub memberships only.
- CLUB_ADMIN can create all event types including COACHING_SLOT (supports solo online coaches who are both admin and coach).
- CLUB_ADMIN sees both student and coach profiles (settled decision).

## Phase 1: Schema + Migration + Backend (ship together)

### 1a. Prisma Schema
**File:** `prisma/schema.prisma`

Change UserType enum:
```
STUDENT → STUDENT (no change)
COACH → COACH (no change)
ADMIN → remove (after backfill)
FACILITY → FACILITY (no change)
+ PLATFORM_ADMIN (new)
+ CLUB_ADMIN (new)
```

### 1b. Migration SQL
- `ALTER TYPE "UserType" ADD VALUE 'PLATFORM_ADMIN'`
- `ALTER TYPE "UserType" ADD VALUE 'CLUB_ADMIN'`
- Backfill: `UPDATE "User" SET "userType" = 'PLATFORM_ADMIN' WHERE "userType" = 'ADMIN'`
- Backfill: `UPDATE "UserClub" SET "role" = 'PLATFORM_ADMIN' WHERE "role" = 'ADMIN'`
- Note: `ALTER TYPE ADD VALUE` cannot run in a transaction — needs custom migration handling

### 1c. Backend Auth Helpers
**File:** `src/server/utils/utils.ts`

New helpers:
- `isPlatformAdmin(user)` — replaces `isAdmin()`
- `isClubAdmin(user)`
- `isAnyAdmin(user)` — PLATFORM_ADMIN or CLUB_ADMIN
- `isFacilityOrAbove(user)` — FACILITY, CLUB_ADMIN, or PLATFORM_ADMIN
- `isStaffOrAbove(user)` — above + COACH
- `canAssignRole(assignerType, targetRole)` — role ceiling enforcement
- `assignableRoles(callerType)` — returns list of roles caller can assign
- Keep `isAdmin()` temporarily as alias for `isPlatformAdmin()` with `@deprecated`

Role hierarchy constant:
```typescript
ROLE_HIERARCHY = { STUDENT: 0, COACH: 1, FACILITY: 2, CLUB_ADMIN: 3, PLATFORM_ADMIN: 4 }
```

### 1d. Procedure Middleware
**File:** `src/server/api/trpc.ts`

| Procedure | Current Gate | New Gate |
|-----------|------------|---------|
| adminProcedure | ADMIN | PLATFORM_ADMIN only |
| clubAdminProcedure | (new) | PLATFORM_ADMIN or CLUB_ADMIN |
| facilityProcedure | FACILITY or ADMIN | FACILITY, CLUB_ADMIN, or PLATFORM_ADMIN |
| staffProcedure | FACILITY, ADMIN, or COACH | FACILITY, CLUB_ADMIN, PLATFORM_ADMIN, or COACH |
| coachProcedure | COACH | COACH only (no change) |

### 1e. Router Updates

**Files to update (every `UserType.ADMIN` and `isAdmin()` reference):**
- `src/server/api/routers/user.ts` — profile creation, switchClub bypass, getAvailableClubs scope
- `src/server/api/routers/calendar.ts` — isFacilityOrAdmin inline checks → use `isFacilityOrAbove()`
- `src/server/api/routers/videoCollection.ts` — collection visibility scoping
- `src/server/api/routers/coachingNotes.ts` — coaching privilege check
- `src/server/api/routers/products.ts` — product CRUD gates
- `src/server/api/routers/coaches.ts` — coach listing filter

Key behavior change: `requireSameClub()` uses `isPlatformAdmin()` (not `isAnyAdmin`) for the bypass — CLUB_ADMIN must stay within their club scope.

### 1f. Frontend Component Updates

Every file with `UserType.ADMIN` or `userType === "ADMIN"`:
- `SideNavigation.tsx` — ALL_TYPES array, navItem userTypes arrays
- `CalendarClient.tsx` — isFacilityOrAdmin inline check
- `EventFormModal.tsx` — role checks
- `EventDetailClient.tsx` — role checks
- `ProductsClient.tsx` — role checks
- `admin/page.tsx`, `admin/facilities/page.tsx`, `calendar/resources/page.tsx` — server guards
- `DashboardClient.tsx`, `HomeClient.tsx`, `profile/page.tsx` — ADMIN rendering
- `VideoCollectionDisplay.tsx`, `VideoCollectionsListing.tsx`, `VideoCollectionForm.tsx` — ADMIN checks
- `CoachingNoteModal.tsx`, `CoachingNotesList.tsx` — ADMIN checks
- `MobileAuthedHeader.tsx` — no direct ADMIN check but uses user.userType

## Phase 2: User Management Page (after Phase 1 is stable)

### 2a. New tRPC Procedures
**File:** `src/server/api/routers/user.ts`

- `listClubUsers` — gated by `facilityProcedure`. Returns users in caller's club with per-facility roles.
- `createUser` — gated by `facilityProcedure` (FACILITY, CLUB_ADMIN, PLATFORM_ADMIN).
  1. Calls `clerkClient.users.createUser({ emailAddress, firstName, lastName, skipPasswordRequirement: true })` → gets `clerkUserId` immediately
  2. Creates shuttlementor `User` row with the `clerkUserId`
  3. Creates `UserClub` row(s) for specified facility with assigned role
  4. Role ceiling enforced via `canAssignRole()` — FACILITY can assign STUDENT/COACH, CLUB_ADMIN up to FACILITY
  5. Clerk sends welcome email, user sets password on first login
  - No PendingInvitation table needed.
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
- Redirects to facility setup / onboarding

**New page:** `/create-club` — form for club name, optional facility details

This enables online coaches to self-serve: create club → set up facility → create coaching slots.

## Phase 4: User Tags (for grouping/email)

### Schema
**File:** `prisma/schema.prisma`

```
model UserTag {
  id            String   @id @default(cuid())
  clubShortName String
  name          String   @db.VarChar(100)  // e.g. "Adults", "Kids", "League Player"
  color         String?  @db.VarChar(20)

  club  Club  @relation(...)
  users UserClubTag[]  // many-to-many through join table

  @@unique([clubShortName, name])
  @@index([clubShortName])
}

model UserClubTag {
  id        String @id @default(cuid())
  userClubId String  // the UserClub membership row
  tagId     String

  userClub UserClub @relation(...)
  tag      UserTag  @relation(...)

  @@unique([userClubId, tagId])
}
```

Tags are per-club (not per-facility). Applied to UserClub memberships so a user can have different tags at different clubs. Enables future email targeting: "send to all users tagged 'Adults' at facility X".

### Procedures (add to user.ts)
- `createTag` — gated by `facilityProcedure`
- `listTags` — gated by `protectedProcedure`
- `tagUser` / `untagUser` — gated by `facilityProcedure`
- `getUsersByTag` — gated by `facilityProcedure` (for future email feature)

### UI
- Tag management on admin users page (pill badges, add/remove)
- Tag filter on user list

## Coach Profile Toggle

### Schema
**File:** `prisma/schema.prisma` — add to CoachProfile:
```
isPublic Boolean @default(true) // Allows admins to hide/show their coach profile
```

### Behavior
- CLUB_ADMIN and PLATFORM_ADMIN can toggle their own coach profile visibility
- When `isPublic = false`, profile hidden from coach listings and public pages
- Profile still accessible to the user themselves and platform admin

## Settled Decisions

1. **Clerk integration:** Use `clerkClient.users.createUser()` directly — creates Clerk account immediately, returns `clerkUserId`, user sets password on first login. No PendingInvitation table needed.
2. **CLUB_ADMIN profile visibility:** Yes, both profiles — same as PLATFORM_ADMIN.
3. **CLUB_ADMIN coaching slots:** Yes — can create all event types including COACHING_SLOT.
4. **Phase 1b timing:** Ship with Phase 1 if safe, otherwise separate deploy.

## Implementation Guidelines

- **Minimize code:** Reuse existing helpers, components, and patterns. Don't create new abstractions when existing ones work.
- **Review before commit:** Every commit must be preceded by a code review checking: clean design, no dead code, reusable modules in correct locations, consistent patterns.
- **Commit summary:** Each commit message must be accompanied by a checklist of what was completed from the plan.
- **Persist progress:** This plan document lives in `designFiles/` and is committed to track progress. Check off items as completed.

## Progress Checklist

### Phase 1: Schema + Backend
- [ ] 1a. Update UserType enum in schema
- [ ] 1b. Migration SQL (add PLATFORM_ADMIN, CLUB_ADMIN, backfill)
- [ ] 1c. Backend auth helpers (isPlatformAdmin, isClubAdmin, isFacilityOrAbove, canAssignRole)
- [ ] 1d. Procedure middleware (adminProcedure, clubAdminProcedure, facilityProcedure, staffProcedure)
- [ ] 1e. Router updates (user.ts, calendar.ts, videoCollection.ts, coachingNotes.ts, products.ts, coaches.ts)
- [ ] 1f. Frontend component updates (SideNavigation, CalendarClient, EventFormModal, admin pages, etc.)
- [ ] 1g. Remove old ADMIN enum value (Phase 1b)

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
- [ ] CoachProfile.isPublic column + migration
- [ ] Toggle UI for admins
- [ ] Filter coach listings by isPublic

## Verification

- [ ] All existing ADMIN users become PLATFORM_ADMIN after migration
- [ ] PLATFORM_ADMIN retains all current superpowers (cross-club access, DB studio)
- [ ] CLUB_ADMIN can manage facilities/resources/events/users within their club only
- [ ] CLUB_ADMIN cannot access other clubs, cannot assign CLUB_ADMIN or PLATFORM_ADMIN roles
- [ ] FACILITY can create STUDENT and COACH users
- [ ] TypeScript compiles clean (no unhandled enum cases)
- [ ] All server guards updated — no leftover `UserType.ADMIN` references
