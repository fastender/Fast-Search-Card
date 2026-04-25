# Custom Component Roadmap — News Reader for Home Assistant

**Status:** Planning · written 2026-04-25 after News-Migration session (siehe `SESSION_NOTES_2026-04-24_25.md`).
**Target:** Eigenes HACS-Custom-Integration in Python, das die Lücken von `core feedreader` und `timmaurice/feedparser` schließt — vor allem die fehlende Bild-Extraktion aus `<content:encoded>`.

---

## 1. Warum überhaupt eine eigene Component

Während der Session 2026-04-24/25 wurden zwei bestehende Optionen evaluiert und fielen beide:

| Integration | Problem |
|---|---|
| **`core feedreader`** (HA built-in) | Event-Entity-Schema ist hardcoded auf 4 Felder (`title`, `link`, `description`, `content`). Bilder, Enclosures, media_* werden bewusst rausgefiltert. Keine Konfigurierbarkeit. Bus-Events haben volle Daten, aber Initial-Load liest aus Entity-Attributen → keine Bilder. |
| **`timmaurice/feedparser`** (HACS) | Schema viel besser (`sensor.<name>` mit `attributes.entries[].image`). Aber: `_process_image()` in `sensor.py` checkt nur `media_content`, `media_thumbnail`, `enclosures`, `summary`-HTML. **NICHT `<content:encoded>`**. Tagesschau und viele deutsche Feeds liefern Bilder ausschließlich dort. |

Eigene Component löst beides:
- **Schemakontrolle** — wir definieren was die Card braucht.
- **Image-Extraktion vollständig** — alle gängigen RSS-Image-Quellen inklusive `content:encoded`.
- **Optional og:image-Fallback** — wenn das RSS gar nichts hergibt, einmal die Article-URL fetchen und `<meta property="og:image">` extrahieren. Server-side, kein CORS.

---

## 2. Schema-Vertrag (Card-Kompatibilität)

**Ziel: Drop-in-Replacement für `timmaurice/feedparser`.** Card-Code in v1.1.1258 erwartet:

```python
sensor.<feed_name>:
    state: <int>                    # Anzahl entries
    attributes:
        channel: dict               # {title, link, image, description, ...}
        entries: list[dict]         # [{title, link, summary, content, published, image, ...}, ...]
        attribution: str            # "Custom News Reader" oder ähnlich
        friendly_name: str          # User-vergebener Name
```

**Pro Entry mindestens:**

| Feld | Typ | Quelle / Notiz |
|---|---|---|
| `id` | str | `entry.id`, `entry.guid` oder `entry.link` als Fallback |
| `title` | str | `entry.title` |
| `link` | str | `entry.link` |
| `summary` | str | Plain text (gestripped) — wenn HTML in description, davor `_strip_html()` |
| `content` | str | Volles HTML wenn vorhanden (für Detail-View) |
| `published` | str | Pre-formatted (per `date_format`-Config); ISO als Default |
| `image` | str \| null | URL als String, multi-source extrahiert (siehe Sektion 5) |
| `author` | str (opt) | `entry.author` |
| `category` | str \| list (opt) | `entry.tags` zu Strings reduziert |

Card-Code in `news/index.jsx:_entryToArticle` parst bereits `image` als String oder `{href, url}`-Object. Wenn wir **string** liefern, keine Card-Änderung nötig.

---

## 3. Architektur (HA-Standard)

```
custom_components/fast_news_reader/
├── __init__.py             # Setup-Hook, Config-Entry-Lifecycle
├── manifest.json           # HACS-Metadaten
├── const.py                # DOMAIN, CONF_*, Defaults, IMAGE_REGEX
├── config_flow.py          # UI-Konfiguration (Settings → Devices & Services → Add)
├── coordinator.py          # DataUpdateCoordinator: Fetch + Parse + Cache
├── sensor.py               # Sensor-Entity-Definition (1 pro Feed)
├── image_extractor.py      # Multi-Source-Image-Logik (Hauptwert dieser Component)
├── strings.json            # i18n-Strings für Config-UI
└── translations/
    ├── de.json
    └── en.json
```

**Lifecycle:**

```
HA Start
  → __init__.async_setup_entry(hass, config_entry)
  → Coordinator(hass, config_entry).async_config_entry_first_refresh()
  → entries.async_forward_entry_setups(["sensor"])
  → sensor.py erstellt FastNewsReaderSensor pro Feed-URL
  → Coordinator pollt Feed im scan_interval
  → on update: sensor.async_write_ha_state() mit neuem state + attributes
```

---

## 4. Implementierungsphasen

### MVP (Phase 1) — die Bilder gehen wieder

