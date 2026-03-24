# ShuttleMentor — Multi-Club Architecture Design

> **Status**: M1 ✅ done (schema + migration + backfill + `getClubMemberships`). M2 ✅ done (`switchClub` + club switcher in profile + SideNavigation footer). M4 ✅ done (`/join` page). M3 pending (admin invite — blocked on Clerk backend API integration).  
> **Related**: `progressPhase2_5.md` items M1–M4, `progressPhase3.md` (payments).

---

## Problem Statement

Today every `User` row has a single `clubShortName` string column. This means:

- A coach who teaches at two clubs has two separate accounts.
- A facility admin who manages multiple locations is stuck in one club context.
- A student who trains at two clubs cannot link both to the same profile.
- There is no concept of "switching organization context" within a session.

Multi-club support lets one user identity belong to many clubs, with the active club context determining what calendar, resources, video collections, and events they see.

---

## Current Schema (Relevant Excerpt)

```prisma
model User {
  userId        String   @id
  userType      UserType
  clubShortName String?          // denormalized active-club FK — stays as the source of truth
  club          Club?    @relation(fields: [clubShortName], ...)
  ...
}

model Club {
  clubShortName String @id
  clubName      String
  users         User[]
  ...
}
```

Every authorization check today reads `user.clubShortName` and compares it to the resource's club. `isSameClub(userA, userB)` in `server/utils/utils.ts` compares two `clubShortName` strings directly. **This stays unchanged** — club-switching just updates `User.clubShortName` and `User.userType` in-place.

---

## Proposed Schema Changes

### M1 — Add `UserClub` join table

```prisma
model UserClub {
  id            String   @id @default(cuid())
  userId        String
  clubShortName String
  role          UserType  // per-club role — may differ from User.userType
  joinedAt      DateTime  @default(now())

  user  User @relation(fields: [userId], references: [userId], onDelete: Cascade)
  club  Club @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)

  @@unique([userId, clubShortName])
  @@index([userId])
  @@index([clubShortName])
}
```

**Backward compatibility**: `User.clubShortName` and `User.userType` remain the live active-club fields. All existing auth checks continue to work without modification. `UserClub` is the **membership registry** — it records which clubs a user belongs to and what role they hold at each.

**Migration strategy**:
1. Add `UserClub` table via Prisma migration.
2. Backfill: for every existing `User` where `clubShortName IS NOT NULL`, insert one `UserClub` row with `role = user.userType`.
3. No existing application code changes in Phase 1.

---

## ✅ Decision: Active Club Context (Q1 — Answered)

**Chosen approach: update `User` table in-place on club switch.**

When a user switches clubs, call a `user.switchClub` tRPC mutation that:
1. Validates the user has a `UserClub` row for the target club.
2. Updates `User.clubShortName = targetClubShortName`.
3. Updates `User.userType = UserClub.role` for that club.

This reuses the same pattern as the existing admin club-change flow in `user.ts` (`updateProfile` → writes `clubShortName` to the `User` row). **All existing authorization logic reads `user.clubShortName` and `user.userType` directly — zero changes needed downstream.**

The club switcher is a navbar dropdown accessible to any user with >1 `UserClub` entry. After switching, a full page reload (or `router.refresh()`) refreshes all tRPC queries against the new active club.

**No URL-scoped routes, no cookie/session claims, no `getCurrentUser` changes.**

---

## ✅ Decision: Per-Club Roles (Q2 — Answered)

**Yes — users can have different roles at different clubs.**

`UserClub.role` stores the `UserType` for that club (e.g. COACH at Club A, STUDENT at Club B). On switch, `User.userType` is updated to match `UserClub.role` for the target club. Existing role-based guards (`isAdmin`, `staffProcedure`, etc.) continue to work correctly.

---

## ✅ Decision: Video Collections — User-Scoped (Q3 — Answered)

**Video collections remain user-scoped. No club scoping added.**

Rationale: The current permission model (owner `userId`, uploader `uploadedByUserId`, assigned coach `assignedCoachId`) is sufficient. A facility user's collections are already scoped by their identity — when they switch clubs, they will see only the collections they uploaded or that belong to students at their new active club (via `isSameClub` checks where applicable). No schema change needed.

---

## ✅ Decision: Club Membership (Q4 — Answered)

Two paths:

### Path A — Self-join via `/join` page
- Primary way for students/coaches to find and join a club manually.
- User searches for club by name or short code.
- Membership contracts will gate access in a future phase (deferred).
- Current restriction (only `default-club-001` users can change club via profile page) can be relaxed once `UserClub` is in place — the self-join page handles it directly.

