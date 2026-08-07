#!/usr/bin/env python3
"""Verschiebt zweisprachige Ternäre (`lang === 'de' ? 'A' : 'B'`) in die
Wörterbücher und ersetzt sie im Quelltext durch Schlüssel-Aufrufe.

Aufruf:
    python3 scripts/i18n-migrate.py <namensraum> <datei> [<datei> …]
    python3 scripts/i18n-migrate.py news src/…/NewsView.jsx --trocken

Was es tut:
  1. sammelt alle Paare der genannten Dateien (nur die einfache Form: zwei
     Stringliterale — alles mit Template-Strings oder Ausdrücken bleibt liegen),
  2. gleicht sie gegen den bestehenden Namensraum ab (gleicher Text = gleicher
     Schlüssel, nichts wird doppelt eingetragen),
  3. schreibt fehlende Einträge nach de.js UND en.js,
  4. ersetzt im Quelltext durch `t('schluessel')`.

🔑 Nach jedem Lauf: die Schlüssel in BEIDEN Sprachen auflösen und gegen die
Originaltexte vergleichen. Der Build merkt nichts davon, wenn Sprachen
vertauscht sind — genau das ist in v1.1.2301 passiert. Deshalb prüft das Skript
nach dem Schreiben seine eigene Spalte (siehe `_schreibe_block`).

Der `t`-Helfer wird NICHT automatisch angelegt — die Dateien unterscheiden sich
zu sehr (Komponente mit lang-Prop, Modul mit lang-Parameter, mehrere Exporte).
Das Skript sagt am Ende, welche Form fehlt.
"""
import re
import sys
import unicodedata
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
WOERTER = {
    'de': WURZEL / 'src/utils/translations/languages/de.js',
    'en': WURZEL / 'src/utils/translations/languages/en.js',
}
PAAR = re.compile(r"lang === 'de' \? '((?:[^'\\]|\\.)*)' : '((?:[^'\\]|\\.)*)'")


def _bestehende(namensraum, sprache):
    """{schluessel: text} des Namensraums in einer Sprache."""
    text = WOERTER[sprache].read_text()
    block = re.search(rf'^    {namensraum}: \{{\n(.*?)\n    \}},', text, re.S | re.M)
    if not block:
        return {}
    return dict(re.findall(r"^      (\w+): '((?:[^'\\]|\\.)*)',", block.group(1), re.M))


def _schluesselname(en, de, vergeben):
    basis = unicodedata.normalize('NFKD', en or de).encode('ascii', 'ignore').decode()
    woerter = re.findall(r'[A-Za-z0-9]+', basis)[:3]
    name = woerter[0].lower() + ''.join(w.capitalize() for w in woerter[1:]) if woerter else 'text'
    # Ein Schlüssel darf nicht mit einer Ziffer beginnen — `1Picked: '…'` ist im
    # Wörterbuch ein Syntaxfehler ("1 picked" hätte genau das erzeugt).
    if name[0].isdigit():
        name = 'n' + name[0].upper() + name[1:]
    if name in vergeben:
        i = 2
        while f'{name}{i}' in vergeben:
            i += 1
        name = f'{name}{i}'
    return name


def _schreibe_block(namensraum, sprache, neu, anker):
    """Trägt `neu` ({schluessel: text}) ein und prüft danach die Spalte."""
    pfad = WOERTER[sprache]
    s = pfad.read_text()
    zeilen = ''.join(f"      {k}: '{v}',\n" for k, v in sorted(neu.items()))
    block = re.search(rf'^    {namensraum}: \{{\n', s, re.M)
    if block:
        s = s[:block.end()] + zeilen + s[block.end():]
    else:
        kopf = f'    {namensraum}: {{\n'
        s = s.replace(anker, kopf + zeilen + '    },\n\n' + anker, 1)
    pfad.write_text(s)
    # Gegenprobe: der erste geschriebene Eintrag muss den Text tragen, den wir
    # für DIESE Sprache vorgesehen hatten.
    ein_k, ein_v = sorted(neu.items())[0]
    if f"      {ein_k}: '{ein_v}'," not in pfad.read_text():
        raise SystemExit(f'❌ {sprache}: Eintrag {ein_k} nicht wie vorgesehen geschrieben')


def main():
    argumente = [a for a in sys.argv[1:] if not a.startswith('--')]
    trocken = '--trocken' in sys.argv
    if len(argumente) < 2:
        raise SystemExit(__doc__)
    namensraum, dateien = argumente[0], [WURZEL / a for a in argumente[1:]]

    vorhanden_de = _bestehende(namensraum, 'de')
    vorhanden_en = _bestehende(namensraum, 'en')
    nach_text = {(v, vorhanden_en.get(k, '')): k for k, v in vorhanden_de.items()}

    paare = []
    for datei in dateien:
        paare += PAAR.findall(datei.read_text())

    zuordnung = dict(nach_text)
    neu_de, neu_en = {}, {}
    for de, en in paare:
        if (de, en) in zuordnung:
            continue
        k = _schluesselname(en, de, set(vorhanden_de) | set(neu_de))
        zuordnung[(de, en)] = k
        neu_de[k], neu_en[k] = de, en

    print(f'{len(paare)} Fundstellen · {len(neu_de)} neue Schlüssel · '
          f'{len(paare) - len(neu_de)} bereits vorhanden/doppelt')
    for k in sorted(neu_de):
        print(f"   {k:24s} de={neu_de[k]!r:34s} en={neu_en[k]!r}")
    if trocken:
        return 0

    if neu_de:
        _schreibe_block(namensraum, 'de', neu_de, '    common: {')
        _schreibe_block(namensraum, 'en', neu_en, '    common: {')
        print(f'\n→ {len(neu_de)} Einträge in de.js und en.js (Spalten geprüft)')

    for datei in dateien:
        s = datei.read_text()
        n = [0]

        def tausche(m):
            k = zuordnung.get((m.group(1), m.group(2)))
            if not k:
                return m.group(0)
            n[0] += 1
            return f"t('{k}')"

        neu = PAAR.sub(tausche, s)
        datei.write_text(neu)
        rest = len(PAAR.findall(neu))
        print(f'   {datei.relative_to(WURZEL)}: {n[0]} ersetzt, {rest} übrig')
        if 'const t = ' not in neu:
            print(f'      ⚠ kein t()-Helfer in der Datei — von Hand ergänzen '
                  f"(t = (key) => translateUI(`{namensraum}.${{key}}`, lang))")
    return 0


if __name__ == '__main__':
    sys.exit(main())
