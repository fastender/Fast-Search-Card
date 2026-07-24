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
 *
 * 🔑 Und die Kachel ist zwischendurch schlicht LEER. Nur auf „enthält den
 * Platzhalter nicht" zu prüfen reicht deshalb nicht — ein leerer String erfüllt
 * das auch. Unter Volllast (ganze Suite) rutschte genau so ein Fehlschlag durch.
 * Also: erst wenn wirklich Text dasteht.
 */
async function waitForBento(root, page, slot = 0) {
  await expect(widgets(root)).toHaveCount(4, { timeout: 15000 });
  await expect
    .poll(async () => {
      const text = (await widgets(root).allInnerTexts())[slot] || '';
      return text.trim().length > 0 && !text.includes('nicht konfiguriert');
    }, { timeout: 15000 })
    .toBe(true);
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
    // 🔑 Auf DEN Slot warten, den der Test prüft (3), nicht nur auf Slot 0.
    // „integration" lädt seine Geräte-Zahl asynchron und zeigt kurz den
    // Platzhalter — waitForBento(slot 0) sagt darüber nichts.
    await waitForBento(root, page, 0);
    await waitForBento(root, page, 3);

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

  test('die Mitteilungs-Kachel zeigt Symbol, übersetzten Namen und die Lage', async ({ page }) => {
    // v1.1.2202: Die Kachel hatte kein Symbol (fehlte in der iconMap), zeigte
    // den hart deutschen Entity-Namen „Mitteilungen" auch auf Englisch, und in
    // der Zeile darüber stand „General" — der generische „kein Raum"-Rückfall.
    const settings = {
      ...BENTO_ON,
      startScreen: { bento: true, widgets: ['settings', 'notifications', 'todos', 'news'] },
    };
    const root = await mountCard(page, { lang: 'en', settings });
    await waitForBento(root, page);
    const tile = widgets(root).nth(1);

    await expect(tile.locator('svg')).toHaveCount(1);
    await expect(tile).toContainText('Notifications');
    await expect(tile).not.toContainText('Mitteilungen');
    // Ohne Meldungen: eine Aussage, kein „General".
    await expect(tile).toContainText('All clear');
    await expect(tile).not.toContainText('General');

    // Mit Meldungen zählt die Kachel live mit.
    await updateHass(page, (states, entity) => {
      states['persistent_notification.a'] = entity('persistent_notification.a', 'A', 'notifying',
        { title: 'Waschmaschine fertig', message: 'x' });
      states['alert.fenster'] = entity('alert.fenster', 'Fenster offen', 'on');
    });
    await expect(tile).toContainText('2 new', { timeout: 10000 });
  });

  test('auf Deutsch heißt dieselbe Kachel „Mitteilungen"', async ({ page }) => {
    const settings = {
      ...BENTO_ON,
      startScreen: { bento: true, widgets: ['settings', 'notifications', 'todos', 'news'] },
    };
    const root = await mountCard(page, { lang: 'de', settings });
    await waitForBento(root, page);
    const tile = widgets(root).nth(1);

    await expect(tile).toContainText('Mitteilungen');
    await expect(tile).toContainText('Alles ruhig');
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
