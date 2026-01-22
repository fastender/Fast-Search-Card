# Todo System-Entity: Architektur-Dokumentation

**Version:** 1.0
**Datum:** 2026-01-22

---

## System-Übersicht

Die Todo System-Entity ist eine **iOS Reminders-inspirierte** Todo-Verwaltung für Home Assistant, die als System-Entity implementiert ist und vollständige CRUD-Operationen über die Home Assistant WebSocket API bereitstellt.

### Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                        DetailView.jsx                           │
│                     (App Container Level)                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              TabNavigation.jsx                            │ │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐                                 │ │
│  │  │ ◀ │ │ ⚙ │ │ + │ │ ⟳ │  (Action Buttons)               │ │
│  │  └───┘ └───┘ └───┘ └───┘                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              TodosView.jsx (Main View)                    │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │      Filter Bar (Horizontal Scroll)                 │ │ │
│  │  │  [All] [Incomplete] [Today] [Overdue] [Completed]   │ │ │
│  │  │  [📋 Work] [📋 Shopping]                            │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │      Todos List (Scrollable)                        │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │ [ ] Buy Milk                        Shopping │  │ │ │
│  │  │  │     Today · Buy groceries                    │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │ [✓] Code Review                          Work │  │ │ │
│  │  │  │     Yesterday · PR #123                      │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │ [ ] Meeting Prep                         Work │  │ │ │
│  │  │  │     Tomorrow 14:00 · Presentation            │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │      CustomScrollbar (Indicator)                    │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          Conditional Views (AnimatePresence)              │ │
│  │                                                           │ │
│  │  • TodoDetailView.jsx    (Edit Mode)                     │ │
│  │  • TodoAddDialog.jsx     (Create Mode)                   │ │
│  │  • TodosSettingsView.jsx (Settings Mode)                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

          ▲                           │
          │                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TodosEntity (index.jsx)                      │
│                                                                 │
│  Actions:                                                       │
│  • getTodos()          • updateTodo()                           │
│  • addTodo()           • deleteTodo()                           │
│  • toggleComplete()    • removeCompleted()                      │
│  • refreshTodos()                                               │
│                                                                 │
│  State:                                                         │
│  • attributes.todos                                             │
│  • attributes.incomplete_count                                  │
│  • attributes.overdue_count                                     │
│  • attributes.available_lists                                   │
└─────────────────────────────────────────────────────────────────┘

          ▲                           │
          │                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Home Assistant WebSocket API                       │
│                                                                 │
│  • callWS({ type: 'todo/item/list', entity_id })               │
│  • callService('todo', 'add_item', { ... })                     │
│  • callService('todo', 'update_item', { ... })                  │
│  • callService('todo', 'remove_item', { ... })                  │
└─────────────────────────────────────────────────────────────────┘

          ▲                           │
          │                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      localStorage                               │
│                                                                 │
│  • todosSettings (Preferences)                                  │
│  • todosCache (Offline Cache)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component-Hierarchie

### TodosView.jsx (Main Component)

```jsx
<TodosView entity={todosEntity} hass={hass} lang="de" onBack={...}>
  {/* Global State Ref */}
  window._todosViewRef = {
    handleOpenSettings,
    handleOverview,
    handleRefresh,
    handleBackNavigation,
    handleAdd,
    getActiveButton,
    selectedTodo,
    showSettings,
    incompleteCount,
    overdueCount,
    todayCount
  }

  {/* Conditional Rendering */}
  <AnimatePresence mode="wait">
    {showSettings ? (
      <TodosSettingsView
        settings={settings}
        todos={todos}
        availableLists={availableLists}
        onToggleListEnabled={handleToggleListEnabled}
        onUpdateSetting={handleUpdateSetting}
      />
    ) : selectedTodo ? (
      <TodoDetailView
        todo={selectedTodo}
        availableLists={availableLists}
        hass={hass}
        onSave={handleDetailSave}
        onCancel={handleDetailCancel}
        onDelete={handleDetailDelete}
      />
    ) : showAddDialog ? (
      <TodoAddDialog
        availableLists={availableLists}
        hass={hass}
        onAdd={handleAddTodo}
        onCancel={() => setShowAddDialog(false)}
      />
    ) : (
      <motion.div> {/* Main View */}
        <FilterBar />
        <TodosList />
        <CustomScrollbar />
      </motion.div>
    )}
  </AnimatePresence>
</TodosView>
```

---

## Data Flow

### 1. Initial Load

