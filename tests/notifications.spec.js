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

  test('hat drei Reiter — Übersicht, Live, Verlauf', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await openCenter(root, page);
    const titles = await root.locator('.detail-tab').evaluateAll(
      els => els.map(e => e.getAttribute('title'))
    );
    expect(titles).toEqual(['Übersicht', 'Live', 'Verlauf']);
  });

  test('der Live-Reiter zeigt laufende Aktivitäten — ohne Verwerfen/Schlummern', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await openCenter(root, page);

    // Auf Übersicht filtern die Chips — auf Live gibt es keine.
    await expect(root.locator('.notif-chip')).toHaveCount(4);
    await root.locator('.detail-tab[title="Live"]').click();
    await expect(root.locator('.notif-chip')).toHaveCount(0);

    const live = root.locator('.notif-live-btn');
    await expect(live).toHaveCount(1);
    await expect(live.first()).toContainText('Pizza');
    // Live-Aktivitäten räumen sich selbst weg — keine Aktions-Knöpfe.
    await expect(root.locator('.notif-live-btn .notif-action-btn')).toHaveCount(0);
  });

  test('eine Live-Zeile öffnet ihr Gerät', async ({ page }) => {
    const root = await mountCard(page);
    await seed(page);
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    await openCenter(root, page);
    await root.locator('.detail-tab[title="Live"]').click();

    await page.evaluate(() => {
      window.__opened = [];
      window.addEventListener('fsc-open-entity', (e) => window.__opened.push(e.detail.entityId));
    });
    await root.locator('.notif-live-btn').first().click();
    await expect.poll(() => page.evaluate(() => window.__opened)).toEqual(['timer.pizza']);
  });

  test('der Insel-Kopf springt direkt auf den Live-Reiter', async ({ page }) => {
    // Der Deep-Link: fsc-open-notifications mit tab=live. Der Wunsch wird VOR
    // dem Mount abgelegt und übersteht den Doppel-Mount der View.
    const root = await mountCard(page);
    await updateHass(page, (states, entity) => {
      states['timer.pizza'] = entity('timer.pizza', 'Pizza', 'active', {
        duration: '0:15:00', finishes_at: new Date(Date.now() + 400000).toISOString(),
      });
    });
    // Der Deep-Link IST das Event mit tab=live — keine Insel nötig, um ihn zu prüfen.
    await page.evaluate(() => window.dispatchEvent(
      new CustomEvent('fsc-open-notifications', { detail: { tab: 'live' } })));

    await root.locator('.notifications-view-container').waitFor({ timeout: 15000 });
    // Beweis über den Body, nicht die Kopf-Optik: die Live-Zeile erscheint nur,
    // wenn der Reiter wirklich auf „live" steht.
    await expect(root.locator('.notif-live-btn').first()).toBeVisible({ timeout: 8000 });
    await expect(root.locator('.notif-live-btn').first()).toContainText('Pizza');
  });
});

// v1.1.2234: Das Center trug seinen hardcoded DE-Namen („Mitteilungen") an zwei
// Stellen bis zum englischen Nutzer durch, weil es in zwei Domain-Listen fehlte,
// in denen JEDE andere System-Entity steht: der Label-Map der Sidebar und der
// System-Whitelist des Detail-Kopfs. Dieselbe Lücke wie v1.1.1612 und v1.1.2202
// — jedes Mal beim NACHTRÄGLICH ergänzten Eintrag. Deshalb hier festgenagelt.
test.describe('Mitteilungs-Center auf Englisch', () => {
  test('die Sidebar nennt es „Notifications", nicht „Mitteilungen"', async ({ page }) => {
    const root = await mountCard(page, {
      lang: 'en',
      // alwaysVisible, damit die Leiste ohne Aufdecken hängt; das Center ist
      // NICHT in DEFAULT_SHORTCUT_IDS, muss also ausdrücklich dazu.
      settings: { sidebar: { enabled: true, alwaysVisible: true, items: ['__home__', 'notifications'] } },
    });

    await expect(root.locator('.vpm-label', { hasText: 'Notifications' })).toHaveCount(1, { timeout: 15000 });
    await expect(root.locator('.vpm-label', { hasText: 'Mitteilungen' })).toHaveCount(0);
  });

  test('der Detail-Kopf sagt „System" statt eines Raumnamens', async ({ page }) => {
    const root = await mountCard(page, { lang: 'en' });
    await seed(page);
    await page.evaluate(() => window.dispatchEvent(
      new CustomEvent('fsc-open-notifications', { detail: {} })));
    await root.locator('.notifications-view-container').waitFor({ timeout: 15000 });

    // Der Titel las sich schon richtig (die Liste oben trug `notifications`);
    // gefehlt hat der Untertitel — er fiel auf Raum/„No room" zurück.
    await expect(root.locator('.detail-left-title-name').first()).toHaveText('Notifications');
    await expect(root.locator('.detail-left-title-area').first()).toHaveText('System');
  });
});
