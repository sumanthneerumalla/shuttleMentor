# 05 — Implementation Phases

This spec defines the phased rollout strategy. Each phase produces a **stable checkpoint** — the app is fully functional and testable at the end of every phase. Phases are ordered by dependency: later phases depend on infrastructure established in earlier ones.

---

## Phase Overview

| Phase | Scope | Stable Checkpoint | Est. Effort |
|---|---|---|---|
| **1** | Dependencies + Navigation + Layout | All pages accessible on mobile via hamburger drawer | High |
| **2** | Landing pages | Public pages look good on mobile | Medium |
| **3** | Authenticated pages | Core authed flows (dashboard, profile, coaches, videos) work on mobile | Medium |
| **4** | Shared components + polish | Modals, touch targets, form inputs, global CSS polished | Low–Medium |

---

## Phase 1: Navigation & Layout Foundation

**Goal**: Every page in the app is *accessible* on mobile — users can navigate to any page using a hamburger menu.

### Steps

1. **Install Shadcn Sheet component**
   ```bash
   npx shadcn@latest add sheet
   ```
   - Generates `src/app/_components/shared/Sheet.tsx`
   - Installs `@radix-ui/react-dialog`, `@radix-ui/react-visually-hidden`
   - DropdownMenu is desktop-only and does not block mobile access — deferred to Phase 2

2. **Create `MobileAuthedHeader` component**
   - New file: `src/app/_components/client/authed/MobileAuthedHeader.tsx`
   - Contains: hamburger button, centered **page title** (derived from SideNavigation config), Clerk UserButton
   - Wraps SideNavigation inside a `<Sheet side="left">`
   - Only visible on `<md` screens

3. **Update `AuthedLayout`**
   - File: `src/app/_components/client/layouts/AuthedLayout.tsx`
   - Hide desktop sidebar on `<md`: `<aside className="hidden md:block w-64 shrink-0">`
   - Render `MobileAuthedHeader` on `<md`: `<div className="md:hidden">`
   - Responsive main content padding: `p-4 md:p-6`
   - Conditional NavBar rendering (hide on authed pages for mobile)
   - Centralize **sticky header offset** (avoid per-page `mt-16`)

4. **Update `NavBar` for mobile**
   - File: `src/app/_components/client/public/NavBar.tsx`
   - Add hamburger button: `<button className="md:hidden">`
   - Hide desktop nav links: `<div className="hidden md:flex">`
   - Add Sheet drawer with mobile nav links and auth buttons (replicate conditional rendering logic: full public nav when on `"/"` or signed out)
   - Pass `clubShortName` through to mobile auth buttons
   - **Keep existing custom hover menus for now** — DropdownMenu migration is Phase 2
   - NavBar is already `fixed top-0` — no change needed

5. **Update `SideNavigation` for Sheet compatibility**
   - File: `src/app/_components/client/authed/SideNavigation.tsx`
   - Export the `navItems` array at module scope (prerequisite for `MobileAuthedHeader`'s Sheet drawer content — needed for userType filtering)
   - Accept optional `onNavigate?: () => void` prop
   - Call `onNavigate` **only on leaf `<Link>` nodes** (not on group toggle `<button>` nodes — group toggles expand sub-items inside the Sheet and must not close it)
   - Make `w-64` conditional: full-width inside Sheet, fixed-width in desktop sidebar

   > Note: `/coaches/[username]` is **authenticated-only** — no `AuthedLayout` changes needed for this route. `MobileAuthedHeader` will show "Coach Profile" via the `startsWith("/coaches/")` fallback in `PAGE_TITLES`.

### Files Touched
| File | Action |
|---|---|
| `src/app/_components/shared/Sheet.tsx` | New (generated) |
| `src/app/_components/client/authed/MobileAuthedHeader.tsx` | New (PAGE_TITLES map + Sheet) |
| `src/app/_components/client/layouts/AuthedLayout.tsx` | Modified (responsive sidebar, conditional NavBar) |
| `src/app/_components/client/public/NavBar.tsx` | Modified (hamburger + Sheet drawer) |
| `src/app/_components/client/authed/SideNavigation.tsx` | Modified (export navItems, leaf-only onNavigate) |

### Testing Criteria
- [ ] At 375px, public pages show sticky NavBar + hamburger → tapping opens Sheet with nav links
- [ ] At 375px, authed pages show sticky MobileAuthedHeader → tapping hamburger opens SideNavigation in Sheet
- [ ] Mobile header title matches `PAGE_TITLES` map for known routes
- [ ] Mobile header shows "Video Collection" for `/video-collections/[id]` routes
- [ ] Mobile header shows "Coach Profile" for `/coaches/[username]` routes
- [ ] Mobile header falls back to "ShuttleMentor" for unmatched routes
- [ ] Tapping a group item (e.g., "Video Collections") expands sub-items inside Sheet — does NOT close Sheet
- [ ] Tapping a leaf nav link inside Sheet navigates and closes the Sheet
- [ ] At 768px+, desktop navigation is unchanged (NavBar, sidebar, existing hover dropdowns)
- [ ] Clerk auth buttons work correctly in mobile Sheet
- [ ] No horizontal scroll on any page at 375px
- [ ] Keyboard navigation works inside Sheet (accessibility)

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

### Testing Criteria
- [ ] Testimonials are single-column at 375px, 2-col at 768px, 3-col at 1024px+
- [ ] Footer is 2×2 at 375px, 4-col at 768px+
- [ ] CTA section has comfortable padding at 375px
- [ ] No horizontal scroll on landing page at 375px
- [ ] Hero decorative backgrounds don't cause overflow
- [ ] All text readable without zooming at 375px
- [ ] Resources page videos scale correctly

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

### Testing Criteria
- [ ] Dashboard coach table shows cards on mobile (`< md`), table on desktop (`≥ md`)
- [ ] Cards display all necessary info (student, collection, media, notes count, actions)
- [ ] Profile name fields stack vertically at 375px
- [ ] Coach Detail action buttons are full-width at 375px
- [ ] Coaches listing sort controls wrap cleanly at 375px
- [ ] Video Collections header stacks title + button at 375px
- [ ] All forms are usable at 375px (no overflow, no truncation of inputs)
- [ ] All pages have comfortable padding at 375px

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

### Testing Criteria
- [ ] CoachingNoteModal is full-screen on mobile, centered modal on desktop
- [ ] All buttons meet 44px minimum touch target
- [ ] No iOS zoom on form input focus
- [ ] CoachSelector dropdown doesn't overflow viewport on mobile
- [ ] ProfileImageUploader crop modal is usable on mobile
- [ ] No horizontal scroll on any page at 375px
- [ ] All interactive elements are comfortably tappable

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
