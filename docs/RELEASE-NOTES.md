# Fast Search Card - Release Notes

## Version 1.1.0980 (2026-01-12)
### UI Polish: Icons, Tooltips & Hover Effects

**Release Date:** 12. Januar 2026
**Type:** UI/UX Enhancement
**Breaking Changes:** None

---

### 🎨 What's New

#### Widget Settings - Clean Icon Design
- **Removed emoji icons** from widget settings (☀️ → Weather, 🔔 → Notifications, 🕐 → Time)
- All widgets now use **clean text labels** with SVG icons in the UI
- Consistent design language across all settings tabs

#### Energy Dashboard - Icon Consistency
- **Grid Export** now uses the same icon as **Grid Import**
- Both widgets display the **Transmission Tower icon** (GridConsumptionIcon)
- Better visual consistency in StatsBar

#### Input Fields - Enhanced Readability
- Fixed dark/unreadable text in input fields
- All inputs now use **white text** (`#ffffff`) for high contrast
- Affected areas:
  - Privacy Settings: Max Entities input
  - Privacy Settings: Excluded Patterns input
  - All `.ios-input` and `.ios-number-input` fields

#### tvOS-Style Hover Effects
Complete color inversion on hover for optimal readability:

**SVG Icons** → Turn black on white hover background
**Code Elements** → Black background with white text
**Input Fields** → Black text on white hover background

**User Benefit:** Perfect contrast in all hover states, just like Apple tvOS

#### Comprehensive Tooltips
Added **10 new tooltips** for better user guidance:

**Filter Controls:**
- Grid View / List View toggles
- Category / Area / Type filters
- Filter panel toggle button

**Detail View Tabs:**
- Controls Tab
- Schedule Tab
- History Tab
- Context Tab

**Languages:** All tooltips available in German and English

---

### 📂 Files Changed

**Settings & Privacy:**
- `src/components/tabs/SettingsTab/components/PrivacySettingsTab.jsx`
- `src/components/tabs/SettingsTab/SettingsTab.css`
- `src/system-entities/entities/news/components/iOSSettingsView.css`

**Translations:**
- `src/utils/translations/languages/de.js`
- `src/utils/translations/languages/en.js`

**Navigation:**
- `src/components/SearchField/components/FilterControlPanel.jsx`
- `src/components/SearchField.jsx`
- `src/components/DetailView/TabNavigation.jsx`
- `src/components/DetailView.jsx`

**StatsBar:**
- `src/components/StatsBar.jsx`
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

---

### 🎯 Impact

**Visual Consistency:**
- ✅ No more emojis in Settings UI
- ✅ SVG-only icon system
- ✅ Unified design language

**Accessibility:**
- ✅ High contrast input fields (white on dark)
- ✅ Inverted colors on hover (black on white)
- ✅ Tooltips for all interactive elements

**User Experience:**
- ✅ Better guidance through tooltips
- ✅ Professional, polished appearance
- ✅ Consistent hover feedback
- ✅ Multilingual support (DE/EN)

---

### 🔧 Technical Details

**CSS Changes:**
```css
/* Input fields - white text */
.ios-input { color: #ffffff; }

/* SVG icons - black on hover */
.ios-item:hover:not(:active) .ios-item-left svg {
  color: #000000 !important;
}

/* Code elements - inverted on hover */
.ios-item:hover:not(:active) code.ios-text-strong {
  background: #000000 !important;
  color: #ffffff !important;
}

/* Input text - black on hover */
.ios-item:hover:not(:active) input {
  color: #000000 !important;
}
```

**New Translation Keys:**
```javascript
tooltips: {
  gridView, listView,
  filterCategories, filterAreas, filterTypes,
  toggleFilter,
  controlsTab, scheduleTab, historyTab, contextTab
}
```

---

### 📖 Documentation Updated

- ✅ `docs/CHANGELOG.md` - Detailed changelog entry
- ✅ `docs/settings-guide.md` - Settings system documentation
- ✅ `docs/system_entities_analysis.md` - Architecture analysis
- ✅ `docs/RELEASE-NOTES.md` - This file

---

### 🚀 Upgrade Notes

**No Breaking Changes:**
- All existing settings preserved
- localStorage structure unchanged
- No migration needed

**What to Expect:**
- Cleaner Settings UI without emojis
- Better readability in input fields
- New tooltips on hover
- Consistent Energy icons in StatsBar

**Compatibility:**
- Home Assistant: All versions
- Browsers: Chrome, Firefox, Safari, Edge
- Languages: German (DE), English (EN)

---

### 🐛 Bug Fixes

- **Fixed:** Dark/unreadable text in input fields
- **Fixed:** Missing tooltips on filter controls
- **Fixed:** Missing tooltips on detail view tabs
- **Fixed:** Inconsistent Energy Dashboard icons

---

### 📝 Full Changelog

For a complete list of changes since v1.1.0979, see:
- [CHANGELOG.md](./CHANGELOG.md)
- [Settings Guide](./settings-guide.md)

---

**Previous Version:** v1.1.0979 (Settings UI Improvements & Reorganization)
**Next Version:** TBD

---

*Fast Search Card - A visionOS-inspired Lovelace Card for Home Assistant*
