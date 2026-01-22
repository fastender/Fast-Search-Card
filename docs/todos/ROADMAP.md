# Todo System-Entity: Development Roadmap

**Version:** 1.0
**Letzte Aktualisierung:** 2026-01-22

---

## Roadmap Übersicht

Diese Roadmap definiert die priorisierten Verbesserungen und neuen Features für die Todo System-Entity, basierend auf der technischen Analyse vom 2026-01-22.

---

## Phase 1: Refactoring & Performance (Q1 2026)

**Ziel:** Code-Qualität verbessern, Performance optimieren, Technical Debt reduzieren

### 1.1 Code-Duplikation eliminieren

**Priority:** 🔥 HIGH
**Effort:** Medium (2-3 Tage)
**Impact:** High (Code Maintainability)

#### Tasks:
- [ ] Erstelle `components/TodoFormDialog.jsx` als Shared Component
- [ ] Refactor `TodoAddDialog.jsx` zu nutzen
- [ ] Refactor `TodoDetailView.jsx` zu nutzen
- [ ] Extrahiere Feature-Detection in Custom Hook `useListFeatures()`
- [ ] Extrahiere Picker-Logic in Custom Hooks `useDatePicker()`, `useTimePicker()`

**Ergebnis:** -500 LOC, bessere Wartbarkeit

---

### 1.2 Performance-Optimierungen

**Priority:** 🔥 HIGH
**Effort:** Small (1-2 Tage)
**Impact:** High (User Experience)

#### Tasks:
- [ ] **Parallel WebSocket Fetching**
  ```javascript
  // Statt sequentiell:
  for (const list of lists) {
    await fetchList(list);
  }

  // Parallel:
  const allTodos = await Promise.all(
    lists.map(list => fetchList(list))
  );
  ```
  **Impact:** 10 Listen: 5s → 0.5s

- [ ] **Memoization für Filter/Sort**
  ```javascript
  const filteredTodos = useMemo(() => {
    return filterAndSortTodos(todos, activeFilter, settings);
  }, [todos, activeFilter, settings.display.sortBy]);
  ```

- [ ] **Debouncing für Toggle-Actions**
  ```javascript
  const debouncedToggle = useDebouncedCallback(handleToggle, 300);
  ```

- [ ] **Virtual Scrolling für >100 Todos**
  ```javascript
  import { useVirtualizer } from '@tanstack/react-virtual';
  ```

**Ergebnis:** 10x schnellerer Load, flüssigere UI

---

### 1.3 Optimistic UI Updates

**Priority:** 🔥 HIGH
**Effort:** Small (1 Tag)
**Impact:** Medium (UX gefühlt schneller)

#### Tasks:
- [ ] Sofortiges UI-Update bei Toggle
- [ ] Rollback bei API-Error
- [ ] Loading-States für API-Calls
- [ ] Success/Error Toasts

```javascript
const handleToggleComplete = async (todo) => {
  // 1. Optimistic Update
  const newStatus = todo.status === 'completed' ? 'needs_action' : 'completed';
  setTodos(prev => prev.map(t =>
    t.uid === todo.uid ? { ...t, status: newStatus } : t
  ));

  // 2. API Call
  try {
    await entity.executeAction('toggleComplete', { ... });
  } catch (error) {
    // 3. Rollback on error
    setTodos(originalTodos);
    showErrorToast(error);
  }
};
```

---

### 1.4 localStorage Improvements

**Priority:** 🔶 MEDIUM
**Effort:** Small (1 Tag)
**Impact:** Low (Edge-Case Handling)

#### Tasks:
- [ ] Quota-Error Handling
- [ ] LRU Eviction bei vollen Cache
- [ ] Cache-Size Monitoring
- [ ] Fallback zu IndexedDB wenn localStorage voll

```javascript
const CACHE_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB

function _cacheTodos(todos) {
  try {
    const data = JSON.stringify({ todos, timestamp: Date.now() });

    if (data.length > CACHE_SIZE_LIMIT) {
      // LRU: Entferne älteste completed todos
      todos = evictOldestCompleted(todos);
    }

    localStorage.setItem('todosCache', data);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Fallback: Clear old cache
      clearOldCache();
      retry();
    }
  }
}
```

---

### 1.5 CSS Refactoring

**Priority:** 🔷 LOW
**Effort:** Small (1 Tag)
**Impact:** Low (Code Organization)

