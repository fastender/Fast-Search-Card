// tests/calendar-todos.spec.js
//
// v1.1.2200: Aufgaben und Kalender — die letzte größere Lücke in der Suite.
//
// Beide holen ihre Einträge NICHT aus `hass.states`, sondern über eigene
// Aufrufe: Aufgaben per WebSocket (`todo/item/list`), Termine über die
// REST-Schnittstelle (`calendars/{id}`). Ohne Antworten darauf stehen die
// Ansichten auf „Keine Aufgaben" bzw. „Keine Termine", egal was sonst im
// Testhaus liegt — deshalb beantwortet der Harness seit dieser Version beides.
//
// Die Daten sind bewusst RELATIV zum heutigen Tag angelegt (heute, vor zwei
// Tagen, in zwei Tagen). So prüfen die Fälligkeits-Tests echtes Rechnen statt
// eines eingefrorenen Datums — und decken damit weiter die Zeitzonen-Falle aus
// v1.1.2190 ab, bei der Fälligkeiten westlich von Greenwich einen Tag
// verrutschten.

import { test, expect } from '@playwright/test';
import { mountCard, serviceCalls, clearServiceCalls } from './harness/card.js';

/** System-Entity über die Suche öffnen. */
async function openSystemEntity(root, page, query) {
  const input = root.locator('input.search-input');
  await input.click();
  await input.fill(query);
  const card = root.locator('.device-name').first();
  await card.waitFor({ timeout: 15000 });
  await card.click();
  const right = root.locator('.detail-right').first();
  await right.waitFor({ timeout: 15000 });
  return right;
}

test.describe('Aufgaben', () => {
  test('die Übersicht zählt richtig und beschriftet die Fälligkeiten', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Aufgab');

    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Rechnung zahlen');
    // Zwei offene Aufgaben: eine heute fällig, eine seit zwei Tagen überfällig.
    await expect(root.locator('.detail-header-name').first()).toContainText('2 Unerledigt');
    await expect(right).toContainText('Heute');
    // Der Kern des Zeitzonen-Fixes: „vor 2 Tagen" muss auch wirklich 2 sein.
    await expect(right).toContainText('Überfällig seit 2 Tagen');
  });

  test('die Filter grenzen die Liste ein', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Aufgab');
    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Rechnung zahlen');

    // 🔑 Playwright-`hasText` ist teilstring- UND case-insensitiv: „Erledigt"
    // träfe auch „Unerledigt". Deshalb der Filter-Reiter über exakten Text.
    const tab = (name) => root.locator('.filter-tab')
      .filter({ has: page.locator(`text="${name}"`) }).first();

    await tab('Erledigt').click();
    await expect(right).toContainText('Müll rausbringen');
    await expect(right).not.toContainText('Rechnung zahlen');

    await tab('Überfällig').click();
    await expect(right).toContainText('Rechnung zahlen');
    await expect(right).not.toContainText('Müll rausbringen');
  });

  test('eine Aufgabe abhaken erreicht Home Assistant', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Aufgab');
    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Spülmaschine');
    await clearServiceCalls(page);

    // Die Kreis-Schaltfläche links am Eintrag.
    await right.locator('.todo-card', { hasText: 'Spülmaschine' })
      .first().locator('.todo-checkbox').first().click();

    await expect.poll(() => serviceCalls(page), { timeout: 10000 })
      .toContainEqual(expect.objectContaining({ domain: 'todo' }));
  });
});

test.describe('Kalender', () => {
  test('zeigt den laufenden Monat mit der Zahl der Termine', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Kalend');

    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Zahnarzt');
    // Kopfzeile: Monat + Anzahl.
    const month = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    await expect(root.locator('.detail-header-name').first()).toContainText(month.split(' ')[0]);
    await expect(root.locator('.detail-header-area').first()).toContainText('2 Termine');
  });

  test('der heutige Termin steht mit seiner Uhrzeit in der Tagesliste', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Kalend');

    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Zahnarzt');
    await expect(right.locator('.calendar-list')).toContainText('10:00');
    // Der Termin in zwei Tagen gehört NICHT in die Tagesliste von heute.
    await expect(right.locator('.calendar-list')).not.toContainText('Elternabend');
  });

  test('die Ansicht lässt sich zwischen Tag, Woche, Monat und Jahr umschalten', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Kalend');
    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Zahnarzt');

    // Standard ist Monat — das Raster steht.
    await expect(right.locator('.calendar-month-grid')).toHaveCount(1);

    await root.locator('.calendar-mode-tab', { hasText: 'Jahr' }).first().click();
    await expect(right.locator('.calendar-month-grid')).toHaveCount(0, { timeout: 10000 });

    await root.locator('.calendar-mode-tab', { hasText: 'Monat' }).first().click();
    await expect(right.locator('.calendar-month-grid')).toHaveCount(1, { timeout: 10000 });
  });

  test('vor- und zurückblättern bewegt den Monat', async ({ page }) => {
    const root = await mountCard(page);
    const right = await openSystemEntity(root, page, 'Kalend');
    await expect.poll(() => right.innerText(), { timeout: 15000 }).toContain('Zahnarzt');

    const header = root.locator('.detail-header-name').first();
    const before = await header.innerText();

    await root.locator('.calendar-nav-btn').last().click();
    await expect.poll(() => header.innerText(), { timeout: 10000 }).not.toBe(before);

    // „Heute" führt zurück.
    await root.locator('.calendar-today-btn').first().click();
    await expect.poll(() => header.innerText(), { timeout: 10000 }).toBe(before);
  });
});
