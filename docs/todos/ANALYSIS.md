# Todo System-Entity: Vollständige Analyse

**Version:** 1.0
**Datum:** 2026-01-22
**Status:** Produktiv

---

## Übersicht

Die Todo System-Entity ist eine vollständige iOS Reminders-Clone Implementierung für Home Assistant. Sie ist die feature-reichste System-Entity im Projekt mit umfangreichen CRUD-Operationen, Filter-/Sortier-Funktionen und einem kompletten Settings-System.

### Dateien

```
src/system-entities/entities/todos/
├── index.jsx                           (620 lines) - Entity Definition & API Actions
├── TodosView.jsx                       (1053 lines) - Main List View
├── TodoDetailView.jsx                  (737 lines) - Edit Dialog
├── TodoAddDialog.jsx                   (531 lines) - Add Dialog
├── components/
│   └── TodosSettingsView.jsx          (628 lines) - Settings View
└── styles/
    ├── TodosView.css
    ├── TodoDetailView.css
    └── TodoAddDialog.css
```

**Total:** ~3569 Lines of Code

---

## Architektur

### Design Pattern: iOS Reminders Clone

Die Implementierung folgt dem iOS Reminders Design-System:

- **Multi-View Architecture** - Separierte Views für List/Detail/Add/Settings
- **iOS-Style Components** - Navbar, Cards, Toggles, Pickers
- **Spring Animations** - Framer Motion mit iOS-artigen Transitions
- **Feature Detection** - Automatische Erkennung von List-Capabilities
- **Local Storage** - Settings & Cache Persistence

### Component-Hierarchie

```
TodosView (Main Container)
├── Filter Bar (Horizontal Scroll mit Tabs)
│   ├── Tab: All
│   ├── Tab: Incomplete
│   ├── Tab: Today
│   ├── Tab: Overdue
│   ├── Tab: Completed
│   └── Tab: [List Names...] (dynamisch)
│
├── Todo List
│   └── Todo Cards (Checkbox + Content + Meta)
│
├── AnimatePresence (Conditional Views)
│   ├── TodoDetailView (Edit Mode)
│   ├── TodoAddDialog (Create Mode)
│   └── TodosSettingsView (Settings Mode)
│
└── CustomScrollbar (macOS-Style Indicator)
```

---

## Features

### ✅ Implementiert

#### CRUD Operations
- ✅ Create Todo
- ✅ Read Todos (Multi-List Support)
- ✅ Update Todo (Edit Dialog)
- ✅ Delete Todo (mit Confirmation)
- ✅ Toggle Complete/Incomplete
- ✅ Remove All Completed

#### Filter & Sortierung
- ✅ **5 Basis-Filter:** All, Incomplete, Today, Overdue, Completed
- ✅ **List-Filter:** Dynamische Tabs pro Todo-Liste
- ✅ **4 Sortierungen:** Due Date, Alphabetical, List, Created Date
- ✅ **Auto-Hide Completed:** 1, 3, 7, 14, 30 Tage

#### Smart Features
- ✅ **Feature Detection:** Erkennt Date/Time/Description Support
- ✅ **Shopping List Detection:** Deaktiviert Features automatisch
- ✅ **Overdue Detection:** Rote Markierung überfälliger Todos
- ✅ **Today Badge:** Separate Ansicht für heutige Todos
- ✅ **Count Badges:** Live-Counts in Filter-Tabs

#### Settings
- ✅ List Enable/Disable
- ✅ Visible Tabs Configuration
- ✅ Default Filter
- ✅ Sort Preference
- ✅ Show Completed Toggle
- ✅ Auto-Hide Days

#### UI/UX
- ✅ iOS-Style Animations (Slide, Spring, Fade)
- ✅ iOS Date/Time Pickers (Scroll Wheels)
- ✅ CustomScrollbar Integration
- ✅ Horizontal Tab Scroll Indicators
- ✅ iOS Checkboxes mit Animation
- ✅ Action Sheet (Delete Confirmation)
- ✅ Responsive Design

### ❌ Fehlt (siehe ROADMAP.md)

- ❌ Recurrence/Repeat
- ❌ Priority/Importance
- ❌ Subtasks
- ❌ Tags/Labels
- ❌ Attachments
- ❌ Location-Based Reminders
- ❌ Swipe-to-Delete
- ❌ Bulk Actions
- ❌ Natural Language Input

---

## API Integration

### Home Assistant Todo API

```javascript
// WebSocket API
{
  type: 'todo/item/list',
  entity_id: 'todo.shopping_list'
}
→ { items: [...] }

// Services
hass.callService('todo', 'add_item', {...})
hass.callService('todo', 'update_item', {...})
hass.callService('todo', 'remove_item', {...})
hass.callService('todo', 'remove_completed_items', {...})
```

### Feature Detection

```javascript
// supported_features Bitfield:
// Bit 1 (1): Due Date Support
// Bit 2 (2): Due DateTime Support
// Bit 3 (4): Description Support

const features = entity.attributes.supported_features || 0;
const supportsDate = (features & 1) !== 0 || (features & 2) !== 0;
const supportsTime = (features & 2) !== 0;
const supportsDescription = (features & 4) !== 0;
```

### Shopping List Exception

```javascript
// Einkaufslisten unterstützen keine Dates
const entityName = entity.attributes.friendly_name.toLowerCase();
const isShoppingList = entityName.includes('einkauf') || entityName.includes('shopping');
if (isShoppingList) {
  // Disable all date/time/description features
}
```

---

## State Management

### Local Storage