**Zweck:** Tagesschau & Co. zeigen Bilder. Schemakompatibel mit der Card.

- `__init__.py`, `manifest.json`, `hacs.json`
- `config_flow.py` mit Feldern: `name`, `feed_url`, `scan_interval` (Default 1h), `date_format` (Default ISO), `local_time` (bool)
- `coordinator.py` — `aiohttp.ClientSession` (HA-managed), `feedparser.parse(content)` im Executor, Storage-Cache via HA-`Store`
- `sensor.py` — eine `SensorEntity` pro Feed mit `extra_state_attributes = {"channel": ..., "entries": ...}`
- `image_extractor.py` — alle 5 Standard-Quellen + `<content:encoded>` Scan (siehe Sektion 5)

**Acceptance Criteria:**
- Tagesschau-Feed zeigt Bilder in der Card
- Heise-Feed zeigt Bilder
- BBC News zeigt Bilder
- Card-Code unverändert
- Sensor-Update bei Reload triggert Card-Update via state_changed

### Phase 2 — og:image-Fallback

**Zweck:** Auch Feeds ohne RSS-Image-Felder funktionieren.

- In `image_extractor.py` zusätzliche `_fetch_og_image(article_url)`-Funktion
- HEAD-Request-Optimierung: zuerst `Content-Length` checken, abbruch wenn HTML > 5 MB
- Range-Request für ersten 64 KB → BeautifulSoup nur auf den head-Bereich
- Aggressive Cache pro Article-URL (TTL z.B. 30 Tage — og:image ändert sich selten)
- Zeitbudget pro Article: max 3s, dann fallback to `null`

**Risk:** Server-Last auf HA. Mitigation: Cache + per-Article-once + Concurrency-Limit (z.B. max 5 parallele Requests).

### Phase 3 — Per-Feed Filterung

**Zweck:** User-Komfort über das Card-Settings hinaus.

- `category_keywords`-Config (filter Entries die nicht matchen)
- `min_word_count`-Config (skip Kurz-Posts wie "Bild der Woche")
- `exclude_keywords`-Config

### Phase 4 — Push-basiert (optional, ambitioniert)

**Zweck:** Statt 1h-Polling sofort updaten wenn Quelle was rausgibt.

- WebSub/PubSubHubbub Subscriber für Feeds die das anbieten (selten in DE)
- Oder: kurzes Polling (5 min) auf wenige "wichtige" Feeds

**Wahrscheinlich nie umgesetzt.** Polling 1h ist gut genug für News.

---

## 5. Image-Extraction (das Hauptproblem das wir lösen)

`image_extractor.py` Pseudocode:

```python
def extract_image(entry: FeedParserDict, feed_url: str) -> str | None:
    """Try every known RSS image source. Returns absolute URL or None."""

    # 1. media:thumbnail (Yahoo Media RSS) — Array of dicts
    if media_thumbnail := entry.get("media_thumbnail"):
        for item in media_thumbnail:
            if url := item.get("url"):
                return _absolutize(url, feed_url)

    # 2. media:content — meist mit medium="image" oder type="image/*"
    if media_content := entry.get("media_content"):
        for item in media_content:
            if (url := item.get("url")) and (
                item.get("medium") == "image"
                or (item.get("type") or "").startswith("image/")
            ):
                return _absolutize(url, feed_url)

    # 3. enclosures — RSS Standard, oft Audio/Video, gelegentlich Image
    if enclosures := entry.get("enclosures"):
        for enc in enclosures:
            url = enc.get("href") or enc.get("url")
            if url and (enc.get("type") or "").startswith("image/"):
                return _absolutize(url, feed_url)

    # 4. <content:encoded> — feedparser legt's in entry.content[0].value als HTML ab.
    #    DAS ist die Lücke die timmaurice/feedparser nicht füllt.
    #    Tagesschau, Heise und viele dt. Feeds packen Bilder NUR hier rein.
    if content := entry.get("content"):
        for item in content:
            if html := (item.get("value") if isinstance(item, dict) else None):
                if img := _scan_html_for_image(html):
                    return _absolutize(img, feed_url)

    # 5. Description / Summary HTML scan
    if summary := entry.get("summary"):
        if img := _scan_html_for_image(summary):
            return _absolutize(img, feed_url)

    # 6. (Phase 2) og:image fetch
    # if link := entry.get("link"):
    #     if img := await _fetch_og_image(link):
    #         return _absolutize(img, link)

    return None


def _scan_html_for_image(html: str) -> str | None:
    """Extract first <img src=...> from HTML, handling all quote styles."""
    if not html:
        return None
    # Single, double, or no quotes around src value
    match = re.search(
        r'<img[^>]+src=(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))',
        html, re.IGNORECASE
    )
    if match:
        return match.group(1) or match.group(2) or match.group(3)
    # og:image / twitter:image meta tags as fallback within content
    meta = re.search(
        r'<meta[^>]+(?:property|name)=["\'](og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    return meta.group(2) if meta else None


def _absolutize(url: str, base: str) -> str:
    """Make URL absolute relative to base feed URL."""
    return urljoin(base, url)
```

