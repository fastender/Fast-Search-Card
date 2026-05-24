# Session Notes 2026-05-22 to 2026-05-24

**Versions:** v1.1.1614 → v1.1.1666 (53 releases over 3 days)
**Trigger:** Reddit "vibe-coded app launch checklist" post → user wanted a real security pass.
**Result:** Security audit + 4 emergency-hotfix releases + 12-iteration boot-reveal saga + calendar/bento polish marathon.

---

## Day 1 (2026-05-22) — Security pass, hotfix marathon

### v1.1.1614 — Five XSS / injection / leak findings

User shared a Reddit checklist about security in vibe-coded apps. Ran five parallel agent audits against `src/`:
- Hardcoded secrets / tokens
- XSS via `innerHTML`/`dangerouslySetInnerHTML`
- External calls + sensitive data exposure
- OWASP-style input validation
- `eval`, `new Function`, `postMessage` checks

**Findings (5 fixed):**
1. **Icon HTML sanitization**: three `dangerouslySetInnerHTML` callsites rendered icons from untrusted sources (entity attributes, YAML config). New `src/utils/iconSanitizer.js` uses DOMParser + SVG-tag whitelist. Wired into `ControlButton`, `PresetButtonsGroup`, `ManagementView`.
2. **RSS link scheme check** in `NewsView`: `window.open(article.link)` accepted `javascript:` URLs. Now requires `^https?://` and adds `noopener,noreferrer`.
3. **`encodeURIComponent(entityId)`** on three REST template-literal calls (`historyUtils`, `homeAssistantService`, `calendar/index`).
4. **`window._hass` non-enumerable** via `Object.defineProperty` (`enumerable: false`) on both setter sites (DataProvider, build.sh wrapper) — defense-in-depth so other custom-cards' `Object.keys(window)` scans don't find it.
5. **`stripHtml` switched from `el.innerHTML = …` to `DOMParser.parseFromString`** — avoids loader-attribute side effects (`<img onerror>` fires even on detached elements when set via innerHTML).