#### Tasks:
- [ ] Erstelle `styles/ios-components.css` (Shared Styles)
- [ ] Extrahiere `.ios-navbar`, `.ios-item`, `.ios-card`
- [ ] Reduziere Duplikation zwischen TodosView/Detail/Add

**Ergebnis:** -200 LOC CSS, bessere Consistency

---

## Phase 2: Core Features (Q2 2026)

**Ziel:** Feature-Parity mit iOS Reminders erhöhen

### 2.1 Priority/Importance

**Priority:** 🔥 HIGH
**Effort:** Small (2 Tage)
**Impact:** High (Häufig gewünschtes Feature)

#### Implementation:

```javascript
// 1. Neue Property
{
  uid: '1',
  summary: 'Todo',
  priority: 0  // 0=None, 1=Low, 2=Medium, 3=High
}

// 2. UI in TodoDetailView
<div className="ios-item">
  <div className="ios-item-label">Priority</div>
  <div className="priority-selector">
    <button className={priority === 0 ? 'active' : ''}>None</button>
    <button className={priority === 1 ? 'active' : ''}>! Low</button>
    <button className={priority === 2 ? 'active' : ''}>!! Medium</button>
    <button className={priority === 3 ? 'active' : ''}>!!! High</button>
  </div>
</div>

// 3. Visual Indicator in Todo Card
<div className={`todo-card priority-${todo.priority}`}>
  {todo.priority > 0 && (
    <span className="priority-badge">
      {'!'.repeat(todo.priority)}
    </span>
  )}
</div>

// 4. Sort by Priority
case 'priority':
  sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  break;
```

#### Tasks:
- [ ] Add priority property to todo schema
- [ ] UI in TodoDetailView
- [ ] UI in TodoAddDialog
- [ ] Visual badges in todo cards
- [ ] Sort by priority
- [ ] Filter by priority

---

### 2.2 Recurrence/Repeat

**Priority:** 🔥 HIGH
**Effort:** Large (5-7 Tage)
**Impact:** High (Killer-Feature)

#### Implementation:

```javascript
// 1. Home Assistant unterstützt iCalendar RRULE
// Siehe: https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10

{
  uid: '1',
  summary: 'Weekly Meeting',
  recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO;UNTIL=20261231',
  recurrence_id: null  // null für Master-Event
}

// 2. UI in TodoDetailView
<div className="ios-item ios-item-clickable" onClick={() => setView('repeat')}>
  <div className="ios-item-label">Repeat</div>
  <div className="ios-item-value">{formatRecurrence(todo.recurrence_rule)}</div>
</div>

// 3. Repeat Selection View
const REPEAT_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 'FREQ=DAILY', label: 'Daily' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=MONTHLY', label: 'Monthly' },
  { value: 'FREQ=YEARLY', label: 'Yearly' },
  { value: 'custom', label: 'Custom...' }
];

// 4. Custom Recurrence Builder
// - Frequency: Daily, Weekly, Monthly, Yearly
// - Interval: Every N days/weeks/months
// - By Day: MO,TU,WE,TH,FR,SA,SU (für Weekly)
// - End: Never, On Date, After N times
```

#### Tasks:
- [ ] RRULE Parser/Generator
- [ ] Repeat Selection View
- [ ] Custom Recurrence Builder
- [ ] Display recurrence info in todo cards
- [ ] Handle recurrence updates (this occurrence vs all)
- [ ] Visual indicator für recurring todos

**References:**
- iCalendar RRULE: https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html
- JS Library: https://github.com/jakubroztocil/rrule

---

### 2.3 Tags/Labels System

**Priority:** 🔶 MEDIUM
**Effort:** Medium (3-4 Tage)
**Impact:** Medium (Power-User Feature)

#### Implementation:

```javascript
// 1. Tags Property
{
  uid: '1',
  summary: 'Todo',
  tags: ['#work', '#urgent', '#monday']
}

// 2. Tag Input in TodoDetailView
<div className="ios-item">
  <div className="ios-item-label">Tags</div>
  <TagInput
    tags={todo.tags || []}
    onChange={(tags) => handleChange('tags', tags)}
    suggestions={getAllTags()}  // Autocomplete
  />
</div>

// 3. Tag Filter in FilterBar
{tags.map(tag => (
  <button
    className={`filter-tab tag-filter ${activeFilter === tag ? 'active' : ''}`}
    onClick={() => setActiveFilter(tag)}
  >
    {tag} <span className="filter-badge">{getTagCount(tag)}</span>
  </button>
))}

// 4. Tag Management in Settings
// - Rename tags
// - Delete tags
// - Tag colors
```

