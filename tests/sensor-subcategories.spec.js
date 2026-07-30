// tests/sensor-subcategories.spec.js
//
// Der Fehler, der hier festgenagelt wird: Der Chip „Luftqualität" lieferte
// IMMER eine leere Liste.
//
// Warum: Es gibt zwei Listen von Sensor-Kategorien, die zusammenpassen müssen.
// `getSensorCategory()` (translations/helpers.js) VERGIBT die Kategorie, und
// `knownSensorCategories` (SearchField/utils/searchFilters.js) entscheidet, ob
// die gewählte Unterkategorie überhaupt als Sensor-Kategorie GILT. Fehlt eine
// dort, hält der Filter sie für einen RAUMNAMEN und prüft `device.area ===
// 'air_quality'` — das ist nie wahr. Also: Chip da, Chip klickbar, Liste leer.
// Kein Fehler in der Konsole, nichts kaputt, nur nichts zu sehen.
//
// Deshalb prüft der erste Test nicht „ist air_quality dabei", sondern die
// ZUSAGE dahinter: JEDE Kategorie, die getSensorCategory je vergibt, muss durch
// den Filter kommen. Die Liste der Kategorien wird dafür aus dem echten Modul
// abgeleitet, nicht abgeschrieben — eine neue Kategorie in helpers.js lässt
// diesen Test scheitern, solange searchFilters.js sie nicht kennt. Genau das
// hätte den Fehler von Anfang an verhindert.
//
// Der zweite Test macht dieselbe Zusage am laufenden Bild: Testhaus mit je
// einem Sensor pro Kategorie möblieren, jeden Chip antippen, Liste zählen.

import { test, expect } from '@playwright/test';
import { mountCard, revealIfLocked } from './harness/card.js';

/** Ein Sensor je Kategorie-Zweig von getSensorCategory(). Die entity_ids sind
    bewusst deutsch: getSensorCategory rät sonst über den Namen mit
    (`entityId.includes('temperature')`) und ein „battery" im Namen würde eine
    Kategorie vergeben, die der device_class widerspricht. */
const SENSORS = {
  'sensor.wz_temp':        ['Temperatur',   '21',   { device_class: 'temperature', unit_of_measurement: '°C' }],
  'sensor.wz_feuchte':     ['Feuchte',      '48',   { device_class: 'humidity', unit_of_measurement: '%' }],
  'sensor.wz_hell':        ['Helligkeit',   '300',  { device_class: 'illuminance', unit_of_measurement: 'lx' }],
  'sensor.wz_akku':        ['Akku',         '80',   { device_class: 'battery', unit_of_measurement: '%' }],
  'sensor.wz_strom':       ['Verbrauch',    '120',  { device_class: 'power', unit_of_measurement: 'W' }],
  'sensor.wz_druck':       ['Luftdruck',    '1013', { device_class: 'pressure', unit_of_measurement: 'hPa' }],
  'sensor.wz_luft':        ['Luftgüte',     '7',    { device_class: 'pm25', unit_of_measurement: 'µg/m³' }],
  'sensor.wz_sonst':       ['Sonstiges',    '3',    {}],
  'binary_sensor.wz_bew':  ['Bewegung',     'off',  { device_class: 'motion' }],
  'binary_sensor.wz_fen':  ['Fenster',      'off',  { device_class: 'window' }],
  'binary_sensor.wz_anw':  ['Anwesenheit',  'on',   { device_class: 'presence' }],
  'binary_sensor.wz_rauch':['Rauch',        'off',  { device_class: 'smoke' }],
  'binary_sensor.wz_leck': ['Leck',         'off',  { device_class: 'moisture' }],
};

const AREA_ID = 'wohnzimmer';
const AREA_NAME = 'Wohnzimmer';

function testHouse() {
  const states = {};
  const registry = [];
  const iso = new Date().toISOString();
  for (const [id, [name, state, attrs]] of Object.entries(SENSORS)) {
    states[id] = {
      entity_id: id, state, last_changed: iso, last_updated: iso,
      attributes: { friendly_name: name, ...attrs },
    };
    // 🔑 Ohne Registry-Eintrag hat die Entity keinen Bereich und der Ladelauf
    // wirft sie weg (entitiesLoader.js Z. 133) — sie wäre schlicht nicht da.
    registry.push({ entity_id: id, area_id: AREA_ID, device_id: null });
  }
  return { states, registry };
}

