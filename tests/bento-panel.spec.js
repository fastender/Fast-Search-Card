// tests/bento-panel.spec.js
//
// v1.1.2213: Die zweite Bento-Startseite — Kopfzeile und Kacheln in EINER
// Glasfläche (Mockup-Variante A mit Kopf H4), umschaltbar über
// `startScreen.bentoLayout`.
//
// Vier Zusagen, die diese Suite festnagelt:
//   1. Die Vorgabe bleibt die klassische Ansicht. Wer nichts umstellt, bekommt
//      genau das, was er vorher hatte — das ist die wichtigste Zusage einer
//      parallel eingebauten zweiten Ansicht.
//   2. Im Panel-Modus tritt die Suchzeile ab und der Kopf übernimmt: Gruß,
//      Uhrzeit, Datum, Werkzeuge.
//   3. Die drei Werkzeuge treffen wirklich ihr Ziel (Suche aufklappen,
//      Mitteilungen, Einstellungen) — geprüft am Ergebnis, nicht am Klick.
//   4. Die Gesamthöhe bleibt bei 672 px. Daran hängt die Geometrie der ganzen
//      Seite (Sidebar auf top:396px, Detail-Overlay deckungsgleich); eine
//      andere Höhe würde beides verschieben, ohne dass es jemand bemerkt.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass } from './harness/card.js';

const PANEL_ON = {
  startScreen: { bento: true, bentoLayout: 'panel' },
  appearance: { statsBarEnabled: true },
};
const CLASSIC_ON = {
  startScreen: { bento: true },
  appearance: { statsBarEnabled: true },
};

/** Wartet, bis die Kacheln im Panel wirklich Inhalt tragen (nicht nur Platz). */
async function waitForPanel(root) {
  await expect(root.locator('.bento-panel')).toHaveCount(1, { timeout: 15000 });
  await expect(root.locator('.bento-panel .bento-widget')).toHaveCount(4, { timeout: 15000 });
  await expect
    .poll(async () => {
      const t = (await root.locator('.bento-panel .bento-widget').allInnerTexts())[0] || '';
      return t.trim().length > 0 && !t.includes('nicht konfiguriert');
    }, { timeout: 15000 })
    .toBe(true);
}

