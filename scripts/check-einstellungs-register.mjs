#!/usr/bin/env node
// check-einstellungs-register.mjs — Wächter für das Register der Einstellungs-Suche
// (Roadmap #46, v1.1.2419).
//
// Die Suche findet nur, was im Register steht. Eine neue Einstellung ohne Eintrag
// wäre unauffindbar, ohne dass es jemand merkt — genau der „gibt es doch längst"-
// Fall, den #46 beheben soll. Deshalb prüft der Wächter:
//
//   1. Jede Beschriftung der Einstellungs-Komponenten (Zeilen, Abschnitts-Köpfe,
//      Regler-Tabellen, feste de/en-Texte) steht im Register ihres Orts — oder
//      bewusst in AUSNAHMEN, mit Grund. v1.1.2420: Orte sind die vier Reiter
//      (einstellungen) und die Einstellungen von Kalender, Aufgaben und News.
//   2. Jeder Wörterbuch-Schlüssel im Register existiert in de.js UND en.js
//      (im Namensraum des Orts: ui.settings.*, ui.calendar.* …; `info` immer unter
//      ui.settings.settingsInfo.*); feste Texte tragen de UND en.
//   3. Jede `seite` steht in SEITEN des Reiters und ist im Reiter als
//      `currentView === '…'` verzweigt; jeder `ersatz` ist eine Zeile derselben Seite.
//   4. Keine doppelten ids.
//
// Aufruf:  node scripts/check-einstellungs-register.mjs [-q]
// Exit:    0 = sauber, 1 = Befund

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// src/ hat kein "type": "module" — Node warnt beim Laden der ES-Module; die
// Warnung ist hier Rauschen.
process.removeAllListeners('warning');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EINST = path.join(ROOT, 'src/components/tabs/SettingsTab');
const leise = process.argv.includes('-q');

// Beschriftungen, die bewusst NICHT ins Register gehören — je Ort.
const AUSNAHMEN = {
  einstellungen: {
    settings: 'allgemeiner Kopf „Einstellungen" auf Unterseiten — kein Suchziel',
    emptyNoWidget: 'Auswahlpunkt „Leer" in der Platz-Auswahl, keine Einstellung',
    noTtsIntegration: 'Leerzustand der TTS-Seite ohne TTS-Integration',
  },
  kalender: {},
  aufgaben: {},
  news: {},
};

// Welche Komponenten zu welchem Ort gehören (Datei oder Ordner, relativ zum Projekt).
const QUELLEN = {
  einstellungen: ['src/components/tabs/SettingsTab/components'],
  kalender: ['src/system-entities/entities/calendar/components/CalendarSettingsView.jsx', 'src/system-entities/entities/calendar/components/settings'],
  aufgaben: ['src/system-entities/entities/todos/components/TodosSettingsView.jsx', 'src/system-entities/entities/todos/components/settings'],
  news: ['src/system-entities/entities/news/components/iOSSettingsView.jsx'],
};

const { REGISTER, SEITEN, ORTE } = await import(pathToFileURL(path.join(EINST, 'register/index.js')));
const woerter = {};
for (const sprache of ['de', 'en']) {
  woerter[sprache] = (await import(pathToFileURL(path.join(ROOT, `src/utils/translations/languages/${sprache}.js`)))).default;
}
const hol = (obj, pfad) => pfad.split('.').reduce((a, s) => (a && typeof a === 'object' ? a[s] : undefined), obj);

const fehler = [];

// ── 2 + 3 + 4: Register in sich ─────────────────────────────────────────────
const ids = new Set();
const registriert = Object.fromEntries(Object.keys(QUELLEN).map((ort) => [ort, new Set()]));
const pruefeText = (wert, wo, praefix = 'ui.settings') => {
  if (wert == null) return;
  if (typeof wert === 'string') {
    for (const sprache of ['de', 'en']) {
      if (typeof hol(woerter[sprache], `${praefix}.${wert}`) !== 'string') fehler.push(`${wo}: Schlüssel ${praefix}.${wert} fehlt in ${sprache}.js`);
    }
  } else if (!wert.de || !wert.en) {
    fehler.push(`${wo}: fester Text ohne de UND en (${JSON.stringify(wert)})`);
  }
};
const reiterDatei = { 0: 'components/GeneralSettingsTab.jsx', 1: 'components/AppearanceSettingsTab.jsx' };
const merke = (ort, wert) => { if (wert && registriert[ort]) registriert[ort].add(typeof wert === 'string' ? wert : wert.de); };

