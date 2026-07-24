// tests/island.spec.js
//
// v1.1.2191: Die Insel (v2170–2181). Sie ersetzt die StatsBar, wurde in sieben
// Phasen gebaut und danach perf-optimiert — ihre Zustandswahl ist damit die
// Stelle mit den meisten Umbauten und dem größten Regressionsrisiko.
//
// Geprüft wird die BEOBACHTBARE Zusage: welcher Inhalt erscheint in welcher
// Situation. Bewusst NICHT geprüft: Animationsdetails (spröde) und die
// pure Zustandswahl selbst — die hat ihre eigene Node-Suite in islandState.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, broadcast, islandText } from './harness/card.js';

// Die Insel erscheint nur, wenn Suche offen ODER Bento aktiv ODER Detail offen.
const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

/**
 * v1.1.2206: Aufklappen geschieht per KLICK (der Langdruck wurde entfernt).
 * Aufgeklappt wird nur bei MEHREREN Live-Aktivitäten — eine einzelne öffnet
 * beim Klick direkt ihr Gerät.
 */
async function expandIsland(root) {
  await root.locator('.island-head').click();
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
  test('Ruhegesicht zeigt Uhr und eine gezählte Haus-Tatsache', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    // Die Uhr — der Ziffern-Roll (v2175) rendert jede Stelle einzeln.
    await expect.poll(() => islandText(page)).toMatch(/\d\s*\d?\s*:\s*\d/);
    // Ein Licht an, eines aus → die Ambient-Zeile (v2174) zählt korrekt.
    await expect.poll(() => islandText(page)).toContain('1 Licht an');
  });

  test('Ambient-Zeile zählt mehrere Lichter und offene Fenster', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['light.kueche'] = entity('light.kueche', 'Küche Licht', 'on');
      states['binary_sensor.fenster'] = entity('binary_sensor.fenster', 'Fenster', 'on', { device_class: 'window' });
    });
    // Ab zwei Einträgen rotiert die Zeile alle 4 s — beide müssen vorkommen.
    // Großzügiges Fenster: der Roll wartet zusätzlich auf den 1-s-Treiber.
    await expect.poll(() => islandText(page), { timeout: 15000 }).toContain('2 Lichter an');
    await expect.poll(() => islandText(page), { timeout: 15000 }).toContain('1 Fenster offen');
  });

  test('laufender Timer verdrängt das Ruhegesicht und zählt herunter', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00',
        finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Pizza');

    // Der 1-Sekunden-Treiber (v2180) muss den Countdown wirklich bewegen.
    const before = await islandText(page);
    await expect.poll(() => islandText(page), { timeout: 8000 }).not.toBe(before);
  });

  test('Meldung schlägt Live-Aktivität', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
      states['persistent_notification.p1'] = entity(
        'persistent_notification.p1', 'Meldung', 'notifying',
        { title: 'Waschmaschine fertig', message: 'Programm beendet' }
      );
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Waschmaschine fertig');
    expect(await islandText(page)).not.toContain('Pizza');
  });

  test('mehrere Meldungen werden zur Sammlung', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M1', 'notifying',
        { title: 'Waschmaschine fertig', message: 'x' });
      states['alert.fenster'] = entity('alert.fenster', 'Fenster offen', 'on');
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('2 Mitteilungen');
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

  test('Tippen auf eine Meldung öffnet das Mitteilungen-Center', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M', 'notifying',
        { title: 'Testmeldung', message: 'x' });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Testmeldung');

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-notifications', () => window.__opened.push('notifications'));
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push('entity:' + e.detail.entityId));
    });
    await root.locator('.island-pill').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['notifications']);
  });

  test('Tippen auf eine Live-Aktivität öffnet deren Gerät', async ({ page }) => {
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
    await root.locator('.island-pill').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('ein Klick klappt die Insel zu EINER Form auf', async ({ page }) => {
    // v1.1.2204: Die Liste ist kein zweites Panel mehr, sondern Teil derselben
    // Form. Geprüft wird genau das: die Pille selbst wächst, ihr Radius geht
    // von der Kapsel auf weich-eckig, und die Zeilen stecken IN ihr.
    // v1.1.2206: per KLICK, nicht mehr per Langdruck.
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    const pill = root.locator('.island-pill');
    const zuHoehe = await pill.evaluate(el => el.offsetHeight);
    await expect(pill).toHaveAttribute('data-expanded', 'false');

    await expandIsland(root);

    await expect(pill).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    // Die Zeilen sind Kinder DER PILLE, nicht eines Nachbarn.
    await expect(pill.locator('.island-row')).toHaveCount(2);
    // Höhe wächst über die grid-rows-Animation (460 ms) — darauf pollen, nicht
    // einmal mitten im Aufklappen messen.
    await expect.poll(() => pill.evaluate(el => el.offsetHeight), { timeout: 5000 })
      .toBeGreaterThan(zuHoehe);

    // Kapsel → weich-eckig. Der Radius federt über 480 ms dorthin, also auf
    // den Endwert warten statt einmal mittendrin zu messen.
    await expect
      .poll(() => pill.evaluate(el => parseFloat(getComputedStyle(el).borderRadius)), { timeout: 5000 })
      .toBeLessThan(60);
  });

  test('aufgeklappt wird der Kopf zur Überschrift', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    await expandIsland(root);
    // Nach dem Überblenden steht dort die Überschrift — nicht mehr das Gerät.
    await expect.poll(() => islandText(page), { timeout: 6000 }).toContain('Live-Aktivitäten');
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
    await root.locator('.island-row').first().click();

    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
    // Und klappt danach zu: der Nutzer verlässt die Insel, sie kehrt in ihren
    // Ruhezustand zurück. (Im Mockup hatte ich das Gegenteil vermutet — dort
    // öffnete sich aber keine Detailansicht, die die Insel ohnehin verdeckt.)
    await expect(root.locator('.island-pill')).toHaveAttribute('data-expanded', 'false', { timeout: 5000 });
  });
});
