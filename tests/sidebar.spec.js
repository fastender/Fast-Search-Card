// tests/sidebar.spec.js
//
// v1.1.2234: Die Shortcut-Leiste — welche Einträge wirklich ankommen.
//
// Anlass ist ein Fehler, den weder der Build noch das Auge beim Durchklicken
// fangen konnte: In `DEFAULT_SHORTCUT_IDS` stand der ORDNERNAME der Zeitplan-
// Entity (`all-schedules`, Bindestrich) statt ihrer registrierten ID
// (`all_schedules`, Unterstrich). Die Auflösung läuft über
// `systemRegistry.entities.get(id)`; für einen unbekannten String kommt
// `undefined` zurück, und die Schleife überspringt ihn wortlos — kein Fehler,
// keine Warnung, keine Lücke. Auf jeder frischen Installation fehlte der
// Eintrag „Zeitpläne Übersicht", und die Leiste sah mit vier Symbolen einfach
// so aus, als wäre sie so gemeint.
//
// Deshalb prüft der erste Test die GANZE Liste und nicht nur, dass irgendwas
// da ist: Ein stumm verschwindender Eintrag fällt nur auf, wenn man die
// vollständige Erwartung hinschreibt.
//
// Die übrigen Tests halten den Speicher-Pfad fest. Die kaputte ID steckt bei
// Bestandsnutzern in `localStorage` — beide Settings-Tabs setzen ihren
// Startwert aus der Default-Liste und schreiben die GANZE Liste zurück, sobald
// ein einziger Schalter umgelegt wird. Ein Fix nur an der Default-Liste hätte
// genau die Nutzer nicht erreicht, die den Eintrag vermisst und deshalb in den
// Einstellungen nachgesehen haben.

import { test, expect } from '@playwright/test';
import { mountCard, revealStart } from './harness/card.js';

const ZEN_ON = {
  startScreen: { bento: true },
  appearance: { statsBarEnabled: true },
};

/**
 * Die Beschriftungen der Leiste, in Anzeige-Reihenfolge.
 *
 * 🔑 Über `aria-label` und nicht über den sichtbaren Text: Auf dem Desktop
 * liegt die Schrift eingeklappt auf `width: 0` / `opacity: 0` und klappt erst
 * beim Überfahren auf. `innerText` wäre dort leer — die Prüfung würde nicht
 * die Einträge messen, sondern den Hover-Zustand.
 */
const sidebarLabels = (root) =>
  root.locator('.vpm-item').evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')));

/** Leiste aufdecken (sie hängt am aufgedeckten Zen-Start) und stehen lassen. */
async function revealSidebar(page, root) {
  await revealStart(page, root);
  // Die System-Entities werden beim Boot asynchron entdeckt; die Leiste hört
  // auf `entity-registered` und rendert nach. Auf die ANZAHL warten, nicht auf
  // eine Zeit — sonst misst man je nach Rechnerlaune eine halb gefüllte Leiste.
  await expect.poll(() => root.locator('.vpm-item').count(), { timeout: 15000 })
    .toBeGreaterThan(4);
}

test.describe('Shortcut-Leiste', () => {
  test('frisch installiert stehen alle fünf Einträge in der Leiste', async ({ page }) => {
    // Bewusst OHNE `sidebar`-Abschnitt: genau der Zustand einer neuen
    // Installation, in dem DEFAULT_SHORTCUT_IDS greift.
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await revealSidebar(page, root);

    expect(await sidebarLabels(root)).toEqual([
      'Home',
      'Einstellungen',
      'Zeitpläne Übersicht',
      'Aufgaben',
      'Nachrichten',
    ]);
  });

  test('auf Englisch ebenso — der Eintrag hängt nicht an der Sprache', async ({ page }) => {
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'en' });
    await revealSidebar(page, root);

    expect(await sidebarLabels(root)).toEqual([
      'Home',
      'Settings',
      'Schedules Overview',
      'Tasks',
      'News',
    ]);
  });

  test('eine gespeicherte Liste mit der alten Schreibweise verliert den Eintrag nicht', async ({ page }) => {
    // Der Stand eines Bestandsnutzers, der in den Sidebar-Einstellungen jemals
    // irgendeinen Schalter umgelegt hat: Die Default-Liste von damals — mit dem
    // Bindestrich — liegt seitdem im Storage.
    const root = await mountCard(page, {
      settings: {
        ...ZEN_ON,
        sidebar: { items: ['__home__', 'settings', 'all-schedules', 'todos', 'news'] },
      },
      lang: 'de',
    });
    await revealSidebar(page, root);

    expect(await sidebarLabels(root)).toEqual([
      'Home',
      'Einstellungen',
      'Zeitpläne Übersicht',
      'Aufgaben',
      'Nachrichten',
    ]);
  });

  test('beide Schreibweisen nebeneinander ergeben EINEN Eintrag', async ({ page }) => {
    // Wer den Eintrag vermisst hat, hat ihn in den Einstellungen neu aktiviert —
    // dabei wurde die richtige ID ANGEHÄNGT, während die alte stehen blieb. Ohne
    // Entdopplung stünde „Zeitpläne Übersicht" nach der Übersetzung zweimal in
    // der Leiste, mit doppeltem `key`.
    const root = await mountCard(page, {
      settings: {
        ...ZEN_ON,
        sidebar: { items: ['__home__', 'settings', 'all-schedules', 'todos', 'news', 'all_schedules'] },
      },
      lang: 'de',
    });
    await revealSidebar(page, root);

    expect(await sidebarLabels(root)).toEqual([
      'Home',
      'Einstellungen',
      'Zeitpläne Übersicht',
      'Aufgaben',
      'Nachrichten',
    ]);
  });

  test('derselbe Fehler steckte im Zeitplan-Slot der Startseite', async ({ page }) => {
    // `DEFAULT_BENTO_WIDGETS` trug denselben Ordnernamen. W2 fiel dort durch
    // ALLE vier Auflösungsstufen von `useBentoSlots` (Live-Gerät, Präfix,
    // Domain, Registry) und landete auf `null` — die Startseite zeigte auf
    // einer frischen Installation „Widget nicht konfiguriert".
    const root = await mountCard(page, { settings: ZEN_ON, lang: 'de' });
    await revealStart(page, root);

    const w2 = root.locator('.bento-cell--w2');
    await expect(w2.locator('.bento-widget--empty')).toHaveCount(0, { timeout: 15000 });
  });
});
