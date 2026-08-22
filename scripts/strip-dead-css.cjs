#!/usr/bin/env node
// scripts/strip-dead-css.cjs — entfernt tote Selektoren aus src/**/*.css.
//
// „Tot“ = die Klasse kommt im Quelltext nirgends als Token vor und steht auf
// keiner Safelist — PurgeCSS wirft ihre Regeln im Release ohnehin raus (Quelle:
// scripts/check-purgecss-dynamic.py --json). Dieses Skript räumt die Quelle
// hinterher, damit CSS-Dateien nicht Leichen früherer Dialoge/Views mitschleppen.
//
// Vorgehen je Regel: Selektorliste aufteilen; ein Selektor fällt, wenn er eine
// tote Klasse enthält; bleibt kein Selektor übrig, fällt die Regel; leere
// @media/@supports-Blöcke fallen mit. Kommentare und Reihenfolge bleiben.
//
// Beweis nach dem Lauf: `npx vite build` → dist/assets/style-*.css muss mit der
// Baseline byte-identisch sein (was PurgeCSS schon entfernt hatte, fehlt jetzt
// auch in der Quelle — sonst nichts).
//
// Aufruf:  node scripts/strip-dead-css.cjs            (trocken: nur Bericht)
//          node scripts/strip-dead-css.cjs --write    (schreibt die Dateien)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const bericht = JSON.parse(execFileSync('python3', [path.join(ROOT, 'scripts/check-purgecss-dynamic.py'), '--json'], { encoding: 'utf8' }));
// Komponierte (nur zusammengesetzt vorkommende) Klassen NICHT anfassen — die sind
// ein Fehler im Quelltext, keine Leiche.
const tot = new Set(bericht.gepurgt.filter((k) => !bericht.komponiert.includes(k)));

const CLASS_RX = /\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g;
function selektorTot(sel) {
  // Klassen im Selektor; Pseudo-Klassen (:hover) beginnen mit ':' und werden von
  // CLASS_RX nicht erfasst, escaped Zeichen (\:) auch nicht.
  let m;
  CLASS_RX.lastIndex = 0;
  while ((m = CLASS_RX.exec(sel))) {
    if (tot.has(m[1])) return true;
  }
  return false;
}

const dateien = [];
(function sammle(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sammle(p);
    else if (e.name.endsWith('.css')) dateien.push(p);
  }
})(path.join(ROOT, 'src'));

let regelnWeg = 0, selektorenWeg = 0, atWeg = 0, dateienGeaendert = 0;
const proDatei = [];
for (const datei of dateien.sort()) {
  const css = fs.readFileSync(datei, 'utf8');
  let root;
  try { root = postcss.parse(css, { from: datei }); } catch (e) { console.error('PARSE-FEHLER', datei, e.message); continue; }
  let weg = 0;
  root.walkRules((rule) => {
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return; // @keyframes-Schritte sind keine Selektoren
    const vorher = rule.selectors;
    const bleibt = vorher.filter((s) => !selektorTot(s));
    if (bleibt.length === vorher.length) return;
    selektorenWeg += vorher.length - bleibt.length;
    if (bleibt.length === 0) { rule.remove(); regelnWeg++; weg++; }
    else { rule.selectors = bleibt; weg++; }
  });
  // leere @media/@supports/@container entfernen
  root.walkAtRules((at) => {
    if (/^(media|supports|container|layer)$/i.test(at.name) && at.nodes && at.nodes.every((n) => n.type === 'comment' || (n.type === 'rule' && false)) && at.nodes.filter((n) => n.type !== 'comment').length === 0) {
      at.remove(); atWeg++;
    }
  });
  if (weg === 0) continue;
  dateienGeaendert++;
  const neu = root.toString();
  proDatei.push(`${path.relative(ROOT, datei)}: ${weg} Regel(n) berührt, ${css.split('\n').length - neu.split('\n').length} Zeilen weniger`);
  if (WRITE) fs.writeFileSync(datei, neu);
}

console.log(`strip-dead-css: ${tot.size} tote Klassen, ${dateienGeaendert} Dateien, ${regelnWeg} Regeln entfernt, ${selektorenWeg} Selektoren entfernt, ${atWeg} leere @-Blöcke entfernt${WRITE ? ' (GESCHRIEBEN)' : ' (trocken — mit --write schreiben)'}`);
for (const z of proDatei) console.log('  ' + z);