test.describe('Sensor-Unterkategorien', () => {
  test('jede Kategorie, die getSensorCategory vergibt, kommt durch den Filter', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async (sensorSpec) => {
      const { getSensorCategory } = await import('/src/utils/translations/helpers.js');
      const { filterDevices } = await import('/src/components/SearchField/utils/searchFilters.js');

      // Geräte in der Form, in der der Filter sie sieht.
      const devices = Object.entries(sensorSpec).map(([entity_id, [friendly_name, state, attributes]]) => ({
        entity_id,
        domain: entity_id.split('.')[0],
        state,
        attributes: { friendly_name, ...attributes },
        area: 'Wohnzimmer',
      }));

      // Die Kategorien werden ABGELEITET, nicht abgeschrieben: was das echte
      // Modul vergibt, ist die Wahrheit, gegen die der Filter antreten muss.
      const categories = [...new Set(devices.map(getSensorCategory).filter(Boolean))];

      const perCategory = {};
      for (const cat of categories) {
        const hits = filterDevices({
          searchValue: '',
          fuzzyResults: [],
          devices,
          activeCategory: 'sensors',
          selectedSubcategory: cat,
          favorites: [],
          predictiveSuggestions: [],
        });
        perCategory[cat] = hits.map(d => d.entity_id);
      }
      return { categories, perCategory };
    }, SENSORS);

    // Alle 13 Zweige sind wirklich abgedeckt — sonst prüft der Test zu wenig.
    expect(result.categories.sort()).toEqual([
      'air_quality', 'battery', 'door_window', 'energy', 'humidity', 'light',
      'motion', 'other_sensors', 'presence', 'pressure', 'security',
      'temperature', 'water',
    ]);

    // Die eigentliche Zusage: keine Kategorie läuft ins Leere.
    const leer = result.categories.filter(c => result.perCategory[c].length === 0);
    expect(leer, `Diese Unterkategorien liefern eine leere Liste: ${leer.join(', ')}`).toEqual([]);

    // Und sie trifft jeweils genau den passenden Sensor, nicht irgendeinen.
    for (const cat of result.categories) {
      expect(result.perCategory[cat].length, `Kategorie ${cat}`).toBe(1);
    }
  });

  test('am laufenden Bild: jeder Sensor-Chip zeigt Geräte', async ({ page }) => {
    const { states, registry } = testHouse();
    const root = await mountCard(page, {
      hass: { states },
      registry,
      settings: { startScreen: { bento: true }, appearance: { statsBarEnabled: true } },
    });

    // Die Suchzeile liegt hinter EINER Bewegung — ohne Aufdecken fängt der
    // Vorhang jeden Klick ab und der Test liefe in einen Timeout statt in
    // einen Fehlschlag.
    await revealIfLocked(page, root);

    // Über das Kategorie-Symbol (Chevron) in die Kategorie-Auswahl, dort auf
    // „Sensoren" — derselbe Weg, den auch ein Mensch nimmt.
    await root.locator('.category-icon').click();
    const sensorsButton = root.locator('.category-button[title="Sensors"]');
    await sensorsButton.waitFor({ timeout: 15000 });
    await sensorsButton.click();

    // Auf Inhalt warten, nicht auf Zeit: die Chips entstehen erst, wenn die
    // Sensoren geladen und einsortiert sind.
    await expect.poll(
      () => root.locator('.subcategory-chip').count(),
      { timeout: 20000 },
    ).toBeGreaterThan(5);

    const chips = await root.locator('.subcategory-chip').evaluateAll(
      (els) => els.map(e => e.getAttribute('data-subcategory')).filter(Boolean),
    );

    // 'favorites' und 'suggestions' dürfen leer sein — im Testhaus ist nichts
    // als Favorit markiert und es gibt keine Nutzungshistorie. Alles andere
    // (Kategorien UND der Raum-Chip) muss etwas zeigen.
    const zuPruefen = chips.filter(c => !['favorites', 'suggestions'].includes(c));
    expect(zuPruefen).toContain('air_quality');

    const leer = [];
    for (const chip of zuPruefen) {
      await root.locator(`.subcategory-chip[data-subcategory="${chip}"]`).click();
      // Nur die Treffer im Suchpanel zählen — die Kacheln der Startseite
      // tragen dieselbe Klasse und würden jede Liste als „voll" ausweisen.
      const treffer = root.locator('.results-container .device-card');
      let count = 0;
      try {
        await expect.poll(() => treffer.count(), { timeout: 7000 }).toBeGreaterThan(0);
        count = await treffer.count();
      } catch (_) {
        count = await treffer.count();
      }
      if (count === 0) leer.push(chip);
    }

    expect(leer, `Diese Chips zeigen eine leere Liste: ${leer.join(', ')}`).toEqual([]);
  });
});