### v1.1.1615 — npm audit
`npm audit` flagged 11 CVEs (2 moderate, 9 high). Only **preact 10.27 JSON VNode Injection** ([GHSA-36hm-qxxp-pg3m](https://github.com/advisories/GHSA-36hm-qxxp-pg3m)) was runtime-relevant; the rest were dev-tooling (vite/rollup/postcss/svgo/picomatch). `npm audit fix` patched 9; `npm uninstall @rollup/plugin-terser` (unused dev-dep) closed the last 2 via transitive removal. Final audit: 0 vulnerabilities. preact at 10.29.2.

### v1.1.1616 — ReDoS + prototype pollution + setConfig validation
Three smaller findings bundled:
- **ReDoS in patternMatching**: user-defined exclusion patterns compiled with `new RegExp(...)`. Only `.` was escaped; `*` and `?` converted to wildcards; every other regex metachar flowed through. Pattern like `(a+)+b` could freeze the browser. Now escapes ALL metachars first; un-escapes `\*` and `\?` to wildcards selectively. 256-char length cap.
- **Prototype-pollution filters** on `toastSettings.js` and `systemSettingsStorage.js`. `safeAssign` helper drops `__proto__`/`constructor`/`prototype` keys before spreading untrusted localStorage data.
- **`setConfig` validation**: type-check config (reject non-object), clamp `card_height` to `[50, 4000]` (later 50 → 0 + no upper limit when the clamp broke user setups with tall cards).
- **Bonus**: mount-error `_root.innerHTML = '...' + error.message` switched to `textContent` (error messages with `<` chars can't inject markup).
- **Bonus**: `window._hass` non-enumerable also in the build.sh wrapper.

### v1.1.1617 — CATASTROPHIC: ReferenceError on every state push
My v1.1.1616 wrapper code referenced `FastSearchCard._hassPropertyDefined` as a static class property. Actual class name is `FastSearchCardElement`. Inside `build.sh` heredoc → not linted, not type-checked. The build succeeded because the code is syntactically valid; the ReferenceError only fires at runtime on first state update.

User showed screenshot: Lovelace "Konfigurationsfehler" + every news/todos card "Hass not available after 20 attempts". Whole card chain collapsed.

### v1.1.1618 — Emergency hotfix
Replaced `FastSearchCard._hassPropertyDefined` with module-level `var _fscHassPropertyDefined = false` declared OUTSIDE the class at top of the heredoc. Robust to rename, visible in top-of-file scan.

### v1.1.1619 — Changelog tile stale (dormant since v1.1.1607)
Tile showed v1.1.1616 while v1.1.1618 was installed. `loadFromCacheOnly` correctly derived `current_version` from the parsed markdown (v1.1.1607 introduced that), but the three `updateAttributes` calls inside `loadChangelog` (cache-hit, fresh-fetch, expired-cache fallback) all omitted that field. Result: after the boot-path cache read, `current_version` was never updated by subsequent fetches.

Added `current_version: versions[0]?.version || this.attributes.current_version` to all three branches.

### v1.1.1620 — Outer DetailView CustomScrollbar (first attempt)
User reported doubled scrollbars in device-detail-views. I extended the existing `:has() ~ .custom-scrollbar-container { display: none }` whitelist with the four device-tab container classes (controls/scheduler/history/context). Didn't fix the symptom; the user's screenshots showed bars STILL doubled.

### v1.1.1621 — Outer DetailView CustomScrollbar (real fix)
Real root cause: the v1.1.1611 `:has() ~` CSS could only hide the OUTER (sibling) CustomScrollbar. The "doubled" bar the user saw was always outer-DetailView + inner-View-scrollbar (rendered as a DESCENDANT, out of reach for the sibling combinator). Two structural fixes:
1. Removed the outer DetailView CustomScrollbar entirely from `DetailView.jsx`. Every tab manages its own overflow.
2. Hardened `CustomScrollbar.jsx` to refuse rendering when the tracked container is invisible:
   - `getComputedStyle(container).overflowY === 'hidden' / 'visible' / 'clip'`
   - `container.offsetParent === null` (display:none ancestor)
   - `container.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })` (any ancestor opacity:0, visibility:hidden, content-visibility:hidden)

### v1.1.1622 — Calendar Custom Scrollbar
While there: `BentoRichCalendar` had no CustomScrollbar (news did). Added one analog to `BentoRichNews`.

### v1.1.1623 — Stale-while-revalidate for Changelog tile
v1.1.1619 fixed `loadChangelog` but it only fires on view-open or after TTL expiry. With 4 releases in a hour, the tile lagged. `onMount` now schedules a background `loadChangelog({ force: true })` 1.5s after mount → tile updates within ~2s without user opening the changelog view.

### v1.1.1624 — parseMarkdown dropped my v1.1.1619-1623 entries silently
User opened the Changelog view: top entry showed v1.1.1618, missing 1619-1623. Cache was fresh; entries WERE in the markdown. Cause: `parseMarkdown` regex required `**Hero:**` line between Title and Tags. I'd omitted Hero in v1.1.1619-1623 (always would be `none`). `String.matchAll` silently skipped entries that didn't match. Two fixes:
1. Made Hero optional in the regex (`(?:\*\*Hero:\*\* (.+?)\n)?`).
2. Backfilled `**Hero:** none` on the affected entries as defense.

### docs/SECURITY.md created
Standalone transparency doc for HACS users: what the card stores locally, what it does NOT send anywhere, every hardening measure across v1.1.1614-1623, how to report security issues responsibly. No marketing-speak; everything verifiable by grepping the release bundle.

---

## Day 2 (2026-05-23) — UI iteration marathons

### Pill saga (v1.1.1625-1631) — 7 iterations on the search-suggestion ghost

User: "diesen autotext will ich anders designen; das icon soll rechts und der text leichtes grau haben, ähnlich wie bei macos spotlight". Asked through it carefully with options.

1. **v1.1.1625**: Suffix-only pill (`nderzimmer 🏠`), 18px text, rounded `border-radius: 999px`, sat right after the typed text via mirror-span measurement.
2. **v1.1.1626**: User asked to make it the full word ("kinderzimmer"), 24px text. My rewrite tripped over an NBSP in the source → JSX edit applied partially → ReferenceError to undefined `mirrorRef` at runtime.
3. **v1.1.1627**: Emergency hotfix for v1.1.1626's broken JSX. Used `replace_all` on smaller identifier-substrings to dodge the NBSP-trap.
4. **v1.1.1628**: User reversed — back to suffix-only, 24px. Mirror-span reactivated.
5. **v1.1.1629**: `padding-left: 0` so the pill background touches the typed-text flush (Apple Spotlight pattern).
6. **v1.1.1630**: User: "gefällt mir die lösung mit pill nicht mehr; können wir das alles rückgängig machen?". Full revert to v1.1.1624 dual-input overlay via `Write` (Edit tool kept tripping on NBSP).
7. **v1.1.1631**: User: "icon sollte aber nicht vor dem wort stehen sondern danach und am besten als button umkreist apple like". Final: round Suffix-Icon-Button (26×26 px circle, `border-radius:50%`, light alpha background) positioned right after the ghost word via mirror-span measurement. Icon inside the circle.

**Lesson**: ~6 commits chasing what user wanted. Spec the visual BEFORE coding next time — even a tiny ASCII mockup.

### Boot-reveal saga (v1.1.1637-1648) — 12 iterations on the Apple-app-launch animation

User: "beim ersten start will ich den background vom dunkel blur in normal wechseln lassen; dabei soll zoom out apple style erfolgen". New component `WallpaperBootOverlay.jsx`.

1. **v1.1.1637**: First version. Overlay `position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(30px)`. Fades out + de-blurs in sync with the card reveal. Card wrapper gets scale 0.95 → 1.0 spring animation.
2. **v1.1.1638**: User: "Zooming out background image effect sehe ich nicht". Tried scaling `document.body.style.transform`.
3. **v1.1.1639**: User: "das native sidebar vom home assistant wird auch gezoomt". Switched from body-scale to a clone-layer (`getComputedStyle(body).backgroundImage` → fresh `<div>` with same bg, scaled). Sidebar stays put.
4. **v1.1.1640**: clone-layer NEVER appeared because... user opened devtools and showed me the actual DOM. **HA wallpaper is NOT on body** — it's on `<hui-view-background fixed-background>` 5 shadow-roots deep. Added `findInShadowDOM(root, tagName)` BFS helper. Transform applied directly to the real element. Sidebar in sibling shadow-branch → untouched naturally.
5. **v1.1.1641**: User asked for longer zoom + sequencing. Wallpaper zoom runs first (4000ms), then overlay-fade + card-reveal kick in together after the zoom settles.
6. **v1.1.1642**: User: "am anfang dark + blur 30 px overlay / dann fade nicht mehr blur oder overlay / dann zoom / erst danach die karten". Re-sequenced: overlay-fade 0-1500ms, then wallpaper-zoom 1500-4500ms, then card 2500-3050ms.
7. **v1.1.1643**: User: "fade-in ist kaum sichtbar / zoom anfangs höher scale vielleicht 1.10 / card schneller starten bei 3000ms". Tweaked fade to ease-out-cubic (more visible throughout duration vs ease-out-quart which compresses to first 200ms), opacity 0.55 → 0.65, scale 1.08 → 1.10, card delay 4.5 → 3.0s.
8. **v1.1.1644**: User: "T=2000 vielleicht; 3500ms; scale 1.20". Tightened.
9. **v1.1.1645**: User: "zoom soll mit T=0 anfangen, Ende soll bleiben bei 5500". Zoom now parallel to fade, duration stretched to 5500ms.
10. **v1.1.1646**: User: "drei Phasen über framer motion realisieren finde ich". Migrated wallpaper-zoom from CSS transition to `framer-motion.animate()`.
11. **v1.1.1647**: User: "der zoom ruckelt". Reverted to CSS transition for the zoom — framer-motion `animate()` is JS-driven (per-frame style writes on main thread), CSS transition runs on compositor/GPU. At 5500ms duration the difference was visible jank vs smooth. Phase 1 + 3 (short animations) stay on framer-motion.
12. **v1.1.1648**: User: "ganz am anfang soll es richtig dunkel sein, also schwarz / dann langsam fade vielleicht mittig anfangen fade in wie im movie". Solid black background `rgb(0,0,0)` instead of dimmed rgba. 500ms hold before fade. ease-in-out cubic (S-curve, change distributed evenly — perceptible).

Final sequence after these iterations:
```
T=0       solid black overlay, wallpaper hidden behind it
T=0       wallpaper zoom 3.0 → 1.0 (CSS transition, 5500ms, ease-out-quart)
T=500     overlay-fade starts (framer-motion, 2000ms, ease-in-out-cubic)
T=2500    overlay gone; card reveal starts (framer-motion, opacity 0→1 in 550ms cubic + scale 0.95→1 spring)
T=5500    wallpaper settled; everything done
```

**Lessons:**
- For 5+ second transforms: CSS transition wins on smoothness because it's compositor-thread.
- Don't assume DOM structure — HA's wallpaper isn't on body; it's deep in shadow-DOM.
- `findInShadowDOM` BFS helper works for open shadow-roots (HA's current setup).

### Bento polish
- **v1.1.1632-1635**: Slider redesigns. AnimatePresence cross-fade, swipe gestures, Apple App Store progress dots (active dot is a pill with growing inner bar synced to auto-slide).
- **v1.1.1636**: BentoRichTodos hover-pill removed, gap shrunk (10px → 4px padding-y).
- **v1.1.1649-1657**: Bento bugs marathon — zoom scale 2.0/3.0, News tabs always visible (was AND-gated on hasUnread && hasRead), bottom mask permanent (was conditional on .is-scrolling), Calendar CustomScrollbar, Calendar Demnächst/Vergangene tabs, slider onTap skips clicks on interactive children (so Calendar tabs work), tab-yank-back useEffect bug, hero row uniform format, loading-loop fix (useEffect dep `[hass, entity]` re-ran on every state push → `[hass?.connection, entity?.id]`), 555px max-height clamp removed.

---

## Day 3 (2026-05-24) — Calendar polish + TDZ disaster

### v1.1.1659-1661 — Calendar Month-view compact + two-column
- Month-cells `aspect-ratio: 1` (square ~60px) → `height: 32px` fixed. Grid 48% shorter.
- Day-numbers, today-bubble, dots shrunk proportionally; grid gap 4 → 2.
- Two-column main layout (calendar grid left, event list right) wrapped in new `.calendar-main-row`. `@media (min-width: 1024px)` collapses back to single-column (desktop, per user preference).

### v1.1.1662 — Calendar header in detail-header
User: inline `.calendar-header-title` "Mai 2026" duplicates the space that the top-right detail-header could use. Hoisted via `useRegisterViewRef('calendar', { headerTitle, visibleEventsCount })` + new `DetailView.getCalendarHeaderInfo()` (same pattern as news/todos/all_schedules). Plus year-view `month: 'long'` → `'short'` to fix 1st-column overlap.

### v1.1.1663 — Month-cell numbers baseline-aligned
User: day numbers on cells with event-dots sat higher. Cause: `justify-content: center` centered the COMBINED (number + dots) block, pushing number up on dotted days. Fix: `.calendar-month-cell-dots { position: absolute; bottom: 3px; }` — number stays centered, dots float at bottom.

### v1.1.1664 — TDZ disaster
v1.1.1662's edit added `headerTitle` + `visibleEvents.length` to `useRegisterViewRef`, but the registration site was ~50 lines BEFORE the `const headerTitle = useMemo(...)` declaration. `const` is in scope from block start but throws on access before declaration line. Runtime ReferenceError "Cannot access 'A' before initialization" on every CalendarView mount → calendar broken entirely.

Moved the registration block down to after both consts. Vite/eslint didn't catch this; the bug only fires at component mount.

### v1.1.1665 — Week → Day sync
User: pick day 18 in Week view → click Day tab → Day-header shows one day, event list shows another, "No events" though 18 has events. Cause: anchor and selectedDay are independent; Week-click only updates selectedDay; Day-tab only flips viewMode. Two states diverge in Day view.

Fix: on Day-tab click, `setAnchor(new Date(selectedDay))`.

### v1.1.1666 — Bento event click opens dialog directly
User: clicking an event in the bento calendar widget opened the overview first, then ~200-500ms later the edit-dialog appeared. Same pattern issue as old news bug. Cause: bento set `window.__pendingCalendarEventUid = ev.uid`; CalendarView mounted overview; useEffect waited for loadEvents → matched UID → opened dialog.

Two fixes:
1. Bento now passes `window.__pendingCalendarEvent = ev` (full object) alongside the UID.
2. CalendarView consumes it via lazy `useState`:
```js
const [pendingFromBento] = useState(() => {
  const ev = window?.__pendingCalendarEvent;
  if (ev) { delete window.__pendingCalendarEvent; return ev; }
  return null;
});
const [anchor, setAnchor] = useState(() => pendingFromBento?.startDate ? new Date(pendingFromBento.startDate) : new Date());
const [selectedDay, setSelectedDay] = useState(() => pendingFromBento?.startDate ? startOfDay(new Date(pendingFromBento.startDate)) : startOfDay(new Date()));
const [dialogState, setDialogState] = useState(() => pendingFromBento ? { mode: 'edit', initialEvent: pendingFromBento } : null);
```
Dialog is up on first render; overview loads behind it but is never visible.

---

## Lessons recap

| # | Lesson |
|---|---|
| 1 | TDZ: hooks reading consts must come AFTER their declarations |
| 2 | Lazy `useState` initializer is the right vehicle for sync window-global handoff (avoids overview flash) |
| 3 | `findInShadowDOM` BFS helper for HA's nested shadow-roots |
| 4 | CSS transition >> framer-motion `animate()` for long single-property animations (compositor vs main thread) |
| 5 | `:has() ~` sibling-combinator can't reach descendants — common false trail |
| 6 | Hardcoded `max-height` clamps in inner components survive outer container resizes; grep when bumping sizes |
| 7 | `build.sh` heredoc is outside the linter safety net; class-identifier references are brittle |
| 8 | Versionsverlauf parser required Hero; made optional + backfill |
| 9 | useEffect "auto-fallback" must respect explicit user choice (`useRef` flag pattern) |
| 10 | Edit-tool NBSP-trap workaround: `replace_all` on shorter substrings, or `Write` whole file |

## Process notes

- Pill saga taught me to spec the visual BEFORE coding for UI work — 6 commits for an icon position is too many.
- Two emergency hotfixes (FastSearchCardElement, TDZ) in three days both came from mechanical changes in code I hadn't run mentally end-to-end. Lesson: trace the runtime semantics, not just the AST.
- User opening devtools and pasting the actual DOM was the SINGLE most useful debugging moment of the session — diagnosed the wallpaper-zoom failure in seconds. More "show me the DOM" prompts in future.
- Versionsverlauf English-only rule violated once (v1.1.1636); caught immediately; haven't repeated it since.