```
User opens Todos
     │
     ▼
DetailView.jsx rendert TodosView
     │
     ▼
TodosView.useEffect() → entity.getTodos({ hass })
     │
     ▼
getTodos() → _checkTodoAvailability(hass)
     │
     ├─── ✅ Has todo.* entities
     │         │
     │         ▼
     │    _fetchFromHomeAssistant(hass)
     │         │
     │         ├─ hass.states → filter todo.* entities
     │         │
     │         ├─ For each list:
     │         │    hass.callWS({ type: 'todo/item/list', entity_id })
     │         │
     │         └─ Merge all todos
     │
     └─── ❌ No todo integration
              │
              ▼
         _getMockTodos() (Fallback)
     │
     ▼
Load settings from localStorage
     │
     ▼
_applyFilters(todos, settings)
     │
     ▼
Update entity.attributes
     │
     ▼
TodosView.setTodos(todos)
     │
     ▼
Render UI
```

---

### 2. Create Todo

```
User clicks Add Button
     │
     ▼
TabNavigation.handleAdd()
     │
     ▼
window._todosViewRef.handleAdd()
     │
     ▼
TodosView.setShowAddDialog(true)
     │
     ▼
TodoAddDialog renders
     │
User fills form & clicks Create
     │
     ▼
TodoAddDialog.handleCreate()
     │
     ▼
onAdd({ listId, summary, description, dueDate })
     │
     ▼
TodosView.handleAddTodo()
     │
     ▼
entity.executeAction('addTodo', { hass, ... })
     │
     ▼
addTodo() → hass.callService('todo', 'add_item', {
              entity_id: listId,
              item: summary,
              description: description,
              due_datetime: dueDate
            })
     │
     ▼
Reload todos: getTodos({ hass, refresh: true })
     │
     ▼
Update UI
```

---

### 3. Toggle Complete

```
User clicks Checkbox
     │
     ▼
TodoCard.onChange → handleToggleComplete(todo, e)
     │
     ▼
entity.executeAction('toggleComplete', {
  hass,
  listId: todo.listId,
  uid: todo.uid,
  currentStatus: todo.status
})
     │
     ▼
toggleComplete() → hass.callService('todo', 'update_item', {
                     entity_id: listId,
                     item: uid,
                     status: newStatus
                   })
     │
     ▼
Update local cache: _cacheTodos(updatedTodos)
     │
     ▼
Reload todos: getTodos({ hass, refresh: true })
     │
     ▼
Update UI (Optimistic already shown)
```

---

### 4. Filter Change

```
User clicks Filter Tab
     │
     ▼
FilterBar.onClick → setActiveFilter('today')
     │
     ▼
useEffect([activeFilter, todos, settings], ...)
     │
     ▼
filterTodos(activeFilter)
     │
     ├─ Apply list enable/disable filter
     │
     ├─ Apply completed filter (with auto-hide)
     │
     ├─ Apply active filter (today/overdue/...)
     │
     └─ Apply sorting (dueDate/alphabetical/...)
     │
     ▼
setFilteredTodos(filtered)
     │
     ▼
Re-render TodosList with filtered items
```

---

## State Management

### Entity State (TodosEntity)

```javascript
// Managed in src/system-entities/entities/todos/index.jsx

class TodosEntity extends SystemEntity {
  constructor() {
    super({
      attributes: {
        todos: [],                  // All todos from all lists
        incomplete_count: 0,        // Count of needs_action
        total_todos: 0,             // Total count
        overdue_count: 0,           // Overdue count
        today_count: 0,             // Due today count
        last_update: null,          // ISO timestamp
        available_lists: [],        // List of todo list entities
        has_todo_integration: false // HA integration check
      }
    });
  }

  // Called on entity mount
  async onMount(context) {
    await this.mountWithRetry(context, async (hass) => {
      await this.actions.getTodos.call(this, { hass });
    });
  }

  // Update attributes and trigger UI refresh
  updateAttributes(newAttrs) {
    this.attributes = { ...this.attributes, ...newAttrs };
    // Triggers 'system-entity-updated' event
    this.emit('update', this.attributes);
  }
}
```

---

### Component State (TodosView)

```javascript
// Local UI State
const [todos, setTodos] = useState([]);
const [filteredTodos, setFilteredTodos] = useState([]);
const [activeFilter, setActiveFilter] = useState('all');
const [selectedTodo, setSelectedTodo] = useState(null);
const [showSettings, setShowSettings] = useState(false);
const [showAddDialog, setShowAddDialog] = useState(false);
const [settings, setSettings] = useState(() => loadSettings());

// Global Ref für TabNavigation
window._todosViewRef = {
  handleOpenSettings,
  handleOverview,
  handleRefresh,
  handleBackNavigation,
  handleAdd,
  getActiveButton: () => activeButton,
  selectedTodo,
  showSettings,
  incompleteCount,
  overdueCount,
  todayCount
};
```

---

