# Todo System-Entity: Changelog

Alle wichtigen Änderungen an der Todo System-Entity werden hier dokumentiert.

---

## [v1.4.0] - 2026-01-24

### 🎨 Profile System & Critical Bugfixes

**Motivation:** Priority System durch flexibleres Profile System ersetzen + kritische Bugs im Edit-Mode beheben

#### ✅ Major Changes

##### 1. Profile System (ersetzt Priority)
- **Profile statt Priority:** Mehrere Profile pro Todo möglich (z.B. "Ender", "Sofie")
- **Storage Pattern:** `<!-- profiles:profile-id1,profile-id2 -->` in description
- **NEU:** `utils/profileParser.js` (ersetzt priorityParser.js)
- **NEU:** `utils/profileColors.js` - Farbverwaltung für Profile
- **UI:** Profile-Auswahl mit farbigen Chips
- **Settings:** Profile erstellen, bearbeiten, löschen
- **Multi-Select:** Mehrere Profile gleichzeitig auswählbar

##### 2. UI/UX Verbesserungen
- **Navbar Layout:**
  - "Fertig" Button rechts (statt mittig)
  - "Fertig" in weißer Farbe
  - Kein "Speichern" Button mehr im Content
- **Subviews (Datum/Zeit/Beschreibung):**
  - Links: "Zurück" (statt "Löschen")
  - Unten: Roter "Löschen" Button hinzugefügt
- **Main View:**
  - "Löschen" als roter Button unten (nur Edit-Mode)

#### 🐛 Critical Bugfixes

##### Bug 1: Date Picker Flicker ✅ FIXED
**Problem:** Beim Scrollen von Monat/Jahr flackerten ALLE Tage (1-31)

**Root Cause:**
- `updateData()` in IOSTimePicker.jsx setzte `innerHTML = ''`
- Komplette DOM-Neuerschaffung bei jeder Änderung
- Alle Elemente wurden neu gerendert → Flackern

**Fix:**
```javascript
// VORHER - Flackern
innerHTML = '';
// Alle Elemente neu erstellen

// NACHHER - Kein Flackern
// Nur geänderte Elemente updaten
if (element.textContent !== newData[i]) {
  element.textContent = newData[i];
}
```

**Location:** `src/components/IOSTimePicker.jsx` (Zeilen 94-109)

##### Bug 2: Edit Mode Save Failure ✅ FIXED
**Problem:** Datum/Uhrzeit-Änderungen wurden beim Editieren nicht gespeichert

**Root Cause (mehrere Probleme):**

1. **State Reinitialisierung bei Re-Mount:**
   - UID-Tracking mit `null` initial → `null === null` → Initialisierung übersprungen
   - **Fix:** `useRef(undefined)` statt `useRef(null)`

2. **State-Überschreibung im Edit-Mode:**
   - Init-Effect löschte User-Änderungen wenn `initialTodo.due` leer
   - **Fix:** Nur in Add-Mode State zurücksetzen, nie in Edit-Mode

3. **Falsche Property im Handler:**
   - `handleDetailSave` verwendete `updatedTodo.due` statt `updatedTodo.dueDate`
   - **Fix:** Korrektur in TodosView.jsx Zeile 615

4. **Home Assistant API Requirements:**
   - HA erfordert mindestens `rename` ODER `status` beim Update
   - Nur `due_datetime` setzen → API-Fehler
   - **Fix:** Bessere updateTodo Action mit allen Feldern

