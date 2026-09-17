// v1.1.2431 (Auftrag 16): Lade-Sonde gegen das GEBAUTE Bündel — kein Server,
// kein Dev-Harness. Playwright liefert dist/ von der Platte unter einer
// erfundenen Origin aus, lädt die Karte als Modul-Ressource (wie HA), mountet
// sie mit einem Mock-hass und prüft: Start ohne Chunk-Abruf, Ansicht öffnen
// lädt genau ihren Chunk, ein 404 auf einen Chunk zeigt die Ersatzfläche.
// Aufruf: node scripts/lade-sonde.mjs [dist-Ordner]   (kein Test der Suite)
import { chromium } from 'playwright';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(process.argv[2] || 'dist');
const ORIGIN = 'https://fsc.test';
const out = (k, v) => console.log(k.padEnd(36), typeof v === 'string' ? v : JSON.stringify(v));
const iso = new Date().toISOString();
const entity = (id, name, state = 'on', attributes = {}) => ({ entity_id: id, state, last_changed: iso, last_updated: iso, attributes: { friendly_name: name, ...attributes } });
const hass = {
  states: {
    'light.wohnzimmer': entity('light.wohnzimmer', 'Wohnzimmer Licht'),
    'sensor.strom': entity('sensor.strom', 'Strom', '412', { unit_of_measurement: 'W', device_class: 'power' }),
    'todo.haushalt': entity('todo.haushalt', 'Haushalt', '2'),
  },
  services: {}, language: 'de', locale: { language: 'de' }, areas: {}, devices: {}, entities: {},
  user: { id: 'sonde', name: 'Sonde' },
  callWS: async (m) => (m?.type === 'config/entity_registry/list' ? [] : m?.type === 'config/area_registry/list' ? [] : {}),
  callService: async () => ({}), callApi: async () => ([]),
  connection: { subscribeMessage: async () => () => {}, sendMessagePromise: async () => ({}), subscribeEvents: async () => () => {} },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const abrufe = []; const fehler = []; let kaputt = null;
page.on('pageerror', (e) => fehler.push(String(e.message).slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 100)); });
await page.route(`${ORIGIN}/**`, async (route) => {
  const url = new URL(route.request().url()); const pfad = url.pathname.replace(/^\//, '');
  if (pfad === '' || pfad === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><script type="module" src="/fast-search-card.js"></script></body></html>' });
  abrufe.push(pfad);
  if (kaputt && pfad === kaputt) return route.fulfill({ status: 404, body: 'nicht da' });
  const datei = join(DIST, pfad);
  if (!existsSync(datei)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ contentType: 'text/javascript', body: readFileSync(datei) });
});
await page.goto(`${ORIGIN}/`);
await page.waitForFunction(() => !!window.customElements.get('fast-search-card'), null, { timeout: 15000 });
await page.evaluate((h) => {
  const el = document.createElement('fast-search-card'); el.setConfig({}); document.body.appendChild(el);
  // Mock-hass mit Funktionen (aus dem Sonden-Prozess kommen nur Daten)
  const AREAS = [{ area_id: 'wohnzimmer', name: 'Wohnzimmer' }, { area_id: 'kueche', name: 'Küche' }];
  const REG = [{ entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer', device_id: null }, { entity_id: 'sensor.strom', area_id: 'kueche', device_id: null }, { entity_id: 'todo.haushalt', area_id: 'kueche', device_id: null }];
  h.callWS = async (m) => (m?.type === 'config/area_registry/list' ? AREAS : m?.type === 'config/entity_registry/list' ? REG : m?.type === 'todo/item/list' ? { items: [] } : []);
  h.callService = async () => ({}); h.callApi = async () => ([]);
  h.connection = { subscribeMessage: async () => () => {}, sendMessagePromise: async () => ({}), subscribeEvents: async () => () => {} };
  window.__hass = h; el.hass = h; window.__el = el;
}, JSON.parse(JSON.stringify(hass)));
await page.waitForTimeout(3000);
const start = await page.evaluate(() => { const r = window.__el?.shadowRoot; return { main: !!r?.querySelector('.main-container'), zen: !!r?.querySelector('.bento-zen, .search-input') }; });
out('Karte gemountet (Shadow)', start);
out('Abrufe beim Start', abrufe.slice());
const chunksAlle = readdirSync(DIST).filter((f) => /-[A-Za-z0-9_-]+\.js$/.test(f) && f !== 'fast-search-card.js');
out('Chunks in dist/', chunksAlle.length);
// Ansicht öffnen: Suche „Aufgaben“ → Karte klicken
const vor = abrufe.length;
const geoeffnet = await page.evaluate(async () => {
  const r = window.__el.shadowRoot; const zen = r.querySelector('.bento-zen');
  if (zen) { zen.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true })); await new Promise((f) => setTimeout(f, 1500)); }
  const input = r.querySelector('input.search-input'); if (!input) return 'kein Suchfeld';
  input.focus(); input.value = 'Aufgaben'; input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((f) => setTimeout(f, 1200));
  // Zweiter hass-Push (wie HA: neue Objektidentität), dann erst suchen.
  window.__el.hass = { ...window.__hass, states: { ...window.__hass.states } }; await new Promise((f) => setTimeout(f, 1500));
  input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((f) => setTimeout(f, 300));
  input.value = 'Aufgaben'; input.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((f) => setTimeout(f, 1500));
  const namen = [...r.querySelectorAll('.device-name')].map((n) => n.textContent.trim());
  const sidebar = [...r.querySelectorAll('button.vpm-item')].map((b) => b.getAttribute('aria-label'));
  const card = [...r.querySelectorAll('.device-name')].find((n) => /Aufgaben/.test(n.textContent));
  if (!card) { const sb = [...r.querySelectorAll('button.vpm-item')].find((b) => /Aufgaben|To-do/i.test(b.getAttribute('aria-label') || '')); if (sb) { sb.click(); await new Promise((f) => setTimeout(f, 2500)); return { weg: 'sidebar', detail: !!r.querySelector('.detail-panel'), sidebar, namen: namen.slice(0, 6) }; } return { fehler: 'keine Karte', sidebar, namen: namen.slice(0, 6) }; }
  card.click(); await new Promise((f) => setTimeout(f, 2500));
  return r.querySelector('.detail-panel') ? 'Detail offen' : 'kein Detail';
});
out('Aufgaben öffnen', geoeffnet);
out('Neue Abrufe dabei', abrufe.slice(vor));
// Gerätedetail (eigener Chunk seit v1.1.2432): Suche „Licht“, erste Karte, .detail-panel
const vorDetail = abrufe.length;
const detail = await page.evaluate(async () => {
  const r = window.__el.shadowRoot; const zurueck = r.querySelector('.detail-panel button');
  if (zurueck) { zurueck.click(); await new Promise((f) => setTimeout(f, 1200)); }
  const input = r.querySelector('input.search-input'); input.focus(); input.value = 'Licht'; input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((f) => setTimeout(f, 1500));
  const card = [...r.querySelectorAll('.device-name')].find((n) => /Licht/i.test(n.textContent)); if (!card) return { fehler: 'keine Karte', namen: [...r.querySelectorAll('.device-name')].map((n) => n.textContent.trim()).slice(0, 5) };
  card.click(); await new Promise((f) => setTimeout(f, 3000));
  return { detail: !!r.querySelector('.detail-panel'), reiter: r.querySelectorAll('.detail-panel [role="tab"]').length };
});
out('Gerätedetail öffnen', detail);
out('Neue Abrufe dabei', abrufe.slice(vorDetail).filter((p) => p !== 'fast-search-card.js'));
out('pageerror', fehler.length ? fehler : 0);
// 404-Fall: neue Seite, ein Chunk kaputt (der der Aufgaben, sonst der erste)
const zielChunk = chunksAlle.find((f) => /^TodosView-/.test(f)) || chunksAlle[0];
if (zielChunk) {
  kaputt = zielChunk; abrufe.length = 0; fehler.length = 0;
  const p2 = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  p2.on('pageerror', (e) => fehler.push(String(e.message).slice(0, 120)));
  await p2.route(`${ORIGIN}/**`, async (route) => {
    const pfad = new URL(route.request().url()).pathname.replace(/^\//, '');
    if (pfad === '' ) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><script type="module" src="/fast-search-card.js"></script></body></html>' });
    if (pfad === kaputt) return route.fulfill({ status: 404, body: '' });
    const datei = join(DIST, pfad); if (!existsSync(datei)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ contentType: 'text/javascript', body: readFileSync(datei) });
  });
  await p2.goto(`${ORIGIN}/`); await p2.waitForFunction(() => !!window.customElements.get('fast-search-card'), null, { timeout: 15000 });
  await p2.evaluate((h) => { const el = document.createElement('fast-search-card'); el.setConfig({}); document.body.appendChild(el); const AREAS = [{ area_id: 'wohnzimmer', name: 'Wohnzimmer' }, { area_id: 'kueche', name: 'Küche' }]; const REG = [{ entity_id: 'light.wohnzimmer', area_id: 'wohnzimmer', device_id: null }, { entity_id: 'todo.haushalt', area_id: 'kueche', device_id: null }]; h.callWS = async (m) => (m?.type === 'config/area_registry/list' ? AREAS : m?.type === 'config/entity_registry/list' ? REG : m?.type === 'todo/item/list' ? { items: [] } : []); h.callService = async () => ({}); h.connection = { subscribeMessage: async () => () => {}, sendMessagePromise: async () => ({}), subscribeEvents: async () => () => {} }; el.hass = h; window.__el = el; }, JSON.parse(JSON.stringify(hass)));
  await p2.waitForTimeout(3000);
  const ergebnis = await p2.evaluate(async () => {
    const r = window.__el.shadowRoot; const zen = r.querySelector('.bento-zen');
    if (zen) { zen.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true })); await new Promise((f) => setTimeout(f, 1500)); }
    const input = r.querySelector('input.search-input'); input.focus(); input.value = 'Aufgaben'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((f) => setTimeout(f, 1200));
    const sb = [...r.querySelectorAll('button.vpm-item')].find((b) => /Aufgaben|To-do/i.test(b.getAttribute('aria-label') || ''));
    const card = sb || [...r.querySelectorAll('.device-name')].find((n) => /Aufgaben/.test(n.textContent)); if (!card) return 'keine Karte';
    card.click(); await new Promise((f) => setTimeout(f, 3000));
    const txt = (r.querySelector('.detail-panel')?.textContent || '').replace(/\s+/g, ' ');
    return { detail: !!r.querySelector('.detail-panel'), ersatz: /nicht geladen|could not|Erneut|Retry|Fehler|Error/i.test(txt), auszug: txt.slice(0, 120) };
  });
  out(`404 auf ${zielChunk}`, ergebnis);
  out('pageerror im 404-Fall', fehler.length ? fehler : 0);
  await p2.close();
}
await browser.close();
