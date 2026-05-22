# Feature Roadmap — 10 Ideen

**Erstellt:** 2026-05-22
**Basis:** Analyse Versionsverlauf v1.0.0 → v1.1.1610 + 16 Session-Notes + Code-Inspektion
**Status:** Vorschlag / unpriorisiert (außer Quick-Priorisierung am Ende)

Konkrete Feature-Vorschläge, die an offene Threads in den Session-Notes, ungenutzte HA-APIs und Lücken in der bestehenden Architektur anknüpfen. Jede Idee mit Aufhänger im aktuellen Code.

---

## 1. Echte LLM-Conversation (statt simulierte AI)

**Pitch:** Aus dem Mock-AI-Mode einen echten Conversational Assistant machen, der HA-Geräte direkt steuert.

**Status quo:** `AIModeSection.jsx` zeigt simulierte Responses. HA hat seit 2024 die **Conversation API** + Assist-Pipeline (`conversation.process`), beliebige LLM-Backends (OpenAI/Anthropic/Ollama) sind als HA-Integration verfügbar.

**Was rein:**
- Eingabe → `hass.callService('conversation', 'process', { text, conversation_id, agent_id })` → Antwort + `tool_calls` für direkte Geräte-Aktionen ("Schalte Küche aus").
- Conversation-ID persistieren für Folge-Fragen ("und im Bad auch").
- Agent-Picker in Settings (HA listet via `conversation/list` alle verfügbaren Agents).

**Aufwand:** Mittel — der Mock-Wrapper ist schon da, nur API ranhängen + Tool-Call-Display + History-Persistierung.

**Files (geschätzt):**
- `src/components/ai/AIModeInterface.jsx` (existiert, refactor)
- `src/utils/conversationService.js` (neu)
- Settings-Tab: Agent-Picker

---

## 2. Spotlight / Command-Palette (Cmd+K)

**Pitch:** Eine zweite Such-Ebene über der bestehenden Entity-Suche — nicht „finde Gerät", sondern „führe Aktion aus".

**Status quo:** Keine Action-Search. Scenes/Scripts sind im ContextTab pro Device gruppiert, aber nicht global suchbar.

