#!/usr/bin/env node
// check-tastatur.mjs — Tastatur-Wächter (v1.1.2422).
//
// Zwei Regeln, geprüft am Syntaxbaum (@babel/parser) aller .jsx/.js unter src/:
//
//   1. framer-motion 12 macht jedes nicht nativ fokussierbare motion-HTML-Element
//      mit Tap-Geste (whileTap, onTap, onTapStart, onTapCancel) SELBST zum
//      Tab-Stopp, sobald es kein tabindex-Attribut trägt (motion-dom,
//      gestures/press: `target.tabIndex = 0`). Der Stopp hat keine Rolle, und
//      Enter löst dort nur synthetische pointer-Events aus — keinen click, also
//      kein onClick. Jedes solche Element braucht deshalb `tabIndex` oder die
//      Tastatur-Attribute im Spread (`knopfAttribute(…)`/`hakenAttribute(…)`):
//      `tabIndex={-1}`, wenn ein anderes Element die Bedienung trägt, sonst die
//      Knopf-Rolle. v1.1.2421/2422 fanden 16 solche Stopps.
//   2. Jede `ios-item-clickable`-Zeile ist per Tastatur bedienbar: Attribute an
//      der Zeile (onKeyDown, data-tastatur, knopfAttribute/hakenAttribute im
//      Spread) oder an einem Teil in der Zeile (Auftrag 08: trägt die Zeile ein
//      eigenes Bedienelement, sitzt die Knopf-Rolle auf dem Teil). Die Messung von
//      Auftrag 13 sah nur wörtliche Attribute und hielt zehn Zeilen für stumm.
//
// Aufruf:  node scripts/check-tastatur.mjs [src] [-q]
// Exit:    0 = sauber, 1 = Befund, 2 = Parser fehlt oder Datei nicht lesbar

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumente = process.argv.slice(2);
const leise = argumente.includes('-q');
const SRC = path.resolve(argumente.find((a) => !a.startsWith('-')) || path.join(WURZEL, 'src'));

let parse;
try {
  ({ parse } = createRequire(path.join(WURZEL, 'package.json'))('@babel/parser'));
} catch (_) {
  console.error('check-tastatur: @babel/parser fehlt (kommt mit dem Preact-Preset von Vite) — npm install ausführen.');
  process.exit(2);
}

const TAP_GESTEN = new Set(['whileTap', 'onTap', 'onTapStart', 'onTapCancel']);
// framer-motion prüft genau diese Tags als „schon fokussierbar"
const NATIV_FOKUSSIERBAR = new Set(['button', 'a', 'input', 'select', 'textarea']);
// press() setzt tabIndex nur an HTML-Elementen, nicht an SVG
const SVG_TAGS = new Set(['svg', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'g', 'text', 'tspan', 'image', 'use', 'defs', 'stop', 'mask', 'clipPath', 'pattern', 'symbol', 'marker', 'filter', 'linearGradient', 'radialGradient', 'foreignObject']);
const HELFER = new Set(['knopfAttribute', 'hakenAttribute']);
const OHNE_KINDER = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'range']);

function* knoten(wurzel) {
  const stapel = [wurzel];
  while (stapel.length) {
    const n = stapel.pop();
    if (!n || typeof n !== 'object') continue;
    if (Array.isArray(n)) { for (let i = n.length - 1; i >= 0; i -= 1) stapel.push(n[i]); continue; }
    if (typeof n.type === 'string') yield n;
    for (const k of Object.keys(n)) if (!OHNE_KINDER.has(k)) stapel.push(n[k]);
  }
}

const attrName = (a) => (a.type === 'JSXAttribute' ? (a.name.type === 'JSXNamespacedName' ? `${a.name.namespace.name}:${a.name.name.name}` : a.name.name) : null);
const schluessel = (p) => (p.key?.type === 'Identifier' && !p.computed ? p.key.name : p.key?.type === 'StringLiteral' ? p.key.value : p.computed && p.key?.type === 'Identifier' ? `[${p.key.name}]` : null);