**Tests die für die Component existieren sollten:**

- BBC News (uses `<media:thumbnail>`) → finds image via path 1
- Heise (uses `<media:content>`) → finds image via path 2
- Tagesschau (uses `<content:encoded>` ONLY) → finds image via path 4 — **das war der Auslöser**
- Generic blog with `<img>` in description → finds via path 5
- Phase 2: pure-text feeds (e.g. mailing-list-as-RSS) → finds via og:image

---

## 6. HACS-Publishing-Setup

### Repository-Struktur

```
fastender/fast-news-reader/    (oder Wunschname)
├── custom_components/fast_news_reader/
│   ├── __init__.py
│   ├── manifest.json
│   ├── const.py
│   ├── config_flow.py
│   ├── coordinator.py
│   ├── sensor.py
│   ├── image_extractor.py
│   ├── strings.json
│   └── translations/
├── tests/
│   ├── conftest.py
│   ├── test_image_extractor.py
│   └── fixtures/
│       ├── tagesschau.xml
│       ├── bbc.xml
│       └── heise.xml
├── hacs.json                  # HACS-Metadata
├── README.md                  # User-facing setup guide
├── pyproject.toml             # Dev-Setup (ruff, pytest)
├── LICENSE
└── .github/workflows/
    └── test.yml               # CI: pytest + ruff
```

### `manifest.json`

```json
{
  "domain": "fast_news_reader",
  "name": "Fast News Reader",
  "version": "0.1.0",
  "documentation": "https://github.com/fastender/fast-news-reader",
  "issue_tracker": "https://github.com/fastender/fast-news-reader/issues",
  "config_flow": true,
  "iot_class": "cloud_polling",
  "requirements": ["feedparser>=6.0.10", "beautifulsoup4>=4.12.0"],
  "dependencies": [],
  "codeowners": ["@fastender"]
}
```

### `hacs.json`

```json
{
  "name": "Fast News Reader",
  "render_readme": true,
  "country": ["DE", "EN"],
  "homeassistant": "2024.12.0"
}
```

### README-Skelett

- Was es ist (RSS-Reader-Integration mit Bild-Extraktion auch aus `content:encoded`)
- Installation via HACS Custom Repository
- Konfiguration: 1 Klick → Settings → Devices & Services → Add Integration → "Fast News Reader" → Name + URL
- Schema-Beschreibung der Sensor-Attribute (für anderen Lovelace-Card-Builder)
- Bekannte funktionierende Feeds + Beispiel-URLs
- Troubleshooting / Debug-Logging

---

## 7. Card-seitige Anpassungen

**Wenn Schema-Variante A** (kompatibel mit `timmaurice/feedparser`):

- **0 Änderungen** im Card-Code nötig.
- Card-Code in `news/index.jsx:_loadFeedparserSensors()` filtert nach `attributes.entries[]` + `attributes.channel` — beides liefert die neue Component genauso.
- `_entryToArticle()` liest `entry.image` als String — passt.

**Wenn Schema-Variante B** (custom besseres Schema, z.B. Plain-Text-`description` statt HTML-`summary`):

- `_entryToArticle()`-Mapper anpassen (~20 LOC)
- Detection-Filter im Card erweitern um auch das eigene Schema zu erkennen

**Empfehlung:** Variante A. Macht die Component zu einem echten Drop-in-Replacement für andere Lovelace-Cards die `timmaurice/feedparser` nutzen.

Update an Card-Empty-State (`iOSSettingsView`-Hinweis): nach Veröffentlichung der eigenen Component zusätzlich verlinken oder als primäre Empfehlung nennen.

---

## 8. Test-Strategie

### Unit-Tests (`pytest`)

- `test_image_extractor.py`:
  - Lade XML-Fixture (Tagesschau, BBC, Heise, generic blog)
  - Parse mit `feedparser`
  - Pro Entry → `extract_image()` → assertEqual erwartete URL
  - Edge-Cases: leere Entry, malformed HTML, fehlende media-Tags, relative URLs

- `test_coordinator.py`:
  - Mock `aiohttp` Response mit Tagesschau-XML-Fixture
  - Coordinator.async_update() → assert state-count + sample entry image
  - Cache-Verhalten: zweiter Refresh bekommt gleichen Output ohne neuen Fetch

