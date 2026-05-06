# Session Notes — 2026-04-24 & 2026-04-25

Direkter Anschluss an `SESSION_NOTES_2026-04-19_24.md`. **21 Releases** (v1.1.1238 → v1.1.1258) in zwei Tagen. Hauptthemen: Boot-Performance, Hitze-Bekämpfung, Bug-Welle, vollständige Migration der News-Entity weg von HA-Core `feedreader`.

> Letzte Version: **v1.1.1258**. Versionsverlauf weiterhin Englisch ab v1.1.1220.

---

## 1. Overview

Stand davor (v1.1.1237): Boot-Pfad mit ~10s leerer Panel, Hitze auf iPhone, viele kleine UI-Bugs.

Stand nach Session (v1.1.1258):
- Boot bis Cards sichtbar: ~900 ms (Mac Safari, gemessen) statt ~10s.
- Registry-Init im Hintergrund statt blockierend (von 10s auf 329 ms gesunken).
- 4 Bug-Bündel gefixt: Translation-Keys, Toggle-Persistenz, Snapshot für Favoriten/Vorschläge, IOSToggle-Komponente.
- News-Entity komplett auf HACS-Custom-Integration `timmaurice/feedparser` umgestellt (kein Adapter, voller Wechsel).
- Erkenntnis am Ende: Tagesschau & ähnliche Feeds liefern Bilder nur in `<content:encoded>` — `timmaurice/feedparser` extrahiert das nicht. **Roadmap für eigene HA-Custom-Component** als nächster Schritt (siehe `CUSTOM_COMPONENT_ROADMAP.md`).

---

## 2. Releases chronologisch

### Phase 1 — Boot-Snapshot + Pre-JS Skeleton (v1.1.1238 – v1.1.1241)

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1238** | Versionsverlauf cache-only on boot + React-level Skeleton | GitHub-Fetch raus aus `onMount`; Skeleton während Entities laden |
| **v1.1.1239** | IndexedDB Warm-Cache | `loadEntitiesFromCache` beim Boot, mit Live-State aus `hass.states` enriched |
| **v1.1.1240** | Splash 2.5s → 120ms + HTML-Skeleton im Custom-Element-Placeholder | Pre-JS-Skeleton bevor Bundle parsed wird, für Safari sichtbar |
| **v1.1.1241** | localStorage Snapshot (1st-Tier Warm-Cache) | Synchroner `useState`-Initializer, Top-120 Entities; ab 2. Boot Cards im 1. Render-Frame |

### Phase 2 — Thermal + Bug-Folgen (v1.1.1242 – v1.1.1244)

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1242** | Skeleton-Shimmer → Opacity-Pulse | `background-position`-Animation war Paint-pro-Frame (Hitze) → Opacity-Pulse Compositor-only |
| **v1.1.1243** | Fix StatsBar `--°C / 0.0 kW` Flash | `setEntities(systemEntities)` nach Registry-Init überschrieb Snapshot → MERGE-Variante mit functional updater |
| **v1.1.1244** | `pendingPulse` opacity ring + state_changed throttle 150ms | `box-shadow`-Animation auf device-cards.pending → opacity-only Ring; max 6-7 Re-Renders/s |

### Phase 3 — Mess-Phase: Profil + window._hass (v1.1.1245 – v1.1.1250)

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1245** | `performance.mark()` Instrumentierung | `src/utils/perfMarks.js` + Auto-Dump in DevTools-Console; 18 Marks im Boot-Pfad |
| **v1.1.1246** | systemRegistry async (decoupled) | Registry läuft fire-and-forget statt blockierend; Card sichtbar bei ~500 ms statt ~10 s |
| **v1.1.1247** | Phase 4: `loadCriticalData` parallel + `buildSearchIndex` fire-and-forget | Promise.all statt sequenziell; Mutex früher frei |
| **v1.1.1248** | Phase 5: Integration parallel | `for…await` in `loadSavedDevices` → Promise.all (Symptom-Fix) |
| **v1.1.1249** | Phase 6: EnergyDashboard onMount parallel | 4 sequenzielle HA-Calls → Promise.all (auch Symptom-Fix) |
| **v1.1.1250** | **`window._hass` was the 10s mystery** ⭐ | `waitForHass` polled 20 × 500 ms = 10 s, weil `window._hass` nirgends gesetzt war (5 Stellen lesen, 0 schreiben). Fix: 2 Zeilen in `build.sh` + `DataProvider.jsx`. Registry fertig in **329 ms** statt 10 s. |

