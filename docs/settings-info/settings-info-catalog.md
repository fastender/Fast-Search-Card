# Settings-Info Catalog (Datenbank)

> **Zweck:** Gepflegte Übersicht aller Info-Popup-Texte, die in den Settings-Tabs
> hinter dem **ⓘ**-Button jedes Sektions-Headers erscheinen.
>
> **Wichtig — Single Source of Truth:** Die App rendert diese Texte **nicht** aus
> dieser Datei (ein kompiliertes JS-Bundle kann zur Laufzeit keine externe `.md`
> lesen). Die echten Texte leben in den Translations:
>
> - `src/utils/translations/languages/de.js` → `ui.settings.settingsInfo.<key>`
> - `src/utils/translations/languages/en.js` → `ui.settings.settingsInfo.<key>`
>
> Diese Datei ist die **menschenlesbare Datenbank**: hier planen/pflegen, dann in
> beide Translation-Dateien spiegeln. Beim Ändern eines Textes **immer beides**
> aktualisieren (diese MD + de.js + en.js).
>
> Komponente: `src/components/tabs/SettingsTab/components/SettingsSectionInfo.jsx`
> (`<SettingsSectionHeader title infoKey t lang />`). Markdown wird über
> `src/utils/miniMarkdown.js` (`renderMarkdown`) gerendert.

## Wo welcher Key hängt

| infoKey | Tab | Sektion (Header) |
|---|---|---|
| `general` | General | ALLGEMEIN / GENERAL |
| `statusGreetings` | General | STATUS & GREETINGS |
| `mobile` | General | Mobile |
| `sidebar` | General | Sidebar |
| `homeScreen` | General | Startseite / Home Screen |
| `tts` | General | Text-to-Speech |
| `suggestions` | General | Vorschläge / Suggestions |
| `toasts` | General | Toasts |
| `design` | Appearance | Darstellung / Design |
| `homeAssistant` | Appearance | Home Assistant |
| `animations` | Appearance | Animationen / Animations |
| `statsBar` | StatsBar (Detail) | EINSTELLUNGEN / SETTINGS |
| `statsBarWidgets` | StatsBar (Detail) | Verfügbare Widgets |
| `privacy` | Privacy | System-Einstellungen |
| `excludedPatterns` | Privacy | Ausgeschlossene Muster |
| `sidebarItems` | Sidebar-Items (Detail) | Verfügbare Einträge |
| `toastConfig` | Toasts (Detail) | Wann Toasts erscheinen |

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

## statsBar

**DE**
> ## Status-Leiste
>
> Konfiguration der Widget-Leiste oben.
>
> - **Status-Leiste aktivieren** – schaltet die ganze Leiste ein/aus.
> - **Erkennungs-Modus** – Automatisch sucht Sensoren selbst, Manuell weist du gezielt zu.
>
> *Warum wichtig:* Automatik = schnell startklar; Manuell = volle Kontrolle.

**EN**
> ## Status Bar
>
> Configuration of the widget bar at the top.
>
> - **Enable status bar** – turns the whole bar on or off.
> - **Detection mode** – Automatic finds sensors itself, Manual lets you assign each source.
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

## privacy

**DE**
> ## System-Einstellungen
>
> Daten und Datenschutz-Verhalten der Karte.
>
> - Steuert systemnahe Optionen sowie das Löschen von Cache und gespeicherten Daten.
>
> *Warum wichtig:* Alle Einstellungen bleiben lokal in deinem Browser.

**EN**
> ## System Settings
>
> Data and privacy behaviour of the card.
>
> - Controls system-level options and clearing cache and stored data.
>
> *Why it matters:* all settings stay local in your browser.

## excludedPatterns

**DE**
> ## Ausgeschlossene Muster
>
> Entitäten, die NICHT in Suche und Karte erscheinen sollen.
>
> - Lege Text-Muster fest (z. B. `*_battery`, `sensor.test*`), um irrelevante Entitäten auszublenden.
> - Beim ersten Start sind Standard-Muster vorbelegt.
>
> *Warum wichtig:* Weniger Rauschen = schnelleres Finden.

**EN**
> ## Excluded Patterns
>
> Entities that should NOT appear in search and the card.
>
> - Define text patterns (e.g. `*_battery`, `sensor.test*`) to hide irrelevant entities.
> - Sensible defaults are pre-filled on first launch.
>
> *Why it matters:* less noise = faster finding.

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