test.describe('Bento-Panel-Startseite', () => {
  test('ohne Umstellung bleibt es bei der klassischen Ansicht', async ({ page }) => {
    const root = await mountCard(page, { settings: CLASSIC_ON });
    await expect(root.locator('.bento-grid--desktop')).toHaveCount(1, { timeout: 15000 });
    // Kein Panel, und die Suchzeile steht weiter oben.
    await expect(root.locator('.bento-panel')).toHaveCount(0);
    await expect(root.locator('input.search-input')).toBeVisible();
  });

  test('im Panel-Modus liegen Kopf und Kacheln in einer Fläche', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    // Das Raster steckt IM Panel, nicht daneben.
    await expect(root.locator('.bento-panel .bento-grid')).toHaveCount(1);
    // Und die Suchzeile ist weg — der Kopf hat sie ersetzt.
    await expect(root.locator('input.search-input')).toBeHidden();
  });

  test('der Kopf zeigt Gruß, Uhrzeit und Datum', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON, lang: 'de' });
    await waitForPanel(root);

    // Gruß: die Sprüche wechseln nach Tageszeit und Zufall — geprüft wird, dass
    // überhaupt einer dasteht, nicht welcher.
    await expect(root.locator('.bento-panel-greet')).not.toBeEmpty();
    // Uhrzeit als hh:mm, Datum mit ausgeschriebenem Wochentag.
    await expect(root.locator('.bento-panel-clock-time')).toHaveText(/^\d{1,2}:\d{2}$/);
    await expect(root.locator('.bento-panel-clock-date')).toHaveText(/tag,/);
  });

  test('die Werkzeuge sitzen in einer Kapsel, das Profil daneben', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    // Genau zwei Knöpfe in der Kapsel (Glocke + Suche) …
    await expect(root.locator('.bento-panel-tools .bento-panel-tool')).toHaveCount(2);
    // … und das Profilbild liegt AUSSERHALB davon.
    await expect(root.locator('.bento-panel-tools .bento-panel-avatar')).toHaveCount(0);
    await expect(root.locator('.bento-panel-avatar')).toHaveCount(1);
  });

  test('die Suche im Kopf klappt das Suchpanel auf', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    await root.locator('.bento-panel-tool[title="Suchen"]').click();
    // Das Panel ist da, das Bento-Panel weicht.
    await expect(root.locator('input.search-input')).toBeVisible({ timeout: 10000 });
    await expect(root.locator('.bento-panel')).toHaveCount(0);
  });

  test('die Glocke öffnet das Mitteilungs-Center', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    await root.locator('.bento-panel-tool[title="Mitteilungen"]').click();
    await expect(root.locator('.detail-panel')).toHaveCount(1, { timeout: 10000 });
    await expect(root.locator('.detail-panel')).toContainText('Mitteilungen', { timeout: 10000 });
  });

  test('das Profilbild öffnet die Einstellungen', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    await root.locator('.bento-panel-avatar').click();
    await expect(root.locator('.detail-panel')).toHaveCount(1, { timeout: 10000 });
    await expect(root.locator('.detail-panel')).toContainText('Einstellungen', { timeout: 10000 });
  });

  test('eine wartende Warnung setzt eine Plakette an die Glocke', async ({ page }) => {
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);
    await expect(root.locator('.bento-panel-tool-badge')).toHaveCount(0);

    await updateHass(page, (states, entity) => {
      states['persistent_notification.test'] = entity(
        'persistent_notification.test', 'Testmeldung', 'notifying',
        { message: 'Filter wechseln', title: 'Wartung' },
      );
    });
    await expect(root.locator('.bento-panel-tool-badge')).toHaveText('1', { timeout: 12000 });
  });

  test('die Gesamthöhe bleibt bei 672 px', async ({ page }) => {
    // 🔑 Diese Zahl trägt die Seitengeometrie: .main-container--bento rechnet mit
    // min-height 732 (60 Insel + 672) und die Sidebar steht fest auf top:396px
    // (= 60 + 672/2). Wächst oder schrumpft das Panel, rutscht beides.
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    // 🔑 `offsetHeight`, nicht `getBoundingClientRect`: die Bühne wird im
    // Harness auf 0.95 skaliert, das Rechteck läge damit bei 638 und die Zusage
    // wäre nicht prüfbar. offsetHeight liefert die Layout-Höhe ohne Transform.
    const h = await root.locator('.bento-panel').evaluate(el => el.offsetHeight);
    expect(h).toBe(672);

    // Und der Kopf bleibt bei den 61 px aus dem Entwurf — wächst er, frisst er
    // Kachelfläche, ohne dass die Gesamthöhe es verrät.
    const head = await root.locator('.bento-panel-head').evaluate(el => el.offsetHeight);
    expect(head).toBe(61);
  });

  test('auf dem Telefon stapeln die Kacheln, die kleinen bleiben nebeneinander', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const root = await mountCard(page, { settings: PANEL_ON });
    await waitForPanel(root);

    await expect(root.locator('.bento-panel--mobile')).toHaveCount(1);
    // Die drei Zellen stehen untereinander (gleiche linke Kante) …
    const lefts = await root.locator('.bento-panel .bento-cell').evaluateAll(
      els => els.map(e => Math.round(e.getBoundingClientRect().left))
    );
    expect(new Set(lefts).size).toBe(1);
    // … aber die beiden kleinen Kacheln teilen sich eine Reihe.
    const small = await root.locator('.bento-panel .bento-cell--w34 > .bento-widget').evaluateAll(
      els => els.map(e => Math.round(e.getBoundingClientRect().top))
    );
    expect(small.length).toBe(2);
    expect(small[0]).toBe(small[1]);
  });
});
