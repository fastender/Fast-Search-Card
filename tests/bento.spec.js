// tests/bento.spec.js
//
// v1.1.2197: Die Bento-Kacheln — der Inhalt der Startseite.
//
// v1.1.2225: Seit die Startseite der Zen-Start ist, liegen die Kacheln beim
// Öffnen im Ruhezustand. Jeder Test deckt deshalb zuerst auf (`revealStart`) und
// prüft danach — sonst prüft er Kacheln, die der Nutzer noch nicht sieht. Die
// Choreografie des Aufdeckens selbst steht in bento-zen.spec.js.
//
// Geprüft wird, was den Bildschirm ausmacht: dass vier Kacheln in der
// eingestellten Reihenfolge erscheinen, dass eine geänderte Belegung wirklich
// durchschlägt, dass ein Tipper die passende Ansicht öffnet — und dass die
// Kacheln sich mit Home Assistant mitbewegen statt beim Startwert zu stehen.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, revealStart } from './harness/card.js';

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
  await revealStart(page, root);
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

  test('Aufgaben, Nachrichten und Kalender tragen alle denselben Scrollbalken', async ({ page }) => {
    // v1.1.2248 (Nutzer-Report): Die Nachrichten hatten seit v1549 einen
    // eigenen Scrollbalken, der Kalender seit v1649 — die Aufgaben als
    // einzige nicht. Man sah der Liste dort nicht an, dass unten noch etwas
    // wartet. Geprüft wird die GEMEINSAME Zusage: jede der drei Kacheln
    // rendert ihren Balken-Behälter.
    // 🔑 Die Rich-Fassung der Kacheln gibt es NUR im W2-Slot (`size ===
    // 'medium'`, BentoWidget.jsx) — Aufgaben müssen also an Position 2 stehen,
    // sonst rendert die schlichte Icon-Kachel und der Test misst ins Leere.
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: { bento: true, widgets: ['__favorites__', 'todos', 'news', 'integration'] },
      },
    });
    await waitForBento(root, page);
    await expect(root.locator('.bento-rich-todos')).toHaveCount(1, { timeout: 10000 });

    // 🔑 Der Balken erscheint NUR bei echtem Überlauf (CustomScrollbar prüft
    // scrollHeight > clientHeight). Das Testhaus hat zu wenige Aufgaben —
    // deshalb wird die Liste künstlich flach gemacht und ein Scroll-Ereignis
    // ausgelöst. Genau das prüft die Verdrahtung: Ref, Überlauf, Balken.
    const balken = await page.evaluate(async () => {
      const alle = [...document.querySelectorAll('.main-container')];
      const c = alle[alle.length - 1];
      const kachel = c.querySelector('.bento-rich-todos');
      const liste = kachel.querySelector('.bento-rich-todos-list');
      liste.style.maxHeight = '30px';
      liste.style.height = '30px';
      liste.dispatchEvent(new Event('scroll', { bubbles: true }));
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 400));
      return {
        ueberlauf: liste.scrollHeight > liste.clientHeight,
        hatBalken: !!kachel.querySelector('.custom-scrollbar-container'),
        // Bezugsrahmen: der Balken sitzt absolut, die Kachel muss ihn halten.
        positioniert: getComputedStyle(kachel).position,
        // Diagnose, falls der Balken ausbleibt (CustomScrollbar bricht bei
        // unsichtbarem oder nicht scrollendem Container ab):
        overflowY: getComputedStyle(liste).overflowY,
        sichtbar: typeof liste.checkVisibility === 'function'
          ? liste.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          : 'unbekannt',
        offsetParent: liste.offsetParent ? liste.offsetParent.className.split(' ')[0] : null,
      };
    });
    expect(balken).toEqual({
      ueberlauf: true, hatBalken: true, positioniert: 'relative',
      overflowY: 'auto', sichtbar: true, offsetParent: 'bento-rich-todos',
    });
  });

  test('der Pause-Knopf des Schiebers sagt, was er tut — auch mit der Maus darauf', async ({ page }) => {
    // 🐞 v1.1.2251 (Nutzer-Report): Der Zeiger MUSS im Widget sein, um den
    // Knopf zu treffen — und genau das pausierte den Schieber automatisch.
    // Der Knopf las diesen Hover-Halt und zeigte deshalb IMMER „Play"; ein
    // Druck darauf pausierte dann dauerhaft. Beschriftung und Wirkung waren
    // gegenläufig. Jetzt spiegelt er nur die Nutzerwahl.
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: { bento: true, widgets: ['__favorites__', '__rich_slider__', 'news', 'integration'] },
      },
    });
    await waitForBento(root, page);
    const schieber = root.locator('.bento-rich-slider');
    await expect(schieber).toHaveCount(1, { timeout: 10000 });
    const knopf = schieber.locator('.hero-slide-pause');
    // Ohne Dots (nur ein Eintrag) gibt es keinen Knopf — dann ist hier nichts
    // zu prüfen; der Testhaus-Inhalt entscheidet das.
    if ((await knopf.count()) === 0) test.skip(true, 'Schieber hat nur einen Eintrag — kein Pager');

    await schieber.hover();
    await expect(knopf).toHaveAttribute('aria-label', 'Pause');   // NICHT „Play"
    await knopf.click();
    await expect(knopf).toHaveAttribute('aria-label', 'Play');    // jetzt hält er
    await knopf.click();
    await expect(knopf).toHaveAttribute('aria-label', 'Pause');
  });

  test('KEINE Kachel trägt mehr das alte Favoriten-Rot', async ({ page }) => {
    // v1.1.2245: Das Apple-Rot der Favoriten (v2224) ist mit dem Panel-Layout
    // gestorben — im Frei-Gerüst trägt W1 Bild oder Glas. Der Test hält das
    // Gegenteil des alten Vertrags fest: taucht das Rot wieder auf, ist eine
    // gelöschte Regel zurückgekommen (PurgeCSS-Safelist-Falle).
    const root = await mountCard(page, {
      settings: {
        ...BENTO_ON,
        startScreen: { bento: true, widgets: ['__favorites__', 'todos', '__suggestions__', 'news'] },
      },
    });
    await waitForBento(root, page, 0);

    const farben = await page.evaluate(() => {
      const behaelter = document.querySelectorAll('.main-container');
      const c = behaelter[behaelter.length - 1];
      const lies = (id) => {
        const el = c.querySelector(`.bento-widget[data-widget-id="${id}"]`);
        return el ? getComputedStyle(el).backgroundImage : null;
      };
      return { fav: lies('__favorites__'), sug: lies('__suggestions__') };
    });

    expect(farben.fav || '').not.toContain('rgba(255, 69, 58');
    expect(farben.sug || '').not.toContain('rgba(255, 69, 58');
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
    // v1.1.2225: und ohne Startseite auch ohne deren Ruhelage — der Schalter
    // muss die ganze Zen-Ansicht aushängen, nicht nur das Raster.
    await expect(root.locator('.bento-zen')).toHaveCount(0);
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
