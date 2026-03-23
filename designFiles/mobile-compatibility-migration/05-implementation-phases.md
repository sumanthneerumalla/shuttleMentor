# 05 — Implementation Phases

This spec defines the phased rollout strategy. Each phase produces a **stable checkpoint** — the app is fully functional and testable at the end of every phase. Phases are ordered by dependency: later phases depend on infrastructure established in earlier ones.

---

## Phase Overview

| Phase | Scope | Stable Checkpoint | Est. Effort |
|---|---|---|---|
| **1** | Dependencies + Navigation + Layout | All pages accessible on mobile via hamburger drawer | High | ✅ Done |
| **2** | Landing pages | Public pages look good on mobile | Medium | ✅ Done |
| **3** | Authenticated pages | Core authed flows (dashboard, profile, coaches, videos) work on mobile | Medium | ✅ Done |
| **4** | Shared components + polish | Modals, touch targets, form inputs, global CSS polished | Low–Medium | ✅ Mostly done (see notes) |

---

## Phase 1: Navigation & Layout Foundation

**Goal**: Every page in the app is *accessible* on mobile — users can navigate to any page using a hamburger menu.

### Current state (as of Mar 2026 — after U1 Sidebar migration)

✅ Already done — **no action needed**:
- `sheet.tsx` already installed at `src/app/_components/shared/ui/sheet.tsx` (installed as shadcn Sidebar dependency during U1)
- `SidebarProvider` already wraps authed layout in `AuthedLayout.tsx`
- `SidebarTrigger` already exists in `AuthedLayout.tsx` inside a bare `md:hidden` bar
- `navItems` already at module scope in `SideNavigation.tsx`
- Radix `Collapsible` already handles group open/close (no `openGroups` state)

⚠️ **Remaining Phase 1 work**:

### Steps

1. **Fix `collapsible="none"` bug in `SideNavigation.tsx`** ← _do this first_
   - Remove `collapsible="none"` from `<Sidebar>` — this prop bypasses the mobile Sheet path entirely
   - Add `hidden md:block` to the sidebar wrapper div in `AuthedLayout.tsx`
   - See `01-navigation-and-layout.md` Section 2 for exact diff

2. **Export `navItems` from `SideNavigation.tsx`**
   - Change `const navItems` → `export const navItems` (already at module scope, just needs `export`)
   - Required so `MobileAuthedHeader` can import it for userType filtering

3. **Add `onNavigate` prop to `SideNavigation`**
   - Accept optional `onNavigate?: () => void`
   - Call it **only on leaf `<Link>` nodes** — not on group toggle buttons
   - This closes the Sheet when a leaf nav link is tapped on mobile

4. **Create `MobileAuthedHeader` component**
   - New file: `src/app/_components/client/authed/MobileAuthedHeader.tsx`
   - Contains: `SidebarTrigger` (hamburger), centered **page title** from `PAGE_TITLES` map, Clerk `UserButton`
   - Only visible on `<md` via `md:hidden`
   - Replaces the bare `SidebarTrigger` bar currently in `AuthedLayout.tsx`
   - See `01-navigation-and-layout.md` Section 2C for `PAGE_TITLES` map and `resolvePageTitle` algorithm

5. **Update `AuthedLayout`**
   - Replace bare `SidebarTrigger` bar with `<MobileAuthedHeader user={user} isLoading={isLoading} />`
   - Responsive main content padding: `p-4 md:p-6`
   - Conditional NavBar: hide on authed pages on mobile (Option B from spec)

6. **Update `NavBar` for mobile**
   - File: `src/app/_components/client/public/NavBar.tsx`
   - Add hamburger button: `<button className="md:hidden">` using `Menu` icon from lucide-react
   - Hide desktop nav links: `<nav className="hidden md:flex">`
   - Add Sheet drawer (`sheet.tsx` already installed) with mobile nav links + auth buttons
   - Replicate conditional rendering: full public nav on `"/"` or signed out; Home link when signed in
   - Pass `clubShortName` through to mobile auth buttons
   - **Keep existing NavigationMenu for desktop** — DropdownMenu migration is Phase 2

   > Note: `/coaches/[username]` is **authenticated-only** — no `AuthedLayout` changes needed for this route. `MobileAuthedHeader` will show "Coach Profile" via the `startsWith("/coaches/")` fallback in `PAGE_TITLES`.

