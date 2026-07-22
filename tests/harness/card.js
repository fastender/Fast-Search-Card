// tests/harness/card.js
//
// v1.1.2191 (Roadmap #36): Fundament des Test-Harness.
//
// Warum überhaupt: Die Karte wurde bisher über einen In-App-Preview-Tab
// verifiziert. Der lief IM HINTERGRUND — der Browser drosselt dort rAF und
// Timer (setTimeout auf ~1 s), framer-Exit-Knoten bleiben liegen, lazy geladene
// System-Entity-Views werden nie fertig. Jede Prüfung brauchte deshalb
// Handarbeit: rAF-Patch vor dem Mount, MessageChannel-Pump, Views über ihren
// Navbar-Titel adressieren statt über die DOM-Reihenfolge.
//
// Playwright gibt uns eine echte, im Vordergrund laufende Seite: rAF und Timer
// laufen normal, Animationen enden, Lazy-Imports kommen an. Damit fallen fast
// alle dieser Sonderbehandlungen weg — der Rest steckt hier in Helfern, damit
// er nicht in jeden Test kopiert wird.

const BASE = process.env.FSC_BASE_URL || 'http://localhost:5173';

/** Minimales, aber vollständiges hass-Objekt. Ergänzungen via `patch`. */
export function makeHass(patch = {}) {
  const iso = new Date().toISOString();
  const entity = (entity_id, friendly_name, state = 'on', attributes = {}) => ({
    entity_id, state, last_changed: iso, last_updated: iso,
    attributes: { friendly_name, ...attributes },
  });
  const base = {
    states: {
      'light.wohnzimmer': entity('light.wohnzimmer', 'Wohnzimmer Licht'),
      'light.kueche': entity('light.kueche', 'Küche Licht', 'off'),
      'switch.terrasse': entity('switch.terrasse', 'Terrasse Steckdose'),
      'weather.home': entity('weather.home', 'Wetter', 'sunny', { temperature: 21 }),
    },
    // Von der Karte gelesen, aber im Test nie echt gebraucht:
    services: { tts: { google_translate_say: {} } },
    language: 'de',
    locale: { language: 'de' },
    areas: {}, devices: {}, entities: {},
    user: { id: 'test-user', name: 'Tester' },
    ...patch,
  };
  if (patch.states) base.states = { ...base.states, ...patch.states };
  return base;
}

/**
 * Lädt die Dev-Seite, mountet die Karte mit einem Mock-hass und wartet, bis
 * sie wirklich steht.
 *
 * 🔑 `connection` muss pro Mount/Update eine NEUE Objekt-Identität haben — der
 * DataProvider seedet Notifications und Watches nur bei Verbindungswechsel,
 * und im Test feuert nie ein echtes `state_changed`.
 */
