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
});