### Phase 4 — Runtime-Perf + Bug-Bündel (v1.1.1251 – v1.1.1252)

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1251** | contextValue useMemo | DataProvider Context-Object war jedes Render neu → Re-Render-Kaskade über alle Consumer; jetzt stable identity |
| **v1.1.1252** | Bug-Bündel: Translations + IOSToggle-Komponente + Favoriten/Suggestions-Snapshot | 4 verschiedene Bugs in einem Release: `ui.suggestions.frequentlyUsed` als Roh-Key, Mobile-Toggle reverted nach Refresh (Preact-Compat double-onChange), 42 weitere Toggles im selben Bug → neue `<IOSToggle>`-Komponente mit eingebautem 150ms-Dedupe; Favoriten + Vorschläge brauchten ~100ms zum Erscheinen → `loadFavoritesSnapshot` / `loadSuggestionsSnapshot` |

### Phase 5 — News-Entity-Refactor (v1.1.1253 – v1.1.1258)

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1253** | News onMount boot-block + dead code + lazy images | `_loadFeedreaderHistory` deferred mit 8s-Timeout; `feedSources.js`/`articleCache.js`/`rssParser.js` (TODO-Code) gelöscht; `<img loading="lazy" decoding="async">` |
| **v1.1.1254** | News empty-state mit Integration-Hinweisen | Hinweis auf `timmaurice/feedparser` (HACS) und core `feedreader` direkt im UI |
| **v1.1.1255** | News thumbnail multi-shape extraction | `_extractThumbnail` Helper für `enclosures[]`, `media_thumbnail[]`, `media_content[]`, `content` Array, Description HTML; img tags mit `referrerPolicy="no-referrer"` + `onError`-Hide |
| **v1.1.1256** | `window.debugNewsImages()` Diagnostics | DevTools-Helper um Roh-Bild-Felder pro Entity zu inspizieren |
| **v1.1.1257** | `debugNewsImages` zeigt alle attribute-keys + `logNewsLiveEvents()` | Erkenntnis: HA-Core feedreader event entities haben **hardcoded** nur 4 Felder (title, link, description, content) — keine Bilder; Bus-Events haben volle Daten |
| **v1.1.1258** | **Vollständige Migration auf `timmaurice/feedparser`** ⭐ | `news/index.jsx` 1044 → 875 Zeilen (-169); `feedreader`-Code raus, `_loadFeedparserSensors`/`_processFeedparserSensor`/`_handleSensorStateChange`/`_entryToArticle` neu; `state_changed`-Subscription statt `feedreader`-Bus |

---

## 3. Architektur-Entscheidungen

### 3.1 `window._hass` war das eigentliche Bottleneck

Drei Releases (v1.1.1248, v1.1.1249, v1.1.1245-Instrumentierung) jagten dem 10s-Boot-Block hinterher mit Parallelisierung der Integration- und EnergyDashboard-onMount-Calls. Erst v1.1.1250 fand die Ursache: `waitForHass` in `src/utils/hassRetryService.js` und `registry.js:426` lesen `window._hass` an 5 Stellen, **gesetzt wird er nirgends**. Der Code-Kommentar "Source 2: Global window._hass (set by Home Assistant)" war Wunschdenken — HA setzt das nicht. `maxRetries × interval = 20 × 500 = 10000 ms` → exakt der gemessene Boot-Block.

**Lesson:** Wenn ein Profil eine glatte Round-Number-Latenz zeigt (5000, 10000, 30000 ms), zuerst die Constants im Code suchen statt Hypothesen über Network/IO zu bilden. Ein `grep window._hass` vor Phase 5 hätte das Problem in 30 Sekunden gefunden.

### 3.2 Drei-Tier Warm-Cache (localStorage → IndexedDB → HA)

Reine IndexedDB-Warm-Cache war auf Safari nicht schnell genug (DB-Open + Read = 50–500 ms). Lösung: localStorage als 1st-Tier (synchron, ~1 ms). Reihenfolge:

1. `useState(() => loadEntitiesSnapshot())` — sync read aus localStorage, top-120 entities mit Live-State aus `hass.states` enriched, Cards im allerersten Preact-Render.
2. `loadEntitiesFromCache(db)` — IndexedDB warm-cache, replaced non-system tier, evtl. mehr Entities.
3. `loadEntitiesFromHA()` — frische HA-Daten, ersetzt alles.

Funktionale `setEntities(prev => …)` Updater verhindern, dass jeder Tier den vorherigen wegblast. Preact-Reconciliation per `entity_id` hält Cards mounted über alle drei Updates → kein Flash, keine Re-Animation.

