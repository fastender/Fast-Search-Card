# Todo System-Entity: Konkrete Verbesserungsvorschläge

**Version:** 1.0
**Datum:** 2026-01-22

Diese Datei enthält **konkrete Code-Beispiele** für die wichtigsten Verbesserungen aus der Roadmap.

---

## 1. Refactoring: Shared TodoFormDialog Component

**Problem:** TodoAddDialog.jsx und TodoDetailView.jsx teilen 90% identischen Code.

**Lösung:** Extrahiere gemeinsame Logic in wiederverwendbare Component.

### Vorher (Code-Duplikation)

```javascript
// TodoAddDialog.jsx (531 lines)
export const TodoAddDialog = ({ availableLists, hass, onAdd, onCancel }) => {
  const [currentView, setCurrentView] = useState('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [dueDate, setDueDate] = useState('');
  // ... 500 more lines
};

// TodoDetailView.jsx (737 lines)
export const TodoDetailView = ({ todo, availableLists, hass, onSave, onDelete }) => {
  const [currentView, setCurrentView] = useState('main');
  const [editedTodo, setEditedTodo] = useState(todo);
  const [dueDate, setDueDate] = useState('');
  // ... 700 more lines (fast identisch!)
};
```

### Nachher (Shared Component)

```javascript
// components/TodoFormDialog.jsx (NEW - ~400 lines)
export const TodoFormDialog = ({
  mode = 'add',  // 'add' | 'edit'
  initialTodo = null,
  availableLists,
  hass,
  onSubmit,
  onCancel,
  onDelete,
  lang = 'de'
}) => {
  const [currentView, setCurrentView] = useState('main');
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && initialTodo) {
      return {
        summary: initialTodo.summary,
        description: initialTodo.description || '',
        listId: initialTodo.listId,
        dueDate: parseDueDate(initialTodo.due),
        dueTime: parseDueTime(initialTodo.due),
        status: initialTodo.status
      };
    }
    return {
      summary: '',
      description: '',
      listId: availableLists[0]?.id || '',
      dueDate: '',
      dueTime: '',
      status: 'needs_action'
    };
  });

  const handleSubmit = () => {
    const todoData = {
      ...(mode === 'edit' && { uid: initialTodo.uid }),
      listId: formData.listId,
      summary: formData.summary,
      description: formData.description,
      dueDate: combineDateAndTime(formData.dueDate, formData.dueTime),
      status: formData.status
    };
    onSubmit(todoData);
  };

  return (
    <div className="todo-form-dialog">
      {/* Shared UI for both Add and Edit */}
      <Navbar
        title={mode === 'add' ? t('createTodo') : t('editTodo')}
        leftButton={<BackButton onClick={onCancel} />}
        rightButton={<SubmitButton onClick={handleSubmit} />}
      />

      <FormFields
        formData={formData}
        onChange={setFormData}
        availableLists={availableLists}
        hass={hass}
        mode={mode}
      />

      {mode === 'edit' && (
        <DeleteButton onClick={() => onDelete(initialTodo)} />
      )}
    </div>
  );
};

// TodoAddDialog.jsx (NEW - ~50 lines)
export const TodoAddDialog = ({ availableLists, hass, onAdd, onCancel, lang }) => {
  return (
    <TodoFormDialog
      mode="add"
      availableLists={availableLists}
      hass={hass}
      onSubmit={onAdd}
      onCancel={onCancel}
      lang={lang}
    />
  );
};

// TodoDetailView.jsx (NEW - ~80 lines)
export const TodoDetailView = ({ todo, availableLists, hass, onSave, onCancel, onDelete, lang }) => {
  return (
    <TodoFormDialog
      mode="edit"
      initialTodo={todo}
      availableLists={availableLists}
      hass={hass}
      onSubmit={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
      lang={lang}
    />
  );
};
```

**Ergebnis:**
- ✅ Code-Reduktion: 1268 → 530 lines (-58%)
- ✅ Wartbarkeit: Eine Quelle für Bugs
- ✅ Konsistenz: Garantiert identisches Verhalten

---

