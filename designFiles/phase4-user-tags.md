# Phase 4: User Tags

## Overview

Club admins and facility members can add custom colored tags to users. Tags are managed inline (no separate page) — creation, assignment, and filtering all happen on the Users management tab.

Tags are **per-club** — each club has its own tag pool. Tags are an **admin/facility-only concept** — students and coaches do not see the tags associated with them. Tags are not exposed in any student-facing or coach-facing query.

---

## Tag name rules

- **Case-insensitive** — "beginner" and "Beginner" are the same tag
- **Stored lowercase** in the database
- **Displayed with first letter capitalized** on the frontend
- Max 50 characters
- Spaces and standard punctuation allowed

---

## UI Changes

### 1. Users table enhancements (keep custom table)

Add to the existing HTML `<table>`:
- **Row selection checkboxes** — header checkbox for select-all + per-row checkboxes, managed via `selectedUserIds` state
- **Tag overflow** — show first 2 tag pills per row, then a "+N more" badge. Click "+N" to see all tags in a Radix Popover.

No column sorting in this phase — deferred to later.

### 2. Bulk action toolbar

When rows are selected, show a **bulk action bar** above the table:
- "Apply tag" dropdown — pick a tag to add to all selected users
- Shows count of selected users (e.g. "5 users selected")
- Shows result feedback after apply (e.g. "Added to 6 users, 2 already at tag limit")

### 3. Users table filter bar

- Add a **"Tags" multi-select dropdown** after the Role filter
- Shows all tags for the club with their color dots
- Filters the table to users who have **any** of the selected tags (OR logic)
- **Tag filter is URL-synced** (like search, facility, role) so browser back/forward preserves it
- Uses **shadcn Combobox** (Popover + Command/cmdk)

### 4. Shared `<TagEditor>` component

Extract a reusable `<TagEditor>` component used in both the **Edit User modal** and **Create User modal**:
- Shows existing tags as colored pill badges with an X to remove
- Combobox input to search existing tags or create a new one inline
- When creating a new tag, show a small row of 14 color dots below the tag name input. One is **pre-selected randomly**. User taps a different dot to change.
- Uses **shadcn Combobox** with multi-select + "Create [name]" option at bottom of dropdown (Notion-style, via cmdk CommandItem)
- **Limit: 15 tags per user** — enforce on backend, show remaining count on frontend
- Tag ordering in dropdown: alphabetical

Props: `selectedTagIds`, `onChange(tagIds)`, `clubShortName`

- **Edit User modal** — section below "Facilities & Roles", loads user's existing tags, calls `setUserTags` on save
- **Create User modal** — section below role/facility selection, starts empty, calls `setUserTags` after `createUser` succeeds. If user creation succeeds but `setUserTags` fails, the user is still created and an error toast is shown for the tags.

### 5. Users table rows

- Display colored tag pills in a "Tags" column
- First 2 pills shown, "+N more" badge with Radix Popover showing all tags on click

### 6. Tag management

- **Create** — inline in the `<TagEditor>` Combobox (type name → "Create [name]" option appears at bottom)
- **Remove from one user** — X button on a tag pill in the `<TagEditor>`. Removes the `UserTag` row only; the tag still exists for the club.
- **Manage Tags dialog** — accessed via a "Manage Tags" button near the Tags filter on the Users page. Opens a dialog listing all club tags with:
  - Color dot + tag name (editable inline for club admins)
  - Usage count (e.g. "12 users")
  - Color picker (row of dots) to recolor
  - Delete button with **confirmation dialog**: "Delete '[tag name]'? This will remove it from [N] users." Requires explicit confirm before proceeding.
- Only **club admins+** see the Manage Tags button and can rename/recolor/delete.

---

## Shared Color Palette

Reuse the same 14-color palette from `EventFormModal.tsx` (`COLOR_OPTIONS`). Extract to a shared constant in `src/lib/constants.ts`:

```ts
export const COLOR_OPTIONS = [
  { bg: "#dbeafe", text: "#1e40af", label: "Blue" },
  { bg: "#dcfce7", text: "#166534", label: "Green" },
  { bg: "#f3e8ff", text: "#6b21a8", label: "Purple" },
  { bg: "#fee2e2", text: "#991b1b", label: "Red" },
  { bg: "#fef9c3", text: "#854d0e", label: "Yellow" },
  { bg: "#fce7f3", text: "#9d174d", label: "Pink" },
  { bg: "#e0e7ff", text: "#3730a3", label: "Indigo" },
  { bg: "#fef3c7", text: "#92400e", label: "Amber" },
  { bg: "#d1fae5", text: "#065f46", label: "Emerald" },
  { bg: "#e0f2fe", text: "#0c4a6e", label: "Sky" },
  { bg: "#ede9fe", text: "#4c1d95", label: "Violet" },
  { bg: "#ffe4e6", text: "#9f1239", label: "Rose" },
  { bg: "#ccfbf1", text: "#134e4a", label: "Teal" },
  { bg: "#ffedd5", text: "#7c2d12", label: "Orange" },
];
```

- `EventFormModal.tsx` refactored to import from this shared constant
- When creating a new tag, the frontend picks a **random color** as the default. User can tap a different color dot to change before saving.

---

## Database Changes

### New model: `Tag`

```prisma
model Tag {
  tagId         String    @id @default(cuid())
  clubShortName String
  club          Club      @relation(fields: [clubShortName], references: [clubShortName], onDelete: Cascade)
  name          String    @db.VarChar(50)   // stored lowercase
  bgColor       String    @db.VarChar(20)   // bg hex, e.g. "#dbeafe"
  textColor     String    @db.VarChar(20)   // text hex, e.g. "#1e40af"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  userTags UserTag[]

  @@unique([clubShortName, name])
  @@index([clubShortName])
}
```

### New model: `UserTag`

```prisma
model UserTag {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [userId], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [tagId], onDelete: Cascade)

  @@unique([userId, tagId])
  @@index([userId])
  @@index([tagId])
}
```

### Updated models

- **`User`** — add relation: `userTags UserTag[]`
- **`Club`** — add relation: `tags Tag[]`

---

## API Changes (tRPC)

### New endpoints

| Endpoint | Procedure | Input | Output | Description |
|---|---|---|---|---|
| `listClubTags` | `facilityProcedure` (query) | — | `Tag[]` with `_count.userTags` | Returns all tags for the caller's club, with usage count per tag. Ordered alphabetically. |
| `createTag` | `facilityProcedure` (mutation) | `{ name, bgColor, textColor }` | `Tag` | Creates a new tag. Name stored lowercase. Dedupes by name (case-insensitive via @@unique). **Enforces max 100 tags per club.** |
| `updateTag` | `clubAdminProcedure` (mutation) | `{ tagId, name?, bgColor?, textColor? }` | `Tag` | Rename or recolor a tag. Name lowercased before save. Validates unique name per club. **Validates tag belongs to caller's club.** |
| `deleteTag` | `clubAdminProcedure` (mutation) | `{ tagId }` | — | Deletes a tag + cascades all UserTag rows. **Validates tag belongs to caller's club.** |
| `setUserTags` | `facilityProcedure` (mutation) | `{ userId, tagIds: z.array(z.string()).max(15) }` | — | Replaces a user's tag set. Enforces max 15 tags per user. **Validates: (1) caller outranks target user via `canManageUser`, (2) all tagIds belong to caller's club, (3) target user belongs to caller's club.** |
| `bulkAddTag` | `facilityProcedure` (mutation) | `{ userIds: string[], tagId: string }` | `{ added: number, skipped: number }` | Adds a tag to multiple users. **Rejects with error if any userId is not in caller's club or caller cannot manage that user** (names the specific user). `skipped` = users already at 15-tag limit. Users who already have the tag are silently ignored. **Validates tagId belongs to caller's club.** |

### Modified endpoints

| Endpoint | Change |
|---|---|
| `listClubUsers` | Add optional `tagIds: string[]` input (URL-synced). When present, filter to users with `userTags: { some: { tagId: { in: tagIds } } }` (OR logic). Include `userTags` (with nested `tag`) in the select so the table can render pills. |

---

## Auto-suggest color logic (frontend)

