# Todo System-Entity: Changelog

Alle wichtigen Änderungen an der Todo System-Entity werden hier dokumentiert.

---

## [v1.3.0] - 2026-01-22

### 🔄 Priority Persistence: Description-Based Storage

**Motivation:** Priority verschwindet nach Refresh - Home Assistant API unterstützt kein natives priority Feld

#### ✅ Implemented

##### 1. HTML Comment Storage Pattern
- **Format:** `<!-- priority:N -->` am Anfang der Description
- **CommonMark kompatibel:** HTML Comments werden nicht gerendert
- **Unsichtbar:** User sieht nur clean description in HA Apps
- **Robust:** Eindeutiges Pattern für Parsing

##### 2. Priority Parser Utility
- **NEU:** `utils/priorityParser.js` (150 lines)
- `extractPriority()` - Extrahiert priority aus description
- `injectPriority()` - Fügt priority in description ein
- `removePriority()` - Entfernt priority comment
- `hasPriority()` - Prüft ob priority vorhanden

##### 3. Integration in API Actions
- **index.jsx `addTodo()`** - Priority wird beim Erstellen gespeichert
- **index.jsx `updateTodo()`** - Priority wird beim Update gespeichert
- **index.jsx `_fetchFromHomeAssistant()`** - Priority wird beim Laden extrahiert
- **TodosView.jsx handlers** - Priority wird weitergegeben

#### 📋 Beispiel

**Gespeichert in Home Assistant:**
```markdown
<!-- priority:3 -->
Bio-Milch kaufen, 3 Liter
```

**Angezeigt in HA Apps:**
```
Bio-Milch kaufen, 3 Liter
```
(HTML Comment unsichtbar!)

**Geladen in Fast Search Card:**
```javascript
{
  summary: "Milch kaufen",
  description: "Bio-Milch kaufen, 3 Liter",
  priority: 3  // ✅ Persistiert!
}
```

#### 🎯 Vorteile

1. **Cross-Device Sync**: Priority sync über alle Geräte (im Gegensatz zu localStorage)
2. **Unsichtbar**: HTML Comments werden nicht gerendert
3. **Markdown-Safe**: CommonMark erlaubt HTML, beeinflusst Rendering nicht
4. **Erweiterbar**: Später z.B. `<!-- priority:3,tags:work -->`
5. **No Data Loss**: Description bleibt intakt

#### 📦 Build Stats

- Bundle size: 1,457.16 kB (gzip: 385.84 kB)
- +150 lines (priorityParser.js)
- Build time: 2.19s

#### 🔧 Technical Details

**Pattern:** `/<!--\s*priority:(\d)\s*-->\s*/`

**Priority Levels:**
- 0: Keine Priorität (kein comment)
- 1: Niedrig (!)
- 2: Mittel (!!)
- 3: Hoch (!!!)

**Edge Cases behandelt:**
- Description ist null/undefined
- Multiple priority comments
- Ungültige priority values
- Update nur priority (ohne description ändern)

#### 🧪 Testing

✅ Build erfolgreich
✅ Keine Breaking Changes
✅ Backward compatible (priority optional)
✅ Markdown bleibt intakt

**Next Step:** Step 4 - Optimistic UI Updates (ROADMAP.md)

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