## 2. Performance: Parallel WebSocket Fetching

**Problem:** Sequentielle API-Calls dauern bei 10 Listen ~5 Sekunden.

### Vorher (Sequential)

```javascript
// index.jsx _fetchFromHomeAssistant
_fetchFromHomeAssistant: async function(hass) {
  const todoListEntities = Object.keys(hass.states)
    .filter(id => id.startsWith('todo.'))
    .map(id => ({ id, name: ... }));

  let allTodos = [];

  // ❌ PROBLEM: Sequential await in loop
  for (const list of todoListEntities) {
    try {
      const response = await hass.callWS({
        type: 'todo/item/list',
        entity_id: list.id
      });

      if (response && response.items) {
        allTodos = [...allTodos, ...response.items.map(...)];
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch items from ${list.name}:`, error);
    }
  }

  return allTodos;
}
```

**Performance:** 10 Listen × 500ms = 5000ms

### Nachher (Parallel)

```javascript
_fetchFromHomeAssistant: async function(hass) {
  const todoListEntities = Object.keys(hass.states)
    .filter(id => id.startsWith('todo.'))
    .map(id => ({ id, name: hass.states[id].attributes.friendly_name || id }));

  // ✅ SOLUTION: Parallel fetching with Promise.all
  const results = await Promise.allSettled(
    todoListEntities.map(async (list) => {
      try {
        const response = await hass.callWS({
          type: 'todo/item/list',
          entity_id: list.id
        });

        if (response && response.items) {
          return response.items.map(item => ({
            uid: item.uid,
            summary: item.summary,
            description: item.description || '',
            status: item.status || 'needs_action',
            due: item.due || null,
            listId: list.id,
            listName: list.name
          }));
        }
        return [];
      } catch (error) {
        console.warn(`⚠️ Failed to fetch items from ${list.name}:`, error);
        return [];
      }
    })
  );

  // Flatten results (only fulfilled promises)
  const allTodos = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  return allTodos;
}
```

**Performance:** max(500ms) = 500ms (10x faster!)

**Bonus:** `Promise.allSettled` garantiert dass ein Fehler nicht alle anderen Fetches blockiert.

---

## 3. Performance: useMemo für Filter/Sort

**Problem:** `filterTodos()` läuft bei jedem Setting-Change neu.

### Vorher (No Memoization)

```javascript
// TodosView.jsx
useEffect(() => {
  filterTodos(activeFilter);
}, [activeFilter, todos, settings]);