### 3.3 contextValue useMemo

`DataProvider.contextValue` wurde bei jedem Render neu erzeugt. Folge: jedes state_changed → neue Object-Identität → alle Consumer (SearchField + jeder `useData()`-Hook) re-rendern. Mit useMemo bleibt Identität stabil bis sich tatsächlich was ändert. Voraussetzung: alle Callbacks im Object müssen `useCallback`'d sein (waren sie schon, bis auf `generateTestPatterns`).

`hass` im Context jetzt direkt der Prop (nicht `hassRef.current`), um eine 1-Render-Lag-Race-Condition zu eliminieren.

### 3.4 IOSToggle-Komponente — der Preact-Compat-Bug

`<label> + <input type="checkbox"> + onChange` feuert in Preact-Compat **zweimal** pro Klick. Erste Call schreibt `true`, zweite Call flippt zurück. v1.1.1219 hatte das schon einmal im `CircularSlider.PowerToggle` mit 150ms-Dedupe gefixt — war aber überall sonst noch drin. v1.1.1252 zentralisiert via `<IOSToggle>` mit eingebautem Dedupe; **42 Toggles** über 8 Dateien migriert.

**Regel für die Zukunft:** Neue Toggles immer `<IOSToggle>` benutzen, nie `<label className="ios-toggle"><input type="checkbox" .../></label>` direkt schreiben.

### 3.5 News-Entity: HA-feedreader-Architektur ist ein Sackgasse für Bilder

HA-Core `feedreader/event.py` hat einen **hardcoded** Schema von 4 Feldern auf den Event-Entities: `title, link, description, content`. Bilder, Enclosures, media_* werden bewusst entfernt. Der vollständige `feedparser`-Entry geht zwar auf den Bus, aber Event-Entities (was wir beim Mount lesen) sind sparse.

`timmaurice/feedparser` (HACS-Custom-Integration) macht's anders: `sensor.<feed>` mit `attributes.entries[]`, jedes Entry hat `image`-Feld (Python-seitig schon extrahiert). v1.1.1258 ist Volltauschmigration.

ABER (Erkenntnis am Ende der Session): `timmaurice/feedparser._process_image` checkt `media_content`/`media_thumbnail`/`enclosures`/`summary`-HTML — **NICHT `<content:encoded>`**. Tagesschau und viele andere deutsche Feeds liefern Bilder NUR in `<content:encoded>`. Folge: Bilder fehlen weiterhin für solche Feeds.

**Konsequenz:** Eigene HA-Custom-Component nötig. Roadmap in `CUSTOM_COMPONENT_ROADMAP.md`.

### 3.6 state_changed throttle 150ms

`scheduleEntityStateUpdate` wurde rAF-batched (max 1 setEntities pro Frame = 60Hz). HA mit aktiver Smart-Home-Konfig schickt 5–10 state_changed/s. 60 Re-Renders/s = sustained CPU-Last = Hitze. Throttle auf min 150ms zwischen Flushes → 6-7/s, visuell nicht unterscheidbar.

### 3.7 Skeleton-Animationen: opacity statt background-position/box-shadow

Lesson aus v1.1.1242: `background-position`-Shimmer und `box-shadow`-Pulse sind **Paint-pro-Frame** auf Mobile-GPU. Bei 8+ Skeleton-Cards × 60fps × Paint = thermische Last. Opacity-Animationen sind compositor-only (GPU-Blending), fast kostenlos.

**Regel:** Permanent laufende CSS-Animationen ausschließlich auf `transform`, `opacity` oder Compositor-only-Properties. Niemals `box-shadow`, `background-position`, `filter`, `width`, `height` als animierte Property bei Endlos-Animationen.

### 3.8 Performance-Instrumentierung bleibt im Production-Bundle

`src/utils/perfMarks.js` + 18 Marks im Boot-Pfad bleiben ausgeliefert. Cost ist Mikrosekunden pro Mark, Auto-Dump nur sichtbar wenn DevTools offen. Vorteil: künftige Perf-Probleme können ohne Re-Build profiled werden.

---

## 4. Etablierte Conventions

### 4.1 Default-Storage-Pattern für UI-Snapshots

Drei localStorage-Snapshots existieren jetzt nebeneinander, alle nach gleichem Pattern:

| Key | Inhalt | Schreiber | Leser |
|---|---|---|---|
| `fsc_entities_snapshot_v1` | Top-120 Non-System-Entities | `loadEntitiesFromHA` finally | `useState`-Initializer in DataProvider |
| `fsc_favorites_snapshot_v1` | Set von entity_ids | `toggleFavorite` + `loadCriticalData` | `useState`-Initializer in DataProvider |
| `fsc_suggestions_snapshot_v1` | Top-60 Suggestion-Objects | `loadSuggestions` `.then` | `useState`-Initializer in `useSuggestions` |

`clearLearningData` in DataProvider ruft alle drei `clear*Snapshot()`-Funktionen auf, sonst blitzen alte usage_counts beim nächsten Boot. Cleanup zentralisiert in `clearUiStateSnapshots()`.

### 4.2 IOSToggle statt rohes label-input-Pattern

```jsx
// Falsch:
<label className="ios-toggle">
  <input type="checkbox" checked={x} onChange={(e) => setX(e.target.checked)} />
  <span className="ios-toggle-slider"></span>
</label>

// Richtig:
<IOSToggle checked={x} onChange={setX} />
```

Props: `checked`, `onChange (boolean) => void`, `disabled?`, `stopPropagation?`, `style?`. Wrapper enthält 150ms-Dedupe, kümmert sich um Preact-Compat.

### 4.3 News-Entity-Schema (für custom Component-Kompatibilität)

Article-Format im Cache:
```js
{
  id: string,         // entity-eindeutig (link oder guid)
  title: string,
  description: string,    // Plain text (gestripped)
  content: string,    // HTML wenn vorhanden
  link: string,
  published: Date,    // JS Date object
  source: string,     // Channel-Title oder Feed-Name
  category: string,   // 'news'|'tech'|'smarthome'|...
  thumbnail: string|null,  // URL
  read: boolean,
  favorite: boolean,
  priority: 'normal',
}
```

Sensor-Lese-Pattern (`timmaurice/feedparser`-kompatibel):
```js
sensor.<name>:
  state: <count>
  attributes:
    channel: { title, link, image, ... }
    entries: [
      { title, link, summary, content, published, image, ... }
    ]
```

### 4.4 Performance-Marks bei neuen Boot-Code-Pfaden

Wenn neue Init-Schritte hinzukommen, einen `perfMark('dp-foo-bar')` davor/danach setzen. So bleibt die Profil-Tabelle aktuell. Naming-Konvention: `<area>-<step>` mit Bindestrich, lowercase.

### 4.5 Tote Code-Pfade konsequent löschen

In dieser Session entfernt:
- `src/system-entities/entities/news/config/feedSources.js` (335 LOC, nirgends importiert)
- `src/system-entities/entities/news/utils/articleCache.js` (singleton class, nirgends importiert)
- `src/system-entities/entities/news/utils/rssParser.js` (mit `// TODO: Implement` Marker, nirgends importiert)
- `_handleFeedreaderEvent`, `_loadFeedreaderHistory`, `_loadFeedreaderEventEntities`, `_extractThumbnail`, `_extractImageFromHtml`, `_findEntityIdByFeedUrl`, `window.testFeedreaderEvent` aus `news/index.jsx` (~169 Zeilen)

Wenn man unsicher ist ob Code dead ist: `grep -rn "FunctionName" src/` über das ganze Repo. Wenn nur die Datei selbst auftaucht, weg damit.

---

## 5. Wichtige Dateien

### Neu erstellt

- `src/utils/entitiesSnapshot.js` (v1.1.1241) — `loadEntitiesSnapshot` / `saveEntitiesSnapshot` / `clearEntitiesSnapshot`
- `src/utils/perfMarks.js` (v1.1.1245) — `perfMark` / `perfDump` / `perfReset` + `window.__fsc_perf` global
- `src/utils/uiStateSnapshots.js` (v1.1.1252) — Favoriten- + Suggestions-Snapshots
- `src/components/common/IOSToggle.jsx` (v1.1.1252) — wiederverwendbarer Toggle mit Dedupe

### Stark modifiziert