**Locations:**
- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` (Zeilen 146, 240-265)
- `src/system-entities/entities/todos/TodosView.jsx` (Zeile 615)
- `src/system-entities/entities/todos/index.jsx` (Zeilen 244-283)

##### Bug 3: Empty Backend Error ✅ FIXED
**Problem:** Fehler beim Erstellen von Todos wenn Backend komplett leer

**Error Message:**
```
invalid_format: not a valid value for dictionary value @ data['entity_id']
```

**Root Cause:**
- `availableLists` war leer → `listId` wurde auf `''` gesetzt
- Home Assistant akzeptiert keine leere entity_id

**Fix:**
- Fallback zu `entity.entity_id` wenn keine Listen vorhanden
- `defaultEntityId` prop zu TodoFormDialog hinzugefügt

**Location:** `src/system-entities/entities/todos/components/TodoFormDialog.jsx` (Zeile 125)

##### Bug 4: Missing Fields in Add Dialog ✅ FIXED
**Problem:** Datum, Uhrzeit, Beschreibung fehlten im Add-Dialog

**Root Cause:**
- `useListFeatures` gab `false` zurück wenn `listId` leer
- Alle Felder wurden ausgeblendet

**Fix:**
```javascript
// Default: all features enabled when no list selected
if (!hass || !listId) {
  return { supportsDate: true, supportsTime: true, supportsDescription: true };
}
```

**Location:** `src/system-entities/entities/todos/components/TodoFormDialog.jsx` (Zeilen 24-25)

##### Bug 5: No Real-Time Updates ✅ FIXED
**Problem:** Änderungen wurden erst nach manuelem Refresh sichtbar

**Root Cause:**
- CRUD Actions gaben refreshed todos zurück, aber Result wurde ignoriert
- Lokaler State wurde manuell (und falsch) aktualisiert

**Fix:**
```javascript
// VORHER
await entity.executeAction('updateTodo', {...});
setTodos(prev => prev.map(...)); // Manuell, inkonsistent

// NACHHER
const refreshedTodos = await entity.executeAction('updateTodo', {...});
if (refreshedTodos) {
  setTodos(refreshedTodos); // Fresh data vom Server
}
```

**Location:** `src/system-entities/entities/todos/TodosView.jsx` (Zeilen 531-629)

#### 🔧 Technical Improvements

##### Home Assistant API Integration
- **Service Calls optimiert:**
  - `todo.add_item` - Korrekte `due_datetime` Format-Konvertierung
  - `todo.update_item` - Alle erforderlichen Parameter setzen
  - Support für `null` um Datum zu löschen

- **Date Format Handling:**
```javascript
// ISO Format: YYYY-MM-DDTHH:MM:SS
// HA Format:  YYYY-MM-DD HH:MM:SS
serviceData.due_datetime = dueDate.replace('T', ' ');
```

#### 📊 Code Metrics

```
Files Changed:
├── components/TodoFormDialog.jsx     +120 lines (bugfixes)
├── TodosView.jsx                     +80 lines (real-time updates)
├── index.jsx (TodosEntity)           +45 lines (API improvements)
├── IOSTimePicker.jsx                 +35 lines (flicker fix)
├── utils/profileParser.js            +150 lines (NEW)
└── utils/profileColors.js            +50 lines (NEW)

Total: +480 lines
Bundle: 1,479.50 kB (gzip: 389.12 kB)
```

#### 🧪 Testing Results

✅ **Flicker Bug:** Datum-Wheel flackert nicht mehr
✅ **Save Bug:** Datum/Uhrzeit werden korrekt gespeichert
✅ **Empty Backend:** Todos können erstellt werden
✅ **Real-Time:** Änderungen sofort sichtbar
✅ **Profile System:** Multi-Select funktioniert
✅ **Build:** Erfolgreich (1.93s)

#### 🎯 Benefits

1. **Flexibles Profil-System:** Mehrere Profile statt einzelner Priority
2. **Stabile Edit-Funktion:** Alle State-Management Bugs behoben
3. **Bessere UX:** Keine Flicker-Effekte, sofortige Updates
4. **Robuster:** Funktioniert auch mit leerem Backend
5. **HA-Konform:** Korrekte API-Integration gemäß Dokumentation

#### 📝 Breaking Changes

⚠️ **Priority entfernt:**
- Alte Todos mit `<!-- priority:N -->` werden nicht automatisch migriert
- User müssen manuell Profile zuweisen falls gewünscht

#### 🔗 References

- [Home Assistant Todo Integration Docs](https://www.home-assistant.io/integrations/todo/)
- [Local Todo Component](https://github.com/home-assistant/core/tree/dev/homeassistant/components/local_todo)

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