**Was rein:**
- Global per `Cmd+K` (oder Long-Press auf Mobile) aufrufbar.
- Beispiele: „Movie-Time aktivieren", „Calendar morgen öffnen", „Heizung auf 21°", „Letzten Tipp lesen", „Settings → Bento".
- Quellen: Scenes, Scripts, Automations, System-Entity-Actions, Settings-Sub-Views, Routinen (siehe #7).

**Anknüpfung:** Fuse.js + System-Entity-Registry + `actions`-Property pro Entity sind alle schon da. Eine Action-Suche = Fuse über einen anderen Index.

**Aufwand:** Klein-mittel — `commandRegistry.js` aufbauen, Keybinding hooken, eigenes Overlay-Panel (kann den bestehenden Search-Stil wiederverwenden).

**Files (geschätzt):**
- `src/utils/commandRegistry.js` (neu)
- `src/components/CommandPalette.jsx` (neu)
- `src/hooks/useGlobalKeybinding.js` (neu)

---

## 3. Notification-Center als System-Entity

**Pitch:** Toasts verschwinden nach 3s spurlos. Eine vollwertige System-Entity (analog zu News/Todos) mit Notification-History.

**Status quo:** Toast-System existiert (`toastNotification.js`), HA `persistent_notifications` werden in `dataNotifications.js` schon extrahiert. Aber keine History, kein Center, keine Bulk-Actions.

**Was rein:**
- System-Entity `notifications` mit eigener Custom-View (analog Todos/News).
- Filter: error / warning / info.
- Quick-Actions: „Dismiss all", „Snooze 1h".
- Bento-Widget: Top-3 ungelesene + Badge-Count.
- Sidebar-Item mit Live-Badge.
- Datenquellen: HA `persistent_notifications` + eigene Toast-Historie + ggf. `mobile_app`-Notifications.

**Aufwand:** Mittel — Persistierung-Schicht (IndexedDB-Store für Toast-History) + View. Toast-Pipeline ist schon da.

**Files (geschätzt):**
- `src/system-entities/entities/notifications/` (komplett neu, analog zu `news/`)
- IndexedDB-Store-Schema-Update für Notification-History
- `dataNotifications.js` erweitert um Persist-Layer

---

## 4. Camera-Live-View als System-Entity

**Pitch:** Kameras kriegen eigene App-artige View mit Grid + Live-Stream.

**Status quo:** HA hat `camera.*`-Domain mit `/api/camera_proxy_stream/{entity_id}` (MJPEG) und `camera.snapshot`-Service. Aktuell nutzt die Card das gar nicht — Kameras erscheinen nur als generische Entity-Cards.

**Was rein:**
- **Grid-View:** Alle Kameras als Live-Tiles mit Snapshot-Polling alle 5s (kein Full-Stream initial — bandwidth-friendly).
- **Detail-Stream:** Click → Full-Frame MJPEG/HLS.
- **Bento-Widget:** Letzte aktive Kamera als Hero (z.B. Tür-Klingel bei Motion-Detection).
- **Snapshot-History:** Bei Motion-Events Snapshots speichern + chronologisch durchblätterbar.

**Aufwand:** Mittel-groß — Stream-Lifecycle (Unmount muss Connections zumachen), Snapshot-Throttling, evtl. WebRTC-Integration für höhere Stream-Quality.

**Files (geschätzt):**
- `src/system-entities/entities/cameras/` (neu)
- `src/utils/cameraStreamManager.js` (neu, Connection-Pool)
- `src/components/bento/widgets/BentoRichCamera.jsx` (neu)

---

## 5. Floorplan / Map-View als System-Entity

**Pitch:** 2D-Grundriss des Hauses mit Geräten als interaktive Hotspots.

**Status quo:** `areas` ist First-Class-Konzept im DataProvider, aber keine räumliche Visualisierung. Click auf Lampe → State-Toggle oder Detail.

**Was rein:**
- User uploadet Grundriss-Bild (SVG oder PNG) + platziert Devices via Editor (drag-Coords).
- **Realtime:** Lampen leuchten farbig wenn an, Sensoren zeigen Werte als kleine Pills, Türen/Fenster zeigen offen/geschlossen.
- **Editor-Mode:** Toggle in Settings, Devices als draggable Markers.
- **Multi-Floor:** Tab-Switch zwischen Etagen.

**Aufwand:** Groß — eigener Editor-Mode, Coords-Persistence, SVG-Render-Layer. Aber hochsichtbares Feature.

**Files (geschätzt):**
- `src/system-entities/entities/floorplan/` (neu)
- `src/components/FloorplanEditor.jsx` (neu)
- `src/utils/floorplanStorage.js` (neu, IndexedDB)

---

## 6. Energy-Cost-Tracking + Sparpotenzial

**Pitch:** Aus den existierenden Energy-Daten echte €-Werte machen.

**Status quo:** Energy-Dashboard kennt nach dem v1.1.1425-Schema-Rewrite schon `entity_energy_price`, aber nutzt es nur als Preference-Auslese. Keine aggregierte Kostenanzeige.

**Was rein:**
- Tag/Woche/Monat-Kosten (in €).
- Year-over-Year-Vergleich.
- Top-Verbraucher-Ranking („Waschmaschine: 18 € diesen Monat").
- **Sparpotenzial-Hinweise** bei Tarif-Variabilität: „Du würdest 12 € im Monat sparen wenn der Trockner abends statt mittags läuft" (basierend auf `stat_rate_from/to`).
- Bento-Widget: Heute X €, gestern Y € — als W3/W4-Pill-Format.

**Anknüpfung:** `energy/get_prefs` liest du schon, `recorder/statistics_during_period` liefert die Werte.

**Aufwand:** Mittel — keine neue Datenquelle, nur Aggregation + UI.

**Files (geschätzt):**
- `src/system-entities/entities/integration/device-entities/energyDashboardCalculations.js` (existiert, erweitern)
- `src/components/bento/widgets/BentoRichEnergyCost.jsx` (neu)
- Neue Sub-View in EnergyDashboardDeviceView

---

## 7. Routinen / Modi-Engine

**Pitch:** Multi-Device-Aktionen mit einem Klick — „Morgen-Modus", „Kino-Modus", „Schlaf-Modus".

**Status quo:** Für solche Aktionen muss man in HA eine Scene oder Script anlegen. Direkt in der Card erstellbar wäre niederschwelliger.

**Was rein:**
- **Modi-Picker im Sidebar/Bento:** „Morgen 🌅" → Rollos hoch, Kaffee an, Heizung +2°.
- **Schedule-Integration:** Routinen lassen sich an Sunrise/Sunset/Time/Geofence triggern (ScheduleTab + scheduler-component existieren schon).
- **Builder-UI:** Apple-Reminders-Style Sub-View-Stack (analog `CalendarEventDialog`) → Device wählen → Action wählen → speichern.
- **Persistierung:** Entweder in IndexedDB-Card-Local, oder als HA-Script über die WS-API erstellt.

**Anknüpfung:** ContextTab zeigt schon Scenes/Scripts pro Device. Eine Routine wäre ein „virtuelles Script".

**Aufwand:** Mittel — UI-Builder + Execution-Layer.

**Files (geschätzt):**
- `src/system-entities/entities/routines/` (neu)
- `src/components/RoutineBuilder.jsx` (neu)
- `src/utils/routineExecutor.js` (neu)

---

## 8. Globale Suche über alle System-Entities

**Pitch:** Eine Eingabe findet **gleichzeitig** Todos, News-Artikel, Calendar-Events, Tipps, Versionsverlauf-Einträge und Geräte.

**Status quo:** Memory-TODO (`SESSION_NOTES_2026-05-16_to_17.md`, „Open Threads"). Aktuelle Suche findet nur Devices + System-Entity-Namen, nicht deren Content.

**Was rein:**
- Wo: Im Sidebar als Search-Pill, oder `Cmd+F`.
- Each-Entity-Searchable: Jede System-Entity exposed eine `searchableItems()`-Funktion (Fuse-Index pro Entity).
- Globale Suche aggregiert + zeigt Gruppen-Header: „Geräte / Aktionen / Inhalte".
- Click auf Result → deep-link in die passende Entity (Pattern existiert schon, z.B. `window.__pendingNewsArticleId`).

**Anknüpfung:** Kann mit #2 (Command-Palette) zusammenfallen — eine Eingabe mit Mode-Switch („Aktionen finden" vs. „Content finden").

**Aufwand:** Klein-mittel — Each-Entity-Searchable ist eine simple Schnittstelle, jede Entity ergänzt 1 Funktion.

**Files (geschätzt):**
- `src/system-entities/base/SystemEntity.js` (Interface erweitern um `searchableItems()`)
- `src/utils/globalSearch.js` (neu)
- Jede `entities/*/index.jsx` ergänzt um `searchableItems`-Implementation

---

## 9. Standby / Ambient-Mode für Wand-Tablets

**Pitch:** Nach X Min ohne Interaktion in einen Ambient-Mode — große Uhr (Apple-Standby-Style) + Wetter + heute's Calendar + Notification-Count.

**Status quo:** `kioskMode.js` existiert (rudimentäre Hide-UI-Funktion), aber kein vollwertiger Ambient-Layer. Bei vielen Usern läuft die Card als Always-On-Display auf iPad/Wand-Tablet.

**Was rein:**
- Idle-Detection (Mouse/Touch-Idle > X Min, konfigurierbar).
- Wake on Touch.
- Optional konfigurierbares Layout pro Tageszeit (Tag/Nacht-Variante).
- Burn-In-Protection: subtile Drift-Animation alle 30s.
- Settings-Toggle: „Aktivierung nach 5/10/30 Min".

**Anknüpfung:** Bento-Architecture eignet sich perfekt — der Ambient-Mode wäre quasi ein 5. Layout neben Desktop/Mobile/DetailView/Search.

**Aufwand:** Mittel — idle-Detection + View-Komposition aus existing Widgets.

**Files (geschätzt):**
- `src/components/AmbientMode.jsx` (neu)
- `src/hooks/useIdleDetection.js` (neu)
- `src/utils/kioskMode.js` (existiert, erweitern)

---

## 10. Calendar: Multi-Day-Events + Custom-RRULE-Editor

**Pitch:** Direkt aus den offenen Calendar-Threads (`SESSION_NOTES_2026-05-17_to_21.md`, „Calendar-Polish").

**Status quo:** Calendar System-Entity ist seit v1.1.1553–1559 funktional, hat aber zwei klare Lücken:

**Was rein:**

**A) Multi-Day-Events:**
- Aktuell rendern Multi-Day-Events nur am Start-Tag in Tag-/Wochen-View.
- Sollten als durchgehende Bars über alle betroffenen Tage gezeichnet werden (Apple-Calendar-Style).
- Implementation: CSS-Grid-Column-Spans + Event-Splitting bei Tagesgrenzen.

**B) Custom-RRULE-Editor:**
- Aktuell 5 Apple-Presets (Nie/Täglich/Wöchentlich/Monatlich/Jährlich).
- Apple kann „Alle 2 Wochen", „Jeden ersten Freitag", „14 Tage nach Geburtstag".
- Sub-View mit `INTERVAL` + `BYDAY` + `UNTIL/COUNT` Pickern (analog zum bestehenden Wheel-Picker-Pattern).
- Custom-RRULEs aktuell read-only als „Benutzerdefiniert" angezeigt → werden voll editierbar.

**Anknüpfung:** Die HA-WS-API (`calendar/event/update`) supportet `rrule` als Event-Field schon. Du musst nur den Editor bauen + Bar-Rendering im MonthGrid/WeekGrid.

**Aufwand:** Mittel — RRULE-Parsing über `rrule.js`-Lib (~6 KB) oder eigener Mini-Parser (5 Felder reichen), Bar-Rendering ist CSS-Grid-Spans.

**Files (geschätzt):**
- `src/system-entities/entities/calendar/CalendarView.jsx` (MonthGrid/WeekGrid: Multi-Day-Bar-Rendering)
- `src/system-entities/entities/calendar/components/CalendarEventDialog.jsx` (Recurrence-Sub-View erweitern)
- `src/system-entities/entities/calendar/utils/rruleHelpers.js` (neu)

---

## Quick-Priorisierungs-Matrix

| Bucket | Ideen | Begründung |
|---|---|---|
| **High Impact, Low Effort** | #2 Cmd+K · #8 Globale Search · #10 Calendar-Polish | Infrastruktur ist da, klare Nutzen |
| **High Impact, Mittel Effort** | #1 LLM · #3 Notification-Center · #6 Energy-Cost · #9 Ambient | Neue Surface, aber etablierte Patterns |
| **Hochsichtbar, Großer Effort** | #4 Camera · #5 Floorplan · #7 Routinen | Marketing-fähige Features, brauchen aber neue Subsysteme |

### Empfehlung als Startpunkt

**#2 + #8 zusammen als „Spotlight"-Feature.** Kleiner Aufwand mit dem größten täglichen Nutzen — die gesamte Infrastruktur (Fuse, System-Entity-Registry, Action-Properties) ist schon da. Erweitert die existierende Search-UX statt ein neues Subsystem zu öffnen.

---

## Out-of-Scope (bewusst nicht aufgenommen)

Ideen, die diskutiert wurden, aber nicht in die Top-10 kamen:

- **Plugin-Store live machen** — zu offen-ended, kein klares MVP.
- **Theme-Picker** — zu klein, ein Dropdown.
- **Backup/Restore Settings als JSON** — nützlich, aber Bauchfeature.
- **Recipe-Browser / Habits-Tracker** — passt nicht zum HA-zentrierten Fokus.
- **Geofencing-Status-Widget** — wäre Erweiterung von #7 Routinen.
- **Custom-Groups (parallel zu Areas)** — sinnvoll, aber Niche-Use-Case.

---

## Anmerkungen

- Diese Roadmap ist ein **Vorschlag**, keine Festlegung. Reihenfolge + Auswahl liegt beim User.
- Aufwand-Schätzungen sind grob (Klein < 4 h, Mittel 4–16 h, Groß > 16 h).
- Strukturelle Refactors (siehe `memory/project_structural_refactor_plan.md`) sind ein paralleler Track und konkurrieren nicht mit dieser Feature-Roadmap.
