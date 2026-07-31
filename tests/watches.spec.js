// tests/watches.spec.js
//
// v1.1.2196: Die Wächter („Hinweise") und die Ruhezeiten — das jüngste
// Subsystem der Karte und bis hierher nur an einer einzigen Stelle gedeckt
// (ein vorbereiteter Wächter im DataProvider-Test).
//
// Neu ist der Weg, den ein Nutzer wirklich geht: Gerät öffnen → Kontext →
// Hinweise → Vorschlag antippen → aktivieren. Möglich ist das erst, seit das
// Testhaus einen Messwert-Sensor hat.
//
// Beim Bau dieser Suite fiel auf, dass der Sensor seine Reiter falsch
// beschriftete (Kontext hieß „Verlauf") — behoben in derselben Version, der
// erste Test hier nagelt es fest.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, openDevice, islandText } from './harness/card.js';

const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

/**
 * Gerät öffnen und im Kontext-Reiter auf „Hinweise" schalten.
 *
 * 🔑 Zwei Bühnen, nicht eine: die LISTE der Hinweise steht in `.detail-right`,
 * die Autoren-Ansicht wird per Portal in `.detail-panel` gehängt (damit sie
 * über der Abdeckung liegt). Wer beides in `.detail-right` sucht, findet die
 * Vorschläge nie.
 */
async function openHints(root, page, query = 'Luftfeuchte') {
  await openDevice(root, page, query);
  await root.locator('.detail-tab[title="Kontext"]').click();
  const hints = root.locator('button', { hasText: 'Hinweise' }).first();
  await hints.waitFor({ timeout: 10000 });
  await hints.click();
  return { list: root.locator('.detail-right').first(), sheet: root.locator('.detail-panel').first() };
}

/** Vorschlag antippen und aktivieren. */
async function createWatch(root, sheet, suggestion = 'Zu feucht') {
  await root.locator('button', { hasText: 'Hinweis' }).last().click();
  await expect(sheet).toContainText(suggestion, { timeout: 10000 });
  await sheet.locator(`text=${suggestion}`).first().click();
  await sheet.locator('button', { hasText: 'Hinweis aktivieren' }).click();
}

test.describe('Hinweise (Wächter)', () => {
  test('ein Messwert-Gerät hat Steuerung, Verlauf und Kontext — richtig beschriftet', async ({ page }) => {
    // Sensoren haben keinen Zeitplan. Die Tooltips wurden aber nach POSITION
    // aus einer festen Vierer-Liste gezogen, also hieß der Kontext-Reiter
    // „Verlauf" und der Verlauf „Zeitplan". Repariert in v1.1.2196.
    const root = await mountCard(page);
    await openDevice(root, page, 'Luftfeuchte');

    const titles = await root.locator('.detail-tab').evaluateAll(
      els => els.map(e => e.getAttribute('title'))
    );
    expect(titles).toEqual(['Steuerung', 'Verlauf', 'Kontext']);
  });

  test('ohne Hinweis lädt die Ansicht zum Anlegen ein', async ({ page }) => {
    const root = await mountCard(page);
    const { list } = await openHints(root, page);

    await expect(list).toContainText('Noch kein Hinweis');
    await expect(root.locator('button', { hasText: 'Hinweis' }).last()).toBeVisible();
  });

  test('ein Vorschlag wird zum gespeicherten Hinweis', async ({ page }) => {
    const root = await mountCard(page);
    const { list, sheet } = await openHints(root, page);

    // Die Autoren-Ansicht schlägt sinnvolle Grenzen für die Messgröße vor.
    await createWatch(root, sheet);

    // In der Liste sichtbar …
    await expect(list).not.toContainText('Noch kein Hinweis', { timeout: 10000 });
    // … und wirklich abgelegt, nicht nur gerendert.
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fsc-watches-v1') || '{}'));
    expect(stored.defs?.length).toBe(1);
    expect(stored.defs[0]).toMatchObject({ entity_id: 'sensor.bad_hum', kind: 'threshold', dir: 'above' });
  });

  test('ein angelegter Hinweis meldet sich, wenn der Wert die Grenze reißt', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    const { list, sheet } = await openHints(root, page);
    await createWatch(root, sheet);
    await expect(list).not.toContainText('Noch kein Hinweis', { timeout: 10000 });

    // Wert über die Grenze schieben — der Hinweis muss die Insel erreichen.
    // v1.1.2239: als Eck-Knopf seiner Stufe (die Übernahme läuft nur, wenn
    // die Boot-Gnade schon vorbei ist — der Knopf kommt IMMER).
    await updateHass(page, (states, entity) => {
      states['sensor.bad_hum'] = entity('sensor.bad_hum', 'Luftfeuchte', '80', {
        unit_of_measurement: '%', device_class: 'humidity', state_class: 'measurement',
      });
    });
    await expect(root.locator('.island-knopf[data-knopf="warn"], .island-knopf[data-knopf="info"]'))
      .toHaveCount(1, { timeout: 12000 });
  });

  test('ein Hinweis lässt sich löschen', async ({ page }) => {
    const root = await mountCard(page, {
      storage: {
        'fsc-watches-v1': {
          defs: [{
            id: 'w1', entity_id: 'sensor.bad_hum', label: 'Zu feucht',
            kind: 'threshold', dir: 'above', threshold: 65, margin: 2, unit: '%',
            severity: 2, enabled: true, created_at: '2026-07-22T00:00:00.000Z',
          }],
          runtime: {},
        },
      },
    });
    const { list } = await openHints(root, page);
    await expect(list).not.toContainText('Noch kein Hinweis');

    await list.locator('button[title="Löschen"], button[aria-label="Löschen"]').first().click();
    await expect(list).toContainText('Noch kein Hinweis', { timeout: 10000 });
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fsc-watches-v1') || '{}'));
    expect(stored.defs?.length ?? 0).toBe(0);
  });
});

test.describe('Ruhezeiten', () => {
  test('im Ruhefenster zeigt die Insel ihr Nachtgesicht statt der Haus-Zeile', async ({ page }) => {
    // Ruhezeiten decken den ganzen Tag ab → wir sind garantiert drin.
    await mountCard(page, {
      settings: {
        ...BENTO_ON,
        toasts: { quietHours: { enabled: true, from: '00:00', to: '23:59', allowCritical: true } },
      },
    });
    // v1.1.2209: Nachtgesicht = nur der (gedimmte) Wetterwert — Energie und
    // Haus-Roll treten ab. Ohne Wetter-Entity (Testhaus) bleibt es leer.
    await expect.poll(() => islandText(page), { timeout: 10000 }).not.toContain('Licht an');
    await expect.poll(() => islandText(page), { timeout: 10000 }).not.toContain('kW');
  });

  test('außerhalb des Ruhefensters läuft die Haus-Zeile normal', async ({ page }) => {
    await mountCard(page, {
      settings: {
        ...BENTO_ON,
        toasts: { quietHours: { enabled: false, from: '00:00', to: '23:59', allowCritical: true } },
      },
    });
    await expect.poll(() => islandText(page), { timeout: 25000 }).toContain('1 Licht an');
    await expect.poll(() => islandText(page), { timeout: 12000 }).toContain('1,2 kW');
  });
});