#### Tasks:
- [ ] Tag input component mit Autocomplete
- [ ] Tag filter in FilterBar
- [ ] Tag management in Settings
- [ ] Tag colors/icons
- [ ] Tag suggestions basierend auf Kontext

---

### 2.4 Subtasks

**Priority:** 🔶 MEDIUM
**Effort:** Large (5-7 Tage)
**Impact:** Medium (Niche Feature)

#### Implementation:

```javascript
// 1. Nested Structure
{
  uid: '1',
  summary: 'Project X',
  subtasks: [
    { uid: '1.1', summary: 'Task 1', status: 'completed' },
    { uid: '1.2', summary: 'Task 2', status: 'needs_action' },
    { uid: '1.3', summary: 'Task 3', status: 'needs_action' }
  ],
  progress: 1/3  // Auto-calculated
}

// 2. Expandable Todo Cards
<div className="todo-card">
  <div className="todo-main" onClick={toggleExpand}>
    <Checkbox />
    <div className="todo-content">
      <h3>{todo.summary}</h3>
      {todo.subtasks && (
        <div className="subtask-progress">
          {completedCount}/{totalCount} subtasks
        </div>
      )}
    </div>
    <ChevronIcon />
  </div>

  {expanded && (
    <div className="subtask-list">
      {todo.subtasks.map(subtask => (
        <SubtaskItem key={subtask.uid} {...subtask} />
      ))}
      <button className="add-subtask">+ Add Subtask</button>
    </div>
  )}
</div>

// 3. Subtask Management in DetailView
// - Add subtask
// - Delete subtask
// - Reorder subtasks (drag & drop)
```

#### Tasks:
- [ ] Nested data structure
- [ ] Expandable todo cards
- [ ] Subtask management in DetailView
- [ ] Progress calculation
- [ ] Visual indentation
- [ ] Reordering via drag & drop

---

## Phase 3: UX Improvements (Q3 2026)

**Ziel:** User Experience auf iOS Reminders-Niveau bringen

### 3.1 Swipe-to-Delete Geste

**Priority:** 🔥 HIGH
**Effort:** Small (1-2 Tage)
**Impact:** High (iOS-typisches UX)

```javascript
<motion.div
  className="todo-card"
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(e, info) => {
    if (info.offset.x < -60) {
      // Show delete button
      setShowDelete(todo.uid);
    } else {
      // Snap back
      controls.start({ x: 0 });
    }
  }}
>
  <div className="todo-content">...</div>
  <motion.button
    className="swipe-delete-button"
    initial={{ opacity: 0, x: 80 }}
    animate={{ opacity: showDelete ? 1 : 0, x: showDelete ? 0 : 80 }}
    onClick={() => handleDelete(todo)}
  >
    Delete
  </motion.button>
</motion.div>
```

---

### 3.2 Bulk Actions

**Priority:** 🔶 MEDIUM
**Effort:** Medium (2-3 Tage)
**Impact:** Medium (Power-User Feature)

#### Features:
- [ ] Multi-Select Mode
- [ ] Complete All
- [ ] Delete All Selected
- [ ] Move to Different List
- [ ] Apply Tags to Multiple

---

### 3.3 Quick Add

**Priority:** 🔶 MEDIUM
**Effort:** Small (1 Tag)
**Impact:** Medium (Convenience)

```javascript
// Inline Quick-Add in List
<div className="quick-add-row">
  <Checkbox disabled />
  <input
    className="quick-add-input"
    placeholder="New todo..."
    onKeyPress={(e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        quickAddTodo(e.target.value);
        e.target.value = '';
      }
    }}
  />
</div>
```

---

### 3.4 Natural Language Input

**Priority:** 🔷 LOW
**Effort:** Large (5-7 Tage)
**Impact:** Low (Nice-to-have)

```javascript
// Parser für Eingaben wie:
// "Buy milk tomorrow at 9am #shopping !!"
// → {
//     summary: "Buy milk",
//     due: "2026-01-23T09:00:00",
//     tags: ["#shopping"],
//     priority: 2
//   }

import chrono from 'chrono-node';

function parseNaturalLanguage(input) {
  let summary = input;
  const tags = [];
  let priority = 0;
  let due = null;

  // Extract tags
  const tagMatches = input.match(/#\w+/g);
  if (tagMatches) {
    tags.push(...tagMatches);
    summary = summary.replace(/#\w+/g, '').trim();
  }

  // Extract priority
  const priorityMatch = input.match(/!+/);
  if (priorityMatch) {
    priority = Math.min(priorityMatch[0].length, 3);
    summary = summary.replace(/!+/g, '').trim();
  }

  // Extract date/time
  const parsed = chrono.parse(input);
  if (parsed.length > 0) {
    due = parsed[0].start.date();
    summary = input.replace(parsed[0].text, '').trim();
  }

  return { summary, tags, priority, due };
}
```

