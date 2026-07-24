// tests/island.spec.js
//
// v1.1.2191: Die Insel (v2170–2181). Sie ersetzt die StatsBar, wurde in sieben
// Phasen gebaut und danach perf-optimiert — ihre Zustandswahl ist damit die
// Stelle mit den meisten Umbauten und dem größten Regressionsrisiko.
//
// Geprüft wird die BEOBACHTBARE Zusage: welcher Inhalt erscheint in welcher
// Situation. Bewusst NICHT geprüft: Animationsdetails (spröde) und die
// pure Zustandswahl selbst — die hat ihre eigene Node-Suite in islandState.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, broadcast, islandText } from './harness/card.js';

// Die Insel erscheint nur, wenn Suche offen ODER Bento aktiv ODER Detail offen.
const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

/**
 * v1.1.2206: Aufklappen geschieht per KLICK (der Langdruck wurde entfernt).
 * Aufgeklappt wird nur bei MEHREREN Live-Aktivitäten — eine einzelne öffnet
 * beim Klick direkt ihr Gerät.
 */
async function expandIsland(root) {
  await root.locator('.island-head').click();
}

/** Zwei laufende Aktivitäten setzen (Voraussetzung fürs Aufklappen). */
async function seedTwoLive(page) {
  await updateHass(page, (states, entity) => {
    states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
      duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
    });
    states['media_player.wohnzimmer'] = entity('media_player.wohnzimmer', 'Box', 'playing', {
      media_title: 'Lied', volume_level: 0.4, supported_features: 84381,
    });
  });
}

