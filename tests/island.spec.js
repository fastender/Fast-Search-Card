// tests/island.spec.js
//
// v1.1.2191: Die Insel (v2170–2181) — Zustandswahl mit dem größten
// Regressionsrisiko. v1.1.2239: Redesign zum ZWEIZEILER (helle macOS-Karte):
// Zeile 1 = Dauerwerte (Wetter · Leistung · Fakten-Roll) + Eck-Knöpfe mit
// Zähler-Kugeln (ℹ ⚠ ❗ ▦), Zeile 2 = Roll-Ticker der Live-Aktivitäten
// (in Ruhe: der Haus-Fakten). Nichts verdrängt mehr etwas — die Übernahme
// (neue Meldung, 6 s Zeitring) ist der einzige Gast in Zeile 2.
//
// Geprüft wird die BEOBACHTBARE Zusage: welcher Inhalt erscheint in welcher
// Situation. Bewusst NICHT geprüft: Animationsdetails (spröde).

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, broadcast, islandText } from './harness/card.js';

// Die Insel erscheint nur, wenn Suche offen ODER Bento aktiv ODER Detail offen.
const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

// 🔑 v1.1.2252: ZEITRAFFER. Die Insel liest ihre Takte aus
// `startScreen.islandTiming` (ohne UI). Vorher musste die Suite die ECHTEN
// Design-Zeiten abwarten — ein Test verbrannte 26 s beim Zusehen, wie der
// 4-s-Roll durch fünf Kategorien wandert, ein anderer 17 s für Boot-Gnade
// plus Übernahme. Mit gestauchten Werten prüfen sie dieselbe Zusage in
// Sekunden. Die REIHENFOLGE der Ereignisse bleibt unberührt — nur der
// Maßstab ändert sich.
const SCHNELL = { rollMs: 350, takeoverMs: 700, bootGraceMs: 600 };
const zeitraffer = (settings = BENTO_ON, timing = SCHNELL) => ({
  ...settings,
  startScreen: { ...settings.startScreen, islandTiming: timing },
});

/**
 * v1.1.2239: Aufklappen geschieht über den ▦-Knopf (Laufendes) — der Kopf
 * führt ins Mitteilungen-Center, die Ticker-Zeile zu ihrem Gerät.
 */
async function expandIsland(root) {
  await root.locator('.island-knopf[data-knopf="kacheln"]').click();
}

/** Zwei laufende Aktivitäten setzen (Voraussetzung fürs Aufklappen). */
async function seedTwoLive(page) {
  await updateHass(page, (states, entity) => {
    states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
      duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
    });
    states['media_player.wohnzimmer'] = entity('media_player.wohnzimmer', 'Box', 'playing', {
      media_title: 'Lied', volume_level: 0.4, supported_features: 84381,
    });
  });
}

