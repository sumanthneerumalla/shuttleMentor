# 03 — Authenticated Pages Responsive Fixes

This spec covers all pages behind authentication: Dashboard, Profile, Coaches listing, Coach Detail, Video Collections, and the Database admin page. The focus is on layout, grids, tables, and form responsiveness.

---

## 1. Dashboard (`src/app/dashboard/DashboardClient.tsx`)

### Current State (511 lines)

Three dashboard variants rendered by `userType`: Student, Coach, Admin.

#### Stats Grid — ✅ Already Responsive
```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
```
Single column on mobile, good.

#### Student Quick Actions — ✅ Already Responsive
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
```

#### Coach Media Review Table — 🚨 Needs Card-Based Redesign

**Current** (lines 286–381):
```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead>...</thead>
    <tbody>
      {allMedia.map((media) => (
        <tr>
          <td>Student name</td>
          <td>Collection title</td>
          <td>Media title</td>
          <td>Coaching notes count</td>
          <td>Created date</td>
          <td>Actions (View Media, Manage Notes)</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Problem**: 6-column table with `min-w-full` requires horizontal scrolling on mobile. Column headers are unreadable when compressed.

**Proposed Fix**: Replace with a card-based layout that works for both mobile and desktop.

##### Card Layout Design

Each media item becomes a card:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  {allMedia.map((media) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header row: student name + date */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 text-sm">
          {media.collection.user.firstName} {media.collection.user.lastName}
        </span>
        <span className="text-gray-500 text-xs">
          {new Date(media.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Collection & media title */}
      <p className="text-gray-900 font-medium">{media.title}</p>
      <p className="text-gray-600 text-sm">{media.collection.title}</p>
      {media.description && (
        <p className="text-gray-500 text-sm mt-1 truncate">{media.description}</p>
      )}

      {/* Notes count badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {media.coachingNotes?.length || 0} notes
        </span>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
            View Media
          </button>
          <button className="text-green-600 hover:text-green-900 text-sm font-medium">
            Manage Notes
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
```

##### Desktop Investigation

The card layout can **unify mobile and desktop** by using a responsive grid:
- `grid-cols-1` on mobile (stacked cards)
- `md:grid-cols-2` on tablet (2 cards per row)
- `xl:grid-cols-3` on desktop (3 cards per row)

**Pros over table**:
- Scans better — each card is a self-contained unit
- No horizontal scrolling at any breakpoint
- Touch-friendly action buttons
- More visual breathing room

**Cons**:
- Loses the scannable columnar alignment of tables for power users
- Slightly more vertical space usage on desktop

**Recommendation**: Use the card layout for both mobile and desktop. If power users need the table view later, it can be added as a toggle (list/grid view switcher), but the card layout is the better default for this data shape.

#### Admin Dashboard

Renders the coach dashboard below admin-specific stats. Same card-based fix applies since it calls `renderCoachDashboard()`.

---

## 2. Profile Page (`src/app/profile/page.tsx`)

### Current State (511 lines)

Complex form with conditional Student/Coach profile sections.

#### Name Fields — 🚨 Not Responsive

**Current** (around line 100):
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* First Name */}
  {/* Last Name */}
</div>
```

**Fix**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

Mobile: stacked name fields. ≥640px: side-by-side (current).

#### General Profile Container

**Current**:
```tsx
<div className="container mx-auto mt-16 max-w-2xl px-4 py-8">
```

**Fixes**:
- `mt-16` → `mt-14 md:mt-16` (if mobile header is shorter)
- `px-4` is fine for mobile
- `py-8` → `py-4 md:py-8`

#### Button Groups

Profile edit buttons use `flex gap-3`. Verify they don't overflow on narrow screens. If needed:
```tsx
<div className="flex flex-col sm:flex-row gap-3 pt-4">
```

#### Student/Coach Profile Sub-Components

- `src/app/_components/client/StudentProfile.tsx` (220 lines): Forms are single-column, should be fine. Verify `flex gap-2` button rows for tag inputs.
- `src/app/_components/client/CoachProfile.tsx` (419 lines): Same pattern. Verify specialty/teaching style `flex gap-2` input + button rows. On very narrow screens the "Add" button might wrap — this is acceptable with `flex-wrap` or `flex-col sm:flex-row`.

---

## 3. Coaches Listing (`src/app/coaches/page.tsx`)

### Current State (36 lines)

```tsx
<div className="container mx-auto mt-16 px-4 py-8">
  <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
    {/* Sidebar placeholder: lg:col-span-1 */}
    {/* Main content: lg:col-span-3 */}
  </div>
</div>
```

### Issues

- `mt-16` offset — same NavBar height consideration
- Filter sidebar is a placeholder `<aside>` — currently empty, so no mobile issue yet
- Grid uses `lg:grid-cols-4` which means the sidebar only appears on large screens — decent

### CoachesListing Component (`src/app/_components/coaches/CoachesListing.tsx`)

**Sort controls header**:
```tsx
<div className="mb-6 flex items-center justify-between">
  <h2>...</h2>
  <div className="flex items-center gap-2">
    <label>Sort by:</label>
    <select>...</select>
  </div>
</div>
```

**Fix**: On very narrow screens, the heading and sort controls might collide. Add responsive wrapping:
```tsx
<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

**CoachCard grid**: `grid-cols-1 md:grid-cols-2` — ✅ already responsive.

**Pagination controls**: `flex items-center justify-between` — verify at 375px. The prev/next buttons + page info should fit.

---

## 4. Coach Detail (`src/app/coaches/[username]/page.tsx` + `CoachDetail.tsx`)

### Current State

#### Page wrapper (117 lines):
```tsx
<div className="container mx-auto mt-16 max-w-4xl px-4 py-8">
```

Same `mt-16` / `py-8` adjustments as other pages.

#### CoachDetail component (164 lines):

**Header section**: `flex-col items-center md:flex-row md:items-start` — ✅ responsive.

**Rate + action buttons**: `flex-shrink-0 flex-col items-center gap-3` — stacks vertically, fine on mobile. On mobile, this section is below the name/bio (since the parent is `flex-col` on mobile). Verify the buttons are full-width on mobile for better touch targets:
```tsx
<button className="w-full md:w-auto flex items-center justify-center ...">
```

**Details grid**: `grid-cols-1 md:grid-cols-3` — ✅ responsive. Left column (experience, teaching style, reviews) spans 2 on desktop, right column (booking widget, contact) is 1.

### Minor Fixes

- Action buttons (`Book a Session`, `Contact`): Add `w-full md:w-auto` for full-width on mobile
- Specialty badges: `flex-wrap` already applied — ✅ good

---

## 5. Video Collections Page (`src/app/video-collections/page.tsx`)

### Current State (295 lines)

#### Collection grid: ✅ Already Responsive
```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
```

#### Page header
```tsx
<div className="mb-8 flex items-center justify-between">
  <div>
    <h1 className="section-heading">Video Library</h1>
    <p className="section-subheading">...</p>
  </div>
  <a href="/video-collections/create" className="...">
    Create New Collection
  </a>
</div>
```

**Fix**: On mobile, the heading and CTA button may collide. Add responsive stacking:
```tsx
<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
```

And make the create button full-width on mobile:
```tsx
<a className="w-full sm:w-auto text-center ...">
```

#### Collection cards

Each card uses `rounded-lg border p-4` with thumbnail, title, description, and metadata. Verify text truncation works at 375px. The metadata row (`flex items-center justify-between text-sm`) should wrap if needed.

---

## 6. Video Collection Detail (`src/app/_components/client/authed/VideoCollectionDisplay.tsx`)

### Current State (234 lines)

#### Main grid: ✅ Already Responsive
```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  {/* Video player: lg:col-span-2 */}
  {/* Sidebar: lg:col-span-1 */}
</div>
```

Mobile: player on top, sidebar (video list + coach selector) below. Good layout.

#### Video player: ✅ `aspect-video` — responsive by default

#### Video list items
```tsx
<div className="cursor-pointer rounded-lg border p-3 ...">
```

Touch-friendly at 44px+ height. ✅ Good.

### Minor Fixes

- `glass-panel p-6` container: Consider `p-4 md:p-6` for tighter mobile padding

---

## 7. Video Collection Form (`src/app/_components/client/authed/VideoCollectionForm.tsx`)

### Current State (569 lines)

Single-column form layout with `space-y-8`. Already mobile-friendly by default since forms are naturally single-column.

### Minor Fixes

- `glass-panel rounded-lg p-6` → `p-4 md:p-6`
- Video card header `flex items-center justify-between` — verify the "Video {n}" title and trash icon don't collide
- Submit button `flex justify-end` — consider `justify-center sm:justify-end` for mobile centering

---

## 8. Home Page (`src/app/home/HomeClient.tsx`)

### Current State (96 lines)

```tsx
<div className="container mx-auto mt-16 px-4 py-8">
  <div className="mx-auto max-w-5xl">
```

Single-column content with user type conditional sections. Already mobile-friendly.

### Fix

- `mt-16` → `mt-14 md:mt-16`
- `py-8` → `py-4 md:py-8`

---

## 9. Database Admin Page (`src/app/database/page.tsx`)

11-line wrapper with `AdminGuard` + `DatabaseStudio` component. The DatabaseStudio is likely a Prisma Studio embed or similar — out of scope for this migration (admin-only tool).

---

## Summary of Changes by Severity

### Must Fix
- Dashboard coach table → card-based layout (investigate desktop unification)
- Profile name fields grid → responsive stacking
- Video Collections page header → responsive stacking

### Should Fix
- All `mt-16` offsets → responsive values
- All `py-8` / `p-6` containers → responsive padding
- Coach Detail action buttons → full-width on mobile
- CoachesListing sort controls → responsive wrapping

### Nice to Have
- Video Collection Form → tighter mobile padding
- Home page → responsive spacing
- Pagination controls verification

---

## Files Touched

| File | Changes |
|---|---|
| `src/app/dashboard/DashboardClient.tsx` | Replace table with card-based grid layout |
| `src/app/profile/page.tsx` | Responsive name fields grid, spacing |
| `src/app/coaches/page.tsx` | Responsive spacing |
| `src/app/_components/coaches/CoachesListing.tsx` | Responsive sort controls |
| `src/app/_components/coaches/CoachDetail.tsx` | Full-width mobile action buttons |
| `src/app/video-collections/page.tsx` | Responsive page header |
| `src/app/_components/client/authed/VideoCollectionDisplay.tsx` | Responsive padding |
| `src/app/_components/client/authed/VideoCollectionForm.tsx` | Responsive padding |
| `src/app/home/HomeClient.tsx` | Responsive spacing |
| `src/app/coaches/[username]/page.tsx` | Responsive spacing |
| `src/app/video-collections/create/page.tsx` | Responsive spacing |
| `src/app/video-collections/[collectionId]/page.tsx` | Responsive spacing |