const filterTodos = (filter) => {
  // ❌ Re-runs on ANY settings change, even unrelated ones
  let filtered = [...todos];

  // Complex filtering logic (~100 lines)
  filtered = filtered.filter(...);
  filtered = sortTodos(filtered, settings.display.sortBy);

  setFilteredTodos(filtered);
};
```

### Nachher (Memoized)

```javascript
// TodosView.jsx
const filteredTodos = useMemo(() => {
  console.log('🔄 Recalculating filtered todos');

  let filtered = [...todos];

  // 1. Apply list enable/disable filter
  filtered = filtered.filter(todo => {
    const listEnabled = settings.lists[todo.listId]?.enabled !== false;
    return listEnabled;
  });

  // 2. Apply completed filter
  const showCompleted = settings.display?.showCompleted !== false;
  const autoHideAfterDays = settings.display?.autoHideAfterDays || 7;

  if (!showCompleted) {
    filtered = filtered.filter(t => t.status !== 'completed');
  } else {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - autoHideAfterDays);
    cutoffDate.setHours(0, 0, 0, 0);

    filtered = filtered.filter(t => {
      if (t.status !== 'completed') return true;
      if (t.due) {
        const dueDate = new Date(t.due);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= cutoffDate;
      }
      return true;
    });
  }

  // 3. Apply active filter
  if (activeFilter === 'incomplete') {
    filtered = filtered.filter(t => t.status === 'needs_action');
  } else if (activeFilter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(t => {
      if (!t.due) return false;
      const due = new Date(t.due);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    });
  } else if (activeFilter === 'overdue') {
    filtered = filtered.filter(t => isOverdue(t));
  } else if (activeFilter === 'completed') {
    filtered = filtered.filter(t => t.status === 'completed');
  } else if (activeFilter !== 'all') {
    // List filter
    filtered = filtered.filter(t => t.listId === activeFilter);
  }

  // 4. Apply sorting
  const sortBy = settings.display?.sortBy || 'dueDate';
  filtered = sortTodos(filtered, sortBy);

  return filtered;
}, [
  todos,
  activeFilter,
  settings.lists,
  settings.display.showCompleted,
  settings.display.autoHideAfterDays,
  settings.display.sortBy
]);
```

**Bonus:** Memoized Callback für Handler

```javascript
const handleToggleComplete = useCallback(async (todo, e) => {
  if (e) e.stopPropagation();

  try {
    await entity.executeAction('toggleComplete', {
      hass,
      listId: todo.listId,
      uid: todo.uid,
      currentStatus: todo.status
    });

    const newStatus = todo.status === 'completed' ? 'needs_action' : 'completed';
    setTodos(prev => prev.map(t =>
      t.uid === todo.uid ? { ...t, status: newStatus } : t
    ));
  } catch (err) {
    console.error('Failed to toggle todo:', err);
  }
}, [entity, hass]);
```

---

## 4. UX: Optimistic UI Updates

**Problem:** UI wartet auf API-Response bevor sie sich updated → feels laggy.

### Vorher (Wait for API)

```javascript
const handleToggleComplete = async (todo, e) => {
  if (e) e.stopPropagation();

  // ❌ UI doesn't update until API responds (~200-500ms delay)
  try {
    await entity.executeAction('toggleComplete', { ... });

    // Update UI only AFTER API success
    const newStatus = todo.status === 'completed' ? 'needs_action' : 'completed';
    setTodos(prev => prev.map(t =>
      t.uid === todo.uid ? { ...t, status: newStatus } : t
    ));
  } catch (err) {
    console.error('Failed to toggle todo:', err);
  }
};
```

### Nachher (Optimistic)

```javascript
const handleToggleComplete = async (todo, e) => {
  if (e) e.stopPropagation();

  const newStatus = todo.status === 'completed' ? 'needs_action' : 'completed';

  // ✅ 1. IMMEDIATELY update UI (optimistic)
  const previousTodos = todos;
  setTodos(prev => prev.map(t =>
    t.uid === todo.uid ? { ...t, status: newStatus } : t
  ));

  // 2. Send API request in background
  try {
    await entity.executeAction('toggleComplete', {
      hass,
      listId: todo.listId,
      uid: todo.uid,
      currentStatus: todo.status
    });

    // ✅ Success: UI already updated, nothing to do
    console.log('✅ Toggle confirmed by API');

  } catch (err) {
    // ❌ Error: Rollback optimistic update
    console.error('❌ Failed to toggle todo, rolling back:', err);
    setTodos(previousTodos);

    // Show error toast
    showErrorToast(
      lang === 'de'
        ? 'Fehler beim Aktualisieren der Aufgabe'
        : 'Failed to update todo'
    );
  }
};
```

**Bonus:** Visual feedback während API-Call

```javascript
const [pendingActions, setPendingActions] = useState(new Set());

const handleToggleComplete = async (todo, e) => {
  if (e) e.stopPropagation();

  // Add pending state
  setPendingActions(prev => new Set(prev).add(todo.uid));

  try {
    // Optimistic update
    setTodos(prev => prev.map(t =>
      t.uid === todo.uid ? { ...t, status: newStatus } : t
    ));

    await entity.executeAction('toggleComplete', { ... });

  } catch (err) {
    // Rollback
    setTodos(previousTodos);
  } finally {
    // Remove pending state
    setPendingActions(prev => {
      const next = new Set(prev);
      next.delete(todo.uid);
      return next;
    });
  }
};

// In todo card:
<div className={`todo-card ${pendingActions.has(todo.uid) ? 'pending' : ''}`}>
  {/* CSS: .todo-card.pending { opacity: 0.7; } */}
