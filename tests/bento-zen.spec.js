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
import { mountCard, updateHass, openDevice, revealStart } from './harness/card.js';

// v1.1.2225: kein `bentoLayout` mehr — der Zen-Start IST die Startseite.
const ZEN_ON = {
  startScreen: { bento: true },
  appearance: { statsBarEnabled: true },
};

/** Sichtbarkeit im Sinne des Nutzers: da UND anfassbar. `display: none`
    behält die spezifizierte Deckkraft (1!) — wer nur opacity liest, hält
    eine ausgehängte Suchzeile für sichtbar. */
const visible = (root, sel) => root.locator(sel).evaluate((el) => {
  const cs = getComputedStyle(el);
  return cs.display !== 'none' && parseFloat(cs.opacity) > 0.5 && cs.pointerEvents !== 'none';
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
    // 🔑 NICHT /tag,/ — alle deutschen Wochentage enden auf „-tag" außer
    // Mittwoch. Die Prüfung war sechs von sieben Tagen grün und fiel jeden
    // Mittwoch um. Also den Wochentag ausrechnen, den die Karte zeigen MUSS.
    const wochentag = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
    await expect(root.locator('.bento-zen-date')).toContainText(`${wochentag},`);
    await expect(root.locator('.bento-zen-greet')).not.toBeEmpty();

    // v2238: Uhr dicker und größer (82/500, iOS-Vorbild), und direkt darunter
    // die Statuszeile — Wetter/Leistung aus den Insel-Quellen. Die Leistung
    // ist im Testhaus deterministisch (sensor.hausverbrauch → „1,2 kW").
    const uhrStil = await root.locator('.bento-zen-time').evaluate((el) => {
      const cs = getComputedStyle(el);
      return `${cs.fontSize}/${cs.fontWeight}`;
    });
    expect(uhrStil).toBe('82px/500');
    await expect(root.locator('.bento-zen-status')).toContainText('kW');

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
    // Uhr und Gruß haben abgetreten; die ECHTE Suchzeile steht über dem
    // Kachel-Panel (v2229: die Kapsel-Variante ist zurückgebaut — die echte
    // Zeile bringt Zurück-Knopf und die vier Kategorien mit).
    expect(await visible(root, '.bento-zen-curtain')).toBe(false);
    expect(await visible(root, '.search-row')).toBe(true);
    await expect(root.locator('input.search-input')).toBeVisible();
    expect(await visible(root, '.bento-zen-panel')).toBe(true);
    // Reihenfolge: Insel, Suchzeile, Panel.
    const inselOben = await root.locator('.island-holder').evaluate(el => el.getBoundingClientRect().top);
    const suchOben = await root.locator('.search-row').evaluate(el => el.getBoundingClientRect().top);
    const panelOben = await root.locator('.bento-zen-panel').evaluate(el => el.getBoundingClientRect().top);
    expect(inselOben).toBeLessThan(suchOben);
    expect(suchOben).toBeLessThan(panelOben);
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

    // v1.1.2250: Ein Tipp auf die Insel KLAPPT jetzt die Liste auf (früher
    // führte er direkt ins Gerät). Der Weg ins Gerät geht seither über die
    // Zeile — genau das prüft dieser Test weiterhin: aus der Insel heraus ein
    // Gerät öffnen zählt als Entsperren.
    await root.locator('.island-pill').click({ timeout: 15000 });
    await root.locator('.island-row').first().click({ timeout: 15000 });
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
    // v1.1.2239: aufgeklappt wird über den ▦-Knopf (Laufendes).
    await root.locator('.island-knopf[data-knopf="kacheln"]').click({ timeout: 15000 });
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
    // v1.1.2239: aufgeklappt wird über den ▦-Knopf (Laufendes).
    await root.locator('.island-knopf[data-knopf="kacheln"]').click({ timeout: 15000 });
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

    // v2228: In der Ruhe kollabiert das PANEL (das Raster steckt darin).
    expect(await root.locator('.bento-zen-panel').evaluate(
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
    // 🔑 Der Vertrag seit v1.1.2229: die ECHTE Suchzeile steht frei über dem
    // Kachel-Kasten (Zurück-Knopf + vier Kategorien — deshalb kam die
    // v2228-Kapsel wieder raus). Seit v1.1.2239 ist die Insel ein Zweizeiler:
    // Insel-Band 84 (Karte 72 + Rand 12) + Zeile 72 + 24 + Kasten 576 = 756;
    // die Unterkante fluchtet mit der aufgeklappten Suche. Seit v1.1.2245
    // (Frei-Sieg) ist der Kasten NUR Layout — kein Glas, kein Rand, kein
    // Polster: das Raster füllt die volle Fläche.
    const ERWARTET = {
      row:   [0, 84, 1200, 72],
      panel: [0, 180, 1200, 576],
      grid:  [0, 180, 1200, 576],
    };

    await page.setViewportSize({ width: 1400, height: 900 });
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);
    await root.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    await page.waitForTimeout(400);

    const desktop = await root.locator('.main-container').evaluate((c) => {
      const cb = c.getBoundingClientRect();
      const m = (sel) => {
        const e = c.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return [Math.round(b.left - cb.left), Math.round(b.top - cb.top),
                Math.round(b.width), Math.round(b.height)];
      };
      return { row: m('.search-row'), panel: m('.bento-zen-panel'),
               grid: m('.bento-zen-panel .bento-grid') };
    });
    expect(desktop).toEqual(ERWARTET);

    // Telefon: das Panel wächst mit dem Inhalt — geprüft werden die festen
    // Größen (Breite 350, Rand 16) und dass es wirklich wächst statt bei 576
    // abzuschneiden.
    await page.setViewportSize({ width: 390, height: 844 });
    const root2 = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root2);
    await root2.locator('.main-container').hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => visible(root2, '.bento-cell--w34'), { timeout: 15000 }).toBe(true);
    await page.waitForTimeout(400);

    const telefon = await root2.locator('.main-container').evaluate((c) => {
      const p = c.querySelector('.bento-zen-panel').getBoundingClientRect();
      const g = c.querySelector('.bento-zen-panel .bento-grid').getBoundingClientRect();
      return {
        breite: Math.round(p.width),
        rand: Math.round(g.left - p.left),
        hoehe: Math.round(p.height),
      };
    });
    expect(telefon.breite).toBe(350);
    expect(telefon.rand).toBe(0);         // v2245: Kasten ohne Polster/Rand
    expect(telefon.hoehe).toBeGreaterThan(1000);
  });
});

