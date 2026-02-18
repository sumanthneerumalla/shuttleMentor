# 01 — Navigation & Layout Overhaul

This spec covers the three critical mobile blockers: the public NavBar, the authenticated SideNavigation, and the AuthedLayout that wires them together.

---

## New Dependencies

```bash
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu
```

This installs the Shadcn **Sheet** component (wrapping `@radix-ui/react-dialog`) and **DropdownMenu** into `src/app/_components/shared/` per the project's `components.json` alias configuration. The Sheet provides the mobile drawer; DropdownMenu replaces the custom hover menus on desktop.

---

## 1. Public NavBar (`src/app/_components/client/public/NavBar.tsx`)

### Current State

- **261 lines**, client component with `"use client"`
- Horizontal `flex items-center space-x-4` for all nav links
- Two custom dropdown menus ("How It Works", "Resources") using `useState` for hover/click toggling
- Clerk `<SignInButton>` / `<SignUpButton>` / `<UserButton>` in the right section
- No responsive breakpoints — all content is always visible
- Dropdowns use `onMouseEnter`/`onMouseLeave` which don't work on touch devices

### Proposed Changes

#### A. Add a hamburger toggle button (visible on mobile only)

```
<md breakpoint: Show hamburger icon button (Menu from lucide-react)
≥md breakpoint: Show current horizontal nav (unchanged)
```

Use Tailwind classes:
- Hamburger button: `md:hidden`
- Desktop nav links: `hidden md:flex`

#### B. Create a mobile drawer using Shadcn Sheet

When the hamburger is tapped, open a `<Sheet side="left">` containing:

1. **Logo / brand** at the top
2. **Navigation links** stacked vertically — same conditional logic as desktop:
   - When on landing page (`pathname === "/"`) or signed out: show How It Works, Resources, Find Coaches
   - When signed in (on any public page): also show Home link
   - Always show the full public nav on public pages (same as desktop)
3. **Auth buttons** at the bottom:
   - Sign In / Sign Up (when signed out)
   - My Profile + UserButton (when signed in)

The Sheet closes automatically on link click (use `onOpenChange` callback or wrap links in `<SheetClose>`).

#### C. Fix dropdown accessibility on desktop

Standardize on **Shadcn `DropdownMenu`** (via `@radix-ui/react-dropdown-menu`) for the "How It Works" and "Resources" menus. This replaces the custom hover logic and provides keyboard + screen reader support.

#### D. File structure

The NavBar can remain a single file. The mobile drawer content can be extracted into a private `MobileNavDrawer` sub-component within the same file, or a new file `src/app/_components/client/public/MobileNavDrawer.tsx` if it grows large.

### Key Implementation Details

- The `clubShortName` prop must be passed through to mobile nav auth buttons (same as desktop)
- Sheet trigger should use the existing `AnimatedLogo` for brand consistency
- Mobile nav links should use `nav-link` CSS class from `globals.css` for consistent styling
- Sheet overlay provides the backdrop dimming automatically
- The NavBar is already `fixed top-0 right-0 left-0 z-50` — **do not change this**. The sticky behavior is already implemented. The `pt-16` in `AuthedLayout` already accounts for the 64px header height.
- The mobile drawer must replicate the NavBar's **conditional rendering logic**: on the landing page (`pathname === "/"`) or when signed out, show the full public nav (How It Works, Resources, Find Coaches); when signed in on non-landing pages, show the Home link + auth section. The mobile drawer should always show the **full public nav** regardless of auth state on public pages — this matches the desktop behavior.

---

## 2. Authenticated SideNavigation (`src/app/_components/client/authed/SideNavigation.tsx`)

### Current State

- **305 lines**, client component
- Fixed `w-64` sidebar with `bg-white border-r`
- Renders nav groups filtered by `userType` (STUDENT, COACH, ADMIN, FACILITY)
- Collapsible groups using `useState` for `openGroups`
- Uses Lucide icons for each nav item
- No responsive behavior — always visible at full width

### Proposed Changes

#### A. Desktop (≥md): Keep current sidebar as-is

No changes to the desktop sidebar. It continues to render as a fixed `w-64` column.

> **⚠️ Do this first — prerequisite for MobileAuthedHeader**
> Before any other work in Phase 1, move `navItems` from inside the `SideNavigation` component function body to **module scope** and export it. This must happen before `MobileAuthedHeader` is built, because `MobileAuthedHeader` imports `navItems` directly to resolve the current page title. Without this export, `MobileAuthedHeader` cannot be implemented.
>
> ```typescript
> // Move navItems OUT of the component function, to module scope
> export const navItems: NavItem[] = [
>   // ... same content as today, just hoisted above the component
> ];
>
> export default function SideNavigation({ user, isLoading }: SideNavigationProps) {
>   // navItems is now referenced from module scope, not redeclared here
> }
> ```
>
> Because the icons are plain JSX elements (no hooks), this hoist is safe.