```javascript
// Settings
localStorage.setItem('todosSettings', JSON.stringify({
  lists: {
    'todo.work': { enabled: true },
    'todo.shopping_list': { enabled: false }
  },
  display: {
    showCompleted: true,
    autoHideAfterDays: 7,
    defaultFilter: 'all',
    sortBy: 'dueDate'
  },
  visibleTabs: {
    all: true,
    incomplete: true,
    today: true,
    overdue: true,
    completed: true
  }
}));

// Cache
localStorage.setItem('todosCache', JSON.stringify({
  todos: [...],
  timestamp: Date.now()
}));
```

### Entity Attributes

```javascript
{
  todos: [],                    // Current todos
  incomplete_count: 0,          // Count of needs_action
  total_todos: 0,               // Total count
  overdue_count: 0,             // Overdue count
  today_count: 0,               // Due today count
  last_update: null,            // ISO timestamp
  available_lists: [],          // Todo list entities
  has_todo_integration: false   // HA integration check
}
```

---

## Performance

### Current Performance

- **Initial Load:** ~300-500ms (mit Cache)
- **Filter Change:** ~50ms (re-filter)
- **Sort Change:** ~100ms (re-sort)
- **WebSocket Fetch:** ~200ms pro Liste (sequentiell)

### Performance Issues

1. **N+1 WebSocket Calls** - Sequentielle Fetches statt parallel
2. **No Memoization** - Filter/Sort läuft bei jedem Setting-Change
3. **Full Re-Render** - Kein virtuelles Scrolling bei >100 Todos
4. **localStorage Limits** - Keine Quota-Checks oder LRU Eviction

---

## Code Quality

### Stärken

- ✅ Clean Architecture (Separation of Concerns)
- ✅ Defensive Programming (Feature Detection)
- ✅ Good Error Handling (Graceful Fallback zu Mock-Data)
- ✅ Consistent Design (iOS Design-System)
- ✅ Good Documentation (Inline Comments)

### Schwächen

- ❌ **Code-Duplikation:** TodoAddDialog & TodoDetailView teilen 90% Code
- ❌ **CSS-Duplikation:** Overlapping Styles zwischen Views
- ❌ **Magic Numbers:** Hardcoded Delays, Scroll-Amounts
- ❌ **No Type Safety:** Kein TypeScript oder PropTypes
- ❌ **Missing Tests:** Keine Unit/Integration Tests

---

## Dependencies

### External

- `preact` - UI Framework
- `framer-motion` - Animations
- `CustomScrollbar` - Shared Component
- `IOSTimePicker` - Date/Time Pickers

### Internal

- `SystemEntity` - Base Class
- `ActionSheet` - Confirmation Dialog
- `translateUI` - i18n (minimal genutzt)

---

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ⚠️ localStorage required
- ⚠️ ES6+ required (no IE11)

---

## Known Issues

### Critical

1. **Race Conditions:** Schnelle Toggle-Clicks können zu inkonsistentem State führen
2. **WebSocket Failures:** Keine Retry-Logic bei Connection-Loss
3. **localStorage Quota:** Keine Handling bei vollen 5-10MB Limits

### Non-Critical

4. **No Offline Support:** Keine Sync-Queue für offline updates
5. **No Loading States:** Während API-Calls keine Spinner
6. **No Error Toast:** Fehler nur in Console

---

## Metrics

### Bundle Size

- **TodosView.jsx:** ~35KB (unminified)
- **TodoDetailView.jsx:** ~25KB (unminified)
- **TodoAddDialog.jsx:** ~18KB (unminified)
- **TodosSettingsView.jsx:** ~20KB (unminified)
- **CSS:** ~15KB (combined)

**Total:** ~113KB (unminified), ~40KB (minified + gzip)

### Complexity

- **Cyclomatic Complexity:** Medium (filterTodos: 8, sortTodos: 5)
- **Cognitive Complexity:** Medium-High (verschachtelte Callbacks)
- **Lines per Function:** Average 25 (ok)

---

## Future Considerations

### Scalability

- **100+ Todos:** Performance ok (mit Optimierungen)
- **1000+ Todos:** Virtual Scrolling nötig
- **10+ Lists:** UI Clutter - List-Gruppen nötig

### Maintainability

- **Code Refactoring:** Shared Components nötig
- **TypeScript Migration:** Würde Bugs vermeiden
- **Testing:** E2E Tests für kritische Flows

---

## Vergleich mit iOS Reminders

| Feature | iOS Reminders | Fast Search Todos | Status |
|---------|---------------|-------------------|--------|
| Create/Edit/Delete | ✅ | ✅ | Complete |
| Lists | ✅ | ✅ | Complete |
| Due Date/Time | ✅ | ✅ | Complete |
| Description | ✅ | ✅ | Complete |
| Priority | ✅ | ❌ | Missing |
| Recurrence | ✅ | ❌ | Missing |
| Subtasks | ✅ | ❌ | Missing |
| Tags | ✅ | ❌ | Missing |
| Location Reminders | ✅ | ❌ | Missing |
| Attachments | ✅ | ❌ | Missing |
| Siri Integration | ✅ | ❌ | N/A |
| iCloud Sync | ✅ | HA Sync | Different |
| Swipe Gestures | ✅ | ❌ | Missing |
| Natural Language | ✅ | ❌ | Missing |

**Parity:** ~55% (6/11 Core Features)

---

## Zusammenfassung

Die Todo System-Entity ist eine **solide, produktionsreife Implementierung** mit exzellentem iOS-Design und guten Core-Features.

**Hauptstärken:**
- Sehr gute UI/UX
- Clean Architecture
- Feature Detection
- Multi-List Support

**Hauptschwächen:**
- Fehlende Advanced Features (Priority, Recurrence, Tags)
- Code-Duplikation
- Performance-Optimierungen nötig
- Keine Tests

**Empfehlung:** Refactoring vor neuen Features (siehe ROADMAP.md)
