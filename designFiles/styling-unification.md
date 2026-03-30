# Styling Unification Plan

## Goal
Establish a consistent, reusable design system across all components. Eliminate inline style duplication and ensure visual consistency.

## Current State

### What works well
- `Button` component with variants (default, outline, ghost, destructive, destructive-outline)
- `Dialog` primitives with `DialogBody` for consistent modal padding
- `Input` component
- `Toast` system
- CSS variables for colors in `globals.css`
- `glass-card` / `glass-inset` utility classes
- `section-heading` / `section-subheading` typography classes

### What's inconsistent

#### 1. Buttons vs Links (High)
Some pages use `<Button>`, some use raw `<Link>` with inline classes, some use raw `<button>` with inline styles. No clear convention for when to use which.

**Convention to establish:** `<Button>` for actions, `<Link>` styled as links for navigation. Never raw `<button>` with inline Tailwind.

#### 2. Select / Dropdown (High)
Every select is a raw `<select>` with inline Tailwind copied everywhere. No shared `Select` component.

**Fix:** Create a `<Select>` component matching `Input` styling.

#### 3. Form Fields (High)
The label + input + error message pattern is repeated manually in every form. No `FormField` wrapper.

**Fix:** Create `<FormField>` wrapping label + input/select + error. Used in every form and modal.

#### 4. Colors (Medium)
Mix of `var(--primary)`, `bg-primary`, hardcoded hex (`#4F46E5`), hardcoded rgba, and Tailwind color classes (`bg-gray-100`). No single source of truth.

**Fix:** Pick one approach — either all CSS variables referenced via Tailwind theme, or all direct Tailwind classes. Eliminate hardcoded hex/rgba.

#### 5. Page Layout / Spacing (Medium)
Some pages use `p-6`, others `px-4 py-8`, others `container mx-auto`. No consistent page shell.

**Fix:** Consider a `<PageShell>` or just document the standard padding pattern and adopt it.

#### 6. Cards (Medium)
Mix of `glass-card`, `glass-inset`, raw `border border-gray-200 bg-white rounded-lg`, and no card wrapper at all.

**Fix:** Standardize on `glass-card` for elevated surfaces, `glass-inset` for inset sections. Remove inline equivalents.

#### 7. Typography (Low)
`section-heading` and `section-subheading` classes exist but many pages use inline `text-2xl font-semibold` instead.

**Fix:** Audit and replace inline heading styles with the shared classes.

#### 8. Loading States (Low)
Some components use `animate-pulse` skeletons, some show "Loading..." text, some show nothing.

**Fix:** Standardize on skeleton loaders for data-heavy pages, spinner for actions.

#### 9. Error States (Low)
Some use `text-red-600`, some `text-red-500`, some use Toast, some show inline errors.

**Fix:** Inline validation errors use `text-red-600`. Server/mutation errors use Toast. Pick one red shade.

## Priority Order

1. ~~`<Select>`~~ ✅ DONE — adopted across all 21 raw selects in 12 files
2. ~~`<FormField>`~~ DROPPED — most forms have custom label layouts (character counters, required asterisks, flex rows) that don't fit a simple wrapper. Not worth the abstraction.
3. `<PageHeader>` — 4 files with identical back-arrow + title + action button pattern. Small effort, high impact.
4. Color consolidation — swap hardcoded `#4F46E5` to `var(--primary)` in ~5 files. Event color picker palette is intentional, leave those.
5. ~~Buttons vs Links~~ ✅ ALREADY DONE — convention established organically, zero raw `<button>` elements with inline Tailwind outside shared components.

### Deferred (tackle opportunistically, not as dedicated work)
- Cards (`glass-card` vs raw borders) — 49 instances, not all should change. Defer until specific visual issues arise.
- Typography (shared heading classes) — low-impact adoption sweep.
- Loading states — `animate-pulse` already dominant (18 files), only 3 use "Loading..." text.
- Error states — minor shade inconsistency (`text-red-500` vs `text-red-600`). Biome or lint rule could enforce.
- Page layout/spacing — genuine inconsistency across ~30 files, but needs a documented convention not a component. Larger effort, defer.

## Implementation Notes

- Each item should be a single commit: create component, then adopt across all consumers in the same commit.
- Don't create abstractions that aren't immediately used in 3+ places.
- Test mobile responsiveness after each adoption pass.