- `src/providers/DataProvider.jsx` — Boot-Pfad-Refactor, contextValue useMemo, state_changed throttle, snapshot-Wires, `setEntities`-merge-Pattern
- `src/system-entities/entities/news/index.jsx` — komplette Migration `feedreader` → `feedparser`, ~169 Zeilen weniger
- `src/system-entities/entities/news/NewsView.jsx` — `hasFeedreader` → `hasFeedparser`, lazy-load images, hint-Text update
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — Sensor-Filter (`sensor.*` mit `entries`+`channel`), neuer Empty-State
- `src/utils/dataLoaders.js` — `loadCriticalData` Promise.all, neue `loadEntitiesFromCache` Funktion mit Live-State-Enrichment
- `build.sh` — HTML-Skeleton-Placeholder (v1.1.1240), `window._hass`-Setter (v1.1.1250), `element-constructor`-Mark (v1.1.1245)
- `src/index.jsx` — Splash-Delays raus (v1.1.1240), `window._hass`-Setter im DataProvider-Sync-useEffect, perfMarks
- `src/utils/translations/languages/de.js` + `en.js` — `ui.suggestions.frequentlyUsed`/`contextBased`/`timeBased`/`areaBased`-Keys ergänzt
- `src/styles/perceivedSpeed.css` — `skeletonShimmer` → `skeletonPulse`, `pendingPulse` → opacity-Ring

### Entfernt

- `src/system-entities/entities/news/config/feedSources.js`
- `src/system-entities/entities/news/utils/articleCache.js`
- `src/system-entities/entities/news/utils/rssParser.js`
- (~169 Zeilen Code aus `news/index.jsx` für feedreader-Pfade)

---

## 6. Offene Themen

### 1. Eigene HA-Custom-Component für News (Hauptthema nach Session-Ende)

Status: Roadmap in `CUSTOM_COMPONENT_ROADMAP.md`. Hauptmotivation: `timmaurice/feedparser` extrahiert keine Bilder aus `<content:encoded>`. Tagesschau & viele deutsche Feeds liefern Bilder ausschließlich dort. Eigene Component löst das schemakompatibel.

### 2. Bug-Backlog (kleinere)

- `news/index.jsx` Globaler `window._newsViewRef` wird beim Unmount nicht aufgeräumt — kleines Speicher-Leak-Risiko bei mehrfachem Mount.
- `~65 console.log()` in News-Code — kosmetisch, könnte hinter DEBUG-Flag.
- `useCallback`/`useMemo`-Audit auf NewsView.jsx (19 useState-Hooks, viele inline-Handler) — eher kleiner Effekt.
- Virtualisierung der Artikel-Liste falls jemand wirklich 200+ Artikel hat — strukturell, nur wenn Profile zeigt dass es klemmt.

### 3. Performance — was noch übrig

- **Bundle-Size** (1.4 MB raw / 366 KB gzip): chart.js (200 KB gzip!) ist der größte einzelne Block, könnte tree-shaked oder gegen schlankere Lib ersetzt werden, aber Risk vs Reward unklar. Lazy-Loading bricht HACS-Single-File.
- **backdrop-filter on `.glass-panel`** ist auf Mobile-GPU teuer (auf 50+ CSS-Regeln verteilt). Mobile-reduzierter Blur (10px statt 20px) wäre messbarer Gewinn aber visueller Change — User-Entscheidung.
- **memo() flächig** auf SearchField (1100 Zeilen, 33 Hooks) — Stale-Closure-Albtraum. Eher: gezielte Subkomponenten-Memo statt Top-Level.

### 4. Bewusst verworfen (nicht wieder vorschlagen ohne neuen Kontext)

- Adapter-Variante für News (Option A: beide HA-Integrationen unterstützen) — User wählte explizit Volltausch (Option B in v1.1.1258).
- Browser-side RSS-Fetching mit Public-CORS-Proxy (`allorigins.win` etc.) — Privacy + Reliability + Rate-Limits.
- Code-Splitting in der Card — `inlineDynamicImports: true` ist HACS-Pflicht.

---

## 7. Quick-Start für die nächste Session

### Dem neuen Claude zeigen

1. Diese Notes (`SESSION_NOTES_2026-04-24_25.md`) — 10 Min Lesen
2. `CUSTOM_COMPONENT_ROADMAP.md` — Plan für die Python-Component
3. Vorgängernotes `SESSION_NOTES_2026-04-19_24.md` und `SESSION_NOTES_2026-04-17_18.md` für Conventions
4. Aktuelle Version aus `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` (heute: **v1.1.1258**) verifizieren
5. `git log --oneline -30`

### Was sehr wahrscheinlich als nächstes ansteht

- HA-Custom-Component für News scaffolden (Plan ist da, Code noch nicht). Voraussichtlich neues Repo.
- Card bleibt unverändert wenn Schema-Variante A (kompatibel mit `timmaurice/feedparser`) verwendet wird.

### User-Präferenzen (aus dieser Session bestätigt)