// Enthält ein Spread-Argument Tastatur-Attribute? `art` = 'tab' (Regel 1) oder 'taste' (Regel 2)
function spreadTraegt(arg, art) {
  for (const n of knoten(arg)) {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && HELFER.has(n.callee.name)) return true;
    if (n.type === 'ObjectProperty') {
      const k = schluessel(n);
      if (art === 'tab' && k === 'tabIndex') return true;
      if (art === 'taste' && (k === 'onKeyDown' || k === 'data-tastatur' || k === '[TASTATUR_MARKER]')) return true;
    }
  }
  return false;
}

function traegtTastatur(oeffner, art) {
  for (const a of oeffner.attributes) {
    if (a.type === 'JSXSpreadAttribute') { if (spreadTraegt(a.argument, art)) return true; continue; }
    const name = attrName(a);
    if (art === 'tab' && name === 'tabIndex') return true;
    if (art === 'taste' && (name === 'onKeyDown' || name === 'data-tastatur')) return true;
  }
  return false;
}

function klassenTexte(oeffner) {
  const texte = [];
  for (const a of oeffner.attributes) {
    if (a.type !== 'JSXAttribute' || (attrName(a) !== 'className' && attrName(a) !== 'class') || !a.value) continue;
    for (const n of knoten(a.value)) {
      if (n.type === 'StringLiteral') texte.push(n.value);
      if (n.type === 'TemplateElement') texte.push(n.value.raw);
    }
  }
  return texte;
}

const befunde = [];
let dateien = 0; let tapElemente = 0; let zeilen = 0;

function pruefeDatei(datei) {
  const quelle = fs.readFileSync(datei, 'utf8');
  if (!quelle.includes('motion.') && !quelle.includes('ios-item-clickable')) return;
  dateien += 1;
  let ast;
  try {
    ast = parse(quelle, { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    console.error(`check-tastatur: ${path.relative(WURZEL, datei)} nicht lesbar — ${e.message}`);
    process.exit(2);
  }
  const rel = path.relative(WURZEL, datei);
  for (const el of knoten(ast.program)) {
    if (el.type !== 'JSXElement') continue;
    const o = el.openingElement;
    // Regel 1: motion-Element mit Tap-Geste
    if (o.name.type === 'JSXMemberExpression' && o.name.object.name === 'motion') {
      const tag = o.name.property.name;
      const hatTap = o.attributes.some((a) => TAP_GESTEN.has(attrName(a)));
      if (hatTap && !NATIV_FOKUSSIERBAR.has(tag) && !SVG_TAGS.has(tag)) {
        tapElemente += 1;
        if (!traegtTastatur(o, 'tab')) {
          befunde.push(`${rel}:${o.loc.start.line}  <motion.${tag}> mit Tap-Geste ohne tabIndex — framer-motion macht es selbst zum stummen Tab-Stopp (tabIndex={-1} oder knopfAttribute)`);
        }
      }
    }
    // Regel 2: klickbare Zeile
    if (klassenTexte(o).some((t) => /(^|\s)ios-item-clickable(\s|$)/.test(t))) {
      zeilen += 1;
      if (traegtTastatur(o, 'taste')) continue;
      let teil = false;
      for (const k of knoten(el.children)) {
        if (k.type === 'JSXOpeningElement' && traegtTastatur(k, 'taste')) { teil = true; break; }
      }
      if (!teil) befunde.push(`${rel}:${o.loc.start.line}  ios-item-clickable ohne Tastatur — weder an der Zeile noch an einem Teil (knopfAttribute / role+tabIndex+onKeyDown)`);
    }
  }
}

function lauf(ordner) {
  for (const eintrag of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) { if (eintrag.name !== 'node_modules') lauf(p); continue; }
    if (/\.(jsx|js)$/.test(eintrag.name)) pruefeDatei(p);
  }
}

if (!fs.existsSync(SRC)) { console.error(`check-tastatur: ${SRC} fehlt`); process.exit(2); }
lauf(SRC);

if (befunde.length) {
  console.log(`check-tastatur: ${befunde.length} Befund(e) in ${dateien} Dateien (${tapElemente} motion-Elemente mit Tap-Geste, ${zeilen} klickbare Zeilen):`);
  for (const b of befunde) console.log(`  ${b}`);
  process.exit(1);
}
if (!leise) console.log(`check-tastatur: ${dateien} Dateien, ${tapElemente} motion-Elemente mit Tap-Geste, ${zeilen} klickbare Zeilen — alle mit Tab-Regel und Tastatur.`);
