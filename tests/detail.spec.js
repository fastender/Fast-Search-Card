// tests/detail.spec.js
//
// v1.1.2195: Die Detail-Ansicht — der Teil der Karte, in dem der Nutzer
// tatsächlich etwas TUT. Bis hierher war sie ungedeckt, weil das Testhaus gar
// keine Geräte hatte: der Ladelauf behält nur Entities MIT Bereich, und der
// Registry-Mock antwortete überall mit einer leeren Liste. Seit die Registry
// im Harness echte Räume liefert, ist alles hinter der Suche prüfbar.
//
// Geprüft wird die Kette, auf die es ankommt:
//   Suche → Detail öffnet → richtige Steuerung je Domain → Tipper landet
//   wirklich bei Home Assistant → eine Antwort von HA verändert die Anzeige.
//
// Die Steuerungen sind bewusst über ihren Tooltip adressiert (`title`) und
// nicht über Position: eine umsortierte Leiste ist kein Fehlschlag wert, ein
// verschwundener Knopf schon.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, openDevice, serviceCalls, clearServiceCalls } from './harness/card.js';

test.describe('Detail-Ansicht', () => {
  test('öffnet mit Name, Raum und Zustand', async ({ page }) => {
    const root = await mountCard(page);
    const panel = await openDevice(root, page, 'Rolladen');

    // Links steht, WAS das Gerät ist (Name + Raum), rechts im Kopf WIE es
    // gerade dasteht (Zustand + Zeitpunkt) — nicht verwechseln.
    await expect(panel.locator('.detail-left-title-info').first()).toContainText('Rolladen');
    await expect(panel.locator('.detail-left-title-info').first()).toContainText('Wohnzimmer');
    await expect(panel.locator('.detail-header-name').first()).toContainText('70%');
    // Vier Reiter: Steuerung, Zeitplan, Verlauf, Kontext.
    await expect(root.locator('.detail-tab')).toHaveCount(4);
  });

  test('die Reiter tragen echte Tooltips, keine Übersetzungsschlüssel', async ({ page }) => {
    // v1.1.1723 hatte die 8 *Tab-Tooltips als „nie referenziert" gelöscht,
    // obwohl TabNavigation sie liest — seitdem stand dort „ui.tooltips.
    // controlsTab". Gefunden beim Bau dieser Suite, repariert in v1.1.2195.
    const root = await mountCard(page);
    await openDevice(root, page, 'Rolladen');

    const titles = await root.locator('.detail-tab').evaluateAll(
      els => els.map(e => e.getAttribute('title'))
    );
    expect(titles).toEqual(['Steuerung', 'Zeitplan', 'Verlauf', 'Kontext']);
  });

  test('jede Domain bekommt ihre eigene Steuerung', async ({ page }) => {
    const cases = [
      { query: 'Rolladen', buttons: ['Öffnen', 'Stop', 'Schließen', 'Position'] },
      { query: 'Box', buttons: ['Zurück', 'Wiedergabe', 'Weiter'] },   // pausiert → Play
      { query: 'Heizung', buttons: ['Heizen', 'Einstellungen'] },
    ];
    for (const { query, buttons } of cases) {
      const root = await mountCard(page);
      await openDevice(root, page, query);
      const titles = await root.locator('.control-button').evaluateAll(
        els => els.map(e => e.getAttribute('title'))
      );
      expect(titles, `Steuerung für ${query}`).toEqual(buttons);
    }
  });

  test('ein Tipper auf „Öffnen" erreicht Home Assistant', async ({ page }) => {
    const root = await mountCard(page);
    await openDevice(root, page, 'Rolladen');
    await clearServiceCalls(page);

    await root.locator('.control-button[title="Öffnen"]').click();
    await expect.poll(() => serviceCalls(page), { timeout: 8000 })
      .toContainEqual(expect.objectContaining({ domain: 'cover', service: 'open_cover' }));
  });

  test('ein Tipper auf „Wiedergabe" erreicht Home Assistant', async ({ page }) => {
    const root = await mountCard(page);
    await openDevice(root, page, 'Box');
    await clearServiceCalls(page);

    await root.locator('.control-button[title="Wiedergabe"]').click();
    await expect.poll(() => serviceCalls(page), { timeout: 8000 })
      .toContainEqual(expect.objectContaining({ domain: 'media_player' }));
  });

  test('eine Antwort von HA verändert die offene Detail-Ansicht', async ({ page }) => {
    // Das ist der Entity-Strom, einmal quer durch: state_changed → rAF-Flush →
    // setEntities → Detail-Ansicht. Genau die Kette, die beim DataProvider-Split
    // (v2192–2194) hätte brechen können.
    const root = await mountCard(page);
    const panel = await openDevice(root, page, 'Box');
    await expect(panel).toContainText('Testlied');

    await updateHass(page, (states, entity) => {
      states['media_player.wohnzimmer'] = entity('media_player.wohnzimmer', 'Wohnzimmer Box', 'paused', {
        media_title: 'Zweites Lied', media_artist: 'Testband',
        volume_level: 0.4, supported_features: 84381,
      });
    });
    await expect(panel).toContainText('Zweites Lied', { timeout: 10000 });
  });

  test('der Reiter lässt sich wechseln', async ({ page }) => {
    const root = await mountCard(page);
    await openDevice(root, page, 'Rolladen');
    await expect(root.locator('.controls-tab')).toHaveCount(1);

    await root.locator('.detail-tab[title="Verlauf"]').click();
    // Der Steuerungs-Reiter weicht — was danach kommt, lädt lazy.
    await expect(root.locator('.controls-tab')).toHaveCount(0, { timeout: 10000 });
  });
});
