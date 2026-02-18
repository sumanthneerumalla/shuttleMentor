# Mobile Compatibility Migration — Master Spec

This document is the master reference for making the entire ShuttleMentor website mobile-compatible. It covers design decisions, a current-state audit, new dependencies, and links to detailed sub-specs.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Min screen width | **375px** | Modern iPhone baseline (12/13/14/15); avoids edge-case 320px work |
| Mobile navigation (public) | **Hamburger → slide-out drawer** | Preserves existing nav hierarchy; industry standard |
| Mobile navigation (authed) | **Hamburger → slide-out drawer** | Same pattern for consistency; SideNavigation becomes a Sheet |
| Dashboard tables | **Card-based layout** | Better for mobile; investigate unifying desktop too |
| Modals on mobile | **Full-screen sheets** | Standard mobile pattern; more room for content |
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

### What's Broken on Mobile 🚨

| Component | File | Issue | Severity |
|---|---|---|---|
| **NavBar** | `src/app/_components/client/public/NavBar.tsx` | No hamburger menu; horizontal links overflow; hover-based dropdowns | **Critical** |
| **SideNavigation** | `src/app/_components/client/authed/SideNavigation.tsx` | Fixed `w-64`; no responsive collapse | **Critical** |
| **AuthedLayout** | `src/app/_components/client/layouts/AuthedLayout.tsx` | Hardcoded `flex` with `w-64 shrink-0` sidebar | **Critical** |
| **Footer** | `src/app/_components/client/public/Footer.tsx` | `grid grid-cols-4` — no responsive breakpoints | **High** |
| **Testimonials** | `src/app/page.tsx` (lines ~150-180) | `grid grid-cols-3` — no responsive breakpoints | **High** |
| **Profile form** | `src/app/profile/page.tsx` | `grid-cols-2` for name fields — no responsive stacking | **High** |
| **CTA section** | `src/app/page.tsx` (line ~130) | `p-16` padding too large for mobile | **Medium** |
| **Dashboard table** | `src/app/dashboard/DashboardClient.tsx` | Full `<table>` for coach media review; only horizontal scroll on mobile | **Medium** |
| **CoachingNoteModal** | `src/app/_components/client/authed/CoachingNoteModal.tsx` | `max-w-4xl` centered modal; cramped on mobile | **Medium** |
| **Form inputs** | Various | Font sizes may be <16px causing iOS auto-zoom | **Low** |
| **Touch targets** | Various buttons/links | Some may be <44px minimum | **Low** |

---

## New Dependencies Required

| Package | Purpose | Used By |
|---|---|---|
| `@radix-ui/react-dialog` | Shadcn Sheet component (slide-out drawer) | NavBar mobile menu, SideNavigation drawer, modals |
| `@radix-ui/react-visually-hidden` | Accessibility for Sheet (required peer) | Sheet component |

Both are peer dependencies of the Shadcn Sheet component. Install via:
```bash
npx shadcn@latest add sheet
```
This also generates `src/app/_components/shared/Sheet.tsx` (per `components.json` alias config).

---

## Spec File Index

| File | Scope |
|---|---|
| [`01-navigation-and-layout.md`](./01-navigation-and-layout.md) | NavBar hamburger, SideNavigation drawer, AuthedLayout responsive refactor |
| [`02-landing-pages.md`](./02-landing-pages.md) | Landing page, Hero, Features, HowItWorks, Footer, testimonials, resources |
| [`03-authed-pages.md`](./03-authed-pages.md) | Dashboard card-based table, Profile form, Coaches, Video Collections |
| [`04-shared-components.md`](./04-shared-components.md) | Button touch targets, modals → sheets, forms, global CSS utilities |
| [`05-implementation-phases.md`](./05-implementation-phases.md) | 4-phase rollout with stable checkpoints, file lists, testing criteria |

---

## Scope Boundaries

- **In scope**: All UI layout, navigation, responsive styling, component replacements
- **Out of scope**: Backend/API changes, data models, authentication logic, business logic
- **Approach**: Desktop experience remains unchanged; all changes are additive responsive behavior
