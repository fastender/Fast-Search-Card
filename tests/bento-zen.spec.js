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

  test('zurück ist nicht mehr möglich — der Weg ist einbahnig', async ({ page }) => {
    // 🔑 Wer aufgedeckt hat, ist im Bento und bleibt dort. Sonst könnte ein
    // Scrollen nach oben in der fertigen Ansicht versehentlich wieder im
    // Sperrbildschirm landen. Zurück führt nur das Verlassen der Ansicht.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();

    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);

    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(1600);
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'true');
    expect(await visible(root, '.bento-cell--w1')).toBe(true);
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
  });

  test('die Kacheln behalten ihr Glas — kein Filter über ihnen', async ({ page }) => {
    // 🔑 Ein `filter` auf einem Vorfahren — auch `blur(0px)` — macht ihn zur
    // „backdrop root": jedes `backdrop-filter` darunter sieht dann nur noch den
    // Inhalt dieses Vorfahren statt der Wand dahinter. Genau daran verlor
    // Kachel 2 ihre Unschärfe gegenüber der klassischen Startseite (v1.1.2217).
    // Deshalb wird hier die ganze Kette geprüft, nicht das Aussehen.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);

    const filterKette = await root.locator('.bento-cell--w2').evaluate((el) => {
      const treffer = [];
      let node = el;
      while (node && node.nodeType === 1) {
        const f = getComputedStyle(node).filter;
        if (f && f !== 'none') treffer.push(`${node.className || node.tagName}: ${f}`);
        node = node.parentElement || node.getRootNode()?.host;
      }
      return treffer;
    });
    expect(filterKette).toEqual([]);
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

  test('in der Insel-Liste scrollen deckt NICHT auf', async ({ page }) => {
    // 🔑 Die Geste hört auf der ganzen Karte — sonst täte ein Rad über der Insel
    // nichts, weil sie ein Geschwister der Ansicht ist. Der Preis: sie hörte
    // auch mit, wenn jemand IN der aufgeklappten Insel scrollen wollte, und
    // schaltete beim ersten Tick um. Wer in einer scrollbaren Fläche wischt,
    // will dort scrollen.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await updateHass(page, (states, entity) => {
      for (let i = 0; i < 14; i++) {
        states[`timer.t${i}`] = entity(`timer.t${i}`, `Timer ${i}`, 'active', {
          duration: '0:15:00',
          finishes_at: new Date(Date.now() + 400000 + i * 1000).toISOString(),
        });
      }
    });
    // Der Insel Zeit lassen, die vierzehn Timer aufzunehmen — vorher trägt sie
    // noch keine Liste, und ein Tipper öffnet dann etwas anderes.
    await page.waitForTimeout(2500);
    const liste = root.locator('.island-list');
    await root.locator('.island-pill').click({ timeout: 15000 });
    // Die Liste klappt über ~480 ms auf. Erst ausklappen lassen — ein Kasten,
    // der währenddessen gemessen wird, zeigt eine Stelle, die es danach nicht
    // mehr gibt, und das Rad ginge ins Leere.
    await expect(liste).toHaveCount(1, { timeout: 15000 });
    await page.waitForTimeout(1500);
    expect(await liste.evaluate((el) => el.scrollHeight > el.clientHeight + 1)).toBe(true);

    // Kein `hover()`: Playwright wartet dort auf eine Ruhe, die eine tickende
    // Insel nicht bietet. Die Maus direkt hinfahren ist ohnehin näher an dem,
    // was geprüft werden soll — ein Rad an genau dieser Stelle.
    const kasten = await liste.boundingBox();
    await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1200);

    expect(await liste.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'false');
  });

  test('auf dem Telefon steht die Ruhelage mittig im Bild', async ({ page }) => {
    // 🔑 Der Vorhang liegt über der GANZEN Karte. Auf dem Telefon ist das Raster
    // gestapelt über 1400 px hoch — läge es in der Ruhe im Fluss, zentrierte
    // sich der Vorhang in dessen Mitte und stünde weit unter dem Bildrand.
    await page.setViewportSize({ width: 390, height: 844 });
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    const rasterHoehe = await root.locator('.bento-zen .bento-grid').evaluate(
      (el) => Math.round(el.getBoundingClientRect().height),
    );
    expect(rasterHoehe).toBe(0);

    // Uhr, Gruß und Insel liegen vollständig im sichtbaren Bereich der Karte.
    const lage = await root.locator('.main-container').evaluate((c) => {
      const cb = c.getBoundingClientRect();
      const a = c.querySelector('.bento-zen-above').getBoundingClientRect();
      const i = c.querySelector('.island-holder').getBoundingClientRect();
      return {
        oben: Math.round(a.top - cb.top),
        unten: Math.round(i.bottom - cb.top),
        karte: Math.round(cb.height),
      };
    });
    expect(lage.oben).toBeGreaterThan(0);
    expect(lage.unten).toBeLessThan(lage.karte);
    // Und die Gruppe sitzt ungefähr mittig (Toleranz: der Griff unten zieht
    // sie ein Stück nach oben).
    const mitte = (lage.oben + lage.unten) / 2;
    expect(Math.abs(mitte - lage.karte / 2)).toBeLessThan(70);
  });

  test('aufgedeckt ist es Pixel für Pixel die klassische Startseite', async ({ page }) => {
    // 🔑 DIE Zusage dieser Ansicht: nach der Animation darf sich nichts anders
    // anfühlen als vorher. Deshalb wird hier nicht „ungefähr gleich" geprüft,
    // sondern die Lage und Größe von Raster, allen drei Zellen UND der Suchzeile
    // gegen einen frischen klassischen Aufbau gestellt — auf beiden Größen.
    //
    // Anlass: v1.1.2215 hatte dem Raster `height: 576px` aufgezwungen. Auf dem
    // Desktop fiel das nicht auf (dort stimmt der Wert), auf dem Telefon quetschte
    // es die vier gestapelten Kacheln aus 1412 px in 576 px.
    const geo = (root) => root.locator('.main-container').evaluate((c) => {
      const cb = c.getBoundingClientRect();
      const m = (sel) => {
        const e = c.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return [Math.round(b.left - cb.left), Math.round(b.top - cb.top),
                Math.round(b.width), Math.round(b.height)];
      };
      return { grid: m('.bento-grid'), w1: m('.bento-cell--w1'), w2: m('.bento-cell--w2'),
               w34: m('.bento-cell--w34'), row: m('.search-row') };
    });

    for (const [breite, hoehe] of [[1400, 900], [390, 844]]) {
      await page.setViewportSize({ width: breite, height: hoehe });

      let root = await mountCard(page, {
        settings: { startScreen: { bento: true }, appearance: { statsBarEnabled: true } },
      });
      await expect(root.locator('.bento-grid')).toHaveCount(1, { timeout: 15000 });
      await page.waitForTimeout(1500);
      const klassisch = await geo(root);

      root = await mountCard(page, { settings: ZEN_ON });
      await waitForZen(root);
      await root.locator('.main-container').hover();
      await page.mouse.wheel(0, 120);
      await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
      await page.waitForTimeout(400);

      expect(await geo(root), `Breite ${breite}`).toEqual(klassisch);
    }
  });
});