// ── Das Frei-Gerüst (v1.1.2230–2238; seit v1.1.2245 die EINZIGE Version) ─────
// Jedes Widget steht isoliert auf der Tapete (kein Panelglas), W1 trägt Bild
// und Fav/Sug-Reiter. Der Testlauf ist entschieden — das Panel-Layout ist
// gelöscht, der `zenLayout`-Schlüssel wird ignoriert.
test.describe('Frei-Gerüst (Bildkachel & Reiter)', () => {
  // 1×1-GIF, bewusst REIN ROT: der Pixeltest unten erkennt daran, dass die
  // Bild-Ebene wirklich MALT — nicht nur, dass ein Wert ankommt.
  const BILD = 'data:image/gif;base64,R0lGODlhAQABAIAAAP8AAAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
  const FREI = {
    startScreen: { bento: true, w1Image: BILD, widgets: ['__favorites__', 'todos', 'news', 'integration'] },
    appearance: { statsBarEnabled: true },
  };

  test('kein Panelglas, volle Suchzeile, Insel ganz oben, Favoriten als Bildkachel', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    // Listenansicht vorwählen — der Scroll-Fade und der Mittig-Start leben dort.
    const root = await mountCard(page, {
      settings: FREI,
      storage: { 'bentoCarouselView:__favorites__': 'list' },
    });
    await revealStart(page, root);

    // Favorit auf dem echten Weg, damit die Kachel ihr Karussell zeigt.
    await openDevice(root, page, 'Wohnzimmer Licht');
    await root.locator('.favorite-button').click();
    await expect(root.locator('.favorite-button.active')).toHaveCount(1, { timeout: 8000 });
    await root.locator('.back-button').click();
    await root.locator('.category-icon').click();
    await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 10000 });
    await page.waitForTimeout(1500);

    const m = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const cb = c.getBoundingClientRect();
      const panel = c.querySelector('.bento-zen-panel');
      const fav = c.querySelector('.bento-widget[data-widget-id="__favorites__"]');
      const pille = c.querySelector('.island-pill');
      return {
        panelGlas: getComputedStyle(panel, '::before').content,
        panelRand: getComputedStyle(panel).borderTopWidth,
        rowBreite: Math.round(c.querySelector('.search-row').getBoundingClientRect().width),
        favRot: getComputedStyle(fav).backgroundImage.includes('255, 69, 58'),
        bildDa: !!c.querySelector('.bento-widget-bild'),
        inselOben: Math.round(pille.getBoundingClientRect().top - cb.top),
      };
    });
    expect(m.panelGlas).toBe('none');       // kein Glas mehr am Layout-Kasten
    expect(m.panelRand).toBe('0px');
    expect(m.rowBreite).toBe(1200);         // volle Breite (v2236: 640er-Kapsel zurückgebaut)
    expect(m.favRot).toBe(false);           // Rot ist dem Bild gewichen
    expect(m.bildDa).toBe(true);
    expect(m.inselOben).toBeLessThanOrEqual(2);  // maximal oben

    // Und das Bild MALT (rein rotes Test-GIF; ~235 wegen des Lese-Schleiers).
    const pos = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const r = alle[alle.length - 1].querySelector('.bento-widget[data-widget-id="__favorites__"]').getBoundingClientRect();
      // 🔑 OBEN messen: seit die Liste mittig beginnt (v2231), sitzt bei 60 %
      // Höhe die weiße Gerätezeile — das Bild gehört der oberen Hälfte.
      return { x: Math.round(r.x + r.width * 0.5), y: Math.round(r.y + r.height * 0.25) };
    });
    const clip = await page.screenshot({ clip: { x: pos.x, y: pos.y, width: 4, height: 4 } });
    const rgb = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      return [...ctx.getImageData(1, 1, 1, 1).data.slice(0, 3)];
    }, clip.toString('base64'));
    expect(rgb[0]).toBeGreaterThan(180);
    expect(rgb[1]).toBeLessThan(60);

    // v1.1.2231: Und die ECKEN bleiben rund — Chrome hob die Bild-Ebene auf
    // den Compositor und die entkam der runden Beschneidung des Trägers
    // (mobil unten, Desktop rechts eckig). Ein Pixel 3 px in der Box-Ecke
    // liegt AUSSERHALB der Rundung und darf nie das rote Testbild zeigen.
    const kachel = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const r = alle[alle.length - 1].querySelector('.bento-widget[data-widget-id="__favorites__"]').getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), h: Math.round(r.height) };
    });
    for (const [ex, ey] of [[kachel.r - 4, kachel.y + 2], [kachel.r - 4, kachel.b - 4], [kachel.x + 2, kachel.b - 4]]) {
      const eclip = await page.screenshot({ clip: { x: ex, y: ey, width: 4, height: 4 } });
      const ergb = await page.evaluate(async (b64) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
        return [...ctx.getImageData(1, 1, 1, 1).data.slice(0, 3)];
      }, eclip.toString('base64'));
      expect(ergb[0] < 150 || ergb[1] > 80, `Ecke ${ex},${ey} zeigt das Bild: ${ergb}`).toBe(true);
    }

    // v1.1.2232: Die Zeilen BEGINNEN mittig (Startversatz als mitscrollendes
    // Polster), können aber bis ganz nach oben fahren — auch bei EINER Zeile,
    // weil unten exakt der fehlende Rest als Boden angehängt wird.
    const start = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const fav = c.querySelector('.bento-widget[data-widget-id="__favorites__"]').getBoundingClientRect();
      const zeile = c.querySelector('.bento-carousel-list-row').getBoundingClientRect();
      return (zeile.top - fav.top) / fav.height;
    });
    expect(start).toBeGreaterThan(0.38);
    expect(start).toBeLessThan(0.55);

    const obenAngekommen = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const liste = c.querySelector('.bento-carousel-list');
      liste.scrollTop = liste.scrollHeight;
      liste.dispatchEvent(new Event('scroll'));
      const fav = c.querySelector('.bento-widget[data-widget-id="__favorites__"]').getBoundingClientRect();
      const zeile = c.querySelector('.bento-carousel-list-row').getBoundingClientRect();
      return {
        anteil: (zeile.top - fav.top) / fav.height,
        bild: parseFloat(c.querySelector('.bento-widget-bild').style.opacity || '1'),
      };
    });
    expect(obenAngekommen.anteil).toBeLessThan(0.15);
    expect(obenAngekommen.bild).toBeLessThan(0.1);

    // v1.1.2233: W1 trägt Reiter mit Zählung — Favoriten ↔ Vorschläge, wie
    // beim News-Widget. Der Wechsel muss auch aus einem LEEREN Reiter wieder
    // herausführen (die Reiter stehen deshalb auch im Leer-Zustand).
    const reiter = root.locator('.bento-carousel-tab');
    await expect(reiter).toHaveCount(2);
    // v2236: Label und Zahl getrennt — die Zahl steht als Badge im Reiter
    // (1:1 Subcategory-Leiste), die Typografie 1:1 wie die Kalender-Reiter.
    await expect(reiter.first()).toContainText('Favoriten');
    await expect(reiter.first().locator('.bento-carousel-tab-zahl')).toHaveText('1');
    const reiterStil = await reiter.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return `${cs.fontSize}/${cs.fontWeight}/${cs.borderRadius}`;
    });
    expect(reiterStil).toBe('14px/600/16px');
    // Haarlinie unter der Reiter-Zeile, Fuß-Beschriftung weg (v2236).
    await expect(root.locator('.bento-widget--mit-reitern .bento-carousel-footer')).toHaveCount(0);
    const linie = await root.locator('.bento-widget--mit-reitern .bento-carousel-header').evaluate(
      (el) => getComputedStyle(el).borderBottomWidth);
    expect(linie).toBe('1px');
    // v2237: 1:1 heißt auch die HÖHE — das Badge hob den Reiter auf 35 px,
    // der Kalender-Reiter hat 31 (14er-Text + 7er-Polster).
    const reiterHoehe = await reiter.first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
    expect(reiterHoehe).toBeGreaterThanOrEqual(30);
    expect(reiterHoehe).toBeLessThanOrEqual(32);

    // v2237: Rasteransicht — die Zeilen dürfen NIE kollabieren. Die Karte
    // trägt container-type:inline-size; in der Grid-Spur-Vermessung wurde
    // ihre aspect-ratio-Höhe zum Größenzyklus (Spur = 0, Karten fächerten
    // übereinander). Flex-Wrap misst am Element — der Wrapper muss also
    // echte Höhe haben. Und der Kanten-Frost (oben/unten) liegt als Overlay
    // an, nicht als Maske (die wäre wieder die Backdrop-Wurzel von v2236).
    await root.locator('.bento-carousel-viewtoggle-btn').first().click();
    const gitterMass = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const w = c.querySelector('.bento-carousel-gitter .bento-widget-card-wrapper');
      return {
        wrapperHoehe: w ? Math.round(w.getBoundingClientRect().height) : 0,
        kanten: c.querySelectorAll('.bento-kante').length,
      };
    });
    expect(gitterMass.wrapperHoehe).toBeGreaterThan(100);
    expect(gitterMass.kanten).toBe(2);

    // v2238: Nach Ansichtswechseln muss der Wrapper auf KARTENHÖHE bleiben —
    // WebKit löste die Wrapper-aspect-ratio am recycelten Element gegen die
    // Containerbreite auf (Replik-Beweis); seit dem ::before-Polster sind
    // beide Engines deterministisch. Hier läuft die Chromium-Seite davon.
    await root.locator('.bento-carousel-viewtoggle-btn').nth(1).click();
    await page.waitForTimeout(250);
    await root.locator('.bento-carousel-viewtoggle-btn').first().click();
    await page.waitForTimeout(400);
    const stabil = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const w = alle[alle.length - 1].querySelector('.bento-carousel-gitter .bento-widget-card-wrapper');
      return {
        wrapper: Math.round(w.getBoundingClientRect().height),
        karte: Math.round(w.querySelector('.device-card').getBoundingClientRect().height),
      };
    });
    expect(Math.abs(stabil.wrapper - stabil.karte)).toBeLessThanOrEqual(2);

    // v2238: Die Scroll-Fläche liegt EXAKT zwischen Haarlinie und Kachelrahmen
    // (zurück in die Listenansicht, dort wurde es gemeldet).
    await root.locator('.bento-carousel-viewtoggle-btn').nth(1).click();
    await page.waitForTimeout(300);
    // 🔑 v1.1.2250: POLLEN statt einmal messen. Die Resthöhe der Scroll-Fläche
    // (`--w1-restboden`) rechnet BentoWidget asynchron nach jedem
    // Ansichtswechsel neu (ResizeObserver + Nachzügler-Timeouts); wer nach
    // einer festen Wartezeit einmal misst, erwischt gelegentlich den Stand
    // davor — der Test fiel dadurch sporadisch mit „unten: 17" um.
    const kante = () => page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const kachel = c.querySelector('.bento-widget--mit-reitern').getBoundingClientRect();
      const kopf = c.querySelector('.bento-carousel-header').getBoundingClientRect();
      const wrap = c.querySelector('.bento-carousel-list-wrap').getBoundingClientRect();
      return {
        oben: Math.round(wrap.top - kopf.bottom),
        unten: Math.round(kachel.bottom - wrap.bottom),
      };
    });
    await expect.poll(async () => (await kante()).unten, { timeout: 8000 }).toBeLessThanOrEqual(2);
    expect((await kante()).oben).toBeLessThanOrEqual(1);
    await reiter.nth(1).click();
    await expect(root.locator('.bento-widget[data-widget-id="__suggestions__"]')).toBeVisible({ timeout: 5000 });
    await expect(root.locator('.bento-carousel-tab')).toHaveCount(2);
    await root.locator('.bento-carousel-tab').first().click();
    await expect(root.locator('.bento-widget[data-widget-id="__favorites__"]')).toBeVisible({ timeout: 5000 });

    // v1.1.2233: Karten AUF dem Bild tragen die Aussehen-Glaskette (inaktive) —
    // die Klasse wird testhalber abgenommen, weil das Testhaus-Licht an ist.
    const kartenGlas = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('.main-container')];
      const karte = alle[alle.length - 1].querySelector('.bento-widget--hat-bild .device-card, .bento-widget--hat-bild .device-list-item');
      if (!karte) return '';
      karte.classList.remove('active');
      return getComputedStyle(karte).backdropFilter || '';
    });
    expect(kartenGlas).toContain('blur');
  });

  test('beim Hover wird die Zeile NICHT an der Scroll-Kante beschnitten', async ({ page }) => {
    // 🐞 v1.1.2246 (Nutzer-Report): Die Karten wachsen beim Hover (Liste 1.02,
    // Raster 1.05). `overflow-y: auto` am Scroller erzwingt `overflow-x`
    // ungleich visible — er beschneidet also alles, was über sein POLSTER
    // hinauswächst. Die Basisregel hält dafür 8 px bereit, die Reiter-Regel
    // aus v2238 hatte sie auf 2 px gekürzt: 3 px sichtbarer Beschnitt je Seite.
    // Geprüft wird beides, was zusammengehört: KEIN Überstand über die
    // Clip-Kante UND die Zeilen stehen in Ruhe unverändert dort, wo v2238 sie
    // haben wollte (der negative Rand darf sie nicht verschieben).
    await page.setViewportSize({ width: 1050, height: 900 });
    const root = await mountCard(page, {
      settings: FREI,
      storage: { 'bentoCarouselView:__favorites__': 'list' },
    });
    await revealStart(page, root);

    await openDevice(root, page, 'Wohnzimmer Licht');
    await root.locator('.favorite-button').click();
    await expect(root.locator('.favorite-button.active')).toHaveCount(1, { timeout: 8000 });
    await root.locator('.back-button').click();
    await root.locator('.category-icon').click();
    await expect(root.locator('.bento-zen')).toHaveCount(1, { timeout: 10000 });
    await page.waitForTimeout(1200);

    const messen = () => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const w1 = c.querySelector('.bento-widget[data-widget-id="__favorites__"]');
      const sc = w1.querySelector('.bento-carousel-list') || w1.querySelector('.bento-carousel-gitter');
      const k = w1.querySelector('.device-list-item') || w1.querySelector('.device-card');
      const scb = sc.getBoundingClientRect(), kb = k.getBoundingClientRect();
      return {
        skaliert: getComputedStyle(k).transform !== 'none',
        ueberstandLinks: Math.round(scb.left - kb.left),
        ueberstandRechts: Math.round(kb.right - scb.right),
        einzugLinks: Math.round(kb.left - w1.getBoundingClientRect().left),
      };
    };

    // Ruhe: die Zeile sitzt 19 px innerhalb der Kachelkante (16 Kachel-Polster
    // + 2 Scroller-Polster + 1 Rahmen) — der Stand aus v2238.
    const ruhe = await page.evaluate(messen);
    expect(ruhe.einzugLinks).toBeGreaterThanOrEqual(18);
    expect(ruhe.einzugLinks).toBeLessThanOrEqual(20);

    // Hover Listenansicht: die Karte wächst, bleibt aber INNERHALB der Kante.
    await root.locator('.bento-carousel-list-row').first().hover();
    await page.waitForTimeout(500);
    const liste = await page.evaluate(messen);
    expect(liste.skaliert).toBe(true);
    expect(liste.ueberstandLinks).toBeLessThanOrEqual(0);
    expect(liste.ueberstandRechts).toBeLessThanOrEqual(0);

    // Und dasselbe im Raster (dort skalieren die Karten sogar auf 1.05).
    await page.mouse.move(5, 5);
    await root.locator('.bento-carousel-viewtoggle-btn').first().click();
    await page.waitForTimeout(500);
    await root.locator('.bento-carousel-gitter .device-card').first().hover();
    await page.waitForTimeout(500);
    const raster = await page.evaluate(messen);
    expect(raster.skaliert).toBe(true);
    expect(raster.ueberstandLinks).toBeLessThanOrEqual(0);
  });

});

