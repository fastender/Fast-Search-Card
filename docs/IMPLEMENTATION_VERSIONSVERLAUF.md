# Implementierungsplan: Versionsverlauf System-Entity

**Erstellt:** 2026-01-21
**Status:** Planung
**Inspiration:** Raycast Changelog UI

---

## 1. Überblick & Ziele

### Was wird gebaut?
Eine **Versionsverlauf System-Entity**, die den Changelog der App anzeigt - ähnlich wie Raycast's Changelog-Feature.

### User-Flow:
```
1. User klickt auf "Versionsverlauf" Card (in "Benutzerdefiniert" Tab)
2. DetailView öffnet sich → Zeigt LISTE aller Versionen
3. User klickt auf Version (z.B. "v1.104.0 Raycast Wrapped 2025")
4. Neue Ansicht slide-in → Zeigt DETAIL mit Hero-Image + Markdown
5. Back Button → Zurück zur Liste
```

### Ziele:
- ✅ Native App-Gefühl (kein externer Link)
- ✅ Markdown wird IN der App gerendert
- ✅ Hero-Images für wichtige Releases
- ✅ Filter/Search-Funktion
- ✅ Cache für Offline-Verfügbarkeit
- ✅ Zwei-Level Navigation (Liste → Detail)

---

## 2. Architektur: 2-Level Navigation

### Level 1: VersionsList (Standard-Ansicht)
```
┌────────────────────────────────────────────┐
│ ← Filter by title...                       │
├────────────────────────────────────────────┤
│  v1.104.0  Raycast Wrapped 2025    16. Dec │ ← Clickable
│  v1.103.0  macOS Tahoe Ready       Sep 2025│
│  v1.102.0  Auto Transcribe...      Jul 2025│
│  v1.101.0  Chat Branching          Jul 2025│
└────────────────────────────────────────────┘
```

**Features:**
- Scrollbare Liste aller Versionen
- Filter-Input (durchsucht Title + Version)
- Datum rechts aligned
- Neueste Version oben

### Level 2: VersionDetail (Detail-Ansicht)
```
┌────────────────────────────────────────────┐
│ ← Raycast Wrapped 2025                     │
├────────────────────────────────────────────┤
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  [Hero Image - visionOS Style]   │    │
│   │  🎁 Raycast Wrapped              │    │
│   │     2025                          │    │
│   └──────────────────────────────────┘    │
│                                            │
│  ## What's New                             │
│  - 1.2M Befehle ausgeführt                │
│  - 50 neue Features                        │
│                                            │
│  ## Bug Fixes                              │
│  - Fixed memory leak                       │
│                                            │
└────────────────────────────────────────────┘
```

**Features:**
- Hero-Image (optional, visionOS-Style)
- Markdown gerendert zu HTML
- Scroll-Support
- Back-Button

---

## 3. Markdown-Struktur & Format

### VERSIONSVERLAUF.md (GitHub)

**Location:** `docs/VERSIONSVERLAUF.md`
**URL:** `https://raw.githubusercontent.com/USER/REPO/main/docs/VERSIONSVERLAUF.md`

### Format-Beispiel:

```markdown
# Versionsverlauf

## Version 1.104.0 - 2025-12-16

**Title:** Raycast Wrapped 2025
**Hero:** wrapped-2025.png
**Tags:** Feature, Special

### 🎁 Raycast Wrapped 2025

Das Jahr 2025 in Zahlen:

- **1.2M Befehle** ausgeführt
- **50 neue Features** implementiert
- **10K aktive Nutzer**

#### Details

Wrapped 2025 zeigt dir deine persönliche Statistik...

---

## Version 1.103.0 - 2025-09-01

**Title:** macOS Tahoe Ready
**Hero:** tahoe.png
**Tags:** Compatibility

### 🏔️ macOS Tahoe Support

Vollständige Unterstützung für macOS Tahoe:

- Native Performance
- Neue APIs
- Optimierte UI

---

## Version 1.102.0 - 2025-07-15

**Title:** Auto Transcribe with Granola
**Hero:** transcribe.png
**Tags:** Feature, AI

### 🎤 Auto Transcribe

Neue AI-powered Transcription Engine...
```

