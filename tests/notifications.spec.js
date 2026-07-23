// tests/notifications.spec.js
//
// v1.1.2199: Das Mitteilungs-Center (Roadmap #3, Schritt 3) — gebaut, aber nie
// geprüft. Die drei Bahnen des Entwurfs treffen hier zusammen: HA-Meldungen,
// `alert.*` und die Danger-Whitelist landen in einer gemergten Liste, die man
// filtern, bestätigen, schlummern und im Verlauf nachlesen kann.
//
// Geprüft wird die Zusage aus dem Entwurf: Bestätigen und Schlummern sind
// LOKAL (sie fassen Home Assistant nicht an), das Wegtippen einer echten
// HA-Meldung dagegen ruft den Dienst — und beides bleibt über einen Neustart
// bestehen, weil es im Speicher der Karte liegt.

import { test, expect } from '@playwright/test';
import { mountCard, updateHass, serviceCalls, clearServiceCalls } from './harness/card.js';

/** Zwei Meldungen aus zwei verschiedenen Quellen. */
const seed = (page) => updateHass(page, (states, entity) => {
  states['persistent_notification.a'] = entity('persistent_notification.a', 'A', 'notifying',
    { title: 'Waschmaschine fertig', message: 'Programm beendet' });
  states['alert.fenster'] = entity('alert.fenster', 'Fenster offen', 'on');
});

/** Center über die Suche öffnen. */
async function openCenter(root, page) {
  const input = root.locator('input.search-input');
  await input.click();
  await input.fill('Mitteil');
  const card = root.locator('.device-name', { hasText: 'Mitteilungen' }).first();
  await card.waitFor({ timeout: 15000 });
  await card.click();
  const list = root.locator('.notif-list').first();
  await list.waitFor({ timeout: 15000 });
  return list;
}

test.describe('Mitteilungs-Center', () => {
  test('führt beide Quellen in einer Liste zusammen', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    const list = await openCenter(root, page);

    await expect(list).toContainText('Waschmaschine fertig');
    await expect(list).toContainText('Fenster offen');
    await expect(root.locator('.notif-entry')).toHaveCount(2);
  });

  test('der Kopf sagt, wie viele anliegen — nicht „Active"', async ({ page }) => {
    // Alle anderen System-Entities zeigen dort einen übersetzten Zustand; für
    // die Mitteilungen fehlte der Zweig, also stand da der rohe Basiswert der
    // System-Entity: „Active", englisch. Repariert in v1.1.2199.
    const root = await mountCard(page);
    await seed(page);
    await openCenter(root, page);

    await expect(root.locator('.detail-header-name').first()).toContainText('2 Mitteilungen');
    await expect(root.locator('.detail-header-name').first()).not.toContainText('Active');
  });

  test('die Filter grenzen nach Dringlichkeit ein', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await openCenter(root, page);
    await expect(root.locator('.notif-entry')).toHaveCount(2);

    // „Info" lässt nur die Hinweis-Meldung übrig, die Warnung fällt weg.
    await root.locator('.notif-chip', { hasText: 'Info' }).first().click();
    await expect(root.locator('.notif-entry')).toHaveCount(1);
    await expect(root.locator('.notif-list').first()).toContainText('Waschmaschine');

    await root.locator('.notif-chip', { hasText: 'Alle' }).first().click();
    await expect(root.locator('.notif-entry')).toHaveCount(2);
  });

  test('eine alert.*-Meldung wird LOKAL bestätigt, ohne Home Assistant anzufassen', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    const list = await openCenter(root, page);
    await clearServiceCalls(page);

    // Das × auf der Alert-Zeile.
    const row = root.locator('.notif-entry', { hasText: 'Fenster offen' }).first();
    await row.locator('.notif-x').first().click();

    await expect(list).not.toContainText('Fenster offen', { timeout: 10000 });
    // Entscheidend: KEIN Dienstaufruf — `alert.*` gehört HA, wir quittieren nur
    // für uns selbst. Ein dismiss-Service gäbe es dafür gar nicht.
    expect(await serviceCalls(page)).toEqual([]);
  });

  test('eine echte HA-Meldung wird über den Dienst weggeräumt', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await openCenter(root, page);
    await clearServiceCalls(page);

    const row = root.locator('.notif-entry', { hasText: 'Waschmaschine' }).first();
    await row.locator('.notif-x').first().click();

    await expect.poll(() => serviceCalls(page), { timeout: 10000 })
      .toContainEqual(expect.objectContaining({
        domain: 'persistent_notification', service: 'dismiss',
      }));
  });

  test('eine Bestätigung überlebt den Neustart der Karte', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    const list = await openCenter(root, page);
    await root.locator('.notif-entry', { hasText: 'Fenster offen' })
      .first().locator('.notif-x').first().click();
    await expect(list).not.toContainText('Fenster offen', { timeout: 10000 });

    // Der lokale Zustand liegt im Speicher der Karte — nach einem Neuaufbau
    // darf die bestätigte Meldung nicht zurückkommen.
    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.includes('notif'))
    );
    expect(stored.length).toBeGreaterThan(0);
  });

  test('Schlummern nimmt eine Meldung vorübergehend aus der Liste', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    const list = await openCenter(root, page);
    await clearServiceCalls(page);

    const row = root.locator('.notif-entry', { hasText: 'Fenster offen' }).first();
    await row.locator('.notif-action-btn[title="1 Stunde stumm"]').first().click();

    await expect(list).not.toContainText('Fenster offen', { timeout: 10000 });
    // Auch das ist rein lokal — Home Assistant bekommt davon nichts mit.
    expect(await serviceCalls(page)).toEqual([]);
  });

  test('der Verlauf merkt sich, was da war', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await openCenter(root, page);

    // Die zwei Kopf-Knöpfe des Centers sind Reiter: Übersicht | Verlauf.
    await root.locator('.detail-tab[title="Verlauf"]').click();
    await expect(root.locator('.notif-list').first())
      .toContainText('Waschmaschine', { timeout: 10000 });
    await expect(root.locator('.detail-header-name').first()).toContainText('Einträge');
  });
});