// ── Am Finger ────────────────────────────────────────────────────────────────
// v1.1.2227: Der einzige Blick, der den touch-action-Fehler je fangen konnte.
// `touch-action: none` lag auf der GANZEN Zen-Ansicht statt nur auf der
// verriegelten — der Browser pannte auf dem Telefon nirgendwo mehr, während
// das Mausrad (davon unberührt) normal lief. Jeder Rad-Test war deshalb grün.
test.describe('Zen-Startseite am Finger', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('der Wisch deckt auf — danach gehört der Finger dem Scrollen', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON });
    await waitForZen(root);

    const scroller = () => page.evaluate(() => {
      const div = [...document.querySelectorAll('div')].find((d) =>
        d.scrollHeight > d.clientHeight + 20 && ['auto', 'scroll'].includes(getComputedStyle(d).overflowY));
      return div ? div.scrollTop : -1;
    });
    const wisch = async (cdp, weit) => cdp.send('Input.synthesizeScrollGesture', {
      x: 195, y: 500, xDistance: 0, yDistance: -weit, speed: 800,
      gestureSourceType: 'touch',
    });
    const cdp = await page.context().newCDPSession(page);

    // Verriegelt: der Wisch nach oben ist die Aufdeck-Geste, kein Scroll.
    await wisch(cdp, 300);
    await expect(root.locator('.bento-zen')).toHaveAttribute('data-revealed', 'true', { timeout: 8000 });

    // Aufgedeckt: derselbe Wisch MUSS jetzt scrollen. Mit `touch-action: none`
    // auf der Ansicht bleibt das Delta exakt 0 — genau der gemeldete Fehler.
    await expect.poll(() => root.locator('.bento-cell--w1').evaluate(
      (el) => getComputedStyle(el).pointerEvents !== 'none'), { timeout: 15000 }).toBe(true);
    const vorher = await scroller();
    await wisch(cdp, 400);
    await expect.poll(scroller, { timeout: 5000 }).toBeGreaterThan(vorher + 100);
  });
});
