// tests/bento-zen.spec.js
//
// v1.1.2215: Der Zen-Start — Ruhe zuerst, alles Weitere auf EINE Bewegung.
//
// Die Zusagen, die hier festgenagelt werden:
//   1. Die Ruhelage zeigt genau drei Dinge: Uhr, Gruß und die Insel — und die
//      Insel steht UNTER dem Gruß, nicht oben. Suchzeile, Seitenleiste und
//      Kacheln sind weg, nicht nur blass, sondern unerreichbar.
//   2. EINE Bewegung genügt. Kein Weiterschieben, kein Fortschritt, an dem man
//      hängenbleiben kann — und ein zweiter Radstoß direkt danach darf nichts
//      umwerfen (Trackpad-Nachlauf).
//   3. Zurück führt zurück.
//   4. Aufgedeckt ist es die KLASSISCHE Startseite: dieselbe echte `.search-row`
//      an derselben Stelle, dasselbe Raster. Nichts springt dabei.
//   5. Die Vorgabe ist unverändert klassisch.
//
// ⚠️ Zeiten: die Treppe läuft bis ~1580 ms (Kacheln zuletzt). Die Polls hier
// warten großzügig — lieber langsam grün als knapp rot.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass } from './harness/card.js';

const ZEN_ON = {
  startScreen: { bento: true, bentoLayout: 'zen' },
  appearance: { statsBarEnabled: true },
};

/** Sichtbarkeit im Sinne des Nutzers: da UND anfassbar. */
const visible = (root, sel) => root.locator(sel).evaluate((el) => {
  const cs = getComputedStyle(el);
  return parseFloat(cs.opacity) > 0.5 && cs.pointerEvents !== 'none';
});

async function waitForZen(root) {
  await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 15000 });
  // Der Auftritt dauert ~950 ms; danach steht die Ruhelage.
  await expect.poll(() => visible(root, '.bento-zen-curtain'), { timeout: 15000 }).toBe(true);
  // 🔑 UND warten, bis die KARTE steht. Ihr Boot-Reveal skaliert sie von 0.95
  // auf 1 — wer währenddessen misst, vergleicht gestauchte mit echten Werten
  // und bekommt Fehlschläge, die kommen und gehen. Verhältnis 1:1 zwischen
  // gezeichneter und gerechneter Höhe heißt: die Skalierung ist durch.
  await expect.poll(() => root.locator('.main-container').evaluate(
    (el) => Math.abs(el.getBoundingClientRect().height - el.offsetHeight) < 1.5,
  ), { timeout: 15000 }).toBe(true);
}

test.describe('Zen-Startseite', () => {
  test('ohne Umstellung bleibt es bei der klassischen Ansicht', async ({ page }) => {
    const root = await mountCard(page, {
      settings: { startScreen: { bento: true }, appearance: { statsBarEnabled: true } },
    });
    await expect(root.locator('.bento-grid--desktop')).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('.bento-zen')).toHaveCount(0);
    await expect(root.locator('input.search-input')).toBeVisible();
  });

  test('die Ruhelage zeigt Uhr, Gruß und die Insel — sonst nichts', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await waitForZen(root);

    // Uhr als hh:mm, Datum mit ausgeschriebenem Wochentag, ein Gruß.
    await expect(root.locator('.bento-zen-time')).toHaveText(/^\d{1,2}:\d{2}$/);
    await expect(root.locator('.bento-zen-date')).toHaveText(/tag,/);
    await expect(root.locator('.bento-zen-greet')).not.toBeEmpty();

    // Kein Sternchen mehr vor dem Gruß, und KEINE selbstgebaute Suchleiste:
    // die Suche ist die echte `.search-row` und schweigt in der Ruhe.
    await expect(root.locator('.bento-zen-mark')).toHaveCount(0);
    await expect(root.locator('.bento-zen-bar')).toHaveCount(0);
    expect(await visible(root, '.search-row')).toBe(false);

    // Die Insel ist da — und steht UNTER dem Gruß, nicht oben.
    expect(await visible(root, '.island-pill')).toBe(true);
    const grussUnten = await root.locator('.bento-zen-above').evaluate(el => el.getBoundingClientRect().bottom);
    const inselOben = await root.locator('.island-holder').evaluate(el => el.getBoundingClientRect().top);
    expect(inselOben).toBeGreaterThan(grussUnten);

    // Und das Raster ist nicht nur blass, sondern unerreichbar.
    expect(await visible(root, '.bento-cell--w1')).toBe(false);
  });

  test('EINE Bewegung deckt alles auf', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    await root.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);              // genau eine

    // Die Kacheln kommen zuletzt — auf sie warten heißt, die ganze Treppe prüfen.
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-cell--w1')).toBe(true);
    expect(await visible(root, '.bento-cell--w2')).toBe(true);
    // Uhr und Gruß haben abgetreten; die ECHTE Suchzeile ist da.
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
    expect(await visible(root, '.search-row')).toBe(true);
    await expect(root.locator('input.search-input')).toBeVisible();
    // Und die Insel ist an ihren Platz oben zurückgewandert.
    const inselOben = await root.locator('.island-holder').evaluate(el => el.getBoundingClientRect().top);
    const suchOben = await root.locator('.search-row').evaluate(el => el.getBoundingClientRect().top);
    expect(inselOben).toBeLessThan(suchOben);
  });

  test('eine Bewegung zurück führt in die Ruhe', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();

    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);

    await page.mouse.wheel(0, -120);
    await expect.poll(() => visible(root, '.bento-zen-curtain'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-cell--w1')).toBe(false);
  });

  test('der Nachlauf eines Trackpads wirft nichts um', async ({ page }) => {
    // Drei Stöße in Folge dürfen nicht zwischen Auf und Zu springen: nach dem
    // Auslösen ist die Bühne kurz taub.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();

    await page.mouse.wheel(0, 90);
    await page.mouse.wheel(0, 90);
    await page.mouse.wheel(0, 90);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
  });

  test('die Geometrie ist die der klassischen Startseite', async ({ page }) => {
    // 🔑 Aufgedeckt IST der Zen-Start die klassische Ansicht: Suchzeile und
    // Raster stehen an genau denselben Stellen. Und weil die Suchzeile auch in
    // der Ruhe ihren Platz behält (nur unsichtbar), springt beim Aufdecken
    // nichts — das prüft der Vergleich der beiden Zustände.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    const rasterOben = () => root.locator('.bento-zen .bento-grid').evaluate(
      el => Math.round(el.getBoundingClientRect().top - el.closest('.main-container').getBoundingClientRect().top)
    );
    const ruhe = await rasterOben();
    await root.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    expect(await rasterOben()).toBe(ruhe);

    const h = await root.locator('.bento-zen .bento-grid').evaluate(el => el.offsetHeight);
    expect(h).toBe(576);
  });
});
