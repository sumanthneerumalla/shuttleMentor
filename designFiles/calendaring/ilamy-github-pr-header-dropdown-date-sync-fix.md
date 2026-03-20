# Title

Use `selectDate` in built-in header dropdown navigation

# Body

## What changed?

This updates the stock header dropdown navigation to use `selectDate` so built-in date jumps fire `onDateChange` consistently.

Without this, the visible calendar can move to a new date range while an app's externally managed selected range remains on the old one, which can leave the UI showing stale or missing events.

In practice, that means a built-in dropdown change can move the calendar while the backend event query still targets the previous range.

- read `selectDate` from context instead of `setCurrentDate`
- use it for month/year/week/day dropdown selection
- keep the rest of the header behavior unchanged

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