test.describe('Insel', () => {
  test('die helle Karte trägt zwei Zeilen und dunkle Tinte', async ({ page }) => {
    // v1.1.2239 (Mockup-Entscheid): macOS-Karte — heller Frost, dunkle
    // Schrift, Radius 24. Der Aufbau ist ZWEIZEILIG: beide Zeilen stehen im
    // DOM und übereinander (nicht nebeneinander).
    const root = await mountCard(page, { settings: BENTO_ON });
    const pill = root.locator('.island-pill');
    await expect(pill).toBeVisible();

    const stil = await pill.evaluate((el) => {
      const z1 = el.querySelector('.island-zeile1').getBoundingClientRect();
      const z2 = el.querySelector('.island-zeile2').getBoundingClientRect();
      return {
        tinte: getComputedStyle(el).color,
        radius: getComputedStyle(el).borderRadius,
        zweizeilig: Math.round(z2.top) >= Math.round(z1.bottom),
      };
    });
    expect(stil.tinte).toBe('rgb(29, 29, 31)');
    expect(stil.radius).toBe('24px');
    expect(stil.zweizeilig).toBe(true);
  });

  test('Ruhegesicht zeigt Dauerwerte und eine gezählte Haus-Tatsache', async ({ page }) => {
    // Zeile 1: die Dauerwerte — im Testhaus der 1234-W-Sensor als „1,2 kW".
    // Zeile 2 rollt in Ruhe die Haus-Fakten (5 Kategorien im Testhaus,
    // 4-s-Takt) — ein voller Zyklus dauert 20 s.
    await mountCard(page, { settings: zeitraffer() });
    await expect.poll(() => islandText(page)).toContain('1,2 kW');
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('1 Licht an');
  });

  test('der Roll zeigt die Aktiv-Zahlen der Kategorieleiste', async ({ page }) => {
    // v1.1.2212: der Roll zählt aus der KURATIERTEN Geräteliste mit den
    // Leisten-Regeln — vorher zählte er rohe States („9 lights on" vs.
    // „Lights 6" in der Leiste).
    await mountCard(page, { settings: zeitraffer() });
    await updateHass(page, (states, entity) => {
      states['light.kueche'] = entity('light.kueche', 'Küche Licht', 'on');
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('2 Lichter an');
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('1 Schalter an');
  });

  test('ein Timer läuft im Ticker und verdrängt die Dauerwerte NICHT', async ({ page }) => {
    // v1.1.2239: nichts verdrängt mehr etwas — der Timer zieht in Zeile 2 ein,
    // Zeile 1 behält Wetter und Leistung.
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00',
        finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Pizza');
    expect(await islandText(page)).toContain('1,2 kW');

    // Der 1-Sekunden-Treiber (v2180) muss den Countdown wirklich bewegen.
    const before = await islandText(page);
    await expect.poll(() => islandText(page), { timeout: 8000 }).not.toBe(before);
  });

  test('eine neue Meldung übernimmt kurz und kondensiert in ihren Knopf', async ({ page }) => {
    // v1.1.2209 (C1): eine NEUE Meldung übernimmt Zeile 2 für ~6 s (Zeitring)
    // und kondensiert dann in den Eck-Knopf ihrer Stufe; der Ticker kehrt
    // zurück.
    const root = await mountCard(page, { settings: zeitraffer() });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    // Boot-Gnade verstreichen lassen: Bestand beim Seitenaufbau kündigt sich
    // bewusst NICHT an — nur wirklich Neues übernimmt. (Zeitraffer: 600 ms.)
    await page.waitForTimeout(900);
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity(
        'persistent_notification.p1', 'Meldung', 'notifying',
        { title: 'Waschmaschine fertig', message: 'Programm beendet' }
      );
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Waschmaschine fertig');
    // … und nach der Übernahme: Pizza zurück, die Meldung zählt im ℹ-Knopf.
    await expect.poll(() => islandText(page), { timeout: 12000 }).toContain('Pizza');
    await expect(root.locator('.island-knopf[data-knopf="info"] .island-eck')).toHaveText('1');
  });

  test('die Eck-Knöpfe zählen je Stufe — und fehlen bei Zähler 0', async ({ page }) => {
    // v1.1.2239 (Mockup-Entscheid): DREI Meldungs-Knöpfe (ℹ ⚠ ❗) statt eines
    // Sammel-Chips; ein Knopf, dessen Zähler auf 0 steht, erscheint nicht.
    const root = await mountCard(page, { settings: BENTO_ON });
    await expect(root.locator('.island-pill')).toBeVisible();

    // Testhaus ohne Meldungen → keine Meldungs-Knöpfe, kein ▦ (nichts läuft).
    await expect(root.locator('.island-knopf')).toHaveCount(0);

    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M1', 'notifying',
        { title: 'Waschmaschine fertig', message: 'x' });
      states['alert.fenster'] = entity('alert.fenster', 'Fenster offen', 'on');
    });
    // persistent_notification → Info (blau), alert.* → Warnung (amber).
    await expect(root.locator('.island-knopf[data-knopf="info"] .island-eck')).toHaveText('1', { timeout: 8000 });
    await expect(root.locator('.island-knopf[data-knopf="warn"] .island-eck')).toHaveText('1');
    await expect(root.locator('.island-knopf[data-knopf="danger"]')).toHaveCount(0);
  });

  test('Master-Toggle hängt die Insel aus und wieder ein', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await expect(root.locator('.island-pill')).toBeVisible();

    // v2180: bedingtes Mounten — die Kapsel darf nicht nur unsichtbar sein.
    await broadcast(page, 'statsBarEnabledChanged', false);
    await expect(root.locator('.island-pill')).toHaveCount(0);
    // Der Platzhalter bleibt, damit das Bento-Layout nicht springt.
    await expect(root.locator('.statsbar-bento-wrapper')).toHaveCount(1);

    await broadcast(page, 'statsBarEnabledChanged', true);
    await expect(root.locator('.island-pill')).toBeVisible();
  });

  test('Meldungs-Knopf und freie Fläche öffnen das Mitteilungen-Center', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M', 'notifying',
        { title: 'Testmeldung', message: 'x' });
    });
    await expect(root.locator('.island-knopf[data-knopf="info"]')).toHaveCount(1, { timeout: 8000 });

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-notifications', () => window.__opened.push('notifications'));
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push('entity:' + e.detail.entityId));
    });
    await root.locator('.island-knopf[data-knopf="info"]').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['notifications']);
  });

  test('Tippen auf die Ticker-Aktivität öffnet deren Gerät', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Pizza');

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    // 🔑 hasText-Filter: während des Roll-Übergangs stehen alter und neuer
    // Eintrag ~0,5 s BEIDE im DOM (AnimatePresence-Exit) — der nackte
    // Selektor lief dann in die strict-mode-Verletzung.
    await root.locator('.island-zeile2 [role="button"]', { hasText: 'Pizza' }).click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('der ▦-Knopf klappt die Liste in DERSELBEN Form auf', async ({ page }) => {
    // v1.1.2204: Die Liste ist kein zweites Panel, sondern Teil derselben
    // Form. v1.1.2239: geöffnet wird sie über den ▦-Knopf; die Karte behält
    // dabei ihren 24er-Radius (kein Kapsel-Morph mehr nötig).
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    const pill = root.locator('.island-pill');
    const zuHoehe = await pill.evaluate(el => el.offsetHeight);
    await expect(pill).toHaveAttribute('data-expanded', 'false');

    await expandIsland(root);

    await expect(pill).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    // Die Zeilen sind Kinder DER KARTE, nicht eines Nachbarn.
    await expect(pill.locator('.island-row')).toHaveCount(2);
    // Höhe wächst über die grid-rows-Animation (460 ms) — darauf pollen, nicht
    // einmal mitten im Aufklappen messen.
    await expect.poll(() => pill.evaluate(el => el.offsetHeight), { timeout: 5000 })
      .toBeGreaterThan(zuHoehe);
    // Der ▦-Knopf schließt sie auch wieder.
    await expandIsland(root);
    await expect(pill).toHaveAttribute('data-expanded', 'false', { timeout: 5000 });
  });

  test('eine Zeile öffnet ihr Gerät und die Insel geht zurück in Ruhe', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');
    await expandIsland(root);
    await expect(root.locator('.island-row').first()).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.island-row', { hasText: 'Pizza' }).first().click();

    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
    // Und klappt danach zu: der Nutzer verlässt die Insel, sie kehrt in ihren
    // Ruhezustand zurück.
    await expect(root.locator('.island-pill')).toHaveAttribute('data-expanded', 'false', { timeout: 5000 });
  });

  test('bleibt bei offener Detail-View bedienbar', async ({ page }) => {
    // v1.1.2207 (Tablet-Report): Mit offener Detail-View war die Insel tot —
    // ein pointer-events-Riegel aus v2206 hatte sie zum Passagier erklärt.
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    // Detail-View öffnen (fremd, nicht über die Insel).
    await page.evaluate(() => window.dispatchEvent(
      new CustomEvent('fsc-open-entity', { detail: { entityId: 'media_player.wohnzimmer' } })));
    await root.locator('.detail-panel').first().waitFor({ timeout: 15000 });

    await expandIsland(root);
    await expect(root.locator('.island-pill')).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    await expect(root.locator('.island-row').first()).toBeVisible();

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.island-row', { hasText: 'Pizza' }).first().click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('ohne Kaskade öffnet die freie Fläche das Center', async ({ page }) => {
    // Der Harness fährt mit abgeschalteter Standby-Kaskade — dann behält die
    // freie Fläche ihre Center-Bedeutung (sonst faltet sie, s. Kaskaden-Suite).
    const root = await mountCard(page, { settings: BENTO_ON });
    await expect(root.locator('.island-pill')).toBeVisible();
    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-notifications', () => window.__opened.push('notifications'));
    });
    // Rechts neben den Werten ist die Zeile frei (keine Meldungen → keine
    // Knöpfe); Locator-Klick mit relativer Position — er wartet auf
    // Element-Stabilität (roher Mausklick verfehlte je nach Boot-Reveal).
    const kopf = root.locator('.island-head');
    const kopfBox = await kopf.boundingBox();
    await kopf.click({ position: { x: kopfBox.width - 30, y: 13 } });
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['notifications']);
  });

  test('gewählte Dauerwert-Quellen übersteuern die Automatik', async ({ page }) => {
    // v1.1.2243: islandSources — der Energie-Picker schlägt die Heuristik
    // (Testhaus-Sensor 1234 W wäre sonst der stärkste), das Wetter kommt ROH
    // aus hass.states (Entity OHNE Registry-Raum — die Kuratierung würde sie
    // wegfiltern, genau dafür ist die Roh-Auflösung da).
    await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: {
          ...BENTO_ON.startScreen,
          islandSources: { weatherId: 'weather.test', powerId: 'sensor.steckdose' },
        },
      },
    });
    await updateHass(page, (states, entity) => {
      states['sensor.steckdose'] = entity('sensor.steckdose', 'Steckdose', '300',
        { device_class: 'power', unit_of_measurement: 'W' });
      states['weather.test'] = entity('weather.test', 'Testwetter', 'sunny', { temperature: 21 });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('300 W');
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('21°');
    expect(await islandText(page)).not.toContain('1,2 kW');
  });

  test('die Energie-Vorzugswahl ist pur und fällt still zurück', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const mod = await import('/src/utils/islandState.js');
      const states = {
        'sensor.haus': { state: '2000', attributes: { device_class: 'power', unit_of_measurement: 'W' } },
        'sensor.klein': { state: '1.5', attributes: { device_class: 'power', unit_of_measurement: 'kW' } },
      };
      return {
        auto: mod.pickPowerInfo(states, 'de'),
        gewaehlt: mod.pickPowerInfo(states, 'de', 'sensor.klein'),
        verschwunden: mod.pickPowerInfo(states, 'de', 'sensor.weg'),
      };
    });
    expect(r.auto.entity_id).toBe('sensor.haus');
    expect(r.gewaehlt).toEqual({ entity_id: 'sensor.klein', text: '1,5 kW' });
    // Gewählte Entity weg → still zurück zur Heuristik.
    expect(r.verschwunden.entity_id).toBe('sensor.haus');
  });

  test('die aufgeklappte Liste trägt Reiter nach Kategorie und filtert danach', async ({ page }) => {
    // v1.1.2248 (Nutzer-Wunsch): Die Liste ist bei vielen laufenden Geräten
    // unübersichtlich — sie bekommt Reiter „Alle · Lichter · Rollos …" mit
    // Zählung, dazu Haarlinie und Kanten-Fade wie in den Kacheln.
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: {
          ...BENTO_ON.startScreen,
          liveActivities: { enabled: true, sources: { timer: true, vacuum: true, cover: true, media_player: true, script: true, automation: true, climate: true, light: true, switch: true } },
        },
      },
    });
    await updateHass(page, (states, entity) => {
      for (let i = 1; i <= 3; i++) {
        states[`light.t${i}`] = entity(`light.t${i}`, `Licht ${i}`, 'on', { brightness: 200 });
      }
      states['media_player.box'] = entity('media_player.box', 'Box', 'playing',
        { media_title: 'Lied', volume_level: 0.4, supported_features: 84381 });
      states['vacuum.robi'] = entity('vacuum.robi', 'Robi', 'cleaning', {});
    });
    await expect(root.locator('.island-knopf[data-knopf="kacheln"]')).toHaveCount(1, { timeout: 10000 });
    await root.locator('.island-knopf[data-knopf="kacheln"]').click();

    const reiter = root.locator('.island-list-reiter-knopf');
    await expect(reiter.first()).toBeVisible({ timeout: 8000 });
    const texte = await reiter.allInnerTexts();
    // 🔑 KEINE absoluten Zahlen: das Testhaus bringt eigene aktive Geräte mit
    // (Licht, Schalter …). Geprüft wird deshalb die innere Stimmigkeit —
    // „Alle" zählt genau so viele Zeilen, wie die Liste zeigt.
    expect(texte[0]).toContain('Alle');
    expect(texte.join('|')).toContain('Lichter');
    const alleZahl = Number((texte[0].match(/(\d+)/) || [])[1]);
    await expect(root.locator('.island-row')).toHaveCount(alleZahl, { timeout: 5000 });

    // Filtern: „Lichter" lässt genau so viele Zeilen stehen, wie sein Badge sagt.
    const lichterText = texte.find((t) => t.includes('Lichter'));
    const lichterZahl = Number((lichterText.match(/(\d+)/) || [])[1]);
    expect(lichterZahl).toBeGreaterThanOrEqual(3);   // unsere drei sind dabei
    await reiter.filter({ hasText: 'Lichter' }).first().click();
    await expect(root.locator('.island-row')).toHaveCount(lichterZahl, { timeout: 5000 });
    await reiter.first().click();
    await expect(root.locator('.island-row')).toHaveCount(alleZahl, { timeout: 5000 });

    // Linie + Fade wie bei Widget 2: 1 px, 8 px Luft, 24er-Maske.
    const aufbau = await root.locator('.island-list-flaeche').evaluate((el) => {
      const cs = getComputedStyle(el);
      const liste = el.querySelector('.island-list');
      return {
        linie: cs.borderTopWidth,
        luft: cs.marginTop,
        maske: (getComputedStyle(liste).maskImage || '').includes('24px'),
      };
    });
    expect(aufbau).toEqual({ linie: '1px', luft: '8px', maske: true });
  });

  test('ausgeschlossene Muster halten Geräte aus der Insel heraus', async ({ page }) => {
    // v1.1.2248 (Nutzer-Report): Die Insel las rohe hass.states und ging an
    // der Ausschlussliste (Einstellungen → Filter) vorbei — dort abgewählte
    // Entities tauchten trotzdem auf.
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: {
          ...BENTO_ON.startScreen,
          liveActivities: { enabled: true, sources: { timer: true, vacuum: true, cover: true, media_player: true, script: true, automation: true, climate: true, light: true, switch: true } },
        },
      },
      storage: { excludedPatterns: ['light.geheim_*', 'vacuum.robi'] },
    });
    await updateHass(page, (states, entity) => {
      states['light.geheim_flur'] = entity('light.geheim_flur', 'Geheim Flur', 'on', { brightness: 200 });
      states['light.sichtbar'] = entity('light.sichtbar', 'Sichtbar', 'on', { brightness: 200 });
      states['vacuum.robi'] = entity('vacuum.robi', 'Robi', 'cleaning', {});
    });
    await expect(root.locator('.island-knopf[data-knopf="kacheln"]')).toHaveCount(1, { timeout: 10000 });
    await root.locator('.island-knopf[data-knopf="kacheln"]').click();
    await expect(root.locator('.island-row').first()).toBeVisible({ timeout: 8000 });

    const namen = (await root.locator('.island-row-name').allInnerTexts()).join('|');
    expect(namen).toContain('Sichtbar');
    expect(namen).not.toContain('Geheim');
    expect(namen).not.toContain('Robi');
  });

  test('Reiter-Aufbau und Muster-Abgleich sind pur', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const sub = await import('/src/utils/subcategoryMap.js');
      const live = await import('/src/utils/liveActivitySources.js');
      const acts = [
        { id: 'a', domain: 'light' }, { id: 'b', domain: 'light' },
        { id: 'c', domain: 'cover' }, { id: 'd', domain: 'timer' },
      ];
      return {
        tabs: sub.getIslandListTabs(acts, 'de').map((t) => `${t.key}:${t.count}`),
        gefiltert: sub.filterActivitiesByTab(acts, 'lights').map((a) => a.id),
        alle: sub.filterActivitiesByTab(acts, 'alle').length,
        // v1.1.2250: Reiter stehen AUCH bei nur einer Kategorie (vorher
        // unterdrückt — beim Nutzer mit 51 Lichtern fehlten sie dadurch ganz).
        einzeln: sub.getIslandListTabs([{ id: 'x', domain: 'light' }], 'de').map((t) => t.key),
        leer: sub.getIslandListTabs([], 'de').length,
        trefferStern: live.matchesAnyPattern('light.geheim_flur', ['light.geheim_*']),
        trefferExakt: live.matchesAnyPattern('vacuum.robi', ['vacuum.robi']),
        keinTreffer: live.matchesAnyPattern('light.wohnzimmer', ['light.geheim_*']),
        // 🔑 Der Punkt ist ein LITERAL, kein Regex-Joker: `light.x` darf nicht
        // auf `lightax` passen und `a.b` nicht auf `axb`.
        punktIstLiteral: live.matchesAnyPattern('lightaflur', ['light.flur']),
      };
    });
    expect(r.tabs).toEqual(['alle:4', 'lights:2', 'covers:1', 'timer:1']);
    expect(r.gefiltert).toEqual(['a', 'b']);
    expect(r.alle).toBe(4);
    expect(r.einzeln).toEqual(['alle', 'lights']);
    expect(r.leer).toBe(0);
    expect(r.trefferStern).toBe(true);
    expect(r.trefferExakt).toBe(true);
    expect(r.keinTreffer).toBe(false);
    expect(r.punktIstLiteral).toBe(false);
  });

  test('die Stufen-Zählung ist pur und zählt Low bewusst nicht', async ({ page }) => {
    // Die Regel selbst ist pur und wird direkt am Modul geprüft (Muster aus
    // dem Hero-Spec) — Low war schon immer nur ein Flüstern und bekommt
    // keinen eigenen Knopf.
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const mod = await import('/src/utils/islandState.js');
      return mod.severityCounts([
        { severity: 1 }, { severity: 2 }, { severity: 2 },
        { severity: 3 }, { severity: 4 },
      ]);
    });
    expect(r).toEqual({ critical: 1, warning: 2, info: 1 });
  });
});

