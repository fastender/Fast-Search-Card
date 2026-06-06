# Info-Popup Catalog (kartenweit / card-wide)

> **Zweck:** Gepflegte Übersicht **aller** Info-Popup-Texte in der Karte — der
> Text, der hinter einem **ⓘ**-Button erscheint.
>
> **Kartenweit, nicht nur Settings:** Das ⓘ-Info-Popup ist ein **allgemeines
> Karten-Primitiv**, kein reines Settings-Feature. Es funktioniert überall, wo es
> einen `.detail-panel`-Vorfahren und `lang` gibt. Heute sitzen die Popups in den
> Settings-Tabs **und** in der News-Entity-Settings-View — weitere Bereiche
> (andere System-Entities, Geräte-Detail-Views, Setup-Flows …) können dasselbe
> Muster jederzeit nutzen.
>
> **Wichtig — Single Source of Truth:** Die App rendert diese Texte **nicht** aus
> dieser Datei (ein kompiliertes JS-Bundle kann zur Laufzeit keine externe `.md`
> lesen). Die echten Texte leben in den Translations:
>
> - `src/utils/translations/languages/de.js` → `ui.settings.settingsInfo.<key>`
> - `src/utils/translations/languages/en.js` → `ui.settings.settingsInfo.<key>`
>
> ⚠️ Der Bucket-Name `settingsInfo` ist **historisch** — er hält alle
> kartenweiten Info-Texte, nicht nur Settings. (Umbenennen wäre ein großer
> Key-Refactor; bewusst belassen.)
>
> Diese Datei ist die **menschenlesbare Datenbank**: hier planen/pflegen, dann in
> beide Translation-Dateien spiegeln. Beim Ändern eines Textes **immer beides**
> aktualisieren (diese MD + de.js + en.js).
>
> **Komponente:** `src/components/tabs/SettingsTab/components/SettingsSectionInfo.jsx`
> — exportiert `SettingsInfoButton` (reines ⓘ + Popup, frei platzierbar) und
> `SettingsSectionHeader` (Sektions-Titel + ⓘ). Props: `infoKey`, `lang`, optional
> `t`; ohne `t` Fallback auf `translateUI('settings.settingsInfo.<key>')`.
> Markdown wird über `src/utils/miniMarkdown.js` (`renderMarkdown`) gerendert
> (Links automatisch `target="_blank"`).
>
> **Neuen Eintrag hinzufügen:** (1) Key + Text in de.js **und** en.js unter
> `settingsInfo` ergänzen; (2) `<SettingsSectionHeader … infoKey="<key>" />` bzw.
> `<SettingsInfoButton infoKey="<key>" />` an der gewünschten Stelle einbauen;
> (3) Zeile in die Tabelle unten + einen Inhalts-Abschnitt hier ergänzen.

## Wo welcher Key hängt (nach Bereich)

### Settings → General

| infoKey | Sektion (Header) |
|---|---|
| `general` | ALLGEMEIN / GENERAL |
| `statusGreetings` | STATUS & GREETINGS |
| `mobile` | Mobile |
| `sidebar` | Sidebar |
| `homeScreen` | Startseite / Home Screen |
| `tts` | Text-to-Speech |
| `suggestions` | Vorschläge / Suggestions |
| `toasts` | Toasts |

### Settings → Appearance

| infoKey | Sektion (Header) |
|---|---|
| `design` | Darstellung / Design |
| `homeAssistant` | Home Assistant |
| `animations` | Animationen / Animations |
| `videoFolder` | Video Folder (Animations-Detail) |
| `videoFiles` | Video Files (ⓘ statt Inline-Anmerkung) |

### Settings → Filter (früher „Privacy")

