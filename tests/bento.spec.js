// tests/bento.spec.js
//
// v1.1.2197: Die Bento-Startseite — der Bildschirm, den der Nutzer beim Öffnen
// der Karte als Erstes sieht, und bis hierher ungedeckt.
//
// Geprüft wird, was den Bildschirm ausmacht: dass vier Kacheln in der
// eingestellten Reihenfolge erscheinen, dass eine geänderte Belegung wirklich
// durchschlägt, dass ein Tipper die passende Ansicht öffnet — und dass die
// Kacheln sich mit Home Assistant mitbewegen statt beim Startwert zu stehen.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass } from './harness/card.js';

const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

/** Die vier Kacheln in Render-Reihenfolge. */
const widgets = (root) => root.locator('.bento-widget');

/**
 * Warten, bis die Kacheln ihren INHALT haben — nicht nur ihren Platz.
 *
 * 🔑 `toHaveCount(4)` ist sofort erfüllt: das Grid stellt vier Platzhalter hin,
 * bevor die System-Registry geladen ist. Wer direkt danach den Text prüft,
 * liest „Widget nicht konfiguriert" und bekommt einen Fehlschlag, der je nach
 * Maschinenlaune kommt und geht.
 */
async function waitForBento(root, page, slot = 0) {
  await expect(widgets(root)).toHaveCount(4, { timeout: 15000 });
  await expect
    .poll(async () => (await widgets(root).allInnerTexts())[slot], { timeout: 15000 })
    .not.toContain('nicht konfiguriert');
}

test.describe('Bento-Startseite', () => {
  test('zeigt vier Kacheln in der Standard-Belegung', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await waitForBento(root, page);

    // Standard: Integrationen (groß) · Zeitpläne · Aufgaben · Nachrichten.
    const texts = await widgets(root).allInnerTexts();
    expect(texts[0]).toContain('Integration');
    expect(texts[2]).toContain('Unerledigt');
    expect(texts[3]).toContain('Nachrichten');
    // Die erste Kachel ist die große.
    await expect(widgets(root).first()).toHaveClass(/bento-widget--large/);
  });

  test('eine geänderte Belegung schlägt durch', async ({ page }) => {
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: { bento: true, widgets: ['__favorites__', 'todos', 'news', 'integration'] },
      },
    });
    await waitForBento(root, page);

    const texts = await widgets(root).allInnerTexts();
    expect(texts[0]).toContain('Favoriten');
    expect(texts[3]).toContain('Integration');
  });

  test('eine unvollständige Belegung fällt auf die Standardbelegung zurück', async ({ page }) => {
    // Der Code verlangt GENAU vier Einträge — alles andere ist unbrauchbar und
    // darf nicht zu einem halb leeren Startbildschirm führen.
    const root = await mountCard(page, {
      settings: { ...BENTO_ON, startScreen: { bento: true, widgets: ['todos', 'news'] } },
    });
    await waitForBento(root, page);
    expect((await widgets(root).allInnerTexts())[0]).toContain('Integration');
  });

  test('ein Tipper auf eine Kachel öffnet ihre Ansicht', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await waitForBento(root, page);

    await widgets(root).nth(2).click();   // Aufgaben
    await expect(root.locator('.detail-panel')).toHaveCount(1, { timeout: 15000 });
  });

  test('eine Geräte-Kachel folgt Home Assistant', async ({ page }) => {
    // Eine Kachel darf direkt auf ein Gerät zeigen. Dann muss sie sich mit dem
    // Entity-Strom mitbewegen statt beim Startwert stehen zu bleiben — genau
    // das würde ein gebrochener Provider anrichten, ohne dass ein Build es merkt.
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: { bento: true, widgets: ['light.wohnzimmer', 'todos', 'news', 'integration'] },
      },
    });
    await waitForBento(root, page);
    expect((await widgets(root).allInnerTexts())[0]).toContain('Ein');

    await updateHass(page, (states, entity) => {
      states['light.wohnzimmer'] = entity('light.wohnzimmer', 'Wohnzimmer Licht', 'off');
    });
    await expect
      .poll(async () => (await widgets(root).allInnerTexts())[0], { timeout: 10000 })
      .toContain('Aus');
  });

  test('ohne Bento startet die Karte ohne Grid', async ({ page }) => {
    const root = await mountCard(page, { settings: { startScreen: { bento: false } } });
    await expect(root.locator('input.search-input')).toBeVisible();
    await expect(root.locator('.bento-grid')).toHaveCount(0);
  });

  test('auf dem Telefon stapeln sich die Kacheln', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const root = await mountCard(page, { settings: BENTO_ON });
    await waitForBento(root, page);

    // Kein Desktop-Grid mehr — die Kacheln liegen untereinander.
    await expect(root.locator('.bento-grid--desktop')).toHaveCount(0);
    const boxes = await widgets(root).evaluateAll(els => els.map(e => e.getBoundingClientRect().left));
    expect(new Set(boxes).size).toBe(1);   // alle an derselben linken Kante
  });
});