</div>
```

---

## 5. Feature: Priority Support

**Implementierung:** Priorität als neues Feld (0=None, 1=Low, 2=Medium, 3=High)

### 1. Schema Extension

```javascript
// Todo Object Schema
{
  uid: '1',
  summary: 'Important task',
  description: '...',
  status: 'needs_action',
  due: '2026-01-25T14:00:00',
  priority: 3,  // NEW: 0=None, 1=Low, 2=Medium, 3=High
  listId: 'todo.work',
  listName: 'Work'
}
```

### 2. UI in TodoFormDialog

```javascript
// components/TodoFormDialog.jsx

// Add to form data
const [formData, setFormData] = useState({
  summary: '',
  description: '',
  listId: '',
  dueDate: '',
  dueTime: '',
  status: 'needs_action',
  priority: 0  // NEW
});

// Priority Selector Component
const PrioritySelector = ({ value, onChange, lang }) => {
  const PRIORITIES = [
    { value: 0, label: lang === 'de' ? 'Keine' : 'None', icon: '' },
    { value: 1, label: lang === 'de' ? 'Niedrig' : 'Low', icon: '!', color: 'blue' },
    { value: 2, label: lang === 'de' ? 'Mittel' : 'Medium', icon: '!!', color: 'orange' },
    { value: 3, label: lang === 'de' ? 'Hoch' : 'High', icon: '!!!', color: 'red' }
  ];

  return (
    <div className="priority-selector">
      {PRIORITIES.map(priority => (
        <button
          key={priority.value}
          className={`priority-button ${value === priority.value ? 'active' : ''}`}
          style={{ '--priority-color': priority.color }}
          onClick={() => onChange(priority.value)}
        >
          <span className="priority-icon">{priority.icon}</span>
          <span className="priority-label">{priority.label}</span>
        </button>
      ))}
    </div>
  );
};

// Add to Form UI
<div className="ios-section">
  <div className="ios-card">
    {/* ... other fields ... */}

    <div className="ios-divider" />

    <div className="ios-item">
      <div className="ios-item-left">
        <div className="ios-item-label">
          {lang === 'de' ? 'Priorität' : 'Priority'}
        </div>
      </div>
      <div className="ios-item-right">
        <PrioritySelector
          value={formData.priority}
          onChange={(priority) => setFormData({ ...formData, priority })}
          lang={lang}
        />
      </div>
    </div>
  </div>
</div>
```

### 3. Visual Badge in Todo Card

```javascript
// TodosView.jsx
<div className={`todo-card priority-${todo.priority || 0}`}>
  {/* Checkbox */}
  <div className="todo-checkbox-wrapper">...</div>

  {/* Content */}
  <div className="todo-content">
    <h3 className="todo-title">
      {/* Priority Badge */}
      {todo.priority > 0 && (
        <span className={`priority-badge priority-${todo.priority}`}>
          {'!'.repeat(todo.priority)}
        </span>
      )}
      {todo.summary}
    </h3>

    {/* ... description, footer ... */}
  </div>
</div>
```

### 4. CSS Styling

```css
/* TodosView.css */

.priority-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  margin-right: 6px;
}

