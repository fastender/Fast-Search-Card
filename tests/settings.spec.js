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
/**
 * 🔑 v1.1.2250: Wartet, bis ein Element WIRKLICH steht. Die Settings-
 * Unteransichten federn beim Einschieben nach; ein Klick, der in diese
 * Nachfederung fällt, geht ins Leere (das Ziel wandert unter dem Zeiger weg).
 * Unter Volllast war das die Ursache mehrerer sporadischer Fehlschläge —
 * isoliert liefen dieselben Tests immer grün. Zwei gleiche Messungen im
 * Abstand von 120 ms sind das Ruhesignal.
 */
async function warteAufRuhe(locator, timeout = 8000) {
  await expect(locator).toBeVisible({ timeout });
  await expect.poll(async () => {
    const a = await locator.boundingBox();
    await new Promise((r) => setTimeout(r, 120));
    const b = await locator.boundingBox();
    return !!a && !!b && Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);
  }, { timeout }).toBe(true);
}

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

    // 🔑 v1.1.2248: Der Zurück-Knopf wird ERST angeklickt, wenn die
    // eingeschobene Unteransicht wirklich steht. Die Ansicht federt beim
    // Einschieben nach; fiel der Klick in diese Nachfederung, wanderte der
    // Knopf unter dem Zeiger weg und das Ereignis ging ins Leere — der Test
    // fiel dadurch in etwa jedem fünften Lauf um (auch isoliert). Geprüft
    // wird die Ruhe über zwei gleiche Messungen der Knopfposition.
    const zurueck = root.locator('.ios-navbar-back').last();
    await warteAufRuhe(zurueck);
    await zurueck.click();
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
    // v1.1.2250: ohne `force` — s. Begründung beim Standby-Schalter unten.
    await firstRow.locator('.ios-item-right').first().click();
    await expect.poll(
      () => page.evaluate(() => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.appearance?.statsBarEnabled)
    ).toBe(false);
  });

  test('Standby-Schalter und Zeit-Zeilen schreiben islandStandby', async ({ page }) => {
    // v1.1.2242: die Kaskade (v2240) hat jetzt UI — Schalter + zwei
    // Zyklus-Zeilen (Tipp schaltet zur nächsten Vorwahl).
    const root = await mountCard(page, {
      settings: {
        startScreen: { bento: true, islandStandby: { enabled: true, miniMs: 30000, knopfMs: 60000 } },
        appearance: { statsBarEnabled: true },
      },
    });
    await openSettings(page, root);
    await openRow(root, 'Insel');
    await expect.poll(() => currentTitle(root)).toBe('Insel');
    const view = root.locator('.ios-settings-view').last();

    // Zeit-Zeile zyklt: 30 s → 1 Min.
    const miniZeile = view.locator('.ios-item', { hasText: 'Zur Mini-Pille nach' });
    await expect(miniZeile.locator('.ios-item-value')).toHaveText('30 s');
    // 🔑 v1.1.2250: Erst klicken, wenn die eingeschobene Unteransicht steht.
    // Fällt der Klick in ihre Nachfederung, wandert die Zeile unter dem Zeiger
    // weg und das Ereignis geht ins Leere — unter Volllast fiel der Test
    // dadurch um, isoliert nie (gleiche Ursache wie beim Zurück-Test oben).
    await warteAufRuhe(miniZeile);
    await miniZeile.click();
    await expect(miniZeile.locator('.ios-item-value')).toHaveText('1 Min');
    await expect.poll(() => page.evaluate(
      () => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.startScreen?.islandStandby?.miniMs
    )).toBe(60000);

    // Schalter aus → gespeichert UND die Zeit-Zeilen treten ab.
    // 🔑 `.first()`: Während der Unteransicht-Überblendung stehen kurzzeitig
    // ZWEI Ansichten im Baum — ein mehrdeutiger Locator wirft dann im
    // strict mode, und ein verschluckter Fehler sieht aus wie „Klick tut
    // nichts". Deshalb eindeutig adressieren.
    const schalter = view.locator('.ios-item', { hasText: 'Automatisch falten' }).first();
    await warteAufRuhe(schalter);
    // 🔑 v1.1.2250: KEIN `force: true` mehr. Playwright scrollt das Ziel vor
    // dem Klick ins Bild — mit `force` überspringt es danach die
    // Stabilitätsprüfung und klickt auf die VOR dem Scrollen berechnete
    // Stelle. Gemessen: die Schalter-Zeile wanderte dabei um 127 px, der
    // Klick landete auf einer anderen Zeile und der Schalter blieb stehen
    // (jeder zweite Lauf rot). Ohne `force` wartet Playwright die Ruhe ab.
    const standbyWert = () => page.evaluate(
      () => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.startScreen?.islandStandby?.enabled
    );
    await schalter.locator('.ios-item-right').first().click();
    await expect.poll(standbyWert, { timeout: 10000 }).toBe(false);
    await expect(view.locator('.ios-item', { hasText: 'Zur Mini-Pille nach' })).toHaveCount(0);
  });

  test('der Energie-Picker schreibt islandSources und zeigt die Wahl', async ({ page }) => {
    // v1.1.2243: Dauerwerte-Sektion — Zeile aufklappen, Sensor wählen.
    const root = await mountCard(page, {
      settings: { startScreen: { bento: true }, appearance: { statsBarEnabled: true } },
    });
    await openSettings(page, root);
    await openRow(root, 'Insel');
    await expect.poll(() => currentTitle(root)).toBe('Insel');
    const view = root.locator('.ios-settings-view').last();

    const energie = view.locator('.ios-item', { hasText: 'Energie' }).first();
    await expect(energie.locator('.ios-item-value')).toHaveText('Automatisch');
    // Gleiche Disziplin wie beim Standby-Schalter: erst klicken, wenn die
    // eingeschobene Ansicht steht (v1.1.2250).
    await warteAufRuhe(energie);
    await energie.click();
    // Der Testhaus-Leistungssensor steht in der Liste — wählen.
    const kandidat = view.locator('.ios-item-subtitle', { hasText: 'sensor.' }).first();
    const gewaehlteId = await kandidat.textContent();
    await kandidat.click();
    await expect.poll(() => page.evaluate(
      () => JSON.parse(localStorage.getItem('systemSettings') || '{}')?.startScreen?.islandSources?.powerId
    )).toBe(gewaehlteId.trim());
    // Die Zeile zeigt jetzt den Namen der Wahl statt „Automatisch".
    await expect(energie.locator('.ios-item-value')).not.toHaveText('Automatisch');
  });
});
