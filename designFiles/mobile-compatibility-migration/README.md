# Mobile Compatibility Migration — Master Spec

This document is the master reference for making the entire ShuttleMentor website mobile-compatible. It covers design decisions, a current-state audit, new dependencies, and links to detailed sub-specs.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Min screen width | **375px** | Modern iPhone baseline (12/13/14/15); avoids edge-case 320px work |
| Mobile navigation (public) | **Hamburger → slide-out drawer** | Preserves existing nav hierarchy; industry standard |
| Mobile navigation (authed) | **Hamburger → Sheet drawer + sticky MobileAuthedHeader** | Consistent pattern; SideNavigation lives in a Sheet |
| Nav dropdowns | **Shadcn DropdownMenu** | Reusable open-source pattern with strong accessibility |
| Header behavior | **Sticky (public + authed)** | Keeps navigation available without extra scrolling |
| Mobile header title | **Map pathname → SideNavigation label** | Single source of truth for titles |
| Dashboard tables | **Table on desktop, cards on mobile** | Preserves scanability on desktop, touch-friendly on mobile |
| Modals on mobile | **Shadcn Dialog (full-screen on mobile)** | Standardized component, easier migration |
| Migration approach | **Phased, incremental stable checkpoints** | Each phase produces a working, testable state |
| Component library | **Shadcn UI + Radix primitives** | Already configured; minimal new dependencies |

---

## Current State Audit

### What's Already Responsive ✅

| Component | Responsive Classes | Notes |
|---|---|---|
| Hero section | `lg:flex-row`, `md:text-5xl` | Good mobile layout |
| Features grid | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | Good |
| HowItWorks grid | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | Good |
| Dashboard stats | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | Good |
| Coach Detail header | `flex-col md:flex-row` | Good |
| Coach Detail grid | `grid-cols-1 md:grid-cols-3` | Good |
| Video Collections grid | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Good |
| Video Collection Detail | `grid-cols-1 lg:grid-cols-3` | Good |
| CoachesListing grid | `grid-cols-1 md:grid-cols-2` | Good |
| CoachCard | Flex-based with `truncate` | Works at any width |

### What's Broken on Mobile 🚨 → All Fixed ✅

| Component | File | Issue | Status |
|---|---|---|---|
| **NavBar** | `src/app/_components/client/public/NavBar.tsx` | Hamburger + Sheet drawer | ✅ Fixed (Phase 1) |
| **SideNavigation** | `src/app/_components/client/authed/SideNavigation.tsx` | `collapsible="none"` removed; Sheet on mobile | ✅ Fixed (Phase 1) |
| **AuthedLayout** | `src/app/_components/client/layouts/AuthedLayout.tsx` | `MobileAuthedHeader` + `hidden md:block` sidebar | ✅ Fixed (Phase 1) |
| **Footer** | `src/app/_components/client/public/Footer.tsx` | `grid-cols-2 md:grid-cols-4` | ✅ Fixed (Phase 2) |
| **Testimonials** | `src/app/page.tsx` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | ✅ Fixed (Phase 2) |
| **Profile form** | `src/app/(app)/profile/page.tsx` | `grid-cols-1 sm:grid-cols-2` | ✅ Fixed (Phase 3) |
| **CTA section** | `src/app/page.tsx` | `p-8 md:p-16` | ✅ Fixed (Phase 2) |
| **Dashboard table** | `src/app/(app)/dashboard/DashboardClient.tsx` | Cards on mobile, table on desktop | ✅ Fixed (Phase 3) |
| **CoachingNoteModal** | `src/app/_components/client/authed/CoachingNoteModal.tsx` | `mx-4` on DialogContent; acceptable on mobile | ✅ Fixed (Phase 4) |
| **Form inputs** | `src/styles/globals.css` | `font-size: 16px` on mobile inputs globally | ✅ Fixed (Phase 4) |
| **Products table** | `src/app/(app)/products/ProductsClient.tsx` | Cards on mobile, table on desktop | ✅ Fixed (bonus) |

---

## New Dependencies Required

| Package | Purpose | Used By |
|---|---|---|
| `@radix-ui/react-dialog` | Shadcn Sheet + Dialog (drawers, modals) | NavBar mobile menu, SideNavigation drawer, modals |
| `@radix-ui/react-visually-hidden` | Accessibility for Sheet (required peer) | Sheet component |
| `@radix-ui/react-dropdown-menu` | Shadcn DropdownMenu | Desktop NavBar dropdowns |

Install via:
```bash
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
```
This generates `Sheet.tsx`, `DropdownMenu.tsx`, and `Dialog.tsx` in `src/app/_components/shared/` (per `components.json` alias config).

---

## Spec File Index

| File | Scope |
|---|---|
| [`01-navigation-and-layout.md`](./01-navigation-and-layout.md) | NavBar hamburger, SideNavigation drawer, AuthedLayout responsive refactor |
| [`02-landing-pages.md`](./02-landing-pages.md) | Landing page, Hero, Features, HowItWorks, Footer, testimonials, resources |
| [`03-authed-pages.md`](./03-authed-pages.md) | Dashboard table (desktop) + cards (mobile), Profile form, Coaches, Video Collections |
| [`04-shared-components.md`](./04-shared-components.md) | Button touch targets, modals → Dialog, forms, global CSS utilities |
| [`05-implementation-phases.md`](./05-implementation-phases.md) | 4-phase rollout with stable checkpoints, file lists, testing criteria |

---

## Scope Boundaries

- **In scope**: All UI layout, navigation, responsive styling, component replacements
- **Out of scope**: Backend/API changes, data models, authentication logic, business logic
- **Approach**: Desktop experience remains unchanged; all changes are additive responsive behavior