### Metadaten-Format:

Jede Version hat:
- **Versionsnummer:** `## Version 1.104.0 - 2025-12-16`
- **Title:** Anzeigename für die Liste
- **Hero:** Optional, Bild-URL oder Dateiname
- **Tags:** Kategorien (Feature, Bug Fix, Performance, etc.)
- **Content:** Markdown-Inhalt (Überschriften, Listen, Code-Blöcke)

---

## 4. Komponenten-Übersicht

### 4.1 VersionsverlaufEntity.js

**Pfad:** `src/system-entities/entities/versionsverlauf/index.js`

```javascript
import { SystemEntity } from '../../base/SystemEntity.js';

class VersionsverlaufEntity extends SystemEntity {
  constructor() {
    super({
      // Core Properties
      id: 'versionsverlauf',
      domain: 'system',
      name: 'Versionsverlauf',
      icon: `<svg>...</svg>`, // Changelog Icon
      brandColor: 'rgb(88, 86, 214)', // Raycast Purple
      category: 'system',
      description: 'App-Versionsverlauf und Changelog',
      relevance: 85,

      // Attributes
      attributes: {
        current_version: '1.2.0',
        total_versions: 0,
        latest_update: null,
        changelog_url: 'https://raw.githubusercontent.com/USER/REPO/main/docs/VERSIONSVERLAUF.md',
        changelog_content: null, // Raw markdown
        versions: [], // Parsed versions array
        last_loaded: null,
        cache_valid: false
      },

      // UI Behavior
      hasTabs: false,
      hasCustomView: true,
      showInDetailView: true,

      // View Component
      viewComponent: () => import('./VersionsverlaufView.jsx'),

      // Permissions
      permissions: [
        'network:read',
        'storage:read',
        'storage:write'
      ],

      // Actions
      actions: {
        /**
         * Lade Changelog von GitHub
         */
        loadChangelog: async function() {
          const url = this.attributes.changelog_url;

          try {
            // 1. Check Cache
            const cached = this.getFromCache();
            if (cached && this.isCacheValid(cached)) {
              console.log('✅ Using cached changelog');
              return cached.content;
            }

            // 2. Fetch from GitHub
            console.log('📥 Fetching changelog from GitHub...');
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const markdown = await response.text();

            // 3. Parse zu Versions-Array
            const versions = this.parseMarkdown(markdown);

            // 4. Update Attributes
            this.updateAttributes({
              changelog_content: markdown,
              versions: versions,
              total_versions: versions.length,
              latest_update: versions[0]?.date || null,
              last_loaded: new Date().toISOString(),
              cache_valid: true
            });

            // 5. Cache speichern
            this.saveToCache(markdown);

            return markdown;

          } catch (error) {
            console.error('❌ Failed to load changelog:', error);

            // Fallback: Cached version verwenden (auch wenn abgelaufen)
            const cached = this.getFromCache();
            if (cached) {
              console.log('⚠️ Using expired cache as fallback');
              return cached.content;
            }

            throw error;
          }
        },

        /**
         * Parse Markdown zu Versions-Array
         */
        parseMarkdown: function(markdown) {
          const versionRegex = /## Version ([\d.]+) - ([\d-]+)\n\n\*\*Title:\*\* (.+?)\n\*\*Hero:\*\* (.+?)\n(?:\*\*Tags:\*\* (.+?)\n)?\n([\s\S]+?)(?=\n---\n|\n## Version|\n*$)/g;

          const versions = [];
          let match;

          while ((match = versionRegex.exec(markdown)) !== null) {
            versions.push({
              version: match[1],        // "1.104.0"
              date: match[2],           // "2025-12-16"
              dateFormatted: this.formatDate(match[2]),
              title: match[3],          // "Raycast Wrapped 2025"
              hero: match[4] || null,   // "wrapped-2025.png" oder null
              tags: match[5] ? match[5].split(',').map(t => t.trim()) : [],
              content: match[6].trim()  // Markdown content
            });
          }

          return versions;
        },

        /**
         * Format Datum für Anzeige
         */
        formatDate: function(dateString) {
          const date = new Date(dateString);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          return `${date.getDate()}. ${months[date.getMonth()]}`;
        },

        /**
         * Cache-Management
         */
        getFromCache: function() {
          try {
            const cached = localStorage.getItem('versionsverlauf_cache');
            return cached ? JSON.parse(cached) : null;
          } catch (error) {
            console.error('Failed to read cache:', error);
            return null;
          }
        },

        saveToCache: function(markdown) {
          try {
            const cache = {
              content: markdown,
              timestamp: Date.now()
            };
            localStorage.setItem('versionsverlauf_cache', JSON.stringify(cache));
          } catch (error) {
            console.error('Failed to save cache:', error);
          }
        },

        isCacheValid: function(cached) {
          const ONE_HOUR = 3600000; // 1 Stunde in ms
          return (Date.now() - cached.timestamp) < ONE_HOUR;
        }
      }
    });
  }

  /**
   * Mount mit Retry-Mechanismus
   */
  async onMount(context) {
    await this.mountWithRetry(context, async (hass) => {
      // Lade initial Changelog
      try {
        await this.actions.loadChangelog.call(this);
      } catch (error) {
        console.warn('Failed to load initial changelog:', error);
        // Entity bleibt gemounted, zeigt aber "Offline" Meldung
      }
    });
  }
}

export default new VersionsverlaufEntity();
```

