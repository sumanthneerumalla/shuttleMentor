# 02 — Landing Pages Responsive Fixes

This spec covers all public-facing landing pages and their sub-components. The Hero, Features, and HowItWorks sections are already mostly responsive — this focuses on the broken areas.

---

## 1. Main Landing Page (`src/app/page.tsx`)

### Current Issues

#### A. Testimonials Grid (Critical)

**Current** (around line 150):
```tsx
<div className="grid grid-cols-3 gap-8">
```

**Problem**: Three columns at all screen sizes. At 375px, each column is ~105px — unreadable.

**Fix**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
```

- Mobile: single column, stacked testimonial cards
- Tablet: 2 columns
- Desktop: 3 columns (current)
- Also reduce `gap-8` → `gap-6` on mobile for tighter spacing

#### B. CTA Section Padding

**Current** (around line 130):
```tsx
<div className="... p-16 ...">
```

**Problem**: 64px padding on all sides is excessive on a 375px screen (leaves only ~247px for content).

**Fix**:
```tsx
<div className="... p-8 md:p-16 ...">
```

#### C. Stats Row

**Current** (around line 100):
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
```

**Status**: Already has `grid-cols-2` for smaller screens. Verify that the stat cards look good at 375px with `grid-cols-2`. If numbers overflow, consider `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`.

#### D. Section Padding/Margins

Several sections use large fixed padding like `py-24` or `py-16`. Audit all sections and add mobile-friendly overrides:
```
py-12 md:py-24    (halve vertical padding on mobile)
py-10 md:py-16    (similar pattern)
px-4 md:px-6      (ensure horizontal padding doesn't eat into content width)
```

---

## 2. Footer (`src/app/_components/client/public/Footer.tsx`)

### Current State (82 lines)

```tsx
<div className="grid grid-cols-4 gap-8">
  {/* Platform links */}
  {/* Resources links */}
  {/* Company links */}
  {/* Contact links */}
</div>
```

### Problem

Four columns at all screen sizes. At 375px, each column is ~70px — links overflow and overlap.

### Fix

```tsx
<div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
```

- Mobile: 2×2 grid of link sections — compact but readable
- Desktop: 4 columns (current)

Also consider:
- Reducing footer `text-sm` on mobile to `text-xs` if space is tight
- Ensuring the copyright/bottom row wraps cleanly: `flex-col items-center md:flex-row md:justify-between`

---

## 3. Hero Section (`src/app/_components/client/public/Hero.tsx`)

### Current State (148 lines)

Already responsive:
- `flex-col lg:flex-row` for layout
- `text-4xl md:text-5xl lg:text-6xl` for heading
- `text-lg md:text-xl` for subtitle

### Verify on 375px

- **Check features mini-grid**: Currently `grid grid-cols-1 sm:grid-cols-3`. At 375px this is single-column, which is fine. Between 640px–767px it's 3 columns — verify these don't overflow.
- **CTA buttons**: Currently `flex-col sm:flex-row gap-4`. Good mobile layout (stacked buttons).
- **Decorative background elements**: Use `overflow-hidden` on the hero container to prevent horizontal scroll from absolutely positioned decorative blobs that extend beyond viewport.

### Potential Fix

Add `overflow-hidden` to the hero's outermost container if not already present, to prevent horizontal scroll caused by decorative `absolute` positioned elements:

```tsx
<section className="relative overflow-hidden ...">
```

---

## 4. Features Section (`src/app/_components/server/Features.tsx`)

### Current State (102 lines)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
```

### Status: ✅ Already Responsive

- Mobile: single column
- Tablet: 2 columns
- Desktop: 4 columns

### Minor Improvements

- Reduce `gap-8` → `gap-6 md:gap-8` for slightly tighter mobile spacing
- Verify feature card icons and text don't overflow at 375px

---

## 5. HowItWorks Section (`src/app/_components/server/HowItWorks.tsx`)

### Current State (92 lines)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
```

### Status: ✅ Already Responsive

Same pattern as Features. Same minor improvement opportunity with gap reduction.

### Additional Check

The step numbers with connecting lines/arrows between steps may look odd on single-column mobile layout. Verify the visual flow makes sense when stacked vertically. The numbered circles should be self-explanatory without horizontal arrows.

---

## 6. Resources / Getting Started (`src/app/resources/getting-started/page.tsx`)

### Current State (78 lines)

```tsx
<div className="container mx-auto mt-16 max-w-4xl px-4 py-8">
```

### Issues

- `mt-16` for NavBar offset — will need adjustment if NavBar height changes on mobile
- Single-column layout of `ResourceVideoCard` components — already mobile-friendly
- YouTube embeds use `aspect-video` — responsive by default

### Fix

- Change `mt-16` → `mt-14 md:mt-16` if mobile NavBar/header is shorter
- Reduce `py-8` → `py-4 md:py-8` for tighter mobile spacing
- Verify `max-w-4xl` doesn't cause issues (it won't — it's a max, not a fixed width)

---

## 7. Club Landing Page (`src/app/club/[clubShortName]/page.tsx`)

### Current State (25 lines)

This page re-renders the main landing page (`MainLandingContent`) with a `clubShortName` prop. All fixes to the main landing page components automatically apply here. No additional work needed.

---

## Files Touched

| File | Changes |
|---|---|
| `src/app/page.tsx` | Fix testimonials grid, CTA padding, section padding/margins |
| `src/app/_components/client/public/Footer.tsx` | Fix grid to `grid-cols-2 md:grid-cols-4`, responsive copyright row |
| `src/app/_components/client/public/Hero.tsx` | Add `overflow-hidden`, verify at 375px |
| `src/app/_components/server/Features.tsx` | Minor gap adjustment |
| `src/app/_components/server/HowItWorks.tsx` | Minor gap adjustment |
| `src/app/resources/getting-started/page.tsx` | Responsive spacing adjustments |

---

## Testing Checklist

- [ ] Testimonials stack into single column at 375px
- [ ] Footer is 2×2 grid at 375px, 4-column at 768px+
- [ ] CTA section has comfortable padding at 375px
- [ ] No horizontal scroll on any landing page section at 375px
- [ ] Hero decorative backgrounds don't cause overflow
- [ ] All text is readable without zooming at 375px
- [ ] Stats grid is usable at 375px (2-column or 1-column)
- [ ] YouTube embeds in resources page scale correctly
