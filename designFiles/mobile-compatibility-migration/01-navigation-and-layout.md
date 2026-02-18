# 01 — Navigation & Layout Overhaul

This spec covers the three critical mobile blockers: the public NavBar, the authenticated SideNavigation, and the AuthedLayout that wires them together.

---

## New Dependency

```bash
npx shadcn@latest add sheet
```

This installs the Shadcn **Sheet** component (wrapping `@radix-ui/react-dialog`) into `src/app/_components/shared/Sheet.tsx` per the project's `components.json` alias configuration. The Sheet provides an accessible, animated slide-out drawer — the foundation for both mobile navigation patterns below.

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
2. **Navigation links** stacked vertically:
   - Home
   - How It Works (expandable section or direct links to sub-pages)
   - Resources (expandable section or direct links)
   - Find Coaches
3. **Auth buttons** at the bottom:
   - Sign In / Sign Up (when signed out)
   - UserButton (when signed in)

The Sheet closes automatically on link click (use `onOpenChange` callback or wrap links in `<SheetClose>`).

#### C. Fix dropdown accessibility on desktop

Replace custom hover/click dropdowns with either:
- **Option A**: Shadcn `DropdownMenu` (uses `@radix-ui/react-dropdown-menu`) — accessible, keyboard-navigable
- **Option B**: Keep custom dropdowns but add `onClick` toggle alongside `onMouseEnter`/`onMouseLeave` so they work on touch-capable desktops/tablets

Recommendation: **Option A** for better accessibility, but Option B is lower-effort if phasing is tight.

#### D. File structure

The NavBar can remain a single file. The mobile drawer content can be extracted into a private `MobileNavDrawer` sub-component within the same file, or a new file `src/app/_components/client/public/MobileNavDrawer.tsx` if it grows large.

### Key Implementation Details

- The `clubShortName` prop must be passed through to mobile nav auth buttons (same as desktop)
- Sheet trigger should use the existing `AnimatedLogo` for brand consistency
- Mobile nav links should use `nav-link` CSS class from `globals.css` for consistent styling
- Sheet overlay provides the backdrop dimming automatically

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
2. **Logo / page title** (centered)
3. **UserButton** from Clerk (right side)

This bar is only visible on `<md` screens. It replaces the NavBar for authed pages on mobile.

### Key Implementation Details

- Create a new component: `src/app/_components/client/authed/MobileAuthedHeader.tsx`
  - Contains the hamburger trigger, logo, and user button
  - Only rendered on `<md` via `md:hidden`
- The `userType` prop must be passed through to filter nav items correctly in the Sheet
- Active route highlighting (current `pathname` matching) continues to work inside the Sheet

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

#### D. Ensure `mt-16` or equivalent offset

Currently some pages use `mt-16` to offset for the fixed NavBar. On mobile authed pages, the offset should match the `MobileAuthedHeader` height instead. Use a consistent CSS variable or a wrapper with the correct padding-top.

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
| `src/app/_components/client/authed/SideNavigation.tsx` | Minor: accept optional `onNavigate` callback for Sheet close |
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