---

### 4.2 VersionsverlaufView.jsx

**Pfad:** `src/system-entities/entities/versionsverlauf/VersionsverlaufView.jsx`

```jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { VersionsList } from './components/VersionsList';
import { VersionDetail } from './components/VersionDetail';

export function VersionsverlaufView({ entity }) {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial laden
  useEffect(() => {
    loadChangelog();
  }, []);

  const loadChangelog = async () => {
    setIsLoading(true);
    try {
      await entity.actions.loadChangelog();
      setVersions(entity.attributes.versions);
    } catch (error) {
      console.error('Failed to load changelog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation: Version Detail öffnen
  const handleVersionClick = (version) => {
    setSelectedVersion(version);
    setView('detail');
  };

  // Navigation: Zurück zur Liste
  const handleBack = () => {
    setView('list');
    setSelectedVersion(null);
  };

  if (isLoading) {
    return (
      <div className="versionsverlauf-loading">
        <div className="spinner"></div>
        <p>Lade Versionsverlauf...</p>
      </div>
    );
  }

  return (
    <div className="versionsverlauf-view">
      {view === 'list' ? (
        <VersionsList
          versions={versions}
          onVersionClick={handleVersionClick}
        />
      ) : (
        <VersionDetail
          version={selectedVersion}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
```

---

### 4.3 VersionsList.jsx

**Pfad:** `src/system-entities/entities/versionsverlauf/components/VersionsList.jsx`

```jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';

export function VersionsList({ versions, onVersionClick }) {
  const [filter, setFilter] = useState('');

  // Filter Versionen
  const filteredVersions = versions.filter(v => {
    const searchLower = filter.toLowerCase();
    return (
      v.version.toLowerCase().includes(searchLower) ||
      v.title.toLowerCase().includes(searchLower) ||
      v.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="versions-list">
      {/* Filter Input */}
      <div className="filter-header">
        <input
          type="text"
          placeholder="Filter by title..."
          value={filter}
          onInput={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {/* Versions Grid */}
      <div className="versions-grid">
        {filteredVersions.map((version) => (
          <div
            key={version.version}
            className="version-item"
            onClick={() => onVersionClick(version)}
          >
            <div className="version-left">
              <span className="version-number">v{version.version}</span>
              <span className="version-title">{version.title}</span>
            </div>
            <div className="version-right">
              <span className="version-date">{version.dateFormatted}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVersions.length === 0 && (
        <div className="empty-state">
          <p>Keine Versionen gefunden für "{filter}"</p>
        </div>
      )}
    </div>
  );
}
```

