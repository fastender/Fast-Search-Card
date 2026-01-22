# Todo System-Entity: Changelog

Alle wichtigen Änderungen an der Todo System-Entity werden hier dokumentiert.

---

## [v1.2.0] - 2026-01-22

### 🎉 Major Refactoring: Shared TodoFormDialog Component

**Motivation:** Code-Duplikation eliminieren zwischen TodoAddDialog und TodoDetailView

#### ✅ Completed

##### 1. Shared Component erstellt
- **NEU:** `components/TodoFormDialog.jsx` (732 lines)
- Unified component mit `mode` prop ('add' | 'edit')
- Alle gemeinsamen Features extrahiert
- Custom Hook `useListFeatures` für Feature Detection

##### 2. TodoAddDialog refactored
- **VORHER:** 531 lines (standalone component)
- **NACHHER:** 33 lines (lightweight wrapper)
- **Reduktion:** -498 lines (-93.8%)

##### 3. TodoDetailView refactored
- **VORHER:** 737 lines (standalone component)
- **NACHHER:** 37 lines (lightweight wrapper)
- **Reduktion:** -700 lines (-95.0%)

#### 📊 Metriken

```
VORHER:
├── TodoAddDialog.jsx       531 lines
└── TodoDetailView.jsx      737 lines
    Total:                 1268 lines

NACHHER:
├── TodoFormDialog.jsx      732 lines  (shared)
├── TodoAddDialog.jsx        33 lines  (wrapper)
└── TodoDetailView.jsx       37 lines  (wrapper)
    Total:                  802 lines

Code Reduction: -466 lines (-36.7%)
```

#### ✨ Benefits

1. **Single Source of Truth**
   - Eine Component statt zwei
   - Bugs müssen nur einmal gefixt werden
   - Features müssen nur einmal implementiert werden

2. **Guaranteed Consistency**
   - Add & Edit haben garantiert gleiche Features
   - Gleiche UI/UX in beiden Modi
   - Gleiche Validierung

3. **Easier Maintenance**
   - 36.7% weniger Code zu warten
   - Neue Features (z.B. Priority) nur einmal implementieren
   - Refactorings nur an einer Stelle

4. **Better Architecture**
   - Custom Hook `useListFeatures` wiederverwendbar
   - Cleaner separation of concerns
   - Mode prop macht Intent explizit

#### 🔧 Implementation Details

**Custom Hook: useListFeatures**
```javascript
function useListFeatures(hass, listId) {
  return useMemo(() => {
    // Feature detection via supported_features bitfield
    const features = entity.attributes?.supported_features || 0;

    return {
      supportsDate: (features & 1) !== 0 || (features & 2) !== 0,
      supportsTime: (features & 2) !== 0,
      supportsDescription: (features & 4) !== 0
    };
  }, [hass, listId]);
}
```

**Wrapper Pattern:**
```javascript
// TodoAddDialog.jsx
export const TodoAddDialog = (props) => (
  <TodoFormDialog mode="add" {...props} />
);

// TodoDetailView.jsx
export const TodoDetailView = ({ todo, ...props }) => (
  <TodoFormDialog mode="edit" initialTodo={todo} {...props} />
);
```

#### 🧪 Testing

- ✅ Build erfolgreich
- ✅ Bundle size: 1,453.30 kB (gzip: 384.83 kB)
- ✅ Keine Breaking Changes
- ✅ API bleibt identisch (externe Components nicht betroffen)

#### 📝 Files Changed

```
NEW:     src/system-entities/entities/todos/components/TodoFormDialog.jsx
CHANGED: src/system-entities/entities/todos/TodoAddDialog.jsx
CHANGED: src/system-entities/entities/todos/TodoDetailView.jsx
```

#### 🚀 Next Steps

Siehe [ROADMAP.md](./ROADMAP.md) für weitere geplante Verbesserungen:
- Phase 1.2: Parallel WebSocket Fetching (10x faster load)
- Phase 1.3: Optimistic UI Updates
- Phase 2.1: Priority Feature

---

## [v1.1.0] - 2026-01-14

### Initial Documentation

- ✅ Vollständige Analyse erstellt (ANALYSIS.md)
- ✅ Roadmap definiert (ROADMAP.md)
- ✅ Architektur dokumentiert (ARCHITECTURE.md)
- ✅ Konkrete Verbesserungen dokumentiert (IMPROVEMENTS.md)

---

## Format

Dieses Changelog folgt [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

### Kategorien
- **Added** - Neue Features
- **Changed** - Änderungen an bestehenden Features
- **Deprecated** - Features die bald entfernt werden
- **Removed** - Entfernte Features
- **Fixed** - Bug Fixes
- **Security** - Sicherheits-Fixes