// ── Standby-Kaskade (v1.1.2240, User-Design Mockup v7) ──────────────────────
// Karte → (Klick oder miniMs Leerlauf) → Mini-Pille → (knopfMs) → Meldungs-
// Knopf GANZ RECHTS. Der Harness fährt sonst mit enabled:false — hier wird
// die Kaskade mit kurzen Zeiten ausdrücklich angefordert.
test.describe('Insel — Standby-Kaskade', () => {
  const KASKADE = (miniMs, knopfMs) => ({
    startScreen: { bento: true, islandStandby: { enabled: true, miniMs, knopfMs } },
    appearance: { statsBarEnabled: true },
  });

  test('Leerlauf faltet zur Mini-Pille und weiter zum Knopf ganz rechts', async ({ page }) => {
    const root = await mountCard(page, { settings: KASKADE(1200, 1200) });
    const pill = root.locator('.island-pill');
    await expect(pill).toBeVisible();

    // Stufe 1: Mini-Pille — Zeile 2 faltet auf Höhe 0, die Form wird zur
    // schmalen Vollpille.
    await expect(pill).toHaveAttribute('data-ruhe', 'mini', { timeout: 8000 });
    await expect.poll(() => pill.locator('.island-zeile2').evaluate(
      (el) => Math.round(el.getBoundingClientRect().height)), { timeout: 5000 }).toBe(0);
    await expect.poll(() => pill.evaluate((el) => Math.round(el.getBoundingClientRect().width)),
      { timeout: 5000 }).toBeLessThan(400);

    // Stufe 2: der Knopf — 52er-Kreis, und er FÄHRT an den rechten Rand.
    await expect(pill).toHaveAttribute('data-ruhe', 'alert', { timeout: 8000 });
    await expect(root.locator('.island-ruheknopf')).toBeVisible();
    await expect.poll(() => pill.evaluate((el) => Math.round(el.getBoundingClientRect().width)),
      { timeout: 5000 }).toBeLessThan(60);
    // 🔑 v1.1.2246: BÜNDIG, nicht „ungefähr rechts". Die alte Schranke (< 40)
    // war weit genug, dass der gemeldete 24-px-Versatz sie mühelos bestand —
    // ein Test, der den Fehler mitträgt, ist keiner. Jetzt zählt die Kante:
    // die rechte Kante des Knopfes liegt auf der Kante des Holders (= Kante
    // von Suchzeile und Kachelraster; 1 px Toleranz für die Boot-Skalierung).
    await expect.poll(() => pill.evaluate((el) => {
      const holder = el.closest('.island-holder').getBoundingClientRect();
      const me = el.getBoundingClientRect();
      return Math.abs(Math.round(holder.right - me.right));
    }), { timeout: 5000 }).toBeLessThanOrEqual(1);

    // Tipp auf den Knopf → die volle Karte kehrt zurück.
    await root.locator('.island-ruheknopf').click();
    await expect(pill).toHaveAttribute('data-ruhe', '', { timeout: 5000 });
    await expect.poll(() => pill.locator('.island-zeile2').evaluate(
      (el) => Math.round(el.getBoundingClientRect().height)), { timeout: 5000 }).toBeGreaterThan(10);
  });

  test('das × schickt die Insel sofort nach rechts, ein Tipp holt sie zurück', async ({ page }) => {
    // v1.1.2250 (Nutzer-Entscheid): Das Wegschicken hat jetzt einen eigenen
    // Knopf — × links oben, sichtbar beim Überfahren. Er springt DIREKT in die
    // Endlage rechts (ohne Umweg über die Mini-Pille); die freie Fläche klappt
    // stattdessen die Liste auf (eigener Test unten).
    // Lange Leerlaufzeiten: hier faltet ausschließlich das ×.
    const root = await mountCard(page, { settings: KASKADE(120000, 120000) });
    const pill = root.locator('.island-pill');
    await expect(pill).toBeVisible();
    await expect(pill).toHaveAttribute('data-ruhe', '');

    // Der Knopf hängt an :hover — erst über die Karte fahren.
    await pill.hover();
    const x = root.locator('.island-x');
    await expect(x).toBeVisible({ timeout: 5000 });
    await x.click();
    await expect(pill).toHaveAttribute('data-ruhe', 'alert', { timeout: 5000 });

    // Tipp auf den Knopf → volle Karte zurück.
    await root.locator('.island-ruheknopf').click();
    await expect(pill).toHaveAttribute('data-ruhe', '', { timeout: 5000 });
  });

  test('ein Klick auf die freie Fläche klappt die Liste auf', async ({ page }) => {
    // v1.1.2250: früher faltete dieser Klick zur Mini-Pille — seit das × das
    // Wegschicken übernimmt, zeigt er stattdessen, was läuft.
    const root = await mountCard(page, {
      settings: {
        ...KASKADE(120000, 120000),
        startScreen: {
          ...KASKADE(120000, 120000).startScreen,
          liveActivities: { enabled: true, sources: { timer: true, vacuum: true, cover: true, media_player: true, script: true, automation: true, climate: true, light: true, switch: true } },
        },
      },
    });
    const pill = root.locator('.island-pill');
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');
    await expect(pill).toHaveAttribute('data-expanded', 'false');

    // 🔑 Locator-Klick mit relativer Position: der Locator wartet auf
    // Element-Stabilität (roher Mausklick verfehlte je nach Boot-Skalierung).
    const kopf = root.locator('.island-head');
    const box = await kopf.boundingBox();
    await kopf.click({ position: { x: box.width - 30, y: 13 } });
    await expect(pill).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    await expect(pill).toHaveAttribute('data-ruhe', '');
  });

  test('eine neue Meldung weckt den Knopf und zählt danach in der Kugel', async ({ page }) => {
    // Zeitraffer: die 6-s-Übernahme und die 5-s-Boot-Gnade sind hier nur
    // Kulisse — geprüft wird die REIHENFOLGE (wecken → übernehmen → zählen).
    const root = await mountCard(page, { settings: zeitraffer(KASKADE(1500, 1500)) });
    const pill = root.locator('.island-pill');
    await expect(pill).toHaveAttribute('data-ruhe', 'alert', { timeout: 10000 });

    // Boot-Gnade sicher verstreichen lassen (Übernahme kündigt nur NEUES an).
    await page.waitForTimeout(900);
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity(
        'persistent_notification.p1', 'Meldung', 'notifying',
        { title: 'Trockner fertig', message: 'x' }
      );
    });
    // Die Meldung weckt die Karte und übernimmt Zeile 2 …
    await expect(pill).toHaveAttribute('data-ruhe', '', { timeout: 8000 });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Trockner fertig');

    // … und nach Übernahme + Leerlauf sitzt sie als Zahl in der Knopf-Kugel
    // (Info → blaue Kugel). Während der Übernahme faltet die Kaskade nicht.
    await expect(pill).toHaveAttribute('data-ruhe', 'alert', { timeout: 20000 });
    const kugel = root.locator('.island-ruheknopf .island-eck');
    await expect(kugel).toHaveText('1');
    await expect(kugel).toHaveClass(/island-eck--blau/);
  });
});
