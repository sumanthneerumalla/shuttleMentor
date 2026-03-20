# UI Consolidation Plan — U1 through U5

> Status: Draft for review. Covers replacing custom nav/modal/error components with shadcn/Radix primitives.

---

## Context

The codebase currently has several hand-rolled UI components that duplicate what shadcn/ui already provides. The goal is to migrate them incrementally so we get:
- Keyboard navigation, ARIA, and focus trap for free
- Consistent design tokens across all interactive elements
- Smaller surface area to maintain

shadcn/ui is already partially in use (`Button`, `Slot` via `@radix-ui/react-slot`). The pattern is: `npx shadcn@latest add <component>` generates the component into `src/app/_components/ui/`, which we then import everywhere.

---

## U1 — Migrate Sidebar to shadcn `Sidebar`

**Target file:** `src/app/_components/client/authed/SideNavigation.tsx`  
**shadcn component:** `npx shadcn@latest add sidebar`  
**Radix primitive used internally:** None (shadcn sidebar is a custom compound component using Radix `Collapsible`)

### What exists now
- Custom `SideNavigation` component with manual `openGroups` state for collapsible sub-nav
- No keyboard trap, no ARIA roles, no mobile drawer behaviour
- Club switcher footer added as a raw `div`

### What to build
1. Run `npx shadcn@latest add sidebar` — generates `sidebar.tsx` in `_components/ui/`. check to see if we plan to move the generated component elsewhere more appropriate in our repo.
2. Replace top-level wrapper `<div className="flex h-full flex-col …">` with `<SidebarProvider>` + `<Sidebar>`
3. Map existing `navItems` to `<SidebarMenu>` / `<SidebarMenuItem>` / `<SidebarMenuButton>` / `<SidebarMenuSub>` for nested items
4. Wrap club switcher footer in `<SidebarFooter>`
5. Delete the `openGroups` state — shadcn `Collapsible` handles this
6. Update `AuthedLayout.tsx`: replace the sticky `<div className="w-64 …">` wrapper with the `<SidebarTrigger>` + `useSidebar()` hook pattern for mobile collapse support

### Risk / notes
- shadcn sidebar requires a `SidebarProvider` at the layout level — `AuthedLayout.tsx` will need a small update
- The `filterItemsByUserType` helper is pure logic and can stay as-is
- Mobile: current layout has no hamburger; migrating adds it for free via `SidebarTrigger`

---

## U2 — Migrate Navbar to shadcn `NavigationMenu`

**Target file:** `src/app/_components/client/public/NavBar.tsx`  
**shadcn component:** `npx shadcn@latest add navigation-menu`  
**Radix primitive:** `@radix-ui/react-navigation-menu`