When the user types a new tag name in the Combobox and selects "Create [name]":
1. Show a small inline row of 14 color dots below the tag name input
2. One dot is **pre-selected randomly**
3. User taps a different dot to change
4. The selected `bgColor` + `textColor` are sent to the `createTag` mutation

---

## Permissions

- **Facility+ roles** (FACILITY, CLUB_ADMIN, PLATFORM_ADMIN) can: create tags, assign/remove tags on users they can manage, bulk-add tags
- **Club admins+** can: rename tags, change tag colors, delete tags (via Manage Tags dialog)
- **Students and coaches** cannot see or manage tags (tags are hidden from them entirely — not exposed in any student-facing or coach-facing query)

---

## Implementation Order

1. Extract shared color palette to `src/lib/constants.ts`, refactor `EventFormModal.tsx` to use it
2. Add Prisma models (`Tag`, `UserTag`) + relations + migrate
3. Add tRPC endpoints (`listClubTags`, `createTag`, `updateTag`, `deleteTag`, `setUserTags`, `bulkAddTag`)
4. Update `listClubUsers` to include tags in response + support `tagIds` filter
5. Install shadcn Combobox component (Popover + Command/cmdk)
6. Build `<TagEditor>` component (shared between Create User + Edit User modals)
7. Add `<TagEditor>` to Edit User modal + Create User modal
8. Build Manage Tags dialog (rename, recolor, delete with confirmation)
9. Build tag filter dropdown in Users table filter bar (URL-synced)
10. Add row selection checkboxes to existing Users table
11. Build bulk action toolbar (apply tag to selected users, with added/skipped feedback)
12. Add tag pills + overflow handling to Users table "Tags" column

---

## Verification Checklist

### Tag CRUD
- [ ] Create a tag from the Edit User modal Combobox — name stored lowercase, displayed capitalized
- [ ] Duplicate tag name (same club) is rejected with a clear error
- [ ] Tag color is auto-suggested randomly, can be changed before saving
- [ ] 100-tag-per-club limit enforced (error on 101st)
- [ ] Rename a tag via Manage Tags dialog — all users see the new name
- [ ] Recolor a tag via Manage Tags dialog — all pills update
- [ ] Delete a tag — confirmation shows tag name + affected user count, cascades to all users

### Tag assignment
- [ ] Add tags to a user via Edit User modal TagEditor
- [ ] Remove tags from a user via X on pills in TagEditor
- [ ] 15-tag-per-user limit enforced (backend rejects, frontend shows remaining count)
- [ ] Tags persist after closing and reopening the Edit User modal
- [ ] Add tags during Create User — user created even if tag assignment fails (error toast)
- [ ] Facility user cannot tag a Club Admin (canManageUser check)

### Bulk tagging
- [ ] Select multiple users via checkboxes, apply a tag from bulk toolbar
- [ ] Feedback shows "Added to N users, M already at tag limit"
- [ ] Rejects if any selected user is unmanageable (names the specific user)
- [ ] Rejects if any user is not in caller's club
- [ ] Selection clears on filter/page change, persists on data refetch

### Tag filter
- [ ] Tags filter dropdown shows all club tags with color dots and checkmarks
- [ ] Multi-select filters users by OR logic (any selected tag)
- [ ] Tag filter is URL-synced — survives browser back/forward
- [ ] Changing tag filter resets page to 1

### Table display
- [ ] Tags column shows colored pills with capitalized names
- [ ] Max 2 pills shown, "+N more" badge for overflow
- [ ] Clicking "+N more" opens popover with all tags
- [ ] Popover closes on click outside or Escape

### Permissions
- [ ] Students/coaches see no tag UI anywhere
- [ ] Facility users can create tags, assign/remove tags on users they outrank
- [ ] Club admins+ see Manage Tags button, can rename/recolor/delete
- [ ] Tag data not returned in any student/coach-facing API query

### Manage Tags dialog
- [ ] Lists all tags with color dot, name, usage count
- [ ] Inline rename (click to edit, Enter to save)
- [ ] Color picker row of 14 dots, selected dot highlighted
- [ ] Delete requires confirmation with user count
- [ ] Only accessible to club admins+
