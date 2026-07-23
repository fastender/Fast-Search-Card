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
export async function mountCard(page, { hass = {}, settings = {}, lang = 'de', storage = {} } = {}) {
  // 🔑 Storage VOR dem Laden der Seite setzen — mit addInitScript, nicht mit
  // evaluate(). Die Karte hat Modul-Level-Stores (watchStore, notificationState,
  // langStore), die localStorage beim IMPORT lesen; der passiert schon während
  // `goto`. Wer erst danach schreibt, ändert für sie nichts mehr — genau daran
  // ist der erste Watch-Test gescheitert.
  //
  // Die Sprache gehört aus demselben Grund hierher: ohne festen Wert entscheidet
  // ein Rennen zwischen langStore-Default und hass, ob die Karte deutsch oder
  // englisch rendert — und Tests, die deutsche Labels suchen, scheitern dann
  // sporadisch.
  await page.addInitScript(({ settingsPatch, language, storagePatch }) => {
    try {
      localStorage.clear();
      localStorage.setItem('userLanguage', language);
      if (settingsPatch && Object.keys(settingsPatch).length) {
        localStorage.setItem('systemSettings', JSON.stringify(settingsPatch));
      }
      for (const [k, v] of Object.entries(storagePatch || {})) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    } catch (_) { /* erster Aufruf kann vor der Origin liegen */ }
  }, { settingsPatch: settings, language: lang, storagePatch: storage });

  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.FastSearchCardApp, null, { timeout: 20000 });

  await page.evaluate(({ hassPatch, language }) => {
    window.__serviceCalls = [];
    window.__mkConnection = () => ({
      subscribeMessage: () => Promise.resolve(() => {}),
      subscribeEvents: () => Promise.resolve(() => {}),
      sendMessagePromise: () => Promise.resolve([]),
    });
    const AREAS = [
      { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
      { area_id: 'kueche', name: 'Küche' },
      { area_id: 'garten', name: 'Garten' },
    ];
    const ENTITY_REG = [
      { entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer', device_id: null },
      { entity_id: 'light.kueche', area_id: 'kueche', device_id: null },
      { entity_id: 'switch.terrasse', area_id: 'garten', device_id: null },
      { entity_id: 'sensor.bad_hum', area_id: 'kueche', device_id: null },
      { entity_id: 'timer.pizza', area_id: 'kueche', device_id: null },
      { entity_id: 'binary_sensor.fenster', area_id: 'wohnzimmer', device_id: null },
      { entity_id: 'media_player.wohnzimmer', area_id: 'wohnzimmer', device_id: null },
      { entity_id: 'climate.heizung', area_id: 'wohnzimmer', device_id: null },
      { entity_id: 'cover.rolladen', area_id: 'wohnzimmer', device_id: null },
    ];
    const iso = new Date().toISOString();
    const entity = (entity_id, friendly_name, state = 'on', attributes = {}) => ({
      entity_id, state, last_changed: iso, last_updated: iso,
      attributes: { friendly_name, ...attributes },
    });
    const base = {
      states: {
        'light.wohnzimmer': entity('light.wohnzimmer', 'Wohnzimmer Licht', 'on', { brightness: 180 }),
        'light.kueche': entity('light.kueche', 'Küche Licht', 'off'),
        'switch.terrasse': entity('switch.terrasse', 'Terrasse Steckdose'),
        'weather.home': entity('weather.home', 'Wetter', 'sunny', { temperature: 21 }),
        // 🔑 PAUSIERT, nicht spielend: ein spielender Lautsprecher ist eine
        // Live-Aktivität und verdrängt das Ruhegesicht der Insel. Das Grundhaus
        // muss still sein — wer „spielt" braucht, setzt es im Test selbst.
        'media_player.wohnzimmer': entity('media_player.wohnzimmer', 'Wohnzimmer Box', 'paused', {
          media_title: 'Testlied', media_artist: 'Testband', volume_level: 0.4,
          supported_features: 84381,
        }),
        'climate.heizung': entity('climate.heizung', 'Heizung', 'heat', {
          current_temperature: 20.5, temperature: 22, hvac_modes: ['off', 'heat'],
        }),
        'cover.rolladen': entity('cover.rolladen', 'Rolladen', 'open', { current_position: 70 }),
        // Messwert-Gerät: Grundlage für Schwellwert-Wächter und Verlaufs-Diagramme.
        'sensor.bad_hum': entity('sensor.bad_hum', 'Luftfeuchte', '50', {
          unit_of_measurement: '%', device_class: 'humidity', state_class: 'measurement',
        }),
      },
      services: { tts: { google_translate_say: {} } },
      language: 'de', locale: { language: 'de' },
      areas: {
        wohnzimmer: { area_id: 'wohnzimmer', name: 'Wohnzimmer' },
        kueche: { area_id: 'kueche', name: 'Küche' },
        garten: { area_id: 'garten', name: 'Garten' },
      },
      devices: {}, entities: {},
      user: { id: 'test-user', name: 'Tester' },
      // Dienstaufrufe mitschreiben: nur so lässt sich prüfen, dass ein Tipper
      // auf einen Schalter wirklich bei Home Assistant ankommt — die Karte
      // aktualisiert die Anzeige nicht optimistisch, sondern wartet auf HA.
      callService: (domain, service, data) => {
        window.__serviceCalls.push({ domain, service, data });
        return Promise.resolve();
      },
      // 🔑 Die Registry-Antworten sind NICHT optional. Der Ladelauf behält nur
      // Entities MIT Bereich (`entity.area != null`) — antwortet callWS überall
      // mit [], hat das Testhaus überhaupt keine Geräte und alles, was hinter
      // der Suche liegt (Detail-Ansicht, Karten, Steuerung), ist untestbar.
      callWS: ({ type } = {}) => {
        if (type === 'config/area_registry/list') return Promise.resolve(AREAS);
        if (type === 'config/entity_registry/list') return Promise.resolve(ENTITY_REG);
        return Promise.resolve([]);   // device_registry: Zuordnung läuft hier direkt über die Entity-Registry
      },
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
  }, { hassPatch: hass, language: lang });

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

/** Alle bisher an Home Assistant geschickten Dienstaufrufe. */
export function serviceCalls(page) {
  return page.evaluate(() => window.__serviceCalls || []);
}

/** Protokoll der Dienstaufrufe leeren (z. B. nach dem Öffnen einer Ansicht). */
export function clearServiceCalls(page) {
  return page.evaluate(() => { window.__serviceCalls = []; });
}

/**
 * Öffnet die Detail-Ansicht eines Geräts über die Suche.
 * @returns {Promise<import('@playwright/test').Locator>} die Detail-Tafel
 */
export async function openDevice(root, page, query, name) {
  const input = root.locator('input.search-input');
  await input.click();
  await input.fill(query);
  const card = name
    ? root.locator('.device-name', { hasText: name }).first()
    : root.locator('.device-name').first();
  await card.waitFor({ timeout: 15000 });
  await card.click();
  const panel = root.locator('.detail-panel').first();
  await panel.waitFor({ timeout: 15000 });
  return panel;
}