### Persistent State (localStorage)

```javascript
// Settings
{
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
}

// Cache
{
  todos: [...],
  timestamp: 1737552000000
}
```

---

## API Integration

### Home Assistant WebSocket API

#### Get Todo Items

```javascript
const response = await hass.callWS({
  type: 'todo/item/list',
  entity_id: 'todo.shopping_list'
});

// Response:
{
  items: [
    {
      uid: 'abc123',
      summary: 'Buy milk',
      description: '2% fat, 1 liter',
      status: 'needs_action',
      due: '2026-01-23T00:00:00'
    },
    ...
  ]
}
```

#### Add Todo Item

```javascript
await hass.callService('todo', 'add_item', {
  entity_id: 'todo.shopping_list',
  item: 'Buy milk',
  description: '2% fat',
  due_date: '2026-01-23',        // Date only: YYYY-MM-DD
  due_datetime: '2026-01-23 14:00:00'  // Date + Time: YYYY-MM-DD HH:MM:SS
});
```

#### Update Todo Item

```javascript
await hass.callService('todo', 'update_item', {
  entity_id: 'todo.shopping_list',
  item: 'abc123',  // UID
  rename: 'Buy organic milk',
  description: 'Updated description',
  due_datetime: '2026-01-24 09:00:00',
  status: 'completed'
});
```

#### Delete Todo Item

```javascript
await hass.callService('todo', 'remove_item', {
  entity_id: 'todo.shopping_list',
  item: ['abc123', 'def456']  // Array of UIDs
});
```

#### Remove All Completed

```javascript
await hass.callService('todo', 'remove_completed_items', {
  entity_id: 'todo.shopping_list'
});
```

---

## Feature Detection

### Supported Features Bitfield

Home Assistant todo entities haben ein `supported_features` Attribut:

```javascript
// Entity attributes
{
  friendly_name: "Shopping List",
  supported_features: 7  // Binary: 0b111
}

// Bit Mapping:
// Bit 0 (1):  Supports Due Date (date only)
// Bit 1 (2):  Supports Due DateTime (date + time)
// Bit 2 (4):  Supports Description
// Bit 3 (8):  Reserved for future use
// ...

// Feature Detection Logic:
const features = entity.attributes.supported_features || 0;

const supportsDate = (features & 1) !== 0 || (features & 2) !== 0;
const supportsTime = (features & 2) !== 0;
const supportsDescription = (features & 4) !== 0;
```

### Shopping List Exception

```javascript
// Shopping lists typically don't support dates/times
const entityName = (entity.attributes.friendly_name || entity.entity_id).toLowerCase();
const isShoppingList = entityName.includes('einkauf') || entityName.includes('shopping');

if (isShoppingList) {
  // Override feature detection
  supportsDate = false;
  supportsTime = false;
  supportsDescription = false;
}
```

---

## Performance Optimizations

### Current Performance Bottlenecks

1. **Sequential WebSocket Calls**
   - Problem: `for...await` loop fetches lists one by one
   - Impact: 10 lists = ~2-5 seconds
   - Solution: `Promise.all()` for parallel fetching

2. **No Memoization**
   - Problem: `filterTodos()` re-runs on every setting change
   - Impact: Unnecessary re-calculations
   - Solution: `useMemo()` for filtered/sorted todos

3. **Full Re-Renders**
   - Problem: Entire list re-renders on state change
   - Impact: Laggy UI with >100 todos
   - Solution: `React.memo()` for todo cards, `useCallback()` for handlers

4. **No Virtual Scrolling**
   - Problem: All todos rendered at once
   - Impact: Slow scroll with >100 todos
   - Solution: `@tanstack/react-virtual`

---

## Error Handling

### Network Errors

```javascript
try {
  await hass.callService('todo', 'add_item', {...});
} catch (error) {
  console.error('Failed to add todo:', error);
  // TODO: Show error toast to user
  // TODO: Retry logic
  throw error;
}
```

### Missing HASS

```javascript
if (!hass || !hass.states) {
  console.error('HASS not available');
  return [];  // Return empty array, don't crash
}
```

### localStorage Quota

```javascript
try {
  localStorage.setItem('todosCache', JSON.stringify(cache));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('localStorage quota exceeded, clearing cache');
    localStorage.removeItem('todosCache');
    // TODO: Implement LRU eviction
  }
}
```

---

## Animation System

### Framer Motion Transitions

#### Slide Animations (View Changes)

```javascript
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentView}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  >
    {/* View content */}
  </motion.div>
</AnimatePresence>
```

#### List Item Animations

```javascript
<motion.div
  className="todo-card"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{
    type: "spring",
    damping: 25,
    stiffness: 120,
    delay: index * 0.05  // Staggered animation
  }}
>
  {/* Todo content */}
</motion.div>
```

