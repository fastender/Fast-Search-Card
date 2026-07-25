// tests/bento-zen.spec.js
//
// v1.1.2214: Der Zen-Start — Ruhe zuerst, alles Weitere auf EINE Bewegung.
//
// Die Zusagen, die hier festgenagelt werden:
//   1. Die Ruhelage zeigt genau vier Dinge: Uhr, Gruß, Suche, wartende
//      Meldungen. Insel, Seitenleiste und Kacheln sind weg — nicht nur blass,
//      sondern unerreichbar (`pointer-events: none`).
//   2. EINE Bewegung genügt. Kein Weiterschieben, kein Fortschritt, an dem man
//      hängenbleiben kann — und ein zweiter Radstoß direkt danach darf nichts
//      umwerfen (Trackpad-Nachlauf).
//   3. Zurück führt zurück.
//   4. Die Suchleiste ist das Einzige, was bleibt, und öffnet die Suche.
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
  await expect.poll(() => visible(root, '.bento-zen-bar'), { timeout: 15000 }).toBe(true);
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

  test('die Ruhelage zeigt Uhr, Gruß und Suche — sonst nichts', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await waitForZen(root);

    // Uhr als hh:mm, Datum mit ausgeschriebenem Wochentag, ein Gruß.
    await expect(root.locator('.bento-zen-time')).toHaveText(/^\d{1,2}:\d{2}$/);
    await expect(root.locator('.bento-zen-date')).toHaveText(/tag,/);
    await expect(root.locator('.bento-zen-greet')).not.toBeEmpty();

    // Die Suchzeile der Karte tritt ab — die Leiste der Ansicht IST sie.
    await expect(root.locator('input.search-input')).toBeHidden();

    // Und das Raster ist nicht nur blass, sondern unerreichbar.
    expect(await visible(root, '.bento-cell--w1')).toBe(false);
  });

  test('eine wartende Meldung erscheint unter der Suche', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await expect(root.locator('.bento-zen-notif')).toHaveCount(0);

    await updateHass(page, (states, entity) => {
      states['persistent_notification.wartung'] = entity(
        'persistent_notification.wartung', 'Wartung', 'notifying',
        { message: 'Filter wechseln', title: 'Wartung' },
      );
    });
    await expect(root.locator('.bento-zen-notif')).toHaveCount(1, { timeout: 12000 });
    await expect(root.locator('.bento-zen-notif')).toContainText('Filter wechseln');
  });

  test('EINE Bewegung deckt alles auf', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    await root.locator('.bento-zen').hover();
    await page.mouse.wheel(0, 120);              // genau eine

    // Die Kacheln kommen zuletzt — auf sie warten heißt, die ganze Treppe prüfen.
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-cell--w1')).toBe(true);
    expect(await visible(root, '.bento-cell--w2')).toBe(true);
    // Uhr und Gruß haben abgetreten, die Leiste ist geblieben.
    expect(await visible(root, '.bento-zen-above')).toBe(false);
    expect(await visible(root, '.bento-zen-bar')).toBe(true);
    // Und die Insel ist wieder da.
    await expect.poll(() => visible(root, '.island-pill'), { timeout: 8000 }).toBe(true);
  });

  test('eine Bewegung zurück führt in die Ruhe', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.bento-zen').hover();

    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);

    await page.mouse.wheel(0, -120);
    await expect.poll(() => visible(root, '.bento-zen-above'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-cell--w1')).toBe(false);
  });

  test('der Nachlauf eines Trackpads wirft nichts um', async ({ page }) => {
    // Drei Stöße in Folge dürfen nicht zwischen Auf und Zu springen: nach dem
    // Auslösen ist die Bühne kurz taub.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.bento-zen').hover();

    await page.mouse.wheel(0, 90);
    await page.mouse.wheel(0, 90);
    await page.mouse.wheel(0, 90);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    expect(await visible(root, '.bento-zen-above')).toBe(false);
  });

  test('die Suchleiste öffnet die Suche', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    await root.locator('.bento-zen-bar').click();
    await expect(root.locator('input.search-input')).toBeVisible({ timeout: 10000 });
    await expect(root.locator('.bento-zen')).toHaveCount(0);
  });

  test('die Gesamthöhe bleibt bei 672 px', async ({ page }) => {
    // 🔑 Dieselbe Zusage wie bei den anderen beiden Startseiten: der Container
    // rechnet mit 732 (60 Insel + 672), die Seitenleiste steht fest auf 396.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    const h = await root.locator('.bento-zen').evaluate((el) => el.offsetHeight);
    expect(h).toBe(672);
  });
});
