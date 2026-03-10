# 04 — Shared Components & Global Styles

This spec covers cross-cutting concerns: touch targets, modals → Shadcn Dialog, form input sizing, global CSS utilities, and shared component adjustments.

---

## 1. Modals → Shadcn Dialog (Full-Screen on Mobile)

### CoachingNoteModal (`src/app/_components/client/authed/CoachingNoteModal.tsx`)

#### Current State (111 lines)

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
  <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
    {/* Header, Tabs, Content, Footer */}
  </div>
</div>
```

**Problem**: Custom modal implementation. On mobile, `max-w-4xl` with `p-4` inset leaves very little margin, and the modal doesn't feel native.

#### Proposed Fix: Replace with Shadcn Dialog (full-screen on mobile)

Install Shadcn Dialog (`npx shadcn@latest add dialog`) and use responsive classes:

```tsx
<DialogContent className="h-full max-h-full w-full max-w-full rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg">
```

- **Mobile**: full-screen (h-full, max-w-full, no border-radius)
- **Desktop**: current centered modal (max-w-4xl, rounded)

This standardizes modal behavior across the app while keeping the mobile experience full-screen and touch-friendly.

#### Additional Dependency

```bash
npx shadcn@latest add dialog
```

The Dialog component provides a semantic wrapper for modal content and shares the same Radix dependency as Sheet.

### Implementation Notes

- Migrate the tab system (View Notes / Add Note) into the new Dialog
- The scrollable content area (`max-h-[60vh] overflow-y-auto`) should use the Dialog's built-in scroll handling
- The footer with Close button maps to `DialogFooter`
- `onClose` callback maps to `onOpenChange`

---

## 2. Button Touch Targets (`src/app/_components/shared/Button.tsx`)

### Current State (51 lines)

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8 text-base",
      },
    },
  },
);
```

### Analysis

| Size | Height | Meets 44px minimum? |
|---|---|---|
| `default` | `h-10` = 40px | ❌ Close but 4px short |
| `sm` | `h-9` = 36px | ❌ 8px short |
| `lg` | `h-11` = 44px | ✅ |

### Proposed Fix

Increase minimum touch target sizes on mobile. Two approaches:

**Option A — Increase base sizes** (simpler):
```tsx
size: {
  default: "h-11 px-4 py-2 text-sm",        // 40px → 44px
  sm: "h-10 px-3 text-sm",                   // 36px → 40px (acceptable for small buttons)
  lg: "h-12 px-8 text-base",                 // 44px → 48px
},
```

**Option B — Responsive sizes** (preserves desktop density):
```tsx
size: {
  default: "h-10 md:h-10 px-4 py-2 text-sm min-h-[44px] md:min-h-0",
  sm: "h-9 px-3 text-sm min-h-[44px] md:min-h-0",
  lg: "h-11 px-8 text-base",
},
```

**Recommendation**: Option A. The 4px increase is negligible on desktop but meaningful for touch. The `lg` variant already meets the target.

### Icon-Only Buttons

Several places use icon-only buttons with explicit sizing like `className="h-8 w-8 p-0"`. These are 32px — well below the 44px minimum. Add a mobile minimum:

```tsx
className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
```

Or create a new `icon` size variant:
```tsx
icon: "h-9 w-9 p-0 md:h-8 md:w-8",
```

---

## 3. Form Input Sizing (iOS Zoom Prevention)

### Problem

iOS Safari automatically zooms in on form inputs with font-size < 16px. Many inputs in the app use `text-sm` (14px) which triggers this zoom.

### What's Already Correct

`src/app/_components/shared/Input.tsx` (the Shadcn-generated Input component) already uses `text-base md:text-sm` — correct iOS zoom prevention out of the box. **No change needed for this file.**

However, most forms in the app use **raw `<input>`, `<select>`, and `<textarea>` elements directly** (not the shared `Input` component), so the global CSS fix is still required.

### Affected Files (raw inputs, not using shared Input.tsx)

- `src/app/profile/page.tsx` — raw `<input>` and `<select>` elements
- `src/app/_components/client/CoachProfile.tsx` — raw `<textarea>` and `<input>` elements
- `src/app/_components/client/StudentProfile.tsx` — raw `<textarea>` and `<select>` elements
- `src/app/_components/client/authed/VideoCollectionForm.tsx` — raw `<input>` elements
- `src/app/_components/client/authed/CoachingNoteForm.tsx` — raw `<textarea>` and `<input>` elements
- `src/app/_components/client/authed/CoachSelector.tsx` — raw `<input>` search element

### Proposed Fix

Add a global CSS rule to prevent iOS zoom on inputs:

```css
/* In globals.css */
@media (max-width: 767px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

This is a single global fix that covers all forms without touching individual components. On desktop, inputs retain their `text-sm` sizing.

**Alternative**: Use `text-base` (16px) on all inputs universally. This is cleaner but slightly changes desktop appearance.

**Recommendation**: The global CSS rule is the least-invasive fix. Apply it in `globals.css`.

---

## 4. Global CSS Additions (`src/styles/globals.css`)

### New Utility Classes

Add mobile-first utility patterns to `globals.css`:

```css
/* Mobile-safe container padding */
.container-mobile {
  @apply px-4 md:px-6;
}

/* Responsive section spacing */
.section-spacing {
  @apply py-10 md:py-16 lg:py-24;
}