for (const e of REGISTER) {
  const wo = e.id;
  if (ids.has(e.id)) fehler.push(`${wo}: doppelte id`);
  ids.add(e.id);
  const ort = ORTE[e.ort];
  if (!ort || !QUELLEN[e.ort]) { fehler.push(`${wo}: unbekannter Ort ${e.ort}`); continue; }
  const praefix = `ui.${ort.namensraum}`;
  if (e.ort === 'einstellungen' && ![0, 1, 2, 3].includes(e.reiter)) fehler.push(`${wo}: unbekannter Reiter ${e.reiter}`);
  if (e.art !== 'abschnitt' && e.art !== 'zeile') fehler.push(`${wo}: unbekannte art ${e.art}`);
  if (!e.titel) fehler.push(`${wo}: ohne titel`);
  pruefeText(e.titel, wo, praefix);
  pruefeText(e.abschnitt, wo, praefix);
  pruefeText(e.text, wo, praefix);
  if (e.info) pruefeText(e.info, wo, 'ui.settings.settingsInfo');
  for (const o of e.optionen || []) {
    // Feste Texte ohne Leerzeichen-Schlüsselform (z. B. 'EUR Euro') sind erlaubt.
    if (typeof o === 'string' && /^[a-zA-Z0-9]+$/.test(o)) pruefeText(o, `${wo} (Option)`, praefix);
    else if (typeof o === 'object') pruefeText(o, `${wo} (Option)`, praefix);
    merke(e.ort, o);
  }
  merke(e.ort, e.titel);
  merke(e.ort, e.abschnitt);
  if (e.seite && e.ort !== 'einstellungen') {
    fehler.push(`${wo}: Systemansichten springen (noch) nur auf ihre Hauptseite — seite „${e.seite}" wird nicht geöffnet`);
  } else if (e.seite) {
    if (!SEITEN[e.reiter]?.[e.seite]) fehler.push(`${wo}: Seite „${e.seite}" fehlt in SEITEN[${e.reiter}]`);
    const datei = reiterDatei[e.reiter];
    const quelle = datei ? fs.readFileSync(path.join(EINST, datei), 'utf8') : '';
    if (!quelle.includes(`currentView === '${e.seite}'`)) fehler.push(`${wo}: Reiter ${e.reiter} verzweigt nicht auf currentView '${e.seite}'`);
  }
}
for (const [reiter, seiten] of Object.entries(SEITEN)) {  // nur die vier Reiter
  for (const [seite, titel] of Object.entries(seiten)) pruefeText(titel, `SEITEN[${reiter}].${seite}`);
}
const titelJeSeite = new Map();
for (const e of REGISTER) {
  const k = `${e.ort}/${e.reiter}/${e.seite || '-'}`;
  if (!titelJeSeite.has(k)) titelJeSeite.set(k, new Set());
  titelJeSeite.get(k).add(typeof e.titel === 'string' ? e.titel : e.titel?.de);
}
for (const e of REGISTER) {
  const ersatz = e.ersatz == null ? [] : Array.isArray(e.ersatz) ? e.ersatz : [e.ersatz];
  for (const r of ersatz) {
    const k = typeof r === 'string' ? r : r?.de;
    if (!titelJeSeite.get(`${e.ort}/${e.reiter}/${e.seite || '-'}`)?.has(k)) fehler.push(`${e.id}: ersatz „${k}" ist keine Zeile derselben Seite`);
  }
}

// ── 1: Deckung der Komponenten ──────────────────────────────────────────────
const MUSTER = [
  /(?<![\w-])label=\{t\(\s*'([\w.]+)'/g,
  /className="ios-item-label"[^>]*>\s*\{t\(\s*'([\w.]+)'/g,
  /className="ios-section-header"[^>]*>\s*\{t\(\s*'([\w.]+)'/g,
  /<SettingsSectionHeader\s+title=\{t\(\s*'([\w.]+)'/g,
  /\blabelKey:\s*'([\w.]+)'/g,
  /\[\s*'[\w-]+',\s*t\(\s*'([\w.]+)'/g,
  // feste de/en-Texte (Insel): der deutsche Text zählt
  /(?<![\w-])label=\{de\s*\?\s*'([^']+)'/g,
  /className="ios-item-label"[^>]*>\s*\{de\s*\?\s*'([^']+)'/g,
  /<SettingsSectionHeader\s+title=\{de\s*\?\s*'([^']+)'/g,
  /<SettingsSectionHeader\s+title="([^"]+)"/g,
];
const sammle = (pfad, liste) => {
  const voll = path.join(ROOT, pfad);
  if (fs.statSync(voll).isFile()) { liste.push(voll); return; }
  for (const eintrag of fs.readdirSync(voll, { withFileTypes: true })) {
    const kind = path.join(pfad, eintrag.name);
    if (eintrag.isDirectory()) sammle(kind, liste);
    else if (/\.jsx$/.test(eintrag.name)) liste.push(path.join(ROOT, kind));
  }
};
let gedeckt = 0;
let dateiAnzahl = 0;
for (const [ort, pfade] of Object.entries(QUELLEN)) {
  const dateien = [];
  for (const p of pfade) sammle(p, dateien);
  dateiAnzahl += dateien.length;
  for (const datei of dateien) {
    const code = fs.readFileSync(datei, 'utf8').split('\n').map((z) => z.replace(/^\s*\/\/.*$/, '')).join('\n');
    for (const muster of MUSTER) {
      for (const m of code.matchAll(muster)) {
        const wert = m[1];
        if (AUSNAHMEN[ort][wert]) continue;
        if (registriert[ort].has(wert)) { gedeckt += 1; continue; }
        const zeile = code.slice(0, m.index).split('\n').length;
        fehler.push(`ohne Register-Eintrag (${ort} → ${ORTE[ort].datei}): ${path.relative(ROOT, datei)}:${zeile} „${wert}"`);
      }
    }
  }
}

if (fehler.length) {
  console.log(`check-einstellungs-register: ${fehler.length} Befund(e):\n`);
  for (const f of fehler) console.log(`  ${f}`);
  console.log('\n  → Eintrag im Register des Orts ergänzen (oder begründet in AUSNAHMEN dieses Wächters).');
  process.exit(1);
}
if (!leise) {
  console.log(`check-einstellungs-register: ${REGISTER.length} Einträge an ${Object.keys(QUELLEN).length} Orten, ${gedeckt} Beschriftungen in ${dateiAnzahl} Dateien gedeckt, Wörterbuch de + en vollständig.`);
}
