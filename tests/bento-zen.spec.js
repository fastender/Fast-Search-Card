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
//   4. Aufgedeckt steht alles auf den Maßen der früheren klassischen Startseite:
//      dieselbe echte `.search-row` an derselben Stelle, dasselbe Raster.
//   5. Es ist die Startseite — ohne jede Umstellung.
//
// ⚠️ Zeiten: die Treppe läuft bis ~1580 ms (Kacheln zuletzt). Die Polls hier
// warten großzügig — lieber langsam grün als knapp rot.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass } from './harness/card.js';

// v1.1.2225: kein `bentoLayout` mehr — der Zen-Start IST die Startseite.
const ZEN_ON = {
  startScreen: { bento: true },
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
  test('mit eingeschaltetem Bento ist es der Zen-Start — ohne jede Umstellung', async ({ page }) => {
    // v1.1.2225: Vorher war das der Nachweis, dass die Vorgabe klassisch bleibt.
    // Die Wahl ist weg, also ist es jetzt der Nachweis, dass es keine mehr gibt:
    // ein gespeichertes `bentoLayout` darf nichts bewirken.
    const root = await mountCard(page, {
      settings: { startScreen: { bento: true, bentoLayout: 'classic' }, appearance: { statsBarEnabled: true } },
    });
    await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'false');
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

  test('aus der Suche zurück landet man im Bento, nicht im Sperrbildschirm', async ({ page }) => {
    // 🔑 Die Ansicht hängt bei jedem Ausflug aus — Suche auf, Gerät öffnen. Setzte
    // sie sich dabei zurück, müsste man nach jedem Zurück erneut aufdecken. Genau
    // das passierte bis v1.1.2218 (`resetZen` beim Aushängen).
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);

    // Suche öffnen — die Startseite hängt aus …
    await root.locator('input.search-input').click();
    await expect(root.locator('.bento-zen')).toHaveCount(0, { timeout: 10000 });

    // … und beim Zurück steht wieder das Bento, nicht die Ruhelage.
    await root.locator('.category-icon').click();
    await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 10000 });
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'true');
    await expect.poll(() => visible(root, '.bento-cell--w1'), { timeout: 10000 }).toBe(true);
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
  });

  test('aus der Insel ein Gerät öffnen zählt als Entsperren', async ({ page }) => {
    // 🔑 Wer im Sperrbildschirm die Insel antippt und dort ein Gerät wählt, hat
    // die Karte benutzt — auch ohne je aufgedeckt zu haben. Zurück gehört er ins
    // Bento, nicht erneut vor den Sperrbildschirm.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    // 🔑 Ein Timer taugt hier NICHT: er ist zwar eine Live-Aktivität, steht aber
    // nicht in der kuratierten Geräteliste — der Deep-Link fände nichts und die
    // Detail-Ansicht bliebe zu. Der spielende Lautsprecher des Testhauses ist
    // beides: Live-Aktivität UND echtes Gerät.
    await updateHass(page, (states) => {
      states['media_player.wohnzimmer'] = {
        ...states['media_player.wohnzimmer'],
        state: 'playing',
        last_changed: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };
    });
    await page.waitForTimeout(2500);

    // Insel antippen → Detail-Ansicht; die Startseite hängt aus.
    await root.locator('.island-pill').click({ timeout: 15000 });
    await expect(root.locator('.detail-panel')).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('.bento-zen')).toHaveCount(0);

    // Zurück → Bento, nicht Ruhelage.
    await root.locator('.back-button').first().click();
    await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'true');
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
  });

  test('bei aufgeklappter Insel schaltet das Rad nichts um', async ({ page }) => {
    // 🔑 Auf Scrollbarkeit zu prüfen reicht NICHT: mit wenigen Einträgen passt
    // die Liste ganz hinein und scrollt nicht — die Geste gehört ihr trotzdem.
    // Deshalb entscheidet der Zustand der Insel, nicht ihre Überlänge.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await updateHass(page, (states, entity) => {
      for (let i = 0; i < 3; i++) {
        states[`timer.k${i}`] = entity(`timer.k${i}`, `Timer ${i}`, 'active', {
          duration: '0:15:00',
          finishes_at: new Date(Date.now() + 400000 + i * 1000).toISOString(),
        });
      }
    });
    await page.waitForTimeout(2500);
    await root.locator('.island-pill').click({ timeout: 15000 });
    await expect(root.locator('.island-anchor[data-expanded="true"]')).toHaveCount(1, { timeout: 15000 });
    await page.waitForTimeout(1200);

    // Kurze Liste — sie scrollt nicht.
    const scrollbar = await root.locator('.island-list').evaluate(
      (el) => el.scrollHeight > el.clientHeight + 1,
    );
    expect(scrollbar).toBe(false);

    const kasten = await root.locator('.island-list').boundingBox();
    await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1500);

    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'false');
  });

  test('die Suchleiste wechselt durch alle vier Kategorien', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await waitForZen(root);
    await expect(root.locator('.bento-zen-search')).toHaveCount(1);

    // Standzeit 3,5 s, dazwischen wird getippt — deshalb nur die VOLLEN
    // Beschriftungen sammeln; „Ger" ist ein Zwischenstand, kein Ergebnis.
    const ziel = ['Aktionen', 'Benutzerdefiniert', 'Geräte', 'Sensoren'];
    const gesehen = new Set();
    for (let i = 0; i < 40; i++) {
      const t = (await root.locator('.bento-zen-cat-label').innerText()).trim();
      if (ziel.includes(t)) gesehen.add(t);
      if (gesehen.size === 4) break;
      await page.waitForTimeout(500);
    }
    expect([...gesehen].sort()).toEqual(ziel);

    // Der Schreibbalken blinkt durchgehend — er verschwindet nie.
    await expect(root.locator('.bento-zen-caret')).toHaveCount(1);
  });

  test('die Leiste hat feste Breite und springt beim Tippen nicht', async ({ page }) => {
    // 🔑 Sie sitzt in einer Spalte, deren Breite der GRUSS bestimmt. Mit
    // `width: 100%` wäre sie je nach Spruch mal 537, mal 610 px breit — und
    // spränge bei jedem Kategoriewechsel.
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await waitForZen(root);
    const messe = () => root.locator('.bento-zen-search').evaluate(
      (el) => Math.round(el.getBoundingClientRect().width),
    );
    const vorher = await messe();
    await page.waitForTimeout(3400);   // mindestens ein Wechsel
    expect(await messe()).toBe(vorher);
    expect(vorher).toBe(560);
  });

  test('ein Tipper öffnet die ZULETZT gewählte Kategorie, nicht die gezeigte', async ({ page }) => {
    // 🔑 Die Leiste zeigt reihum alle vier — sie ist eine Anzeige, kein
    // Umschalter. Geöffnet wird, wo der Nutzer zuletzt war; beim ersten Start
    // ist das die Vorgabe der Suche (Geräte).
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await waitForZen(root);

    // Warten, bis die Leiste NICHT mehr auf „Geräte" steht — dann ist gezeigt
    // und zuletzt-gewählt garantiert verschieden.
    await expect
      .poll(async () => (await root.locator('.bento-zen-cat-label').innerText()).trim(),
        { timeout: 20000 })
      .toMatch(/^(Sensoren|Aktionen|Benutzerdefiniert)$/);

    await root.locator('.bento-zen-search').click();
    const feld = root.locator('input.search-input');
    await expect(feld).toBeVisible({ timeout: 10000 });
    // Geöffnet ist „Geräte" — die zuletzt gewählte, nicht die angezeigte.
    await expect(feld).toHaveAttribute('placeholder', /Geräte/i);
    // Und das Bento wurde übersprungen.
    await expect(root.locator('.bento-zen')).toHaveCount(0);
    await expect(root.locator('.bento-cell--w1')).toHaveCount(0);
  });

  test('die Leiste trägt das Glas aus den Einstellungen', async ({ page }) => {
    // 🔑 Über `glass-panel` — dieselbe Kette wie das Suchpanel, damit Blur und
    // Sättigung aus dem Aussehen-Bereich automatisch greifen. Eine eigene,
    // fest verdrahtete `backdrop-filter` würde die Einstellungen ignorieren.
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    const leiste = root.locator('.bento-zen-search');
    expect(await leiste.evaluate((el) => el.classList.contains('glass-panel'))).toBe(true);
    const kette = await leiste.evaluate((el) => getComputedStyle(el, '::before').backdropFilter);
    expect(kette).toContain('blur(');
    expect(kette).toContain('saturate(');
    // Maße 1:1 aus der echten eingeklappten Leiste.
    expect(await leiste.evaluate((el) => el.offsetHeight)).toBe(72);
    expect(await leiste.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('35px');
    const label = await root.locator('.bento-zen-cat-label').evaluate((el) => {
      const cs = getComputedStyle(el);
      return `${cs.fontSize}/${cs.fontWeight}`;
    });
    expect(label).toBe('24px/400');
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
    // 🔑 Nicht in die MITTE der Liste zielen: seit die Suchleiste dazugekommen
    // ist, sitzt die Insel tiefer, und bei 720 px Fensterhöhe ragt die
    // aufgeklappte Liste unten heraus — der Zeiger landete außerhalb des
    // Fensters und das Rad ging ins Leere. Der obere Bereich ist immer sichtbar.
    const kasten = await liste.boundingBox();
    await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + 40);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(1200);

    expect(await liste.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'false');
  });

  test('auf dem Telefon steht alles im Bild und in der richtigen Ordnung', async ({ page }) => {
    // 🔑 Seit v1.1.2222 ist der Aufbau von OBEN verankert statt als Gruppe
    // mittig: Uhr und Datum oben, der Gruß dicht über der Leiste (er gehört
    // inhaltlich zu ihr), die Insel mit Abstand darunter, der Griff am Rand.
    // Geprüft wird deshalb die Reihenfolge und dass nichts aus dem Bild ragt —
    // nicht mehr eine Mitte.
    await page.setViewportSize({ width: 390, height: 844 });
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    expect(await root.locator('.bento-zen .bento-grid').evaluate(
      (el) => Math.round(el.getBoundingClientRect().height),
    )).toBe(0);

    const lage = await root.locator('.main-container').evaluate((c) => {
      const cb = c.getBoundingClientRect();
      const y = (s, kante = 'top') => {
        const e = c.querySelector(s);
        return Math.round(e.getBoundingClientRect()[kante] - cb.top);
      };
      return {
        datum: y('.bento-zen-date'),
        uhr: y('.bento-zen-time'),
        gruss: y('.bento-zen-greet'),
        leiste: y('.bento-zen-search'),
        leisteUnten: y('.bento-zen-search', 'bottom'),
        insel: y('.island-holder'),
        inselUnten: y('.island-holder', 'bottom'),
        griff: y('.bento-zen-grip'),
        karte: Math.round(cb.height),
        leisteBreit: Math.round(c.querySelector('.bento-zen-search').getBoundingClientRect().width),
        karteBreit: Math.round(cb.width),
      };
    });

    // Reihenfolge von oben nach unten.
    expect(lage.datum).toBeLessThan(lage.uhr);
    expect(lage.uhr).toBeLessThan(lage.gruss);
    expect(lage.gruss).toBeLessThan(lage.leiste);
    expect(lage.leisteUnten).toBeLessThan(lage.insel);
    expect(lage.inselUnten).toBeLessThan(lage.griff);
    // Nichts ragt heraus …
    expect(lage.datum).toBeGreaterThan(0);
    expect(lage.griff).toBeLessThan(lage.karte);
    // … und der Randabstand der Leiste beträgt 16 px auf jeder Seite.
    expect(lage.karteBreit - lage.leisteBreit).toBe(32);
  });

  test('aufgedeckt stimmen die Maße Pixel für Pixel', async ({ page }) => {
    // 🔑 DIE Zusage dieser Ansicht: nach der Animation darf sich nichts anders
    // anfühlen als vorher. Geprüft wird nicht „ungefähr gleich", sondern Lage und
    // Größe von Raster, allen drei Zellen UND der Suchzeile — auf beiden Größen.
    //
    // Anlass: v1.1.2215 hatte dem Raster `height: 576px` aufgezwungen. Auf dem
    // Desktop fiel das nicht auf (dort stimmt der Wert), auf dem Telefon quetschte
    // es die vier gestapelten Kacheln aus 1412 px in 576 px.
    //
    // v1.1.2225: Bis hierher stellte der Test einen frischen KLASSISCHEN Aufbau
    // daneben. Den gibt es nicht mehr, also stehen die Maße jetzt fest. Es sind
    // genau die klassischen: dieselbe Prüfung war in v1.1.2224 gegen die echte
    // klassische Ansicht grün, und die Kette rechnet auf 156 = 60 (Insel-Platz)
    // + 72 (Suchzeile) + 24 (Abstand) auf. Ändert sich eine Zahl, muss jemand
    // begründen, warum — nicht ein Vergleichspartner mitwandern.
    const ERWARTET = {
      1400: {
        grid: [0, 156, 1200, 576],
        w1:   [0, 156, 681, 576],
        w2:   [697, 156, 503, 316],
        w34:  [697, 488, 503, 244],
        row:  [0, 60, 1200, 72],
      },
      390: {
        grid: [0, 141, 350, 1412],
        w1:   [0, 141, 350, 422],
        w2:   [0, 575, 350, 422],
        w34:  [0, 1009, 350, 434],
        row:  [0, 60, 350, 57],
      },
    };

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

    for (const breite of [1400, 390]) {
      await page.setViewportSize({ width: breite, height: breite === 1400 ? 900 : 844 });
      const root = await mountCard(page, { settings: ZEN_ON });
      await waitForZen(root);
      await root.locator('.main-container').hover();
      await page.mouse.wheel(0, 120);
      await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
      await page.waitForTimeout(400);

      expect(await geo(root), `Breite ${breite}`).toEqual(ERWARTET[breite]);
    }
  });
});