#### B. Mobile (<md): Render inside a Shadcn Sheet

The SideNavigation content becomes the `<SheetContent>` of a left-side Sheet:

```
<Sheet>
  <SheetTrigger>  → hamburger button in the top bar
  <SheetContent side="left">
    <SideNavigation ... />   → existing component, rendered inside the sheet
  </SheetContent>
</Sheet>
```

Key considerations:
- The SideNavigation component itself doesn't need to change much — it just renders inside a different container on mobile
- Remove the fixed `w-64` when inside the Sheet (Sheet handles its own width)
- Add `<SheetClose>` wrapper around each `<Link>` so the drawer closes on navigation

#### C. Mobile top bar

On mobile, the authed pages need a slim top bar containing:
1. **Hamburger button** (opens the Sheet)
2. **Page title** (centered), derived from the SideNavigation config by matching the current `pathname`
3. **UserButton** from Clerk (right side)

This bar is only visible on `<md` screens. It replaces the NavBar for authed pages on mobile.

### Key Implementation Details

- Create a new component: `src/app/_components/client/authed/MobileAuthedHeader.tsx`
  - Contains the hamburger trigger, page title, and user button
  - Only rendered on `<md` via `md:hidden`
- **Prop interface** (mirrors `SideNavigation` — use the same props `AuthedLayout` already has):
  ```tsx
  interface MobileAuthedHeaderProps {
    user: any;        // same type as SideNavigation receives
    isLoading: boolean;
  }
  ```
  Pass the full `user` object (not just `userType`) so nav item filtering works identically to the desktop sidebar.
- Active route highlighting (current `pathname` matching) continues to work inside the Sheet
- **Page title resolution** — see "Page Title Algorithm" section below
- **Group toggle behavior**: tapping a group item (e.g., "Video Collections") expands its sub-items *inside the Sheet* — it does **not** close the Sheet. Only tapping a leaf `<Link>` (e.g., "My Collections", "Create New") closes the Sheet via `onNavigate`. The `onNavigate` callback must only be called on leaf links, not on group toggle buttons.

---

## Page Title Map

### Why `page.tsx` metadata doesn't work

Next.js `metadata` exports (static `title` in `page.tsx`) are server-only and not available at runtime in client components. There is no clean way to read a page's `metadata.title` from a client component like `MobileAuthedHeader`.

### Approach: hardcoded `PAGE_TITLES` map

With ~8–10 authed routes, a plain `Record<string, string>` map is more readable and maintainable than a generic prefix-matching algorithm:

- Easy to read and reason about
- Titles don't have to mirror nav item labels exactly (e.g., detail pages can use different wording)
- No risk of wrong labels if `navItems` is reordered or restructured
- Dynamic segments (`/video-collections/[collectionId]`) need a `startsWith` fallback either way — just as simple hardcoded

`navItems` still needs to be exported from `SideNavigation.tsx` for the Sheet drawer (userType filtering). The title map is a separate small lookup, co-located in `MobileAuthedHeader.tsx`.

```typescript
const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/dashboard": "Dashboard",
  "/profile": "Profile",
  "/coaches": "Browse Coaches",
  "/video-collections": "My Collections",
  "/video-collections/create": "Create New",
  "/database": "Database",
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/video-collections/")) return "Video Collection";
  if (pathname.startsWith("/coaches/")) return "Coach Profile";
  return "ShuttleMentor";
}
```

Add entries to `PAGE_TITLES` as new routes are added. The `startsWith` fallbacks at the bottom handle all dynamic segments.

### Note on `/coaches/[username]`

`/coaches/[username]` is **authenticated-only**. It is already handled by `AuthedLayout` with the sidebar. The `MobileAuthedHeader` will show "Coach Profile" for this route via the `startsWith("/coaches/")` fallback above. No `AuthedLayout` changes needed for this route.

---

## 3. AuthedLayout (`src/app/_components/client/layouts/AuthedLayout.tsx`)

### Current State (76 lines)

```tsx
// Simplified structure:
<>
  <NavBar clubShortName={clubShortName} />
  {isAuthedPage ? (
    <div className="flex">
      <aside className="w-64 shrink-0">
        <SideNavigation userType={...} />
      </aside>
      <main className="flex-1 overflow-x-hidden p-6">
        {children}
      </main>
    </div>
  ) : (
    <main>{children}</main>
  )}
</>
```

### Problems

1. `w-64 shrink-0` sidebar has no responsive hiding
2. `p-6` on main content is too much padding on mobile
3. NavBar is always shown even on authed pages (redundant with sidebar nav on mobile)

### Proposed Changes

#### A. Responsive sidebar visibility