---

### 4.4 VersionDetail.jsx

**Pfad:** `src/system-entities/entities/versionsverlauf/components/VersionDetail.jsx`

```jsx
import { h } from 'preact';
import ReactMarkdown from 'react-markdown';

export function VersionDetail({ version, onBack }) {
  if (!version) return null;

  return (
    <div className="version-detail">
      {/* Header mit Back-Button */}
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>
          ← {version.title}
        </button>
      </div>

      {/* Hero Section (optional) */}
      {version.hero && (
        <div className="hero-section">
          <img
            src={`/assets/changelog/${version.hero}`}
            alt={version.title}
            className="hero-image"
          />
        </div>
      )}

      {/* Version Info */}
      <div className="version-info">
        <h2 className="version-title">{version.title}</h2>
        <div className="version-meta">
          <span className="version-number">v{version.version}</span>
          <span className="version-date">{version.dateFormatted}</span>
        </div>
        {version.tags.length > 0 && (
          <div className="version-tags">
            {version.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Markdown Content */}
      <div className="version-content">
        <ReactMarkdown>{version.content}</ReactMarkdown>
      </div>
    </div>
  );
}
```

---

## 5. Parse-Funktionen

### Regex-Pattern für MD-Parsing:

```javascript
// Pattern erklärt:
const versionRegex = /
  ## Version ([\d.]+) - ([\d-]+)  // Version + Datum
  \n\n
  \*\*Title:\*\* (.+?)            // Title (required)
  \n
  \*\*Hero:\*\* (.+?)             // Hero (required)
  \n
  (?:\*\*Tags:\*\* (.+?)\n)?     // Tags (optional)
  \n
  ([\s\S]+?)                      // Content (alles bis nächste Version)
  (?=\n---\n|\n## Version|\n*$)  // Lookahead: Ende
/g;
```

### Beispiel-Match:

**Input:**
```markdown
## Version 1.104.0 - 2025-12-16

**Title:** Raycast Wrapped 2025
**Hero:** wrapped-2025.png
**Tags:** Feature, Special

### 🎁 Content hier...
```

**Output:**
```javascript
{
  version: "1.104.0",
  date: "2025-12-16",
  title: "Raycast Wrapped 2025",
  hero: "wrapped-2025.png",
  tags: ["Feature", "Special"],
  content: "### 🎁 Content hier..."
}
```

---

## 6. Cache-Strategie

### Warum Cache?
- ✅ Schnelleres Öffnen (kein Fetch-Delay)
- ✅ Offline-Verfügbarkeit
- ✅ Reduziert GitHub-Requests

### Cache-Logik:

```javascript
// 1. Beim Laden: Cache zuerst prüfen
const cached = localStorage.getItem('versionsverlauf_cache');

if (cached) {
  const { content, timestamp } = JSON.parse(cached);
  const ONE_HOUR = 3600000;

  // Cache ist gültig (< 1 Stunde alt)
  if (Date.now() - timestamp < ONE_HOUR) {
    return content; // Sofort verwenden!
  }
}

// 2. Fetch von GitHub
const response = await fetch(url);
const markdown = await response.text();

// 3. Cache aktualisieren
localStorage.setItem('versionsverlauf_cache', JSON.stringify({
  content: markdown,
  timestamp: Date.now()
}));
```

### Cache-Invalidierung:

- **Automatisch:** Nach 1 Stunde
- **Manuell:** "Refresh" Button in UI
- **Event:** Bei App-Update (neue Version installiert)

---

## 7. Styling (Raycast-inspiriert)

### 7.1 VersionsList Styling

```css
/* versions-list.css */

.versions-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.filter-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.versions-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.version-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.version-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.version-number {
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  padding: 4px 8px;
  background: rgba(88, 86, 214, 0.2);
  border-radius: 6px;
  color: rgb(88, 86, 214);
  font-weight: 600;
}

.version-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.version-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
}
```