### Files Touched
| File | Action |
|---|---|
| ~~`src/app/_components/shared/ui/sheet.tsx`~~ | Already installed ✅ |
| `src/app/_components/client/authed/SideNavigation.tsx` | Remove `collapsible="none"`; export `navItems`; add leaf-only `onNavigate` |
| `src/app/_components/client/authed/MobileAuthedHeader.tsx` | **New file**: `SidebarTrigger` + `PAGE_TITLES` + `UserButton` |
| `src/app/_components/client/layouts/AuthedLayout.tsx` | `hidden md:block` on sidebar wrapper; swap trigger bar for `MobileAuthedHeader`; responsive padding |
| `src/app/_components/client/public/NavBar.tsx` | Hamburger button + Sheet drawer |

### Pre-commit UI test checklist

- [x] **Hydration error gone** ✅
- [x] **Desktop layout unchanged** ✅
- [x] **`collapsible="none"` bug fixed** ✅

### Full Phase 1 testing criteria
- [x] At 375px, public pages show sticky NavBar + hamburger → Sheet with nav links ✅
- [x] At 375px, authed pages show `MobileAuthedHeader` → hamburger opens SideNavigation in Sheet ✅
- [x] Mobile header shows correct page title for all routes in `PAGE_TITLES` map ✅
- [x] Mobile header shows "Video Collection" for `/video-collections/[id]` dynamic routes ✅
- [x] Mobile header shows "Coach Profile" for `/coaches/[username]` routes ✅
- [x] Mobile header falls back to "ShuttleMentor" for unmatched routes ✅
- [x] Tapping a leaf nav link inside Sheet navigates AND closes the Sheet ✅
- [x] At 768px+, desktop navigation completely unchanged ✅
- [x] No horizontal scroll on any page at 375px ✅

### Rollback
Revert the 5 files above. No database or API changes to roll back.

---

## Phase 2: Landing Pages + Desktop Nav Polish

**Goal**: All public-facing pages look polished on mobile. Desktop nav dropdowns migrated to Shadcn DropdownMenu.

**Depends on**: Phase 1 (NavBar mobile hamburger must be working).

### Steps

0. **Install Shadcn DropdownMenu component**
   ```bash
   npx shadcn@latest add dropdown-menu
   ```
   - Generates `src/app/_components/shared/DropdownMenu.tsx`
   - Installs `@radix-ui/react-dropdown-menu`
   - Replace the custom hover menus in `NavBar.tsx` ("How It Works", "Resources") with Shadcn DropdownMenu
   - This is desktop-only polish; mobile uses the Sheet drawer from Phase 1

1. **Fix testimonials grid** in `src/app/page.tsx`
   - `grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - Reduce gap: `gap-8` → `gap-6 md:gap-8`

2. **Fix CTA section padding** in `src/app/page.tsx`
   - `p-16` → `p-8 md:p-16`

3. **Fix section vertical padding** in `src/app/page.tsx`
   - Audit all `py-24` / `py-16` sections
   - Apply `py-12 md:py-24` / `py-10 md:py-16` pattern

4. **Fix Footer grid** in `src/app/_components/client/public/Footer.tsx`
   - `grid-cols-4` → `grid-cols-2 gap-6 md:grid-cols-4 md:gap-8`
   - Fix copyright row: `flex-col items-center md:flex-row md:justify-between`

5. **Verify Hero section** in `src/app/_components/client/public/Hero.tsx`
   - Add `overflow-hidden` to prevent decorative element overflow
   - Verify CTA buttons stack correctly at 375px

6. **Responsive section padding** in Features.tsx and HowItWorks.tsx
   - `py-20` → `py-12 md:py-20` on both `<section>` elements
   - `mb-16` → `mb-8 md:mb-16` on section header `<div>` elements
   - `gap-8` → `gap-6 md:gap-8` on feature/step grids

7. **Fix resources page spacing** in `src/app/resources/getting-started/page.tsx`
   - Responsive `mt` and `py` values

### Files Touched
| File | Action |
|---|---|
| `src/app/_components/shared/DropdownMenu.tsx` | New (generated) |
| `src/app/_components/client/public/NavBar.tsx` | Modified (DropdownMenu migration for desktop) |
| `src/app/page.tsx` | Modified |
| `src/app/_components/client/public/Footer.tsx` | Modified |
| `src/app/_components/client/public/Hero.tsx` | Modified |
| `src/app/_components/server/Features.tsx` | Modified (responsive py, mb, gap) |
| `src/app/_components/server/HowItWorks.tsx` | Modified (responsive py, mb, gap) |
| `src/app/resources/getting-started/page.tsx` | Modified |

### Testing Criteria ✅ Phase 2 Done
- [x] Testimonials are single-column at 375px, 2-col at 768px, 3-col at 1024px+
- [x] Footer is 2×2 at 375px, 4-col at 768px+
- [x] CTA section has comfortable padding at 375px
- [x] No horizontal scroll on landing page at 375px
- [x] All text readable without zooming at 375px
- [x] Resources page videos scale correctly

### Rollback
Revert the 6 files above. All changes are CSS class modifications only.

---

## Phase 3: Authenticated Pages

**Goal**: Dashboard, Profile, Coaches, and Video Collection pages work well on mobile.

**Depends on**: Phase 1 (sidebar drawer must be working for navigation).

### Steps

1. **Dashboard: Replace table with responsive table/cards**
   - File: `src/app/dashboard/DashboardClient.tsx`
   - Desktop: keep table (show at `md+`)
   - Mobile: render cards (show below `md`)
   - Card content: student name, date, collection title, media title, notes count, action buttons

2. **Profile: Fix name fields grid**
   - File: `src/app/profile/page.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
   - Responsive container spacing

