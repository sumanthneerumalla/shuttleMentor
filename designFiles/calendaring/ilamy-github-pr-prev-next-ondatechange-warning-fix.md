# Title

Fix `onDateChange` callback timing in prev/next navigation

# Body

## What changed?

This changes prev/next navigation so ilamy no longer calls `onDateChange` from inside the `setCurrentDate` updater.

- compute `newDate` outside the updater
- call `setCurrentDate(newDate)`
- call `onDateChange?.(newDate)` after that

This avoids the React warning path while keeping prev/next navigation behavior and callback semantics the same from the caller's point of view.

It also adds a stock-header regression test that renders the calendar with parent-owned date state, clicks the built-in prev/next navigation, and verifies the React warning is not emitted.

## Type of Change

- [x] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation
- [ ] 🔧 Maintenance

## Checklist

- [x] CI passes locally (`bun run ci`)
- [x] Changes are tested
- [x] Code follows project standards