export async function mountCard(page, { hass = {}, settings = {}, lang = 'de' } = {}) {
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.FastSearchCardApp, null, { timeout: 20000 });

  await page.evaluate(({ hassPatch, settingsPatch, language }) => {
    // Sauberer Storage-Start: Tests dürfen sich nicht gegenseitig beeinflussen.
    localStorage.clear();
    // 🔑 Sprache FESTNAGELN. `localStorage.clear()` löscht auch die Sprachwahl,
    // und ohne sie entscheidet ein Rennen zwischen langStore-Default und dem
    // hass-Objekt, ob die Karte deutsch oder englisch rendert. Genau daran sind
    // die ersten Testläufe gescheitert — mal fanden sie „Währung", mal stand
    // dort „Currency", und die Fehlschläge wanderten zwischen den Läufen.
    localStorage.setItem('userLanguage', language);
    if (settingsPatch && Object.keys(settingsPatch).length) {
      localStorage.setItem('systemSettings', JSON.stringify(settingsPatch));
    }
    window.__mkConnection = () => ({
      subscribeMessage: () => Promise.resolve(() => {}),
      subscribeEvents: () => Promise.resolve(() => {}),
      sendMessagePromise: () => Promise.resolve([]),
    });
    const iso = new Date().toISOString();
    const entity = (entity_id, friendly_name, state = 'on', attributes = {}) => ({
      entity_id, state, last_changed: iso, last_updated: iso,
      attributes: { friendly_name, ...attributes },
    });
    const base = {
      states: {
        'light.wohnzimmer': entity('light.wohnzimmer', 'Wohnzimmer Licht'),
        'light.kueche': entity('light.kueche', 'Küche Licht', 'off'),
        'switch.terrasse': entity('switch.terrasse', 'Terrasse Steckdose'),
        'weather.home': entity('weather.home', 'Wetter', 'sunny', { temperature: 21 }),
      },
      services: { tts: { google_translate_say: {} } },
      language: 'de', locale: { language: 'de' },
      areas: {}, devices: {}, entities: {},
      user: { id: 'test-user', name: 'Tester' },
      callService: () => Promise.resolve(),
      callWS: () => Promise.resolve([]),
      callApi: () => Promise.resolve({}),
    };
    const hass = { ...base, language, locale: { language }, ...hassPatch, connection: window.__mkConnection() };
    if (hassPatch && hassPatch.states) hass.states = { ...base.states, ...hassPatch.states };

    const container = document.createElement('div');
    container.id = 'fsc-test-root';
    container.style.cssText = 'position:fixed;inset:0;background:#222;overflow:auto;';
    document.body.appendChild(container);

    window.__fsc = { container, hass };
    window.FastSearchCardApp.mount(container, hass, {});
  }, { hassPatch: hass, settingsPatch: settings, language: lang });

  await page.waitForSelector('#fsc-test-root #fast-search-card-root', { timeout: 20000 });
  return page.locator('#fsc-test-root #fast-search-card-root');
}

/**
 * Schiebt einen neuen hass-Stand nach. `mutate` läuft IM Browser und bekommt
 * das states-Objekt zum Verändern.
 *
 * 🔑 `updateHass` nimmt ZWEI Argumente (container, hass) — nur hass zu
 * übergeben lässt es still auf undefined laufen.
 */
export async function updateHass(page, mutate) {
  await page.evaluate((fnBody) => {
    const { container, hass } = window.__fsc;
    const states = { ...hass.states };
    // eslint-disable-next-line no-new-func
    new Function('states', 'entity', fnBody)(states, (id, name, state = 'on', attributes = {}) => ({
      entity_id: id, state, last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      attributes: { friendly_name: name, ...attributes },
    }));
    const next = { ...hass, states, connection: window.__mkConnection() };
    window.__fsc.hass = next;
    window.FastSearchCardApp.updateHass(container, next);
  }, `(${mutate.toString()})(states, entity)`);
}

/** Feuert ein Settings-Broadcast-Event (die Karte hört auf window). */
export async function broadcast(page, eventName, detail = {}) {
  await page.evaluate(({ n, d }) => {
    window.dispatchEvent(new CustomEvent(n, { detail: d }));
  }, { n: eventName, d: detail });
}

/** Schreibt einen systemSettings-Abschnitt und läutet die passende Glocke. */
export async function setSetting(page, section, patch, bell) {
  await page.evaluate(({ s, p }) => {
    const all = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    all[s] = { ...(all[s] || {}), ...p };
    localStorage.setItem('systemSettings', JSON.stringify(all));
  }, { s: section, p: patch });
  if (bell) await broadcast(page, bell);
}

/** Text der Insel-Kapsel (nur der aktive Inhalt, ohne Exit-Reste). */
export async function islandText(page) {
  return page.evaluate(() => {
    const pill = document.querySelector('#fsc-test-root .island-pill');
    if (!pill) return null;
    const content = [...pill.children].filter(c => (c.getAttribute('style') || '').includes('position: relative'));
    return content.map(c => c.innerText.replace(/\s+/g, ' ').trim()).join(' | ');
  });
}

/** Die Sub-View mit diesem Navbar-Titel (robust gegen Exit-Geister). */
export function viewByTitle(root, title) {
  return root.locator('.ios-view-wrapper').filter({
    has: root.page().locator('.ios-navbar-title', { hasText: title }),
  }).last();
}