### 7.2 VersionDetail Styling

```css
/* version-detail.css */

.version-detail {
  height: 100%;
  overflow-y: auto;
}

.detail-header {
  position: sticky;
  top: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.back-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
}

.back-button:hover {
  opacity: 0.7;
}

.hero-section {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  border-radius: 16px;
  margin: 16px;
}

.hero-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.version-info {
  padding: 24px;
}

.version-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 12px;
}

.version-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.version-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: rgba(88, 86, 214, 0.2);
  color: rgb(88, 86, 214);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.version-content {
  padding: 24px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

/* Markdown Styling */
.version-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.95);
}

.version-content ul {
  list-style: none;
  padding-left: 0;
}

.version-content li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
}

.version-content li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: rgb(88, 86, 214);
  font-weight: bold;
}

.version-content code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-size: 13px;
}
```

---

## 8. Hero-Images Integration

### Struktur:

```
public/
└── assets/
    └── changelog/
        ├── wrapped-2025.png
        ├── tahoe.png
        ├── transcribe.png
        └── ...
```

### Verwendung in MD:

```markdown
**Hero:** wrapped-2025.png
```

### Rendering:

```jsx
{version.hero && (
  <img
    src={`/assets/changelog/${version.hero}`}
    alt={version.title}
  />
)}
```

### Fallback:

```jsx
// Wenn Hero fehlt, zeige Icon stattdessen
{version.hero ? (
  <img src={`/assets/changelog/${version.hero}`} />
) : (
  <div className="hero-placeholder">
    <svg>...</svg> {/* Version Icon */}
  </div>
)}
```

---

## 9. Implementierungs-Schritte (Checkliste)

### Phase 1: Entity Setup
- [ ] Erstelle `src/system-entities/entities/versionsverlauf/`
- [ ] Erstelle `index.js` (VersionsverlaufEntity)
- [ ] Icon erstellen/auswählen
- [ ] Entity in Registry registrieren
- [ ] Test: Entity erscheint in "Benutzerdefiniert" Tab

### Phase 2: Markdown & Parsing
- [ ] Erstelle `docs/VERSIONSVERLAUF.md` mit Beispiel-Versionen
- [ ] Implementiere `parseMarkdown()` Funktion
- [ ] Test: Regex matched alle Versionen korrekt
- [ ] Implementiere `formatDate()` Funktion
- [ ] Test: Datum wird korrekt formatiert

### Phase 3: Cache-System
- [ ] Implementiere `getFromCache()`
- [ ] Implementiere `saveToCache()`
- [ ] Implementiere `isCacheValid()`
- [ ] Implementiere `loadChangelog()` mit Cache-Logic
- [ ] Test: Cache wird gespeichert und gelesen

### Phase 4: UI - VersionsList
- [ ] Erstelle `components/VersionsList.jsx`
- [ ] Implementiere Filter-Input
- [ ] Implementiere Versions-Grid
- [ ] Implementiere onClick-Handler
- [ ] Styling: Raycast-inspiriert
- [ ] Test: Liste zeigt alle Versionen, Filter funktioniert

### Phase 5: UI - VersionDetail
- [ ] Erstelle `components/VersionDetail.jsx`
- [ ] Implementiere Back-Button
- [ ] Implementiere Hero-Section (conditional)
- [ ] Implementiere Markdown-Rendering (react-markdown)
- [ ] Styling: visionOS-inspiriert
- [ ] Test: Detail-Ansicht rendert Markdown korrekt

### Phase 6: Main View
- [ ] Erstelle `VersionsverlaufView.jsx`
- [ ] Implementiere State-Management (view, selectedVersion)
- [ ] Implementiere Navigation (list ↔ detail)
- [ ] Implementiere Loading-State
- [ ] Test: Navigation funktioniert smooth

### Phase 7: Integration & Polish
- [ ] react-markdown dependency installieren
- [ ] Hero-Images in `public/assets/changelog/` ablegen
- [ ] Error-Handling verbessern
- [ ] Loading-Spinner schöner machen
- [ ] Transitions/Animations hinzufügen
- [ ] Test: Gesamter Flow funktioniert