### Integration-Tests (mit echtem HA-Test-Setup)

- `pytest-homeassistant-custom-component` als Dev-Dependency
- Config-Flow durchlaufen lassen + Sensor-State prüfen
- State-Change-Listener triggern + Card-seitige `_handleSensorStateChange` simulieren

### Manuelle Verifikation

- HA-Instanz mit Component und 3 Feeds: Tagesschau, Heise, BBC
- Card öffnen → Bilder sichtbar
- `window.debugNewsImages()` in Console → entries haben `image: "https://..."`

---

## 9. Risiken / Unbekannte

- **Feedparser-Library Verhalten** bei seltenen RSS-Dialekten (Atom 1.0 mit XHTML-Content, RSS 0.91, etc.) — sollte robust sein, evtl. zusätzliche Fixtures
- **og:image-Fetch (Phase 2)** verbraucht HA-Server-Bandbreite. Pro Feed-Update ggf. 50 Article-URL-Fetches → jeder 64KB Range-Request. Bei 10 Feeds × 50 Articles × 64KB = 32 MB pro Stunde. Akzeptabel, aber dokumentieren.
- **Authentifizierte Feeds** (Basic Auth, Cookies, Tokens) — nicht im MVP. Nachrüstbar.
- **HACS-Listing** — eigenes Repo muss "passable" sein für Listung im HACS-Default-Verzeichnis (ca. 1 Monat Wartezeit). Bis dahin "Custom Repository"-Install dokumentieren.

---

## 10. Definition of Done für Phase 1 (MVP)

- [ ] Component installierbar via "HACS Custom Repository → Integration"
- [ ] Config-Flow funktioniert (Add → Name + URL eingeben → Sensor erscheint)
- [ ] Sensor-Update läuft im scan_interval, ohne Errors in HA-Log
- [ ] **Tagesschau-Feed liefert Bilder** in der Card (Card-Code unverändert)
- [ ] BBC News, Heise, Spiegel, Zeit getestet — Bilder kommen durch
- [ ] README mit Setup-Anleitung
- [ ] Pytest-Suite mit Image-Extractor-Tests grün
- [ ] Repo öffentlich auf GitHub, HACS-Custom-Repository-Link in Card-Settings dokumentiert

---

## 11. Mögliche Erweiterungen (post-MVP, Wunschliste)

- **Translation per Feed** (DeepL-Integration, optional)
- **AI-Summarization** (kürzt langen Article-Text auf 2-3 Sätze)
- **Sentiment-Analyse** (zeigt Stimmungs-Trend pro Quelle/Tag)
- **Per-Article TTS** (vorlesen lassen über HA's TTS-Integration)
- **Read-later-Sync** mit Pocket / Wallabag / Instapaper
- **News-Discovery** (Card schlägt neue Feeds basierend auf User-Klicks vor)

Alles **post-MVP**, alles strikt optional. Nicht in Phase 1.

---

## 12. Nächste konkrete Schritte (für die Folgesession)

1. **Repo-Name finalisieren** (z.B. `fast-news-reader`, `feedparser-pro`, oder Wunsch).
2. **Skeleton schreiben** — alle Files in `custom_components/<domain>/` plus `manifest.json`, `hacs.json`, `README.md`. Direkt MVP-Funktional.
3. **Lokale HA-Test-Instance einrichten** (oder bestehende User-HA als Dev-Target).
4. **Tagesschau-Fixture sichern** (`docs/fixtures/tagesschau-rss.xml` oder im neuen Repo) als Regression-Testfall.
5. **Image-Extractor schreiben mit Tests-First** — die 5 Pfade einzeln durchtesten.
6. **Coordinator + Sensor verkabeln**, gegen lokale HA-Test-Instanz prüfen.
7. **GitHub-Repo erstellen, push, in HACS als Custom-Repository hinzufügen, installieren, manueller Smoketest.**
8. **README finalisieren, v0.1.0 taggen.**
9. **Card-Empty-State erweitern** um Hinweis auf die neue Component (zusätzlich zu `timmaurice/feedparser`).

Schätzaufwand: 1 fokussierter Tag für MVP. og:image-Fallback (Phase 2): nochmal 0.5 Tage.

---

*Roadmap geschrieben am 2026-04-25 nach der Migration auf `timmaurice/feedparser` (v1.1.1258) und dem Beweis, dass auch dort Bilder bei Tagesschau und ähnlichen Feeds fehlen. Diese Component ist der Schlussstein in der News-Architektur — danach ist die Card-Pipeline komplett unter eigener Kontrolle vom Feed bis zum Pixel.*
