#!/usr/bin/env python3
"""Ergänzt den t()-Helfer nach einer i18n-Migration — die Handarbeit, die in
v2303–v2309 dreimal schiefging (Import mitten im mehrzeiligen Block, Helfer vor
der props-Zerlegung, Ausdrucks-Komponenten ohne Rumpf).

Aufruf: python3 scripts/i18n-add-helper.py <namensraum> <datei> [<datei> …]

Formen, die es erkennt (in dieser Reihenfolge je Datei):
  1. Datei hat schon einen passenden Helfer → nichts tun.
  2. GENAU EINE Funktion nutzt t() und hat `lang` + einen Rumpf `{`
     → lokaler Helfer direkt nach der props-Zerlegung bzw. dem Funktionskopf.
  3. Sonst → Modul-Helfer `const t = (key, lang) => …` nach den Imports,
     und alle `t('x')` werden zu `t('x', lang)`.

Der Import wird IMMER nach dem letzten Import eingefügt (mehrzeilige Blöcke
werden verfolgt); Dateien ganz ohne Importe bekommen ihn nach dem
Kopfkommentar."""
import re
import sys
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent


def import_stelle(zeilen):
    ende, in_block = 0, False
    for i, z in enumerate(zeilen):
        if in_block:
            if re.match(r"^\s*\}\s*from\s+'[^']+';", z):
                in_block = False
                ende = i + 1
            continue
        if re.match(r'^import\s+\{[^}]*$', z):
            in_block = True
            continue
        if re.match(r"^import .*;\s*$", z):
            ende = i + 1
    return ende


def import_sichern(s, pfad):
    if re.search(r"import \{[^}]*translateUI", s):
        return s
    m = re.search(r"import \{ ([^}]*) \} from '([^']*utils/translations)';\n", s)
    if m:
        return s.replace(m.group(0), f"import {{ {m.group(1)}, translateUI }} from '{m.group(2)}';\n", 1)
    tiefe = '../' * (len(Path(pfad).parts) - 2)
    zeile = f"import {{ translateUI }} from '{tiefe}utils/translations';"
    zeilen = s.split('\n')
    i = import_stelle(zeilen)
    if i == 0:
        kopf = re.match(r'^(/\*\*.*?\*/\n|(?://.*\n)+)', s, re.S)
        vor = kopf.group(0).count('\n') if kopf else 0
        zeilen.insert(vor, zeile)
    else:
        zeilen.insert(i, zeile)
    return '\n'.join(zeilen)


def main():
    raum, pfade = sys.argv[1], [WURZEL / a for a in sys.argv[2:]]
    for pfad in pfade:
        rel = pfad.relative_to(WURZEL)
        s = pfad.read_text()
        if re.search(r"translateUI\(`" + re.escape(raum) + r"\.\$\{key\}`", s):
            print(f'  = {rel} (Helfer vorhanden)')
            continue
        zeilen = s.split('\n')
        grenzen = [i for i, z in enumerate(zeilen)
                   if re.match(r'^(export )?(default )?(const|function) \w+', z)] + [len(zeilen)]
        nutzer = []
        for a, b in zip(grenzen, grenzen[1:]):
            block = '\n'.join(zeilen[a:b])
            if re.search(r"(?<![\w.])t\('", block):
                nutzer.append((a, b, block))
        if not nutzer:
            print(f'  - {rel} (keine t()-Aufrufe)')
            continue

        lokal = None
        if len(nutzer) == 1:
            a, b, block = nutzer[0]
            kopf_m = re.search(r'^.*?(=>\s*\{|\)\s*\{)\s*$', '\n'.join(zeilen[a:min(b, a + 30)]), re.M)
            hat_lang = 'lang' in block[:600]
            if kopf_m and hat_lang and '=> (' not in zeilen[a]:
                lokal = (a, b)

        if lokal:
            a, b = lokal
            props_ende = None
            for i in range(a, min(b, a + 40)):
                if re.match(r'^\s*\} = props;', zeilen[i]):
                    props_ende = i + 1
                    break
                if re.match(r'^.*(\)\s*=>\s*\{|\)\s*\{)\s*$', zeilen[i]):
                    props_ende = props_ende or i + 1
            stelle = props_ende or a + 1
            zeilen.insert(stelle, f"  const t = (key) => translateUI(`{raum}.${{key}}`, lang);")
            zeilen.insert(stelle, f"  // v1.1.2310: Texte aus dem Wörterbuch (ui.{raum}.*) statt inline.")
            s = import_sichern('\n'.join(zeilen), str(pfad))
            pfad.write_text(s)
            print(f'  + {rel} (lokaler Helfer)')
        else:
            s = re.sub(r"(?<![\w.])t\('(\w+)'\)", r"t('\1', lang)", s)
            zeilen = s.split('\n')
            i = import_stelle(zeilen)
            helfer = [
                '',
                f'// v1.1.2310: Texte aus dem Wörterbuch (ui.{raum}.*). Modul-Helfer mit',
                '// `lang`-Parameter — mehrere Funktionen/Ausdrücke nutzen ihn.',
                f'const t = (key, lang) => translateUI(`{raum}.${{key}}`, lang);',
            ]
            zeilen[i:i] = helfer
            s = import_sichern('\n'.join(zeilen), str(pfad))
            pfad.write_text(s)
            print(f'  + {rel} (Modul-Helfer, {len(nutzer)} Nutzer)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