- Pragmatisch: lieber sauberen Volltausch (Option B) als Adapter-Komplexität (Option A) wenn Klarheit über das Ziel besteht.
- Daten-getrieben: lehnt blinde Optimierung ab. Hat dreimal in dieser Session "messen statt raten" durchgezogen — und genau das hat den `window._hass`-Bug gefunden.
- Mehrere Bugs sammeln und ein Bündel-Release machen statt jedem einzelnen einen eigenen Release.
- Bei Architektur-Entscheidungen klare Optionen-Tabellen mit Aufwand/Risk wertschätzen, dann selbst entscheiden.

---

## 8. Status am Session-Ende (v1.1.1258)

### Bundle

| Stand | Version | JS gzip | CSS gzip |
|---|---|---:|---:|
| Anfang | v1.1.1237 | ~382 KB | ~20 KB |
| Ende | v1.1.1258 | ~366 KB | ~20 KB |

JS leicht geschrumpft trotz Feature-Adds (Snapshot-Utils, IOSToggle, perfMarks) durch News-Dead-Code-Cleanup (~600 LOC weg).

### Boot-Performance (Mac Safari, gemessen)

| Phase | Zeit |
|---|---:|
| `bundle-evaluated` → `app-first-render` | 4–9 ms |
| `dp-init-start` → `dp-db-init` | 28–80 ms |
| `dp-db-init` → `dp-critical-done` | 80–120 ms |
| `dp-critical-done` → `dp-warmcache-done` | 49–101 ms |
| `dp-warmcache-done` → `dp-initialized` | ~0 ms |
| `dp-initialized` → `dp-ha-rendered` (Cards sichtbar) | ~250–350 ms |
| **Total bis Cards sichtbar** | **~570–911 ms** |
| `dp-ha-indexed` (background search index) | +320–500 ms |
| `dp-registry-done` (background system entities) | +30–250 ms |

Vor Session: 10000+ ms bis Cards sichtbar. **Faktor ~12× schneller.**

### Hitze

Subjektiv besser nach v1.1.1244 (state_changed throttle) und v1.1.1251 (contextValue memoize). v1.1.1250 (window._hass) eliminierte 10s sustained Background-Polling beim Boot. User hat nach v1.1.1251 "ok sehr gut" gesagt.

### Features live

- ✅ News komplett auf `timmaurice/feedparser` umgestellt (BREAKING für `feedreader`-User)
- ✅ Performance-Instrumentierung in Production
- ✅ Snapshot-3-Tier-Architektur (localStorage + IndexedDB + HA)
- ✅ IOSToggle-Komponente überall ausgerollt (42 Stellen)
- ✅ Translation-Keys für Suggestion-Gruppen DE/EN
- ✅ Auto-dump perf-Tabelle bei Boot (DevTools-Console)

### Bekannte offene Baustellen

- News-Bilder fehlen für Tagesschau-artige Feeds (Bilder nur in `content:encoded`) → Lösung via eigene HA-Custom-Component (siehe Roadmap)
- `window._newsViewRef` Memory-Leak-Risiko bei mehrfachem Mount
- Bundle-Größe + backdrop-filter Mobile-Cost — nur wenn User klagt

### User-Feedback im Verlauf

- "es ist viel viel besser geworden" (nach Phase 2/3 Boot-Optimierungen)
- "das handy wird sehr heiss" (vor v1.1.1251 — wurde mit Phase 4 + Phase 7 adressiert)
- "ok sehr gut" (nach Phase 7)
- "Bilder werden nicht angezeigt" (auslösend für News-Migration)
- "ich glaube ich sollte selber ein custom componente installieren" (Trigger für Roadmap)

---

## 9. Session-Ende-Checkliste

- [x] Letzter Commit + Push auf `main` (v1.1.1258)
- [x] Tag `v1.1.1258` auf GitHub
- [x] Release mit Asset erstellt
- [x] `docs/versionsverlauf.md` aktuell, alle 21 Releases drin
- [x] `current_version` in Versionsverlauf-Entity hochgezogen
- [x] Diese Session-Notes erstellt
- [x] `CUSTOM_COMPONENT_ROADMAP.md` als Plan für nächste Session erstellt
- [x] Memory-Index aktualisiert

---

*Session-Notes geschrieben am 2026-04-25 nach 21 Releases (v1.1.1238 – v1.1.1258) in zwei langen Tagen. Nächste Session voraussichtlich: Eigene HA-Custom-Component für News scaffolden — siehe `CUSTOM_COMPONENT_ROADMAP.md`.*