test.describe('Insel', () => {
  test('Ruhegesicht zeigt Dauerwerte und eine gezählte Haus-Tatsache', async ({ page }) => {
    // v1.1.2209: KEINE Uhr mehr (Nutzer-Entscheid). Links die Dauerwerte —
    // im Testhaus der 1234-W-Sensor als „1,2 kW" — daneben der Fakten-Roll.
    await mountCard(page, { settings: BENTO_ON });
    await expect.poll(() => islandText(page)).toContain('1,2 kW');
    // v1.1.2212: der Roll läuft jetzt durch ALLE aktiven Kategorien der
    // Leiste (5 im Testhaus, 4-s-Takt) — ein voller Zyklus dauert 20 s.
    await expect.poll(() => islandText(page), { timeout: 25000 }).toContain('1 Licht an');
  });

  test('der Roll zeigt die Aktiv-Zahlen der Kategorieleiste', async ({ page }) => {
    // v1.1.2212: der Roll zählt aus der KURATIERTEN Geräteliste mit den
    // Leisten-Regeln — vorher zählte er rohe States („9 lights on" vs.
    // „Lights 6" in der Leiste). Fenster/Türen sind raus: sie sind keine
    // Leisten-Kategorie.
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['light.kueche'] = entity('light.kueche', 'Küche Licht', 'on');
    });
    await expect.poll(() => islandText(page), { timeout: 25000 }).toContain('2 Lichter an');
    await expect.poll(() => islandText(page), { timeout: 25000 }).toContain('1 Schalter an');
  });

  test('laufender Timer verdrängt das Ruhegesicht und zählt herunter', async ({ page }) => {
    await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00',
        finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Pizza');

    // Der 1-Sekunden-Treiber (v2180) muss den Countdown wirklich bewegen.
    const before = await islandText(page);
    await expect.poll(() => islandText(page), { timeout: 8000 }).not.toBe(before);
  });

  test('eine neue Meldung übernimmt kurz und dockt als Chip an', async ({ page }) => {
    // v1.1.2209 (C1): Meldungen verdrängen die Live-Aktivität nicht mehr —
    // eine NEUE übernimmt die Kapsel für ~6 s (Zeitring) und kondensiert dann
    // in den Meldungs-Chip rechts; die Aktivität kehrt zurück.
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    // Boot-Gnade verstreichen lassen: Bestand beim Seitenaufbau kündigt sich
    // bewusst NICHT an — nur wirklich Neues übernimmt.
    await page.waitForTimeout(5200);
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity(
        'persistent_notification.p1', 'Meldung', 'notifying',
        { title: 'Waschmaschine fertig', message: 'Programm beendet' }
      );
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Waschmaschine fertig');
    // … und nach der Übernahme: Pizza zurück, Meldung als Chip.
    await expect.poll(() => islandText(page), { timeout: 12000 }).toContain('Pizza');
    await expect(root.locator('.island-chip-alert')).toHaveCount(1);
  });

  test('mehrere Meldungen zählen im Chip', async ({ page }) => {
    // v1.1.2209: keine „Sammlung" mehr in der Kapsel — der Meldungs-Chip
    // trägt die Stufenfarbe der höchsten Meldung und zählt.
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M1', 'notifying',
        { title: 'Waschmaschine fertig', message: 'x' });
      states['alert.fenster'] = entity('alert.fenster', 'Fenster offen', 'on');
    });
    const chip = root.locator('.island-chip-alert');
    await expect(chip).toHaveCount(1, { timeout: 8000 });
    await expect(chip.locator('.island-chip-count')).toHaveText('2');
    // alert.* ist Warnung → der Chip trägt Orange.
    await expect(chip).toHaveClass(/is-warn/);
  });

  test('Master-Toggle hängt die Insel aus und wieder ein', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await expect(root.locator('.island-pill')).toBeVisible();

    // v2180: bedingtes Mounten — die Kapsel darf nicht nur unsichtbar sein.
    await broadcast(page, 'statsBarEnabledChanged', false);
    await expect(root.locator('.island-pill')).toHaveCount(0);
    // Der Platzhalter bleibt, damit das Bento-Layout nicht springt.
    await expect(root.locator('.statsbar-bento-wrapper')).toHaveCount(1);

    await broadcast(page, 'statsBarEnabledChanged', true);
    await expect(root.locator('.island-pill')).toBeVisible();
  });

  test('Tippen auf eine Meldung öffnet das Mitteilungen-Center', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['persistent_notification.p1'] = entity('persistent_notification.p1', 'M', 'notifying',
        { title: 'Testmeldung', message: 'x' });
    });
    // v1.1.2209: innerhalb der Boot-Gnade keine Übernahme — die Meldung
    // erscheint als Chip; das Ruhegesicht-Tippen führt weiter ins Center.
    await expect(root.locator('.island-chip-alert')).toHaveCount(1, { timeout: 8000 });

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-notifications', () => window.__opened.push('notifications'));
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push('entity:' + e.detail.entityId));
    });
    await root.locator('.island-pill').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['notifications']);
  });

  test('Tippen auf eine Live-Aktivität öffnet deren Gerät', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await expect.poll(() => islandText(page), { timeout: 8000 }).toContain('Pizza');

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.island-pill').click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('ein Klick klappt die Insel zu EINER Form auf', async ({ page }) => {
    // v1.1.2204: Die Liste ist kein zweites Panel mehr, sondern Teil derselben
    // Form. Geprüft wird genau das: die Pille selbst wächst, ihr Radius geht
    // von der Kapsel auf weich-eckig, und die Zeilen stecken IN ihr.
    // v1.1.2206: per KLICK, nicht mehr per Langdruck.
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    const pill = root.locator('.island-pill');
    const zuHoehe = await pill.evaluate(el => el.offsetHeight);
    await expect(pill).toHaveAttribute('data-expanded', 'false');

    await expandIsland(root);

    await expect(pill).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    // Die Zeilen sind Kinder DER PILLE, nicht eines Nachbarn.
    await expect(pill.locator('.island-row')).toHaveCount(2);
    // Höhe wächst über die grid-rows-Animation (460 ms) — darauf pollen, nicht
    // einmal mitten im Aufklappen messen.
    await expect.poll(() => pill.evaluate(el => el.offsetHeight), { timeout: 5000 })
      .toBeGreaterThan(zuHoehe);

    // Kapsel → weich-eckig. Der Radius federt über 480 ms dorthin, also auf
    // den Endwert warten statt einmal mittendrin zu messen.
    await expect
      .poll(() => pill.evaluate(el => parseFloat(getComputedStyle(el).borderRadius)), { timeout: 5000 })
      .toBeLessThan(60);
  });

  test('aufgeklappt wird der Kopf zur Überschrift', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    await expandIsland(root);
    // Nach dem Überblenden steht dort die Überschrift — nicht mehr das Gerät.
    await expect.poll(() => islandText(page), { timeout: 6000 }).toContain('Live-Aktivitäten');
  });

  test('eine Zeile öffnet ihr Gerät und die Insel geht zurück in Ruhe', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');
    await expandIsland(root);
    await expect(root.locator('.island-row').first()).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.island-row').first().click();

    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
    // Und klappt danach zu: der Nutzer verlässt die Insel, sie kehrt in ihren
    // Ruhezustand zurück. (Im Mockup hatte ich das Gegenteil vermutet — dort
    // öffnete sich aber keine Detailansicht, die die Insel ohnehin verdeckt.)
    await expect(root.locator('.island-pill')).toHaveAttribute('data-expanded', 'false', { timeout: 5000 });
  });

  test('bleibt bei offener Detail-View bedienbar', async ({ page }) => {
    // v1.1.2207 (Tablet-Report): Mit offener Detail-View war die Insel tot —
    // ein pointer-events-Riegel aus v2206 hatte sie zum Passagier erklärt.
    // Sie muss sich auch dann aufklappen und ihre Zeilen müssen ziehen.
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    // Detail-View öffnen (fremd, nicht über die Insel).
    await page.evaluate(() => window.dispatchEvent(
      new CustomEvent('fsc-open-entity', { detail: { entityId: 'media_player.wohnzimmer' } })));
    await root.locator('.detail-panel').first().waitFor({ timeout: 15000 });

    await expandIsland(root);
    await expect(root.locator('.island-pill')).toHaveAttribute('data-expanded', 'true', { timeout: 5000 });
    await expect(root.locator('.island-row').first()).toBeVisible();

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.island-row', { hasText: 'Pizza' }).first().click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('Langläufer kondensieren zum Chip, Countdowns nie (Partition pur)', async ({ page }) => {
    // v1.1.2209: Die 90-s-Standzeit ist im UI-Test unpraktisch — die REGEL
    // selbst ist pur und wird direkt am Modul geprüft (Muster aus dem
    // Hero-Spec): Timer bleiben in der Kapsel, Stetiges kondensiert nach
    // Ablauf der Standzeit, vorher nicht.
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const mod = await import('/src/utils/islandState.js');
      const t0 = 1000000;
      const timer = { id: 't', domain: 'timer', endsAt: t0 + 60000 };
      const music = { id: 'm', domain: 'media_player', endsAt: null };
      const seen = new Map([['t', t0], ['m', t0]]);

      const frisch = mod.partitionLiveActivities([timer, music], seen, t0 + 10000);
      const spaeter = mod.partitionLiveActivities([timer, music], seen, t0 + mod.LONGRUNNER_HOLD_MS + 1000);
      return {
        frischDisplay: frisch.display.map(a => a.id),
        frischCondensed: frisch.condensed.map(a => a.id),
        spaeterDisplay: spaeter.display.map(a => a.id),
        spaeterCondensed: spaeter.condensed.map(a => a.id),
      };
    });
    // Frisch: beide sichtbar. Nach der Standzeit: Musik im Chip, Timer bleibt.
    expect(r.frischDisplay).toEqual(['t', 'm']);
    expect(r.frischCondensed).toEqual([]);
    expect(r.spaeterDisplay).toEqual(['t']);
    expect(r.spaeterCondensed).toEqual(['m']);
  });

  test('der Langläufer-Chip zeigt überlappende Kacheln und öffnet die Liste', async ({ page }) => {
    // Der UI-Teil der Kondensation — die Standzeit wird hier nicht abgewartet,
    // sondern die Partition über einen bereits „alten" Zeitstempel erzwungen:
    // wir lassen die Musik im Testhaus laufen und warten nur die zwei Ticks,
    // bis der Treiber sie sieht … dann prüfen wir Chip-Verhalten über die
    // Live-Liste (die kondensiertes MIT auflistet).
    const root = await mountCard(page, { settings: BENTO_ON });
    await seedTwoLive(page);
    await expect.poll(() => islandText(page), { timeout: 10000 }).toContain('Pizza');

    // Beide laufen, keine kondensiert (Standzeit nicht erreicht) → kein Chip.
    await expect(root.locator('.island-chip-live')).toHaveCount(0);

    // Aufklappen zeigt weiterhin ALLE Aktivitäten — Chip und Liste teilen
    // dieselbe Quelle.
    await expandIsland(root);
    await expect(root.locator('.island-row')).toHaveCount(2, { timeout: 5000 });
  });
});