.priority-badge.priority-1 {
  background: rgba(0, 122, 255, 0.15);
  color: rgb(0, 122, 255);
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.priority-badge.priority-2 {
  background: rgba(255, 149, 0, 0.15);
  color: rgb(255, 149, 0);
  border: 1px solid rgba(255, 149, 0, 0.3);
}

.priority-badge.priority-3 {
  background: rgba(255, 59, 48, 0.15);
  color: rgb(255, 59, 48);
  border: 1px solid rgba(255, 59, 48, 0.3);
}

/* Priority indicator on card border */
.todo-card.priority-3 {
  border-left: 3px solid rgb(255, 59, 48);
}

.todo-card.priority-2 {
  border-left: 3px solid rgb(255, 149, 0);
}

.todo-card.priority-1 {
  border-left: 3px solid rgb(0, 122, 255);
}
```

### 5. Sort by Priority

```javascript
// TodosView.jsx sortTodos()
const sortTodos = (todos, sortBy) => {
  const sorted = [...todos];

  switch (sortBy) {
    case 'priority':
      // NEW: Sort by priority (high → low), then by due date
      sorted.sort((a, b) => {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;

        // Higher priority first
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }

        // Same priority: sort by due date
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      });
      break;

    // ... other sort options ...
  }

  return sorted;
};
```

### 6. Filter by Priority

```javascript
// TodosView.jsx
// Add priority filter tabs
<div className="filter-tabs">
  {/* ... existing tabs ... */}

  {/* Priority Filters */}
  <motion.button
    className={`filter-tab ${activeFilter === 'priority:high' ? 'active' : ''}`}
    onClick={() => setActiveFilter('priority:high')}
  >
    !!! {lang === 'de' ? 'Hoch' : 'High'}
    <span className="filter-badge">{getPriorityCount(3)}</span>
  </motion.button>

  <motion.button
    className={`filter-tab ${activeFilter === 'priority:medium' ? 'active' : ''}`}
    onClick={() => setActiveFilter('priority:medium')}
  >
    !! {lang === 'de' ? 'Mittel' : 'Medium'}
    <span className="filter-badge">{getPriorityCount(2)}</span>
  </motion.button>

  <motion.button
    className={`filter-tab ${activeFilter === 'priority:low' ? 'active' : ''}`}
    onClick={() => setActiveFilter('priority:low')}
  >
    ! {lang === 'de' ? 'Niedrig' : 'Low'}
    <span className="filter-badge">{getPriorityCount(1)}</span>
  </motion.button>
</div>

// Filter logic
const filterTodos = (filter) => {
  let filtered = [...todos];

  // ... existing filters ...

  // Priority filters
  if (filter === 'priority:high') {
    filtered = filtered.filter(t => t.priority === 3);
  } else if (filter === 'priority:medium') {
    filtered = filtered.filter(t => t.priority === 2);
  } else if (filter === 'priority:low') {
    filtered = filtered.filter(t => t.priority === 1);
  }

  return filtered;
};
```

---

## 6. Feature: Swipe-to-Delete

**Implementierung:** iOS-typisches Swipe-Gesture mit Framer Motion.

```javascript
// TodosView.jsx
const [swipedTodoId, setSwipedTodoId] = useState(null);

<motion.div
  className="todo-card"
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  dragElastic={0.2}
  dragMomentum={false}
  onDragEnd={(e, info) => {
    if (info.offset.x < -60) {
      // Swipe threshold reached - show delete button
      setSwipedTodoId(todo.uid);
    } else {
      // Snap back to original position
      setSwipedTodoId(null);
    }
  }}
  animate={{
    x: swipedTodoId === todo.uid ? -80 : 0
  }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 30
  }}
  style={{ position: 'relative' }}
>
  {/* Todo content */}
  <div className="todo-content" onClick={() => handleTodoClick(todo)}>
    {/* ... */}
  </div>

  {/* Delete button (revealed on swipe) */}
  <motion.button
    className="swipe-delete-button"
    initial={{ opacity: 0 }}
    animate={{
      opacity: swipedTodoId === todo.uid ? 1 : 0
    }}
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteTodo(todo);
    }}
    style={{
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '80px',
      background: 'rgb(255, 59, 48)',
      border: 'none',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer'
    }}
  >
    Delete
  </motion.button>
</motion.div>
```

**CSS:**

```css
.todo-card {
  position: relative;
  overflow: hidden;
  touch-action: pan-y; /* Allow vertical scroll, horizontal drag */
}