```tsx
{isAuthedPage ? (
  <div className="flex">
    {/* Desktop sidebar — hidden on mobile */}
    <aside className="hidden md:block w-64 shrink-0">
      <SideNavigation userType={...} />
    </aside>

    {/* Mobile header with hamburger — hidden on desktop */}
    <MobileAuthedHeader userType={...} />

    <main className="flex-1 overflow-x-hidden p-4 md:p-6">
      {children}
    </main>
  </div>
) : (
  <main>{children}</main>
)}
```

#### B. Responsive main content padding

Change `p-6` → `p-4 md:p-6` so mobile gets slightly tighter padding.

#### C. NavBar visibility on mobile for authed pages

On mobile, authed pages should show the `MobileAuthedHeader` (with hamburger + Sheet) instead of the full NavBar. Two approaches:

- **Option A**: Always render NavBar but hide it on authed pages on mobile via `md:block` conditional
- **Option B**: Don't render NavBar at all for authed pages on mobile; the `MobileAuthedHeader` handles everything

Recommendation: **Option B** — cleaner, avoids double navigation on mobile. The NavBar still shows on public pages (with its own hamburger menu).

#### D. Header offset — finalized approach

The NavBar is already `fixed` (not sticky) and `AuthedLayout` already applies `pt-16` at the layout level for authed pages. **Do not add per-page `mt-16` to authed pages** — the layout handles it.

**`mt-16` audit results** — only 3 files use `mt-16` directly:

| File | Context | Fix |
|---|---|---|
| `src/app/home/HomeClient.tsx` | Authed page — redundant with `AuthedLayout`'s `pt-16` | Remove `mt-16`; the layout already provides the offset. If extra top spacing is needed use `pt-4` or `py-8`. |
| `src/app/resources/getting-started/page.tsx` | Public page — needs NavBar offset | Keep as `mt-16` (public pages don't go through `AuthedLayout`'s `pt-16`). On mobile, if `MobileAuthedHeader` is shorter, adjust to `mt-14 md:mt-16`. |
| `src/app/_components/shared/UnauthorizedAccess.tsx` | Shared component — used on authed pages | Remove `mt-16`; the authed layout already provides `pt-16`. The component should use `py-8` for internal spacing only. |

**For the `MobileAuthedHeader`**: if its height differs from `h-16` (e.g., `h-14`), update `AuthedLayout`'s `pt-16` to `pt-14 md:pt-16` to match.

#### E. `/coaches/[username]` — public page requiring NavBar offset fix

`/coaches/[username]` is accessible to unauthenticated users but is currently not in `AuthedLayout`'s `isPublicPage` list. This means it gets the sidebar layout (with `pt-16` from the flex wrapper) when signed in, but **no top offset** when signed out. Fix:

```tsx
// In AuthedLayout.tsx — add /coaches/[username] to public page detection
const isPublicPage =
  pathname === "/" ||
  pathname.startsWith("/resources") ||
  pathname.startsWith("/coaches/") ||   // <-- add this
  isClubLandingShortUrlPathname(pathname) ||
  isClubLandingInternalPathname(pathname);
```

This ensures unauthenticated visitors to a coach profile page get the correct public layout (NavBar only, no sidebar, content with `mt-16` offset).

---

## Component Dependency Graph

```
AuthedLayout
├── NavBar (public pages, all screens)
│   └── MobileNavDrawer (< md, Sheet-based)
├── MobileAuthedHeader (authed pages, < md only)
│   └── Sheet → SideNavigation
├── SideNavigation (authed pages, ≥ md — desktop sidebar)
└── main content
```

---

## Files Touched

| File | Action |
|---|---|
| `src/app/_components/client/public/NavBar.tsx` | Add hamburger toggle, hide desktop nav on mobile, add Sheet drawer |
| `src/app/_components/client/authed/SideNavigation.tsx` | Export `navItems` config; accept optional `onNavigate` callback on leaf links only |
| `src/app/_components/client/layouts/AuthedLayout.tsx` | Responsive sidebar visibility, conditional NavBar, responsive padding |
| `src/app/_components/client/authed/MobileAuthedHeader.tsx` | **New file**: mobile top bar with hamburger + Sheet |
| `src/app/_components/shared/Sheet.tsx` | **New file**: generated by `npx shadcn@latest add sheet` |

---

## Breakpoint Strategy

| Breakpoint | Public Pages | Authed Pages |
|---|---|---|
| `< md` (< 768px) | Hamburger → Sheet with nav links | MobileAuthedHeader → Sheet with SideNavigation |
| `≥ md` (768px+) | Full horizontal NavBar (current) | NavBar + fixed sidebar (current) |

The `md` (768px) breakpoint is chosen because:
- It's the standard Tailwind tablet breakpoint
- Below 768px, a sidebar consuming 256px (w-64) leaves only ~119px for content at 375px — unusable
- Most tablet-portrait users (768px+) can handle the sidebar
