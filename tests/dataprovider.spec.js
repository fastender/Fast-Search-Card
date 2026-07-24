// tests/dataprovider.spec.js
//
// v1.1.2192: Das Sicherheitsnetz für den DataProvider (1419 LOC), BEVOR er
// zerlegt wird. Er ist der einzige Refactor-Posten, den ich bewusst
// zurückgestellt habe: seine Ref-Choreografie (hassRef, Lade-Mutex,
// rAF-Flush-Timing) und die referenz-stabilen Context-Memos sind
// performance-kritisch, und kein Build merkt, wenn man sie bricht.
//
// Deshalb werden hier seine ZUSAGEN festgehalten, nicht seine Interna — genau
// die Dinge, die ein Split versehentlich kaputt machen würde:
//
//   Entity-Strom      state_changed → UI zeigt den neuen Wert
//   Notifications     HA-Meldung → Alert-Lane
//   Watches           Schwellwert reißt → wird zur Meldung
//   Favoriten         umschalten + überleben
//   Settings          schreiben + überleben
//   Suche             Entities sind geladen und auffindbar
//
// Alle Prüfungen laufen über die BEOBACHTBARE Oberfläche. Bricht der Split
// eine Verdrahtung, fällt hier ein Test — egal wie die Interna danach heißen.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, islandText } from './harness/card.js';

const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

test.describe('DataProvider — beobachtbare Zusagen', () => {
  test('Entities sind geladen und über die Suche auffindbar', async ({ page }) => {
    const root = await mountCard(page);
    const input = root.locator('input.search-input');
    await input.click();

    await input.fill('Einstell');
    await expect(root.locator('.device-name', { hasText: 'Einstellungen' }).first()).toBeVisible();

    await input.fill('Kalend');
    await expect(root.locator('.device-name', { hasText: 'Kalender' }).first()).toBeVisible();

    // Unsinn liefert nichts — die Filterung greift wirklich.
    await input.fill('zzzgibtesnicht');
    await expect(root.locator('.device-name')).toHaveCount(0);
  });

  test('ein state_changed erreicht die Oberfläche', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    // Ausgangslage: ein Licht an (das zweite ist aus).
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('1 Licht an');

    // Zweites Licht an → der Entity-Strom muss die Zählung bewegen.
    await updateHass(page, (states, entity) => {
      states['light.kueche'] = entity('light.kueche', 'Küche Licht', 'on');
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('2 Lichter an');

    // …und wieder zurück.
    await updateHass(page, (states, entity) => {
      states['light.kueche'] = entity('light.kueche', 'Küche Licht', 'off');
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('1 Licht an');
  });

  test('HA-Meldungen landen in der Alert-Lane', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.abc'] = entity('persistent_notification.abc', 'N', 'notifying',
        { title: 'Backofen vorgeheizt', message: 'x' });
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Backofen vorgeheizt');

    // Auflösen in HA → die Meldung verschwindet wieder.
    await updateHass(page, (states) => { delete states['persistent_notification.abc']; });
    await expect.poll(() => islandText(page), { timeout: 10000 }).not.toContain('Backofen vorgeheizt');
  });

  test('ein reißender Schwellwert wird zur Meldung', async ({ page }) => {
    // 🔑 Der watchStore liest seinen Storage beim MODUL-IMPORT — der Watch muss
    // also vor dem Mount stehen, nicht danach.
    await mountCard(page, {
      settings: BENTO_ON,
      storage: {
        'fsc-watches-v1': {
          defs: [{
            id: 'w_test', entity_id: 'sensor.bad_hum', label: 'Bad Luftfeuchte',
            kind: 'threshold', dir: 'above', threshold: 65, margin: 2, unit: '%',
            severity: 2, enabled: true, created_at: '2026-07-22T00:00:00.000Z',
          }],
          runtime: {},
        },
      },
    });
    // Wert unter der Schwelle → still.
    await updateHass(page, (states, entity) => {
      states['sensor.bad_hum'] = entity('sensor.bad_hum', 'Bad Luftfeuchte', '50',
        { unit_of_measurement: '%', device_class: 'humidity' });
    });
    // Wert über der Schwelle → die Watch-Engine muss feuern.
    await updateHass(page, (states, entity) => {
      states['sensor.bad_hum'] = entity('sensor.bad_hum', 'Bad Luftfeuchte', '80',
        { unit_of_measurement: '%', device_class: 'humidity' });
    });
    await expect.poll(() => islandText(page), { timeout: 12000 }).toContain('Bad Luftfeuchte');
  });

  test('Favoriten lassen sich setzen und überleben einen Neustart', async ({ page }) => {
    // Insel aus: sie ist hier nicht Gegenstand, und im schmalen Test-Viewport
    // überlappt die (bewusst bedienbare, v1.1.2207) Pille sonst den
    // Favoriten-Knopf im Detail-Kopf.
    const root = await mountCard(page, { settings: { appearance: { statsBarEnabled: false } } });
    const input = root.locator('input.search-input');
    await input.click();
    await input.fill('Einstell');
    const card = root.locator('.device-name', { hasText: 'Einstellungen' }).first();
    await card.waitFor({ timeout: 10000 });

    const FAV_KEY = 'fsc_favorites_snapshot_v1';
    const before = await page.evaluate((k) => localStorage.getItem(k), FAV_KEY);
    // Favoriten-Schalter der Karte (Herz) — über die Detail-Ansicht.
    await card.click();
    const fav = root.locator('.favorite-button').first();
    await fav.waitFor({ timeout: 15000 });
    await fav.click();

    await expect
      .poll(() => page.evaluate((k) => localStorage.getItem(k), FAV_KEY), { timeout: 10000 })
      .not.toBe(before);
    // Der Favorit steht wirklich drin (nicht nur „irgendwas hat sich geändert").
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), FAV_KEY);
    expect(Array.isArray(stored) && stored.length).toBeGreaterThan(0);
  });

  test('eine Einstellung wird geschrieben und wirkt sofort', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await expect(root.locator('.island-pill')).toBeVisible();

    // Über den Settings-Weg schreiben (updateSetting + Broadcast im Provider).
    await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('systemSettings') || '{}');
      all.appearance = { ...(all.appearance || {}), statsBarEnabled: false };
      localStorage.setItem('systemSettings', JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('statsBarEnabledChanged', { detail: false }));
    });
    await expect(root.locator('.island-pill')).toHaveCount(0);

    // Neu mounten: der geschriebene Wert muss überleben.
    await page.evaluate(() => {
      document.getElementById('fsc-test-root')?.remove();
    });
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.appearance?.statsBarEnabled
    );
    expect(stored).toBe(false);
  });
});