| infoKey | Sektion (Header) |
|---|---|
| `limits` | Limits (früher „System Settings") |
| `excludedPatterns` | Ausgeschlossene Muster |
| `quickAdd` | Schnellauswahl / Quick add |

### Settings → weitere Detail-/Sub-Views

| infoKey | Ort | Sektion |
|---|---|---|
| `statsBar` | StatsBar (Detail) | EINSTELLUNGEN / SETTINGS |
| `statsBarWidgets` | StatsBar (Detail) | Verfügbare Widgets |
| `sidebarItems` | Sidebar-Items (Detail) | Verfügbare Einträge |
| `homeScreenSlots` | Start Screen (Detail) | Bento-Widgets |
| `toastConfig` | Toasts (Detail) | Wann Toasts erscheinen |
| `privacySecure` | About | „Your data is secure"-Karte |

### Außerhalb des Settings-Systems (kartenweit)

| infoKey | Bereich | Sektion |
|---|---|---|
| `integrationTypes` | **Integration „Geräte hinzufügen"** | VERFÜGBARE TYPEN / AVAILABLE TYPES |
| `universalPickDevice` | **Universal-Setup → Schritt 1** | Gerät wählen / Pick a Device (Titel-ⓘ) |
| `energySetup` | **Energie-Dashboard hinzufügen** | ENERGIE-QUELLEN / ENERGY SOURCES |
| `calCalendars` | **Kalender → Einstellungen** | KALENDER / CALENDARS |
| `calDisplay` | **Kalender → Einstellungen** | ANZEIGE / DISPLAY |
| `calVisibleViews` | **Kalender → Einstellungen** | SICHTBARE ANSICHTEN / VISIBLE VIEWS |
| `calNewEvents` | **Kalender → Einstellungen** | NEUE TERMINE / NEW EVENTS |
| `calTitleTemplates` | **Kalender → Einstellungen** | TITEL-VORLAGEN / TITLE TEMPLATES |
| `calDescTemplates` | **Kalender → Einstellungen** | BESCHREIBUNGS-VORLAGEN / DESCRIPTION TEMPLATES |
| `todoLists` | **Tasks → Einstellungen** | LISTEN / LISTS |
| `todoDisplay` | **Tasks → Einstellungen** | ANZEIGE / DISPLAY |
| `todoVisibleTabs` | **Tasks → Einstellungen** | SICHTBARE TABS / VISIBLE TABS |
| `todoDescTemplates` | **Tasks → Einstellungen** | BESCHREIBUNGS-VORLAGEN / DESCRIPTION TEMPLATES |
| `todoProfiles` | **Tasks → Einstellungen** | PROFILE / PROFILES |
| `scheduleDomainSettings` | **Schedule-Editor** (DomainSettingsPicker) | GERÄTE-EINSTELLUNGEN / DEVICE SETTINGS |
| `newsFeeds` | **News-Entity** → Settings | FEEDS |
| `newsDisplay` | **News-Entity** → Settings | ANZEIGE / DISPLAY |
| `heroEntities` | **Universal-Gerät bearbeiten** → Hero | ENTITÄTEN / ENTITIES |
| `chartSensors` | **Universal-Gerät bearbeiten** → Charts | SENSOREN / SENSORS |
| `quickStatsMetrics` | **Universal-Gerät bearbeiten** → Quick-Stats | METRIKEN / METRICS |
| `iconPicker` | **Universal-Gerät bearbeiten** → Icon | STANDARD / DEFAULT |
| `visibility` | **Universal-Gerät bearbeiten** → Sichtbare Entitäten | Navbar-ⓘ (rechts) |

---

## general

**DE**
> ## Allgemein
>
> Grundeinstellungen, die für die gesamte Karte gelten.
>
> - **App-Sprache** – Sprache der Oberfläche (Menüs, Beschriftungen, Datums- und Wochentagsnamen). Unabhängig von der Sprache deines Home Assistant.
> - **Währung** – Symbol und Format für alle Geldbeträge (z. B. Energiekosten, Tarife).
> - **Zeitformat** – 24-Stunden (14:30) oder 12-Stunden (2:30 PM). Betrifft alle Uhrzeiten in Charts, Aktivitäten, Zeitplänen und der Status-Leiste.
>
> *Warum wichtig:* Sprache und Zeitformat sorgen dafür, dass alle Anzeigen so aussehen wie du es gewohnt bist – die Währung wird für Energie- und Kosten-Widgets gebraucht.

**EN**
> ## General
>
> Basic settings that apply to the whole card.
>
> - **App Language** – language of the interface (menus, labels, date and weekday names). Independent of your Home Assistant's language.
> - **Currency** – symbol and format for all money values (e.g. energy costs, tariffs).
> - **Time format** – 24-hour (14:30) or 12-hour (2:30 PM). Affects every time shown in charts, activities, schedules and the status bar.
>
> *Why it matters:* language and time format make everything read the way you're used to – the currency is needed for energy and cost widgets.

## statusGreetings

**DE**
> ## Status & Begrüßung
>
> Die zwei Leisten ganz oben in der Karte.
>
> - **Status-Leiste (StatsBar)** – kompakte Widget-Zeile mit Live-Werten wie Wetter, Stromnetz, Solar oder Uhrzeit. Tippe darauf, um zu wählen welche Widgets erscheinen und woher sie ihre Daten beziehen.
> - **Begrüßungs-Leiste (GreetingsBar)** – zeigt eine tageszeitabhängige Begrüßung. Rein dekorativ, jederzeit ein- und ausschaltbar.
>
> *Warum wichtig:* Die Status-Leiste bringt die wichtigsten Werte auf einen Blick nach oben.

**EN**
> ## Status & Greetings
>
> The two bars at the very top of the card.
>
> - **Status bar (StatsBar)** – a compact widget row with live values like weather, grid power, solar or clock. Tap it to choose which widgets appear and where they pull their data from.
> - **Greetings bar (GreetingsBar)** – shows a time-of-day greeting. Purely decorative, toggle on or off anytime.
>
> *Why it matters:* the status bar surfaces your most important values at a glance.

## mobile

**DE**
> ## Mobile
>
> Verhalten speziell auf Smartphones.
>
> - **Suchfeld automatisch öffnen** – auf dem Handy startet die Karte direkt mit ausgeklapptem Such- und Geräte-Panel.
>
> *Warum wichtig:* Spart auf dem Handy einen Tipp.

**EN**
> ## Mobile
>
> Behaviour specific to phones.
>
> - **Auto-open search panel** – on mobile the card starts with the search and device panel already expanded.
>
> *Why it matters:* saves a tap on the phone.

## sidebar

**DE**
> ## Sidebar
>
> Die seitliche Navigationsleiste der Karte.
>
> - **Sidebar aktivieren** – blendet die seitliche Leiste mit deinen Schnellzugriffen ein oder aus.
> - **Immer sichtbar** – hält die Sidebar dauerhaft offen.
> - **Einträge verwalten** – lege fest, welche Bereiche und Verknüpfungen in der Sidebar erscheinen.
>
> *Warum wichtig:* Die Sidebar ist dein Schnellzugriff.

**EN**
> ## Sidebar
>
> The card's side navigation bar.
>
> - **Enable sidebar** – shows or hides the side bar with your quick shortcuts.
> - **Always visible** – keeps the sidebar open permanently.
> - **Manage items** – decide which areas and shortcuts appear in the sidebar.
>
> *Why it matters:* the sidebar is your quick access.

## homeScreen

**DE**
> ## Startseite
>
> Der Startbildschirm, den du beim Öffnen der Karte siehst.
>
> - **Bento-Grid aktivieren** – zeigt eine Kachel-Übersicht (Wetter, News, Kalender, Geräte …).
> - **Widgets konfigurieren** – wähle, welche Kacheln erscheinen und in welcher Reihenfolge.
>
> *Warum wichtig:* Die Startseite ist das Erste was du siehst.

**EN**
> ## Home Screen
>
> The start screen you see when opening the card.
>
> - **Enable bento grid** – shows a tile overview (weather, news, calendar, devices …).
> - **Configure widgets** – choose which tiles appear and in what order.
>
> *Why it matters:* the home screen is the first thing you see.

## homeScreenSlots

> Ersetzt die frühere gelbe Hinweis-Karte in der Bento-Slot-Auswahl (Start Screen Detail).

**DE**
> ## Startseiten-Widgets
>
> Lege fest, welche System-Entity in jedem der vier Bento-Slots auf der Startseite erscheint.
>
> - **W1** groß, **W2** oben rechts, **W3 / W4** unten geteilt.
> - Tippe einen Slot an, um die Entity auszuwählen.
> - Tippe auf ein Bento-Widget auf der Startseite, um direkt dessen Detail-Ansicht zu öffnen.
>
> *Warum wichtig:* So baust du dir deine Startseite aus genau den Infos zusammen, die du sofort sehen willst.

**EN**
> ## Home Screen Widgets
>
> Choose which system entity renders in each of the four bento slots on the home screen.
>
> - **W1** large, **W2** top-right, **W3 / W4** split at the bottom.
> - Tap a slot to pick its entity.
> - Tap a bento widget on the home screen to open that entity's detail view directly.
>
> *Why it matters:* this is how you compose your home screen from exactly the info you want at a glance.

## tts

**DE**
> ## Text-to-Speech
>
> Sprachausgabe für Ansagen über deine Lautsprecher und Media-Player.
>
> - **TTS-Engine** – wähle den Sprachdienst von Home Assistant (z. B. Google, Piper, Cloud).
>
> *Warum wichtig:* Nur mit gewählter Engine können Ansagen gesprochen werden.

**EN**
> ## Text-to-Speech
>
> Voice output for announcements through your speakers and media players.
>
> - **TTS engine** – choose the Home Assistant speech service (e.g. Google, Piper, Cloud).
>
> *Why it matters:* only with an engine selected can announcements be spoken.

## suggestions

**DE**
> ## Vorschläge
>
> Intelligente Vorschläge, welche Geräte du als Nächstes brauchst.
>
> - **Vorschläge aktivieren** – die Karte lernt aus deinem Nutzungsverhalten und schlägt passende Geräte oben vor.
> - **Lerngeschwindigkeit** – wie schnell sich die Vorschläge anpassen.
> - **Lerndaten zurücksetzen** – löscht alle gelernten Muster.
>
> *Warum wichtig:* Alles läuft lokal in deinem Browser, es werden keine Daten verschickt.

**EN**
> ## Suggestions
>
> Smart suggestions for which devices you'll need next.
>
> - **Enable suggestions** – the card learns from your usage and suggests likely devices at the top.
> - **Learning speed** – how quickly suggestions adapt.
> - **Reset learning data** – clears all learned patterns.
>
> *Why it matters:* everything runs locally in your browser, no data is sent.

## toasts

**DE**
> ## Toasts
>
> Kurze Hinweis-Einblendungen.
>
> - Tippe hier hinein, um festzulegen wann Toasts erscheinen, an welcher Position und wie lange sie sichtbar bleiben.
>
> *Warum wichtig:* Toasts geben Rückmeldung ohne den Bildschirm zu blockieren.

**EN**
> ## Toasts
>
> Short notification pop-ups.
>
> - Tap in here to set when toasts appear, at which position, and how long they stay visible.
>
> *Why it matters:* toasts confirm an action worked without blocking the screen.

## design

**DE**
> ## Darstellung
>
> Das Aussehen der gesamten Karte.
>
> - **Hintergrund-Modus** – Hell, Dunkel oder Automatisch.
> - **Spalten** – wie viele Geräte-Kacheln nebeneinander passen.
> - **Kachel-Form** – Rundung und Form der Karten (z. B. Squircle).
> - **Hintergrund** – Helligkeit, Unschärfe, Kontrast, Sättigung und Graustufen.
>
> *Warum wichtig:* Hier passt du Lesbarkeit und Stil an.

**EN**
> ## Appearance
>
> The look of the whole card.
>
> - **Background mode** – Light, Dark or Automatic.
> - **Columns** – how many device tiles fit side by side.
> - **Card shape** – rounding and shape of the cards (e.g. squircle).
> - **Background** – brightness, blur, contrast, saturation and grayscale.
>
> *Why it matters:* this is where you tune readability and style.

## homeAssistant

**DE**
> ## Home Assistant
>
> Sichtbarkeit der nativen Home-Assistant-Oberfläche.
>
> - **HA-Sidebar anzeigen** / **HA-Kopfzeile anzeigen** – linke/obere HA-Leiste ein- oder ausblenden.
>
> *Warum wichtig:* Für einen aufgeräumten Vollbild-Look.

**EN**
> ## Home Assistant
>
> Visibility of the native Home Assistant interface.
>
> - **Show HA sidebar** / **Show HA header** – show or hide the left/top HA bar.
>
> *Why it matters:* for a clean full-screen look.

## animations

**DE**
> ## Animationen
>
> Video-Hintergründe in der Detail-Ansicht von Geräten.
>
> - **Detail-Videos aktivieren** – spielt Loop-Videos hinter der Geräte-Detailseite ab.
> - **Auf Mobilgeräten** – separat steuerbar (Daten/Akku sparen).
> - **Video-Ordner & Dateinamen** – wo die Videos liegen und wie sie benannt sein müssen.
>
> *Warum wichtig:* Videos kosten Leistung/Daten – darum getrennt für Desktop und Mobil.

**EN**
> ## Animations
>
> Video backgrounds in a device's detail view.
>
> - **Enable detail videos** – plays loop videos behind the device detail page.
> - **On mobile** – controllable separately (save data/battery).
> - **Video folder & filenames** – where the videos live and how they must be named.
>
> *Why it matters:* videos cost performance/data – that's why desktop and mobile are separate.

## videoFolder

> Ersetzt die frühere Footer-Anmerkung ("Place videos in … config/www/fast-search-videos/").

**DE**
> ## Video-Ordner
>
> Wo die Karte nach den Video-Dateien sucht.
>
> - **Pfad:** `/local/fast-search-videos`
> - Lege die Videos in den Home-Assistant-www-Ordner: `config/www/fast-search-videos/`.
> - `/local/…` ist die HA-Verknüpfung zu `config/www/…`.
>
> *Warum wichtig:* Liegen die Videos woanders, werden sie nicht gefunden.

**EN**
> ## Video Folder
>
> Where the card looks for the video files.
>
> - **Path:** `/local/fast-search-videos`
> - Place the videos in the Home Assistant www folder: `config/www/fast-search-videos/`.
> - `/local/…` is HA's alias for `config/www/…`.
>
> *Why it matters:* if the videos are elsewhere, they won't be found.

## videoFiles

> Ersetzt die komplette Inline-Anmerkung (Namensschema + Beispiele + Hinweis) im Animations-Detail.

**DE**
> ## Video-Dateien
>
> Damit Hintergrund-Videos automatisch zugeordnet werden, müssen die Dateinamen einem Schema folgen.
>
> **Namensschema:** `{domain}_{state}.mp4`
>
> **Beispiele:**
> - `light_on.mp4` / `light_off.mp4`
> - `switch_on.mp4` / `switch_off.mp4`
> - `cover_open.mp4` / `cover_closed.mp4`
> - `fan_on.mp4` / `fan_off.mp4`
>
> **Hinweis:** Videos werden einmalig abgespielt wenn die Detail-Ansicht geöffnet wird; das letzte Frame bleibt sichtbar. Platzhalter `default_1.mp4` … `default_10.mp4` (zufällige Auswahl).
>
> *Warum wichtig:* Nur exakt benannte Dateien werden gefunden – ein Tippfehler im Namen = kein Video.

**EN**
> ## Video Files
>
> For background videos to be matched automatically, the filenames must follow a scheme.
>
> **Naming scheme:** `{domain}_{state}.mp4`
>
> **Examples:**
> - `light_on.mp4` / `light_off.mp4`
> - `switch_on.mp4` / `switch_off.mp4`
> - `cover_open.mp4` / `cover_closed.mp4`
> - `fan_on.mp4` / `fan_off.mp4`
>
> **Note:** videos are played once when the detail view opens; the last frame stays visible. Placeholders `default_1.mp4` … `default_10.mp4` (random selection).
>
> *Why it matters:* only exactly-named files are found – a typo in the name = no video.

## statsBar

> v1.1.1813: enthält jetzt auch die „About StatsBar"-Features (Inline-Sektion entfernt).

**DE**
> ## Status-Leiste
>
> Eine Widget-Leiste oben in der Karte mit Live-Werten.
>
> - **Status-Leiste aktivieren** – schaltet die ganze Leiste ein/aus.
> - **Erkennungs-Modus** – Automatisch sucht Sensoren selbst, Manuell weist du gezielt zu.
>
> **Features:** Live-Updates · Energy-Dashboard-Integration · anpassbare Widgets
>
> *Warum wichtig:* Automatik = schnell startklar; Manuell = volle Kontrolle.

**EN**
> ## Status Bar
>
> A widget bar at the top of the card with live values.
>
> - **Enable status bar** – turns the whole bar on or off.
> - **Detection mode** – Automatic finds sensors itself, Manual lets you assign each source.
>
> **Features:** live updates · Energy Dashboard integration · customizable widgets
>
> *Why it matters:* automatic = fast; manual = full control.

## statsBarWidgets

**DE**
> ## Verfügbare Widgets
>
> Welche Kacheln in der Status-Leiste erscheinen.
>
> - Schalte einzelne Widgets ein/aus: Wetter, Stromnetz, Solar, Batterie, Tarife, Uhr.
> - Pro Widget legst du die Datenquelle (Sensor) fest.
>
> *Warum wichtig:* Jedes Widget braucht eine gültige Sensor-Quelle.

**EN**
> ## Available Widgets
>
> Which tiles appear in the status bar.
>
> - Toggle widgets: Weather, Grid, Solar, Battery, Tariffs, Clock.
> - For each widget you set the data source (sensor).
>
> *Why it matters:* each widget needs a valid sensor source.

## limits

> Tab „Privacy" wurde zu **„Filter"** umbenannt; die Sektion „System Settings"
> zu **„Limits"** (es geht um Entity-Lade-Begrenzung, nicht um Datenschutz).

**DE**
> ## Limits
>
> Steuert, **wie viele** und **welche** Entitäten die Karte überhaupt lädt – wichtig für die Performance bei großen Setups.
>
> - **Maximale Anzahl Entities** – begrenzt, wie viele Entitäten geladen werden. `0` = unbegrenzt. Ein Limit beschleunigt den Start bei sehr vielen Geräten.
> - **Nur Entities mit Area laden** – blendet Entitäten ohne zugewiesenen Bereich (Raum) dauerhaft aus.
>
> *Warum wichtig:* Weniger geladene Entitäten = schnellere Karte und weniger Rauschen in der Suche.

**EN**
> ## Limits
>
> Controls **how many** and **which** entities the card loads at all – important for performance on large setups.
>
> - **Maximum Number of Entities** – caps how many entities are loaded. `0` = unlimited. A limit speeds up startup with very many devices.
> - **Load only entities with area** – permanently hides entities without an assigned area (room).
>
> *Why it matters:* fewer loaded entities = a faster card and less noise in search.

## excludedPatterns

**DE**
> ## Ausgeschlossene Muster
>
> Lege Muster fest, um bestimmte Entitäten aus der Suche und der Karte auszublenden. Mit **Platzhaltern**:
>
> - `*` = beliebig viele Zeichen (z. B. `sensor.*` für alle Sensoren)
> - `?` = genau ein Zeichen
>
> **Beispiele:**
>
> - `sensor.temp_*` – alle Temperatur-Sensoren mit diesem Präfix
> - `binary_sensor.motion_*` – alle Bewegungsmelder
> - `*_unavailable` – alles was auf „_unavailable" endet
>
> Beim ersten Start sind Standard-Muster vorbelegt – jederzeit änder- oder löschbar.
>
> *Warum wichtig:* Weniger Rauschen = schnelleres Finden. Versehentlich zu viel ausgeschlossen? Einfach das Muster wieder entfernen.

**EN**
> ## Excluded Patterns
>
> Define patterns to hide specific entities from search and the card. Using **wildcards**:
>
> - `*` = any number of characters (e.g. `sensor.*` for all sensors)
> - `?` = exactly one character
>
> **Examples:**
>
> - `sensor.temp_*` – all temperature sensors with this prefix
> - `binary_sensor.motion_*` – all motion sensors
> - `*_unavailable` – anything ending in "_unavailable"
>
> Sensible default patterns are pre-filled on first launch – change or delete them anytime.
>
> *Why it matters:* less noise = faster finding. Accidentally excluded too much? Just remove the pattern again.

## quickAdd

**DE**
> ## Schnellauswahl
>
> Vordefinierte Muster-Pakete, die du mit einem Tipp hinzufügst – statt jedes Muster einzeln einzutippen.
>
> - Tippe einen Vorschlag an, um sein komplettes Muster-Set zu den ausgeschlossenen Mustern hinzuzufügen.
> - Ein **✓** zeigt, dass das Set bereits aktiv ist.
>
> *Warum wichtig:* Deckt typische Aufräum-Fälle (z. B. nicht verfügbare oder diagnostische Entitäten) mit einem Klick ab.

**EN**
> ## Quick Add
>
> Predefined pattern bundles you add with a single tap – instead of typing each pattern by hand.
>
> - Tap a suggestion to add its whole pattern set to the excluded patterns.
> - A **✓** shows the set is already active.
>
> *Why it matters:* covers typical clean-up cases (e.g. unavailable or diagnostic entities) in one click.

## privacySecure

> Hinweis: enthält einen Link auf die GitHub-Security-Policy — `renderMarkdown`
> rendert `[text](https://…)` automatisch mit `target="_blank" rel="noopener"`.

**DE**
> ## Deine Daten sind sicher
>
> Fast Search Card läuft vollständig **lokal** in deinem Browser.
>
> - **Keine Cloud, kein Tracking** – alle Berechnungen (Vorschläge, Suche, Statistiken) passieren auf deinem Gerät. Es werden keine Daten an Dritte gesendet.
> - **Lokale Speicherung** – Einstellungen und gelernte Muster liegen in deinem Browser (localStorage), nicht auf einem Server.
> - **Open Source** – der gesamte Code ist öffentlich einsehbar und prüfbar.
>
> [🔒 Sicherheits-Policy auf GitHub](https://github.com/fastender/Fast-Search-Card?tab=security-ov-file)

**EN**
> ## Your data is secure
>
> Fast Search Card runs entirely **locally** in your browser.
>
> - **No cloud, no tracking** – all calculations (suggestions, search, statistics) happen on your device. No data is sent to third parties.
> - **Local storage** – settings and learned patterns live in your browser (localStorage), not on a server.
> - **Open source** – the entire code is public and auditable.
>
> [🔒 Security policy on GitHub](https://github.com/fastender/Fast-Search-Card?tab=security-ov-file)

## sidebarItems

**DE**
> ## Verfügbare Einträge
>
> Bausteine für deine Sidebar.
>
> - Wähle aus der Liste, welche Bereiche und Verknüpfungen als Sidebar-Einträge verfügbar sind.
>
> *Warum wichtig:* So bestimmst du den Inhalt deiner Schnellzugriff-Leiste.

**EN**
> ## Available Items
>
> Building blocks for your sidebar.
>
> - Choose from the list which areas and shortcuts are available as sidebar items.
>
> *Why it matters:* this decides the contents of your quick-access bar.

## toastConfig

**DE**
> ## Toasts
>
> Kurze Hinweis-Einblendungen und ihr Verhalten.
>
> - **Wann** – bei welchen Ereignissen ein Toast erscheint.
> - **Position** – wo der Toast eingeblendet wird.
> - **Dauer** – wie lange er sichtbar bleibt.
>
> *Warum wichtig:* So bekommst du Rückmeldungen genau so, wie sie dich am wenigsten stören.

**EN**
> ## Toasts
>
> Short notification pop-ups and their behaviour.
>
> - **When** – which events trigger a toast.
> - **Position** – where the toast appears.
> - **Duration** – how long it stays.
>
> *Why it matters:* so you get feedback the way that disturbs you least.

## newsFeeds

**DE**
> ## Feeds
>
> Welche RSS-Feeds in der News-Ansicht erscheinen.
>
> - Pro Feed ein Schalter – an = der Feed wird geladen und seine Artikel angezeigt.
> - Die Artikelzahl unter jedem Feed zeigt, wie viele neue Beiträge gerade vorliegen.
> - Die Feeds stammen aus der HACS-Integration **Fast News Reader** (feedparser-Sensoren).
>
> *Warum wichtig:* Deaktivierte Feeds werden komplett ausgeblendet – so hältst du deinen News-Stream fokussiert.

**EN**
> ## Feeds
>
> Which RSS feeds appear in the news view.
>
> - One toggle per feed – on = the feed is loaded and its articles shown.
> - The article count under each feed shows how many new items are currently available.
> - The feeds come from the **Fast News Reader** HACS integration (feedparser sensors).
>
> *Why it matters:* disabled feeds are hidden entirely – keeps your news stream focused.

## newsDisplay

**DE**
> ## Anzeige
>
> Wie Artikel dargestellt und gefiltert werden.
>
> - **Bilder anzeigen** – Vorschaubilder in der Artikelliste ein-/ausblenden.
> - **Beim Öffnen als gelesen markieren** – Artikel automatisch als gelesen markieren.
> - **Artikelalter** – wie alt Artikel maximal sein dürfen, um noch zu erscheinen.
> - **Maximale Artikel** – Obergrenze der geladenen Artikel (Performance).
> - **Standard-Filter** – womit die Liste startet (Alle / Ungelesen / Favoriten).
>
> *Warum wichtig:* Steuert Übersichtlichkeit und Lademenge deines News-Streams.

**EN**
> ## Display
>
> How articles are shown and filtered.
>
> - **Show images** – toggle preview images in the article list.
> - **Mark as read when opening** – automatically mark articles read once you open them.
> - **Article age** – the maximum age articles may have to still appear.
> - **Maximum articles** – upper limit of loaded articles (performance).
> - **Default filter** – what the list starts with (All / Unread / Favorites).
>
> *Why it matters:* controls how tidy and how heavy your news stream is.

## heroEntities

> Universal-Gerät bearbeiten → Hero. Ersetzt den grauen Beschreibungstext unter „ENTITIES".

**DE**
> ## Hero-Anzeige
>
> Wähle bis zu 5 Werte für die große Hero-Anzeige (der Kreis oben in der Detail-Ansicht).
>
> - Mehrere Heroes **rotieren als Slideshow**.
> - Entitäten mit **„Bild"- oder „Kamera"-Badge** werden als Foto dargestellt statt als Wert.
> - Über die Pfeile (↑/↓) an einer ausgewählten Zeile bestimmst du die Reihenfolge der Slideshow.
>
> *Warum wichtig:* Der Hero ist das Erste, was du beim Öffnen des Geräts siehst.

**EN**
> ## Hero Display
>
> Pick up to 5 values for the large hero display (the circle at the top of the detail view).
>
> - Multiple heroes **rotate as a slideshow**.
> - Entities with an **"Image" or "Camera" badge** render as a picture instead of a value.
> - Use the arrows (↑/↓) on a selected row to set the slideshow order.
>
> *Why it matters:* the hero is the first thing you see when opening the device.

## chartSensors

> Universal-Gerät bearbeiten → Charts. Ersetzt den grauen Beschreibungstext unter „SENSORS" (die Live-Anzahl bleibt im Header).

**DE**
> ## Charts-Sensoren
>
> Wähle, welche Sensoren als Zeitreihen-Chart erscheinen (Tag/Woche/Monat/Jahr).
>
> - **Kumulativ / Momentan** – Sensoren mit `state_class` liefern volle Statistik (D/W/M/Y) direkt aus Home Assistant.
> - **History** – Sensoren ohne `state_class` fallen auf die State-History zurück (begrenzt auf die HA-Aufbewahrungsdauer).
> - Das farbige Badge pro Sensor zeigt den Modus: Kumulativ (grün), Momentan (blau), History (orange).
>
> *Warum wichtig:* Statistik-Sensoren liefern langfristige, lückenlose Charts; History-Sensoren nur so weit zurück wie HA die Daten aufbewahrt.

**EN**
> ## Chart Sensors
>
> Choose which sensors appear as a time-series chart (day/week/month/year).
>
> - **Cumulative / Measurement** – sensors with a `state_class` provide full statistics (D/W/M/Y) straight from Home Assistant.
> - **History** – sensors without a `state_class` fall back to state-history (limited to HA's retention period).
> - The colored badge per sensor shows the mode: Cumulative (green), Measurement (blue), History (orange).
>
> *Why it matters:* statistics sensors give long, gap-free charts; history sensors only go back as far as HA keeps the data.

## quickStatsMetrics

> Universal-Gerät bearbeiten → Quick-Stats. Ersetzt den grauen Beschreibungstext unter „METRICS".

**DE**
> ## Quick-Stats / Metriken
>
> Wähle Sensoren, die als kompakte **Pill-Chips** oben in der Geräte-Detail-Ansicht erscheinen.
>
> - Jeder gewählte Sensor wird als kleiner Wert-Chip angezeigt.
> - Ideal für die wichtigsten Live-Werte auf einen Blick.
>
> *Warum wichtig:* So siehst du Kernwerte sofort, ohne die einzelnen Entitäten zu öffnen.

**EN**
> ## Quick Stats / Metrics
>
> Pick sensors to show as compact **pill chips** at the top of the device detail view.
>
> - Each selected sensor appears as a small value chip.
> - Great for your most important live values at a glance.
>
> *Why it matters:* you see key values immediately without opening individual entities.

## iconPicker

> Universal-Gerät bearbeiten → Icon. ⓘ am „DEFAULT"-Header (kein grauer Text vorher).

**DE**
> ## Icon
>
> Wähle das Symbol, das die Geräte-Karte repräsentiert.
>
> - **Standard** nutzt das automatische Icon des Geräte-Typs.
> - Oder wähle ein Icon aus den Kategorien darunter.
>
> *Warum wichtig:* Ein passendes Icon macht das Gerät auf einen Blick erkennbar.

**EN**
> ## Icon
>
> Choose the symbol that represents the device card.
>
> - **Default** uses the automatic icon for the device type.
> - Or pick an icon from the categories below.
>
> *Why it matters:* a fitting icon makes the device recognizable at a glance.

## visibility

> Universal-Gerät bearbeiten → Sichtbare Entitäten. ⓘ rechts in der Navbar (keine Sektion zum Anhängen).

**DE**
> ## Sichtbare Entitäten
>
> Lege fest, welche Entitäten des Geräts in der Detail-Ansicht angezeigt werden.
>
> - Pro Entität ein Schalter – aus = in der Karte ausgeblendet (bleibt aber in Home Assistant erhalten).
> - Gruppiert nach **Steuerung, Sensoren, Diagnose, Sonstiges**.
> - Über die Suche findest du Entitäten bei großen Geräten schnell.
>
> *Warum wichtig:* Blende Rauschen aus und zeig nur, was dich an diesem Gerät interessiert.

**EN**
> ## Visible Entities
>
> Decide which of the device's entities appear in the detail view.
>
> - One toggle per entity – off = hidden in the card (still present in Home Assistant).
> - Grouped by **Controls, Sensors, Diagnostics, Misc**.
> - Use search to find entities quickly on large devices.
>
> *Why it matters:* hide the noise and show only what matters for this device.
