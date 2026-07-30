// tests/settings.spec.js
//
// v1.1.2191: Die Settings-Oberflächen nach dem Shell-Refactor (v2183–2189).
// Sechs Releases haben hier Rahmen ausgetauscht — `IosSubView`/`IosPagerView`
// statt handkopierter motion.div-Blöcke. Der Build kann davon nichts prüfen:
// Ein falsch verdrahteter Titel, ein fehlender Zurück-Button oder ein
// verschwundener Inhalt kompiliert einwandfrei.
//
// Genau diese drei Zusagen werden hier festgehalten — pro Unteransicht:
// richtiger Titel, ein Zurück-Button, und Inhalt ist da.

import { test, expect } from '@playwright/test';
import { mountCard, revealIfLocked } from './harness/card.js';

/**
 * Öffnet die Einstellungen über die Suche (System-Entities sind auffindbar).
 *
 * 🔑 Die Settings-View wird LAZY geladen (`registry.js` → dynamischer Import).
 * Direkt nach dem Klick steht das Panel, aber sein Menü noch nicht — deshalb
 * wird auf den INHALT gewartet (mehrere Menüzeilen), nicht auf eine feste Zeit.
 */
async function openSettings(page, root) {
  // v1.1.2225: Bei eingeschalteter Startseite liegt die Suche hinter EINER
  // Bewegung — sonst fängt der Zen-Vorhang den Klick ab (er meldet das Feld als
  // sichtbar, deshalb lief der Test in einen Timeout statt in einen klaren
  // Fehler). Tests ohne Startseite bleiben unberührt.
  await revealIfLocked(page, root);
  // v1.1.2228: siehe openDevice im Harness — die Kapsel öffnet die Suche.
  const kapsel = root.locator('.bento-zen-panel-search');
  if (await kapsel.count()) {
    await kapsel.click();
  }
  const input = root.locator('input.search-input');
  await input.click();
  await input.fill('Einstellungen');
  const card = root.locator('.device-name', { hasText: 'Einstellungen' }).first();
  await card.waitFor({ timeout: 15000 });
  await card.click();
  await expect
    .poll(() => root.locator('.ios-item-label').count(), { timeout: 20000 })
    .toBeGreaterThan(5);
}

/**
 * Zeile im aktuellen Menü öffnen.
 * Bewusst Text-Suche statt `^…$`-Regex: Der gerenderte Label-Text kann
 * Whitespace/Zeilenumbrüche aus dem JSX enthalten, an denen Anker scheitern.
 * Playwright normalisiert bei String-Matches — die Labels sind eindeutig genug.
 */
async function openRow(root, label) {
  const row = root.locator('.ios-item-label').filter({ hasText: label }).first();
  await row.waitFor({ timeout: 8000 });
  await row.scrollIntoViewIfNeeded();
  await row.click();
}

/**
 * Titel der zuletzt eingeblendeten Unteransicht — oder `null`, wenn keiner da
 * ist. 🔑 Das Haupt-Menü der Allgemein-Einstellungen hat KEINE Navbar; `null`
 * ist deshalb die verlässliche Aussage „wir sind im Menü".
 */
async function currentTitle(root) {
  const titles = root.locator('.ios-navbar-title');
  if ((await titles.count()) === 0) return null;
  return (await titles.last().innerText()).trim();
}

test.describe('Einstellungen → Allgemein', () => {
  // Jede Zeile: Label im Menü → erwarteter Navbar-Titel der Unteransicht.
  const SUB_VIEWS = [
    ['App-Sprache', 'App-Sprache'],
    ['Währung', 'Währung'],
    ['Zeitformat', 'Zeitformat'],
    ['TTS-Engine', 'TTS-Engine'],
    ['Insel', 'Insel'],
    ['Live-Aktivitäten', 'Live-Aktivitäten'],
    ['Benachrichtigungen', 'Toasts'],
    ['Widgets konfigurieren', 'Bento-Widgets'],
    ['Einträge konfigurieren', 'Sidebar-Einträge'],
  ];

  for (const [row, title] of SUB_VIEWS) {
    test(`„${row}" öffnet „${title}" mit Zurück und Inhalt`, async ({ page }) => {
      const root = await mountCard(page);
      await openSettings(page, root);
      await openRow(root, row);

      await expect.poll(() => currentTitle(root), { timeout: 8000 }).toBe(title);
      await expect(root.locator('.ios-navbar-back').last()).toBeVisible();
      // Inhalt: mindestens eine Karte im Scroll-Bereich der Unteransicht.
      await expect(root.locator('.ios-settings-view').last().locator('.ios-card').first()).toBeVisible();
    });
  }

  test('Zurück führt aus der Unteransicht ins Menü', async ({ page }) => {
    const root = await mountCard(page);
    await openSettings(page, root);
    await openRow(root, 'Währung');
    await expect.poll(() => currentTitle(root)).toBe('Währung');

    await root.locator('.ios-navbar-back').last().click();
    // Zurück im Menü: dort gibt es keine Navbar mehr.
    await expect.poll(() => currentTitle(root), { timeout: 10000 }).toBeNull();
  });

  test('Währung auswählen speichert und schließt die Unteransicht', async ({ page }) => {
    const root = await mountCard(page);
    await openSettings(page, root);
    await openRow(root, 'Währung');
    await root.locator('.ios-item-label').filter({ hasText: 'US Dollar' }).first().click();

    await expect.poll(() => page.evaluate(() => localStorage.getItem('userCurrency'))).toBe('USD');
    // v2184: der Picker schließt sich nach der Auswahl (closeDelayMs) → Menü.
    await expect.poll(() => currentTitle(root), { timeout: 10000 }).toBeNull();
  });

  test('Insel-Schalter wirkt sofort auf die Karte', async ({ page }) => {
    const root = await mountCard(page, {
      settings: { startScreen: { bento: true }, appearance: { statsBarEnabled: true } },
    });
    await expect(root.locator('.island-pill')).toBeVisible();

    await openSettings(page, root);
    await openRow(root, 'Insel');
    await expect.poll(() => currentTitle(root)).toBe('Insel');

    // Der Master-Toggle ist der erste Schalter der Ansicht. Statt auf ein
    // Style-Detail zu zielen wird das erste klickbare Element der ersten
    // Zeile genommen — der LiquidGlassSwitch rendert dort seinen Hit-Bereich.
    const firstRow = root.locator('.ios-settings-view').last().locator('.ios-item').first();
    await firstRow.locator('.ios-item-right').first().click({ force: true });
    await expect.poll(
      () => page.evaluate(() => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.appearance?.statsBarEnabled)
    ).toBe(false);
  });
});
