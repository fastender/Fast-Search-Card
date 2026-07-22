// playwright.config.js
//
// v1.1.2191 (Roadmap #36): Test-Harness für die Karte.
//
// `webServer` startet den vite-Dev-Server selbst und wartet, bis er antwortet;
// läuft schon einer auf dem Port, wird er wiederverwendet. Damit ist
// `npx playwright test` der einzige nötige Befehl.
//
// Bewusst nur Chromium: Der Zweck ist Regressionsschutz für Logik und
// Interaktion. Für die Safari-spezifischen Glas-Fragen gibt es den separaten
// WebKit-Weg (siehe Memory) — der gehört nicht in jeden Lauf.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // 🔑 BEWUSST SERIELL. Alle Tests teilen sich EINEN vite-Dev-Server; mit vier
  // Workern stieg die Laufzeit pro Test von ~5 s auf 20–60 s (der Server wird
  // zum Flaschenhals), und die dadurch gerissenen Timeouts ließen die
  // Fehlschläge zwischen den Läufen wandern. Seriell ist in Summe genauso
  // schnell — und deterministisch, worauf es bei einem Regressionsnetz ankommt.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : [['list']],
  // Die Karte lädt System-Entity-Views lazy; 30 s waren für die
  // Settings-Durchläufe zu knapp.
  timeout: 60000,
  expect: { timeout: 7000 },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