/* Safe area insets for notched devices */
.safe-area-inset {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Viewport Meta Tag Verification

Verify that `src/app/layout.tsx` (or Next.js metadata) includes the correct viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Next.js 15 includes this by default via the `metadata` export, but verify `viewport-fit=cover` for notched devices.

### Existing Custom Classes — Mobile Review

| Class | File | Issue |
|---|---|---|
| `.glass-card` | globals.css | Uses `p-6` — may need responsive variant |
| `.glass-panel` | globals.css | Same — verify padding on mobile |
| `.section-heading` | globals.css | Font size may be too large on mobile |
| `.section-subheading` | globals.css | Fine |
| `.nav-link` | globals.css | Used in NavBar — will be updated in nav overhaul |
| `.nav-dropdown` | globals.css | Hover-based — will be replaced in nav overhaul |

### Responsive Font Sizes for Section Headings

**Already done** — `.section-heading` in `globals.css` already has a responsive breakpoint:
```css
.section-heading {
  font-size: 1.875rem; /* 30px on mobile */
}
@media (min-width: 768px) {
  .section-heading { font-size: 2.25rem; } /* 36px on desktop */
}
```

**No change needed.** The Phase 4 step for this is a no-op — remove it from the implementation checklist.

---

## 5. ProfileAvatar (`src/app/_components/shared/ProfileAvatar.tsx`)

Uses size props: `sm`, `md`, `lg`, `xl`. Verify that:
- Size `xl` (used on Coach Detail page) doesn't dominate mobile screen
- All sizes are at least 32px for visual clarity

If `xl` is too large (e.g., 96px+), add responsive sizing:
```tsx
xl: "h-20 w-20 md:h-24 md:w-24",
```

---

## 6. ProfileImageUploader (`src/app/_components/shared/ProfileImageUploader.tsx`)

### Image crop modal — custom modal, needs Dialog treatment

The `ProfileImageUploader` contains a **custom modal** for image cropping (lines 139–164):
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
  <div className="w-full max-w-md rounded-lg bg-white p-6">
```

This is the same pattern as `CoachingNoteModal` — a custom fixed-position overlay. On mobile, `max-w-md` with `p-4` inset works reasonably well (it's narrower than CoachingNoteModal), but it should still be migrated to Shadcn Dialog for consistency:

```tsx
<DialogContent className="w-full max-w-md sm:max-w-md">
```

This is a lower-priority migration since the crop modal is small and works acceptably on mobile. Add to Phase 4.

### Upload button and image preview
- Upload button (`px-4 py-2`) — ~36px height, slightly below 44px. Add `py-2.5` or `min-h-[44px]` for mobile.
- Image preview circle (`h-24 w-24`) — 96px, fine on mobile.
- `flex items-center gap-4` layout — fine at 375px, image + button side by side with enough room.

---

## 7. YouTubeEmbed (`src/app/_components/shared/YouTubeEmbed.tsx`)

Uses `aspect-video` class on iframe container — ✅ responsive by default. No changes needed.

---

## 8. ResourceVideoCard (`src/app/_components/shared/ResourceVideoCard.tsx`)

```tsx
<div className="glass-card animate-slide-up rounded-xl p-6">
```

**Fix**: `p-6` → `p-4 md:p-6` for tighter mobile padding.

---

## 9. CoachDetail Action Buttons — Placeholder Note

`src/app/_components/coaches/CoachDetail.tsx` has two action buttons (`Book a Session`, `Contact`) and a `Send Message` link that are **placeholders** — they don't navigate anywhere yet (`href="#"`, no onClick handlers). The responsive fix (`w-full md:w-auto`) should still be applied so the layout is correct when these features are implemented. Leave a `// TODO: wire up booking/contact functionality` comment when touching these buttons.

---

## 10. CoachSelector Dropdown (`src/app/_components/client/authed/CoachSelector.tsx`)

### Current State

Custom dropdown with `absolute top-full` positioning and `max-h-64 overflow-y-auto`.

### Mobile Considerations

- The dropdown button is full-width (`w-full`) — ✅ good touch target
- Dropdown items have `p-3` padding — ✅ adequate touch targets
- The absolutely-positioned dropdown may overflow the Sheet container on mobile. Add `position: relative` to the parent or use `fixed` positioning on mobile.

### Potential Fix

If the dropdown causes layout issues inside the Sheet:
```tsx
<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 md:max-h-64 ...">
```

Reduce `max-h` on mobile to prevent it from overflowing the viewport.

---

## Files Touched

| File | Changes |
|---|---|
| `src/app/_components/client/authed/CoachingNoteModal.tsx` | Replace custom modal with Shadcn Dialog, full-screen on mobile |
| `src/app/_components/shared/Button.tsx` | Increase touch target sizes, add icon variant |
| `src/styles/globals.css` | iOS zoom prevention, section-heading responsive, utility classes |
| `src/app/_components/shared/ResourceVideoCard.tsx` | Responsive padding |
| `src/app/_components/client/authed/CoachSelector.tsx` | Mobile dropdown max-height |
| `src/app/layout.tsx` | Verify viewport meta tag |

### New Files (Generated by Shadcn CLI)

| File | Source |
|---|---|
| `src/app/_components/shared/Dialog.tsx` | `npx shadcn@latest add dialog` |

---

## New Dependencies

| Package | Purpose |
|---|---|
| `@radix-ui/react-dialog` | Already needed for Sheet; Dialog reuses it |

Note: If Sheet is already installed (Phase 1), Dialog shares the same Radix dependency — no additional package install, just the Shadcn component generation.