### What exists now
- Manual hover/click state for "How It Works" and "Resources" dropdowns (`isDropdownOpen`, `isHovering`, etc.)
- ~60 lines of event handler boilerplate for hover + click-outside behaviour
- No keyboard navigation (arrow keys don't work)

### What to build
1. Run `npx shadcn@latest add navigation-menu`
2. Replace the custom dropdown divs with:
   ```tsx
   <NavigationMenu>
     <NavigationMenuList>
       <NavigationMenuItem>
         <NavigationMenuTrigger>How It Works</NavigationMenuTrigger>
         <NavigationMenuContent>
           <NavigationMenuLink asChild><Link href="/#how-it-works">How It Works</Link></NavigationMenuLink>
         </NavigationMenuContent>
       </NavigationMenuItem>
       {/* Resources dropdown */}
     </NavigationMenuList>
   </NavigationMenu>
   ```
3. Remove all `isDropdownOpen`, `isHovering`, `isResourcesDropdownOpen`, `isResourcesHovering` state + their `useEffect`s and handlers
4. Keep Clerk `SignInButton`/`SignUpButton`/`UserButton` as-is — they sit outside the nav menu

### Risk / notes
- `NavigationMenu` uses `position: absolute` for the content panel — verify z-index against Clerk's `UserButton` dropdown
- The `isScrolled` blur effect can stay on the `<header>` wrapper

---

## U3 — Replace `CoachingNoteModal` with Radix `Dialog`

**Target file:** `src/app/_components/client/authed/CoachingNoteModal.tsx`  
**shadcn component:** `npx shadcn@latest add dialog`  
**Radix primitive:** `@radix-ui/react-dialog`

### What exists now
- Custom fixed overlay: `<div className="fixed inset-0 z-50 …">`
- Manual `if (!isOpen) return null` guard
- No focus trap — keyboard users can tab to content behind the overlay
- No `Escape` key handler
- No scroll lock

### What to build
1. Run `npx shadcn@latest add dialog`
2. Replace the component with:
   ```tsx
   <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
     <DialogContent className="max-w-4xl">
       <DialogHeader>
         <DialogTitle>Coaching Notes</DialogTitle>
         <DialogDescription>{studentName} • {collectionTitle} • {mediaTitle}</DialogDescription>
       </DialogHeader>
       {/* Tabs + content unchanged */}
       <DialogFooter>
         <Button onClick={onClose} variant="outline">Close</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ```
3. Delete the `if (!isOpen) return null` guard — Radix handles mounting/unmounting
4. The `X` close button becomes redundant — Radix `DialogContent` renders its own; remove the manual one

### Risk / notes
- All call sites pass `isOpen` + `onClose` — interface is unchanged, so no call-site edits needed
- Scroll lock is automatic via Radix
- `CoachingNoteForm` and `CoachingNotesList` are rendered as children — unchanged

---

## U4 — Shared `ErrorBanner` Component

**Target files (callers):** any component that currently renders ad-hoc red error text  
**shadcn components:** `npx shadcn@latest add alert` (uses Radix `Alert` primitive)

### What exists now
Multiple places render error text as one-off inline elements, e.g.:
```tsx
<div className="text-red-600 text-sm">{error.message}</div>
<p className="text-red-500 text-sm">{serverError}</p>
```
No consistent icon, no consistent spacing, no dismiss option.

### What to build
1. Run `npx shadcn@latest add alert`
2. Create `src/app/_components/shared/ErrorBanner.tsx`:
   ```tsx
   import { Alert, AlertDescription } from "~/app/_components/ui/alert";
   import { AlertCircle } from "lucide-react";

   export function ErrorBanner({ message, className }: { message: string; className?: string }) {
     if (!message) return null;
     return (
       <Alert variant="destructive" className={className}>
         <AlertCircle className="h-4 w-4" />
         <AlertDescription>{message}</AlertDescription>
       </Alert>
     );
   }
   ```
3. Do a codebase-wide find for `text-red-600`, `text-red-500` in TSX files and replace with `<ErrorBanner message={…} />`

### Known call sites (non-exhaustive)
- `profile/page.tsx` — `serverError` state display
- `AdminClubIdSelector.tsx` — `switchClub.isError` display
- `CoachingNoteForm.tsx` — mutation error display
- `VideoCollectionForm.tsx` — field-level errors

### Risk / notes
- Low risk — purely additive; existing red-text can be migrated file by file
- The `variant="destructive"` in shadcn Alert renders a red left border, consistent with existing style

---

## U5 — Fix Nested `glass-panel` (Full Codebase Audit)

**No new dependency — CSS cleanup only**

### Audit findings — all nesting violations

A `glass-panel` applies `background: white`, `border`, and a `box-shadow`. Nesting one inside another doubles the shadow, double-borders, and causes visual roughness.

| File | Outer `glass-panel` | Nested inner `glass-panel` | Fix |
|------|--------------------|-----------------------------|-----|
| `VideoCollectionDisplay.tsx:258` | Outer card wrapper | `:313` Coaching Notes section, `:338` Assigned Coach display | Replace inner with `rounded-lg border border-gray-100 bg-gray-50 p-4` |
| `VideoCollectionForm.tsx:293` | "Collection Details" card | `:340` owner typeahead dropdown | Replace inner dropdown with `rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden` |
| `VideoCollectionForm.tsx:430` | "Videos" card | — (no nesting here, standalone) | No change needed |
| `ResourceManagerClient.tsx:84` | Resource form card | `:193` Business Hours block, `:521` New/Edit resource form | Replace inner with `rounded-lg border border-gray-100 bg-gray-50 p-4` |
| `AdminClubIdSelector.tsx:123` | — (dropdown popover only, not nested in a glass-panel caller) | — | No change needed |
| `CoachSelector.tsx` | — (standalone, not nested in other glass-panels at call sites) | — | Audit call sites to confirm |

### Standalone usages (not nested — leave as-is)
- `Toast.tsx` — floats over everything, correct
- `AlertDialog.tsx` — modal overlay, correct
- `UnauthorizedAccess.tsx` — page-level card, correct
- `EventFormModal.tsx` / `ProductFormModal.tsx` — slide-over panels, correct
- `VideoCollectionsListing.tsx` — top-level empty state, correct
- `join/page.tsx` — results list, correct
- `(app)/page.tsx` — CTA section, correct

### What to do
1. In `VideoCollectionDisplay.tsx`: change the two inner `glass-panel` divs (lines 313 and 338) to `rounded-lg border border-gray-100 bg-gray-50 p-{4|6}`
2. In `VideoCollectionForm.tsx`: change the owner typeahead dropdown (line 340) from `glass-panel` to `rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden`
3. In `ResourceManagerClient.tsx`: change the two inner blocks (lines 193, 521) from `glass-panel` to `rounded-lg border border-gray-100 bg-gray-50 p-4`
4. Verify visually — the outer card retains the frost/shadow, inner sections become subtle inset panels

### Risk / notes
- Pure visual — no logic changes
- Should be done after U1 since sidebar migration may shift layout widths

---

## Execution Order

| Step | Why this order |
|------|---------------|
| **U4 first** | Purely additive, no structural changes, lowest risk, unblocks consistent error display for U1-U3 work |
| **U3** | Self-contained modal swap, no layout impact |
| **U2** | NavBar is isolated from sidebar, can be done in parallel with U1 |
| **U1** | Largest change — requires `AuthedLayout` update, do last so other components are stable |
| **U5** | Pure visual polish, do last |

---

## shadcn Install Commands (run once per component)

```bash
npx shadcn@latest add sidebar
npx shadcn@latest add navigation-menu
npx shadcn@latest add dialog
npx shadcn@latest add alert
```

> Note: Each `add` command generates a component file in `src/app/_components/ui/` and may update `components.json`. Commit after each add to keep diffs clean.

---

## Decisions (resolved)

1. **U1 mobile behaviour** — ✅ **Hamburger drawer**. Use `variant="sidebar"` with `SidebarTrigger` in the header. `AuthedLayout.tsx` wraps in `SidebarProvider`.
2. **U2 sticky header** — ✅ **Replace with Tailwind**. Drop the custom `isScrolled` CSS, use `backdrop-blur-sm bg-white/80` conditional class on scroll. Less custom code to maintain.
3. **U5 scope** — ✅ **Audit completed** — see findings in the expanded U5 section below.

## shadcn Component Placement

**Decision: generated files go into `src/app/_components/shared/` — no move needed.**

`components.json` is already configured:
```json
"aliases": {
  "components": "~/app/_components/shared",
  "utils": "~/lib/utils"
}
```

So `npx shadcn@latest add <component>` drops files directly into `shared/` alongside existing primitives like `Button.tsx`, `Toast.tsx`, `Input.tsx`. That's the right place — no post-generation move required.

Note: `shared/ui/avatar.tsx` exists as a one-off manual placement. Leave it there to avoid breaking imports, but going forward new shadcn components land in `shared/` (not `shared/ui/`).

**Rule:** shadcn-generated primitives → `shared/`. Hand-authored compositions built on top of them also live in `shared/` (e.g. `ErrorBanner.tsx` imports from `~/app/_components/shared/alert`).
