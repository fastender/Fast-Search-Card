// tests/bundle-klassen.spec.js
//
// v1.1.2246: Der einzige Test, der die PurgeCSS-Falle fangen KANN.
//
// 🚨 Warum kein normaler UI-Test reicht: Der Dev-Server (auf dem die ganze
// übrige Suite läuft) putzt das CSS NICHT — dort ist jede Regel da, auch die,
// die im ausgelieferten Bundle fehlt. Genau so blieb `bento-widget--${size}`
// monatelang unbemerkt kaputt, und genau so verschwand in v1.1.2244
// `island-eck--grau`: sobald ein Klassenname ZUSAMMENGEBAUT wird
// (`island-eck--${k.kugel}`), sieht der Extraktor nur das Bruchstück und wirft
// die Regel weg. Sichtbare Folge damals: die graue Zähler-Kugel des
// ▦-Knopfes fiel auf das rote Standard-Rot zurück.
//
// Dieser Test liest deshalb `dist/fast-search-card.js` als DATEI (kein
// Browser, kein Mount) und besteht darauf, dass die Zustandsklassen, die nur
// dynamisch gesetzt werden, wirklich mit ausgeliefert wurden.
//
// ⚠️ Er prüft den ZULETZT GEBAUTEN Stand. Nach Änderungen an diesen Klassen
// gehört ein `./build.sh` davor — im Release-Ablauf ist das ohnehin der Fall.

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Playwright läuft aus dem Projektwurzelverzeichnis (playwright.config.js dort).
// Bewusst KEIN `import.meta.url`: die Spec-Dateien werden nicht als ESM geladen.
//
// Zwei mögliche Fundorte, je nachdem was zuletzt lief:
//   dist/fast-search-card.js   — die HACS-Einzeldatei aus ./build.sh
//   dist/assets/style-*.css    — das gesäuberte CSS aus `npm run build`
// Beide sind PurgeCSS-Ausgaben; geprüft wird, was da ist (die Einzeldatei
// zuerst, weil sie exakt das ist, was der Nutzer installiert).
const gebautesCss = () => {
  const einzel = join(process.cwd(), 'dist', 'fast-search-card.js');
  if (existsSync(einzel)) return { pfad: einzel, inhalt: readFileSync(einzel, 'utf8') };
  const assets = join(process.cwd(), 'dist', 'assets');
  if (!existsSync(assets)) return null;
  const css = readdirSync(assets)
    .filter((f) => f.startsWith('style-') && f.endsWith('.css'))
    .map((f) => ({ f, t: statSync(join(assets, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (!css) return null;
  return { pfad: join(assets, css.f), inhalt: readFileSync(join(assets, css.f), 'utf8') };
};

// Klassen, die im JSX NICHT als vollständiges Literal stehen müssen, deren
// Regel aber gebraucht wird. Wer hier etwas ergänzt, ergänzt eine Farbe/Größe,
// die per Zustand gewählt wird.
const PFLICHTKLASSEN = [
  // Zähler-Kugeln der Insel-Eck-Knöpfe (Stufenfarben + Grau fürs Laufende).
  'island-eck--blau',
  'island-eck--amber',
  'island-eck--rot',
  'island-eck--grau',
  // Die Bento-Kachelgrößen — der historische Fall, der die Regel gelehrt hat.
  'bento-widget--large',
  'bento-widget--medium',
  'bento-widget--small',
];

test.describe('Ausgeliefertes Bundle', () => {
  test('die dynamisch gesetzten Klassen überleben PurgeCSS', async () => {
    const gebaut = gebautesCss();
    test.skip(!gebaut, 'Kein Build vorhanden — erst `npm run build` oder ./build.sh laufen lassen');

    const fehlend = PFLICHTKLASSEN.filter((klasse) => !gebaut.inhalt.includes(klasse));
    expect(
      fehlend,
      `Diese Klassen fehlen im gebauten Bundle — PurgeCSS hat sie geschluckt. `
      + `Fast immer die Ursache: der Klassenname wird im JSX zusammengesetzt `
      + `(\`praefix--\${wert}\`) statt ganz hingeschrieben.`,
    ).toEqual([]);
  });
});
