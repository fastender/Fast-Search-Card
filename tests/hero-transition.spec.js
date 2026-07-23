// tests/hero-transition.spec.js
//
// v1.1.2201: Der Hero-Übergang — die Insel morpht beim Tap in die Ziel-Ansicht
// und beim Schließen zurück. Der letzte offene Punkt der Roadmap.
//
// Eine Animation zu testen ist heikel: Pixel und Zeiten sind spröde und ändern
// sich bei jedem Feinschliff. Deshalb wird hier NICHT geprüft, WIE der Klon
// fliegt, sondern nur die zwei Zusagen, die wirklich zählen:
//
//   1. Der Klon entsteht, bewegt sich zum Ziel und RÄUMT SICH WIEDER AUF.
//   2. Scheitert der Übergang (Ziel mountet nie), bleibt trotzdem nichts
//      liegen — der Fallback löst den Klon auf. „Schlimmstenfalls wie vorher,
//      nie kaputt" ist die eigentliche Design-Zusage.
//
// Die reine DOM-Mechanik wird direkt geprüft (Modul per URL importiert), die
// Verdrahtung über einen echten Tap auf die Insel.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass } from './harness/card.js';

const BENTO_ON = { startScreen: { bento: true }, appearance: { statsBarEnabled: true } };

test.describe('Hero-Übergang — Modul', () => {
  test('ein Klon entsteht, fliegt zum Ziel und räumt sich auf', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const mod = await import('/src/utils/heroTransition.js');
      const holder = document.createElement('div');
      holder.style.cssText = 'position:relative;width:600px;height:400px';
      document.body.appendChild(holder);

      const hero = mod.createHeroClone({ holder, from: { left: 10, top: 10, width: 100, height: 40 } });
      const created = holder.querySelectorAll('.island-hero-clone').length;
      const el = holder.querySelector('.island-hero-clone');
      const leftStart = el.style.left;
      const positioned = getComputedStyle(el).position;

      hero.flyTo({ left: 300, top: 250, width: 260, height: 120 });
      // flyTo committet den Zielwert in einem requestAnimationFrame — zwei
      // Frames abwarten, sonst liest man noch den Startwert (kein Timing-Rennen
      // mit setTimeout, das den rAF-Commit verpassen kann).
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const leftAfterFly = el.style.left;

      await new Promise(res => setTimeout(res, 800));  // > REMOVE_AT_MS (700)
      const remaining = holder.querySelectorAll('.island-hero-clone').length;
      holder.remove();
      return { created, positioned, leftStart, leftAfterFly, remaining };
    });

    expect(r.created).toBe(1);
    expect(r.positioned).toBe('absolute');
    // flyTo hat den Klon wirklich bewegt (Endwert gesetzt, egal wie schnell).
    expect(r.leftAfterFly).not.toBe(r.leftStart);
    // Und danach ist er weg — kein Leck.
    expect(r.remaining).toBe(0);
  });

  test('dissolve räumt den Klon auch ohne Ziel auf', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async () => {
      const mod = await import('/src/utils/heroTransition.js');
      const holder = document.createElement('div');
      holder.style.cssText = 'position:relative;width:400px;height:300px';
      document.body.appendChild(holder);

      const hero = mod.createHeroClone({ holder, from: { left: 5, top: 5, width: 80, height: 30 } });
      const created = holder.querySelectorAll('.island-hero-clone').length;
      hero.dissolve();
      await new Promise(res => setTimeout(res, 400));  // > dissolve-Frist (320)
      const remaining = holder.querySelectorAll('.island-hero-clone').length;
      holder.remove();
      return { created, remaining };
    });
    expect(r.created).toBe(1);
    expect(r.remaining).toBe(0);
  });

  test('waitForElement findet ein spät erscheinendes Element', async ({ page }) => {
    await mountCard(page);
    const found = await page.evaluate(async () => {
      const mod = await import('/src/utils/heroTransition.js');
      const host = document.createElement('div');
      document.body.appendChild(host);
      // Element erst nach 120 ms einhängen — der rAF-Poll muss es einfangen.
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'late-hero-target';
        host.appendChild(el);
      }, 120);
      const el = await mod.waitForElement(host, '.late-hero-target', 700);
      const ok = !!el && el.className === 'late-hero-target';
      host.remove();
      return ok;
    });
    expect(found).toBe(true);
  });

  test('waitForElement gibt nach dem Budget auf, statt hängenzubleiben', async ({ page }) => {
    await mountCard(page);
    const result = await page.evaluate(async () => {
      const mod = await import('/src/utils/heroTransition.js');
      const host = document.createElement('div');
      document.body.appendChild(host);
      const el = await mod.waitForElement(host, '.gibt-es-nie', 200);
      host.remove();
      return el;  // muss null sein, nicht ewig warten
    });
    expect(result).toBeNull();
  });
});

test.describe('Hero-Übergang — Verdrahtung', () => {
  test('ein Tap auf die Insel hebt einen Klon ab', async ({ page }) => {
    const root = await mountCard(page, { settings: BENTO_ON });
    // Live-Aktivität → die Insel ist antippbar und öffnet ein Gerät.
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    const pill = root.locator('.island-pill');
    await expect(pill).toBeVisible();
    await pill.click();
    // Der Klon hebt SYNCHRON beim Tap ab — kurz danach muss er da sein.
    const clones = () => root.page().evaluate(() => {
      const r = document.querySelector('#fsc-test-root')?.shadowRoot || document;
      return r.querySelectorAll('.island-hero-clone').length;
    });
    await expect.poll(clones, { timeout: 2000 }).toBeGreaterThan(0);
  });

  test('nach dem Tap bleibt kein Klon liegen — auch wenn das Ziel nie mountet', async ({ page }) => {
    // Im Harness öffnet das fsc-open-entity-Event keine Detail-Ansicht. Genau
    // dann greift der Fallback: waitForElement läuft ins Budget, dissolve räumt
    // auf. Das ist die „nie kaputt"-Zusage unter härtesten Bedingungen.
    const root = await mountCard(page, { settings: BENTO_ON });
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    const pill = root.locator('.island-pill');
    await expect(pill).toBeVisible();
    await pill.click();

    const clones = () => root.page().evaluate(() => {
      const r = document.querySelector('#fsc-test-root')?.shadowRoot || document;
      return r.querySelectorAll('.island-hero-clone').length;
    });
    // Erst da (abgehoben) …
    await expect.poll(clones, { timeout: 2000 }).toBeGreaterThan(0);
    // … dann restlos weg (Budget 700 + Fade).
    await expect.poll(clones, { timeout: 4000 }).toBe(0);
  });
});