---

## Security Considerations

### Input Validation

```javascript
// Summary: Max 500 characters
if (summary.length > 500) {
  throw new Error('Summary too long');
}

// Description: Max 2000 characters
if (description && description.length > 2000) {
  throw new Error('Description too long');
}

// Sanitize HTML in descriptions
import DOMPurify from 'dompurify';
const cleanDescription = DOMPurify.sanitize(description);
```

### localStorage Security

```javascript
// Don't store sensitive data
// All data is visible to client-side JavaScript
// No credentials or tokens in localStorage

// Consider encryption for sensitive todos (future)
```

---

## Testing Strategy

### Unit Tests

```javascript
// Test entity actions
describe('TodosEntity', () => {
  test('getTodos fetches from HA API', async () => {
    const mockHass = { ... };
    const todos = await entity.getTodos({ hass: mockHass });
    expect(todos).toHaveLength(3);
  });

  test('filterTodos respects settings', () => {
    const filtered = filterTodos(todos, settings);
    expect(filtered).not.toContain(disabledListTodo);
  });
});
```

### Integration Tests

```javascript
// Test component interactions
describe('TodosView', () => {
  test('clicking todo opens detail view', () => {
    render(<TodosView entity={entity} hass={hass} />);
    const todoCard = screen.getByText('Buy milk');
    fireEvent.click(todoCard);
    expect(screen.getByText('Edit Todo')).toBeInTheDocument();
  });
});
```

### E2E Tests

```javascript
// Test full user flows
test('user can create todo', async ({ page }) => {
  await page.goto('/todos');
  await page.click('[data-testid="add-button"]');
  await page.fill('[placeholder="Todo-Titel"]', 'New todo');
  await page.click('[data-testid="create-button"]');
  await expect(page.getByText('New todo')).toBeVisible();
});
```

---

## Deployment

### Build Process

```bash
# Development
npm run dev

# Production Build
npm run build

# Output: dist/assets/todos-*.js (code-split)
```

### Code Splitting

```javascript
// Lazy load view component
viewComponent: () => import('./TodosView.jsx')

// Automatically creates separate chunk:
// dist/assets/TodosView-abc123.js
```

---

## Monitoring & Logging

### Console Logging

```javascript
// Prefix all logs with 📋
console.log('📋 getTodos called', { hasHass: !!hass });
console.log('📋 [CHECK] Todo entities found:', count);
console.log('📋 ✅ Refresh complete! Loaded N todos');
console.error('❌ Failed to add todo:', error);
```

### Performance Monitoring

```javascript
// TODO: Add performance marks
performance.mark('todos-fetch-start');
await fetchTodos();
performance.mark('todos-fetch-end');
performance.measure('todos-fetch', 'todos-fetch-start', 'todos-fetch-end');
```

---

## Accessibility

### ARIA Labels

```javascript
<button aria-label={lang === 'de' ? 'Aufgabe hinzufügen' : 'Add todo'}>
  +
</button>

<input
  type="checkbox"
  aria-label={`${lang === 'de' ? 'Erledigt' : 'Complete'}: ${todo.summary}`}
/>
```

### Keyboard Navigation

```javascript
// Tab through todos
// Enter to open detail
// Space to toggle checkbox
// Escape to close dialogs
```

---

## Migration Guide

### localStorage Schema Changes

```javascript
// When changing settings schema, migrate old data
function loadSettings() {
  const saved = localStorage.getItem('todosSettings');
  if (saved) {
    const parsed = JSON.parse(saved);

    // Migration: Add new fields with defaults
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      display: {
        ...DEFAULT_SETTINGS.display,
        ...parsed.display
      },
      // New field in v2.0
      visibleTabs: parsed.visibleTabs || DEFAULT_SETTINGS.visibleTabs
    };
  }
  return DEFAULT_SETTINGS;
}
```

---

## FAQ

**Q: Warum nicht Redux/Zustand für State Management?**
A: SystemEntity bietet zentrales State-Management. Local state reicht für UI. Overhead nicht nötig.

**Q: Warum localStorage statt IndexedDB?**
A: Einfachheit. Datenvolumen (<5MB) passt in localStorage. IndexedDB wäre Overkill.

**Q: Warum Preact statt React?**
A: Projekt-weite Entscheidung. Preact = kleiner Bundle (~3KB vs ~40KB).

**Q: Warum keine Real-Time Sync?**
A: Home Assistant WebSocket gibt keine Events für Todo-Changes. Polling wäre ineffizient.

**Q: Warum Mock-Data Fallback?**
A: Entwicklung & Demo ohne HA-Installation. Bessere DX.