.swipe-delete-button {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: rgb(255, 59, 48);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.swipe-delete-button:hover {
  background: rgb(235, 39, 28);
}
```

---

## 7. localStorage: Quota Handling

**Problem:** localStorage kann voll laufen (5-10MB Limit).

```javascript
// index.jsx _cacheTodos
_cacheTodos: function(todos) {
  try {
    const cache = {
      todos: todos,
      timestamp: Date.now()
    };

    const cacheString = JSON.stringify(cache);
    const cacheSizeKB = new Blob([cacheString]).size / 1024;

    // Check if cache would exceed 4MB
    const CACHE_SIZE_LIMIT_KB = 4 * 1024; // 4MB
    if (cacheSizeKB > CACHE_SIZE_LIMIT_KB) {
      console.warn(`📋 Cache too large (${cacheSizeKB.toFixed(2)}KB), applying LRU eviction`);

      // Strategy 1: Remove oldest completed todos
      const filtered = todos.filter(t => {
        if (t.status !== 'completed') return true;

        // Keep completed todos from last 7 days
        if (t.due) {
          const dueDate = new Date(t.due);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          return dueDate >= cutoff;
        }

        return false;
      });

      cache.todos = filtered;
    }

    localStorage.setItem('todosCache', JSON.stringify(cache));
    console.log(`📋 Cache saved: ${todos.length} todos, ${cacheSizeKB.toFixed(2)}KB`);

  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('❌ localStorage quota exceeded');

      // Strategy 2: Clear old cache and retry with filtered data
      localStorage.removeItem('todosCache');

      // Keep only incomplete todos
      const incompleteTodos = todos.filter(t => t.status === 'needs_action');

      try {
        localStorage.setItem('todosCache', JSON.stringify({
          todos: incompleteTodos,
          timestamp: Date.now()
        }));
        console.log('📋 Saved minimal cache (incomplete only)');
      } catch (retryError) {
        console.error('❌ Still failed after retry, cache disabled');
      }
    } else {
      console.error('Failed to cache todos:', error);
    }
  }
}
```

---

## 8. Custom Hook: useListFeatures

**Extrahiere Feature Detection Logic in wiederverwendbaren Hook.**

```javascript
// hooks/useListFeatures.js
import { useMemo } from 'preact/hooks';

export function useListFeatures(hass, listId) {
  return useMemo(() => {
    console.log('🔍 [useListFeatures] Detecting features for:', listId);

    // Default: No features
    const defaultFeatures = {
      supportsDate: false,
      supportsTime: false,
      supportsDescription: false
    };

    if (!hass || !listId) {
      return defaultFeatures;
    }

    const entity = hass.states[listId];
    if (!entity) {
      console.warn('⚠️ Entity not found:', listId);
      return defaultFeatures;
    }

    // Shopping list exception
    const entityName = (entity.attributes?.friendly_name || listId).toLowerCase();
    const isShoppingList = entityName.includes('einkauf') || entityName.includes('shopping');

    if (isShoppingList) {
      console.log('🛒 Shopping list detected, features disabled');
      return defaultFeatures;
    }

    // Feature detection via supported_features bitfield
    const features = entity.attributes?.supported_features || 0;

    const result = {
      supportsDate: (features & 1) !== 0 || (features & 2) !== 0,
      supportsTime: (features & 2) !== 0,
      supportsDescription: (features & 4) !== 0
    };

    console.log('✅ Features:', result);
    return result;
  }, [hass, listId]);
}

// Usage in TodoFormDialog
import { useListFeatures } from './hooks/useListFeatures';

export const TodoFormDialog = ({ hass, initialTodo, ... }) => {
  const { supportsDate, supportsTime, supportsDescription } = useListFeatures(
    hass,
    formData.listId
  );

  return (
    <>
      {supportsDate && <DatePicker />}
      {supportsTime && <TimePicker />}
      {supportsDescription && <DescriptionField />}
    </>
  );
};
```

---

## Zusammenfassung

Diese Verbesserungen bringen die Todo System-Entity auf das nächste Level:

✅ **Phase 1 (Refactoring):**
1. Shared TodoFormDialog → -500 LOC
2. Parallel Fetching → 10x schneller
3. useMemo → Keine unnötigen Re-Renders
4. Optimistic UI → Feels instant

✅ **Phase 2 (Features):**
5. Priority Support → Power-User Feature
6. Swipe-to-Delete → iOS UX
7. useListFeatures Hook → Cleaner Code

✅ **Phase 3 (Robustness):**
8. localStorage Quota → Keine Crashes

**Nächste Schritte:** Siehe ROADMAP.md für komplette Timeline.