3. **Profile sub-components: Verify tag input rows**
   - Files: `CoachProfile.tsx`, `StudentProfile.tsx`
   - Ensure specialty/teaching-style `flex gap-2` input rows wrap on mobile
   - Button groups: `flex-col sm:flex-row`

4. **Coaches listing: Fix sort controls**
   - File: `src/app/_components/coaches/CoachesListing.tsx`
   - `flex items-center justify-between` → `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`

5. **Coach Detail: Full-width mobile action buttons**
   - File: `src/app/_components/coaches/CoachDetail.tsx`
   - Add `w-full md:w-auto` to Book a Session / Contact buttons

6. **Video Collections: Fix page header**
   - File: `src/app/video-collections/page.tsx`
   - Responsive stacking of title + create button

7. **Responsive spacing pass** on authed page containers
   - **Remove `mt-16`** from `src/app/home/HomeClient.tsx` and `src/app/_components/shared/UnauthorizedAccess.tsx` — redundant with `AuthedLayout`'s `pt-16`
   - `py-8` → `py-4 md:py-8`
   - `p-6` → `p-4 md:p-6` on glass-panel containers
   - Note: `coaches/[username]/page.tsx` `mt-16` is handled in Phase 1 (public page fix)

### Files Touched
| File | Action |
|---|---|
| `src/app/dashboard/DashboardClient.tsx` | Major refactor (table → cards) |
| `src/app/profile/page.tsx` | Modified |
| `src/app/_components/client/CoachProfile.tsx` | Modified |
| `src/app/_components/client/StudentProfile.tsx` | Modified |
| `src/app/_components/coaches/CoachesListing.tsx` | Modified |
| `src/app/_components/coaches/CoachDetail.tsx` | Modified |
| `src/app/video-collections/page.tsx` | Modified |
| `src/app/_components/client/authed/VideoCollectionDisplay.tsx` | Modified |
| `src/app/_components/client/authed/VideoCollectionForm.tsx` | Modified |
| `src/app/home/HomeClient.tsx` | Modified (remove redundant mt-16) |
| `src/app/_components/shared/UnauthorizedAccess.tsx` | Modified (remove redundant mt-16) |
| `src/app/coaches/page.tsx` | Modified |
| `src/app/video-collections/create/page.tsx` | Modified |

### Testing Criteria ✅ Phase 3 Done
- [x] Dashboard coach table shows cards on mobile (`< md`), table on desktop (`≥ md`)
- [x] Cards display all necessary info (student, collection, media, notes count, actions)
- [x] Profile name fields stack vertically at 375px
- [x] Coach Detail action buttons are full-width at 375px
- [x] Coaches listing sort controls wrap cleanly at 375px
- [x] Video Collections already responsive — no change needed
- [x] All forms have comfortable padding at 375px
- [x] HomeClient `mt-16` removed; resources page `mt-16` removed

### Rollback
Revert the 13 files above. The dashboard card refactor is the largest change — consider feature-flagging it if needed.

---

## Phase 4: Shared Components & Polish

**Goal**: Final polish pass — modals, touch targets, form inputs, global styles.

**Depends on**: Phases 1–3 (all navigation and page layouts must be stable).

### Steps

1. **Install Shadcn Dialog component**
   ```bash
   npx shadcn@latest add dialog
   ```

2. **CoachingNoteModal → Shadcn Dialog with responsive sizing**
   - File: `src/app/_components/client/authed/CoachingNoteModal.tsx`
   - Replace custom modal with Shadcn Dialog
   - Full-screen on mobile, centered modal on desktop
   - Migrate tab system and scrollable content