---

## Phase 4: Advanced Features (Q4 2026)

### 4.1 Attachments

**Priority:** 🔷 LOW
**Effort:** Large (7-10 Tage)
**Impact:** Low (Niche)

- [ ] Image Uploads
- [ ] Link Previews
- [ ] File Attachments

---

### 4.2 Location-Based Reminders

**Priority:** 🔷 LOW
**Effort:** Very Large (10+ Tage)
**Impact:** Low (HA Integration komplex)

- [ ] Home Assistant Zone Integration
- [ ] Arriving/Leaving Triggers
- [ ] Distance-Based Reminders

---

### 4.3 Collaboration/Sharing

**Priority:** 🔷 LOW
**Effort:** Very Large (10+ Tage)
**Impact:** Low (Multi-User komplex)

- [ ] Shared Lists
- [ ] Assignment
- [ ] Comments

---

## Phase 5: Testing & Documentation (Ongoing)

### 5.1 Testing

**Priority:** 🔥 HIGH
**Effort:** Medium (3-5 Tage)
**Impact:** High (Code Quality)

- [ ] Unit Tests (Vitest)
- [ ] Integration Tests (Testing Library)
- [ ] E2E Tests (Playwright)
- [ ] Test Coverage >80%

---

### 5.2 TypeScript Migration

**Priority:** 🔶 MEDIUM
**Effort:** Large (5-7 Tage)
**Impact:** High (Type Safety)

```typescript
interface Todo {
  uid: string;
  summary: string;
  description?: string;
  status: 'needs_action' | 'completed';
  due?: string;  // ISO 8601
  priority?: 0 | 1 | 2 | 3;
  tags?: string[];
  recurrence_rule?: string;  // RRULE
  subtasks?: Todo[];
  listId: string;
  listName: string;
}
```

---

## Timeline

```
Q1 2026 (Jan-Mar)
├── Phase 1.1: Refactoring ████████░░ 80%
├── Phase 1.2: Performance ███████░░░ 70%
├── Phase 1.3: Optimistic UI ██████░░░░ 60%
└── Phase 1.4: localStorage ████░░░░░░ 40%

Q2 2026 (Apr-Jun)
├── Phase 2.1: Priority ████████████ 100% (geplant)
├── Phase 2.2: Recurrence ████████░░ 80% (geplant)
├── Phase 2.3: Tags ██████░░░░ 60% (geplant)
└── Phase 2.4: Subtasks ████░░░░░░ 40% (geplant)

Q3 2026 (Jul-Sep)
├── Phase 3.1: Swipe-to-Delete ████████████ 100% (geplant)
├── Phase 3.2: Bulk Actions ██████████░░ 80% (geplant)
├── Phase 3.3: Quick Add ████████░░░░ 60% (geplant)
└── Phase 3.4: NLP ████░░░░░░░░ 30% (geplant)

Q4 2026 (Oct-Dec)
├── Phase 4.x: Advanced Features (TBD)
├── Phase 5.1: Testing ████████████ 100% (ongoing)
└── Phase 5.2: TypeScript ████████░░ 80% (ongoing)
```

---

## Success Metrics

### Phase 1 (Refactoring)
- ✅ Code Reduction: -500 LOC
- ✅ Performance: Load Time <500ms
- ✅ Bundle Size: -20KB

### Phase 2 (Features)
- ✅ Feature Parity: 70% (vs iOS Reminders)
- ✅ User Satisfaction: >4.5/5
- ✅ Bug Reports: <5/month

### Phase 3 (UX)
- ✅ Feature Parity: 85%
- ✅ User Engagement: +30%
- ✅ Task Completion Rate: +20%

---

## Notes

- **Flexibilität:** Roadmap ist iterativ, Prioritäten können sich ändern
- **User Feedback:** Regelmäßige Reviews nach jedem Feature
- **Breaking Changes:** Vermeiden, außer bei kritischen Refactorings
- **Backward Compatibility:** localStorage Migration-Scripts bei Schema-Changes