### Phase 8: GitHub Integration
- [ ] GitHub-URL in Entity konfigurieren
- [ ] Test: Fetch von GitHub funktioniert
- [ ] Test: Cache funktioniert nach Refresh
- [ ] Test: Offline-Modus (cached Version)
- [ ] Test: Error-Handling bei Network-Fehler

### Phase 9: Final Testing
- [ ] Test: Hard Cache Reset → Entity lädt Daten korrekt
- [ ] Test: Filter funktioniert mit Umlauten
- [ ] Test: Markdown-Rendering (Headers, Listen, Code)
- [ ] Test: Hero-Images laden korrekt
- [ ] Test: Back-Navigation funktioniert
- [ ] Performance-Check (smooth scrolling?)

### Phase 10: Dokumentation
- [ ] JSDoc-Kommentare vervollständigen
- [ ] README für Entity erstellen
- [ ] Screenshots für Docs machen
- [ ] VERSIONSVERLAUF.md mit echten Versionen füllen

---

## 10. Offene Fragen / Entscheidungen

### 1. Markdown-Library
**Optionen:**
- `react-markdown` (einfach, klein, gut für Basis-Markdown)
- `marked` (mehr Features, größer)

**Empfehlung:** `react-markdown` für Start

### 2. Hero-Image Hosting
**Optionen:**
- Local (`public/assets/changelog/`)
- GitHub (im Repo)
- CDN (Cloudinary, imgur)

**Empfehlung:** Local für Start, später optional CDN

### 3. Versionsnummer-Quelle
**Frage:** Soll `current_version` aus `package.json` gelesen werden?

**Vorschlag:** Ja, automatisch synchronisieren:
```javascript
import packageJson from '../../../package.json';
this.attributes.current_version = packageJson.version;
```

### 4. "What's New" Badge
**Idee:** Roten Punkt auf Card zeigen wenn neue Version verfügbar

**Implementierung:**
```javascript
// Beim Mount vergleichen
const lastSeenVersion = localStorage.getItem('last_seen_version');
if (lastSeenVersion !== this.attributes.current_version) {
  this.attributes.has_new_version = true;
}
```

---

## 11. Dependencies

### Neue NPM Packages:
```bash
npm install react-markdown
```

### Optional (für erweiterte Features):
```bash
npm install remark-gfm          # GitHub Flavored Markdown
npm install rehype-highlight    # Code Syntax Highlighting
```

---

## 12. Dateistruktur (Übersicht)

```
src/system-entities/entities/versionsverlauf/
├── index.js                         # VersionsverlaufEntity
├── VersionsverlaufView.jsx          # Main View Component
├── components/
│   ├── VersionsList.jsx             # Liste aller Versionen
│   └── VersionDetail.jsx            # Detail-Ansicht einer Version
├── styles/
│   ├── versions-list.css
│   └── version-detail.css
└── README.md                        # Dokumentation

docs/
└── VERSIONSVERLAUF.md               # Markdown-Datei (GitHub)

public/assets/changelog/
├── wrapped-2025.png
├── tahoe.png
└── ...
```

---

## 13. Nächste Schritte

1. **Dependencies installieren:** `npm install react-markdown`
2. **Ordner erstellen:** `src/system-entities/entities/versionsverlauf/`
3. **MD-Datei vorbereiten:** `docs/VERSIONSVERLAUF.md` mit echten Versionen füllen
4. **Implementierung starten:** Phase 1 (Entity Setup)

---

## 14. Inspiration & Referenzen

- **Raycast Changelog:** https://raycast.com/changelog
- **Linear Changelog:** https://linear.app/changelog
- **Framer Releases:** https://www.framer.com/releases/
- **Apple Release Notes:** iOS Settings → Software Update

---

**Status:** ✅ Planung komplett
**Bereit für Implementierung:** Ja
**Geschätzte Zeit:** 3-4 Stunden