### Path B — Admin/Facility invite
- Admins or facility users can add new members with **minimum info: first name, last name, email**.
- Implementation: use **Clerk's backend API** (`POST /v1/invitations` or `clerkClient.users.createUser`) to create a Clerk user account, then insert a `User` row + `UserClub` row in the DB.
- The new member receives an invite email from Clerk; on first sign-in `getOrCreateProfile` provisions their full profile.
- Relevant Clerk docs: [Create user](https://clerk.com/docs/reference/backend-api/tag/Users#operation/CreateUser), [Invitations](https://clerk.com/docs/reference/backend-api/tag/Invitations).
- New tRPC procedure: `admin.inviteMember` — input: `{ firstName, lastName, email, clubShortName, role }`.

---

## ✅ Decision: Public Calendar (Q5 — Answered)

The public calendar (`/club/[clubShortName]/calendar`) and embeddable widget (`/embed/[clubShortName]/calendar`) are already URL-scoped by `clubShortName` and use `publicProcedure` — no auth required. Multi-club has zero impact here. No changes needed.

---

## ✅ Decision: Payments Club-Scoping (Q6 — Answered)

**Details needed before deciding.**

Key questions to answer before Phase 3 payment work:
- Does each club have its own Polar account/workspace, or is there one Polar account for the platform?
- Are products (coaching sessions, memberships) priced per-club or globally?
- When a student switches clubs, do their existing purchases transfer or stay with the originating club?

> **TODO for user**: Clarify the Polar account structure (one per club vs one platform-wide).

---

## ✅ Decision: S1 (middleware cleanup) — Deferred

Not blocking any other work. Will surface as a to-do in future sessions.

---

## New tRPC Procedures

| Procedure | Auth | Description |
|-----------|------|-------------|
| `user.switchClub` | `protectedProcedure` | Validates `UserClub` membership, updates `User.clubShortName` + `User.userType` |
| `user.getClubMemberships` | `protectedProcedure` | Returns all `UserClub` rows for current user (for switcher dropdown) |
| `admin.inviteMember` | `staffProcedure` | Creates Clerk user + `User` + `UserClub` row; sends invite email |
| `admin.removeUserFromClub` | `staffProcedure` | Deletes `UserClub` row; optionally resets `User.clubShortName` if it was the active club |
| `admin.updateMemberRole` | `staffProcedure` | Updates `UserClub.role` for a given user+club; updates `User.userType` if that club is currently active |

---

## `user.switchClub` — Implementation Sketch

```ts
switchClub: protectedProcedure
  .input(z.object({ clubShortName: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const user = await getCurrentUser(ctx);
    const membership = await ctx.db.userClub.findUnique({
      where: { userId_clubShortName: { userId: user.userId, clubShortName: input.clubShortName } },
    });
    if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this club." });

    await ctx.db.user.update({
      where: { userId: user.userId },
      data: { clubShortName: input.clubShortName, userType: membership.role },
    });
  }),
```

On the frontend, after `switchClub` succeeds: `router.refresh()` to re-run all server components and invalidate tRPC cache.

---

## UI Changes

### Navbar club switcher (M2)
- Visible to any user with >1 `UserClub` entry (from `user.getClubMemberships`).
- Dropdown shows all clubs user belongs to; current active club highlighted.
- Selecting a new club calls `user.switchClub`, then `router.refresh()`.
- Single-club users: show club name as plain text (no dropdown).

### `/join` page (M2) — self-join flow
- **Primary path** for students/coaches to find and join a club.
- Search clubs by name or short code.
- Joining creates a `UserClub` row immediately (membership contracts/approval gating deferred to a future phase).
- Not the same as the profile page switcher — `/join` is for joining a new club; the profile dropdown is for switching between clubs already joined.

### Admin invite flow (M3)
- Within `/admin/members` or a modal: "Invite Member" button.
- Form: first name, last name, email, role selector.
- Calls `admin.inviteMember` → Clerk creates account + invite email.

### Profile page (M2 — reuse existing admin pattern)
- Non-admins can switch active club from the profile page **the same way admins currently do**.
- Existing `getAvailableClubs` + `updateProfile` pattern is reused; the only gate change is relaxing the `default-club-001` restriction to instead validate against `UserClub` memberships.
- Shows a dropdown of clubs the user belongs to (from `getClubMemberships`); selecting one calls `user.switchClub` → `router.refresh()`.
- Single-club users see a read-only club name (no dropdown).

---

## Calendar & Resource Scoping

No changes needed. Resources and events are already scoped by `CalendarResource.clubShortName` / `CalendarEvent.clubShortName`. After switching active club, existing queries filter by `user.clubShortName` automatically.

---

## Migration Plan

### Phase 1 — Schema + Backfill (M1) ← **Ready to implement**
1. Add `UserClub` model to `prisma/schema.prisma`.
2. Write Prisma migration.
3. Run backfill: insert `UserClub` rows for all existing `User` rows with a `clubShortName`.
4. Add `user.getClubMemberships` procedure.
5. No UI or behavior changes.

### Phase 2 — Club Switcher + Join Page (M2)
1. Add `user.switchClub` procedure.
2. Build navbar club switcher dropdown (only shown when memberships > 1).
3. Build `/join` page for self-join flow.
4. Relax profile page club-change restriction (allow any user to change via switcher).

### Phase 3 — Admin Invite + Role Management (M3)
1. Add `admin.inviteMember` using Clerk backend API.
2. Add `admin.removeUserFromClub` and `admin.updateMemberRole`.
3. Build admin invite UI in `/admin/members`.
4. Replace free-text club field on profile page.

---

## Files Affected

| File | Phase | Change |
|------|-------|--------|
| `prisma/schema.prisma` | M1 | Add `UserClub` model |
| `prisma/migrations/` | M1 | Migration + backfill script |
| `server/api/routers/user.ts` | M1/M2 | Add `getClubMemberships`, `switchClub`; relax club-change restriction |
| `server/api/routers/admin.ts` | M3 | Add `inviteMember`, `removeUserFromClub`, `updateMemberRole` |
| `app/_components/shared/NavBar.tsx` | M2 | Club switcher dropdown |
| `app/(app)/join/page.tsx` | M2 | New self-join page |
| `app/(app)/profile/` | M3 | Replace free-text club input |
| `app/(app)/admin/members/` | M3 | Invite member UI |