3. **Button touch targets**
   - File: `src/app/_components/shared/Button.tsx`
   - Increase `default` size: `h-10` → `h-11` (44px)
   - Increase `sm` size: `h-9` → `h-10` (40px)
   - Add `icon` size variant for icon-only buttons

4. **iOS zoom prevention**
   - File: `src/styles/globals.css`
   - Add media query to set `font-size: 16px` on inputs for `<md` screens

5. **ResourceVideoCard responsive padding**
   - File: `src/app/_components/shared/ResourceVideoCard.tsx`
   - `p-6` → `p-4 md:p-6`

6. **CoachSelector dropdown mobile max-height**
   - File: `src/app/_components/client/authed/CoachSelector.tsx`
   - `max-h-64` → `max-h-48 md:max-h-64`

7. **ProfileImageUploader crop modal → Shadcn Dialog**
   - File: `src/app/_components/shared/ProfileImageUploader.tsx`
   - Replace custom `fixed inset-0` crop modal with Shadcn Dialog
   - Lower priority than CoachingNoteModal — crop modal is small and works acceptably on mobile

8. **Viewport meta tag verification**
   - File: `src/app/layout.tsx`
   - Verify `viewport-fit=cover` for notched devices

9. **Final audit at 375px**
   - Test every page at 375px width
   - Check for horizontal scroll, overflow, truncation, unreadable text
   - Verify all interactive elements have ≥44px touch targets

### Files Touched
| File | Action |
|---|---|
| `src/app/_components/shared/Dialog.tsx` | New (generated) |
| `src/app/_components/client/authed/CoachingNoteModal.tsx` | Major refactor |
| `src/app/_components/shared/Button.tsx` | Modified |
| `src/styles/globals.css` | Modified |
| `src/app/_components/shared/ResourceVideoCard.tsx` | Modified |
| `src/app/_components/client/authed/CoachSelector.tsx` | Modified |
| `src/app/_components/shared/ProfileImageUploader.tsx` | Modified (crop modal → Dialog) |
| `src/app/layout.tsx` | Verified/modified |

### Testing Criteria — Phase 4 Partial
- [ ] CoachingNoteModal full-screen on mobile — deferred (acceptable as-is with `mx-4`)
- [ ] All buttons meet 44px minimum touch target — pending (`Button.tsx` not yet updated)
- [x] No iOS zoom on form input focus — ✅ global CSS fix applied
- [ ] CoachSelector dropdown max-height on mobile — pending
- [ ] ResourceVideoCard padding — pending
- [x] `mx-4` on DialogContent for mobile margins — ✅ done
- [x] No horizontal scroll on any page at 375px — ✅

### Rollback
Revert the 7 files above.

---

## Total Files Changed Across All Phases

| Category | Count |
|---|---|
| New files | 4 (Sheet.tsx, MobileAuthedHeader.tsx, DropdownMenu.tsx, Dialog.tsx) |
| Modified files | ~23 |
| Deleted files | 0 |
| New dependencies | 1 (`@radix-ui/react-dialog` via Shadcn) |

---

## Testing Strategy

### Manual Testing

For each phase, test at these widths using browser DevTools:
- **375px** — iPhone 12/13/14 (minimum supported)
- **390px** — iPhone 14 Pro
- **428px** — iPhone 14 Pro Max
- **768px** — iPad portrait (breakpoint boundary)
- **1024px** — iPad landscape / small laptop
- **1440px** — Desktop (regression check)

### Key Test Flows

1. **Public visitor**: Land on homepage → browse features → find coaches → view coach profile → sign up
2. **Student**: Sign in → dashboard → upload video → view video collection → view coaching notes
3. **Coach**: Sign in → dashboard → review student media → manage coaching notes → edit profile
4. **Admin**: Sign in → admin dashboard → review media → database page

### Automated Testing (Optional)

Consider adding Playwright viewport tests after Phase 4:
```typescript
test.describe('Mobile responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing page has no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
```

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Sheet component breaks existing layout | Phase 1 is isolated to nav/layout; easy revert |
| Dashboard card layout loses info density | Keep table as optional "list view" if users complain |
| iOS zoom prevention `!important` causes issues | Scoped to `<md` media query; doesn't affect desktop |
| Shadcn component styling conflicts | CSS variables already mapped in globals.css; test thoroughly |
| Performance impact of Sheet animations | Radix uses CSS transforms; hardware-accelerated by default |
