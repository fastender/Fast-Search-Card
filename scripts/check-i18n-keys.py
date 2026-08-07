#!/usr/bin/env python3
"""Prüft, dass jeder im Code benutzte Übersetzungsschlüssel in BEIDEN
Wörterbüchern steht (de.js und en.js).

Warum das nötig ist: `getTranslation` gibt bei einem unbekannten Schlüssel den
PFAD zurück ('ui.musicAssistant.play'), nicht null. Der Pfad ist truthy, also
greift auch ein `|| fallback` nicht — auf dem Bildschirm steht dann der rohe
Schlüssel. Ein Tippfehler fällt so erst dem Nutzer auf.

Erkannt werden:
  translateUI('a.b', …)                      → ui.a.b
  const t = (k) => translateUI(`praefix.${k}`, …)  +  t('c')   → ui.praefix.c

Aufruf:  python3 scripts/check-i18n-keys.py
Rückgabe: 0 = alle Schlüssel vorhanden, 1 = mindestens einer fehlt.
"""
import re
import sys
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
SPRACHEN = {
    'de': WURZEL / 'src/utils/translations/languages/de.js',
    'en': WURZEL / 'src/utils/translations/languages/en.js',
}


def lies_schluessel(pfad):
    """Sammelt alle Pfade eines Wörterbuchs ('ui.a.b') über die Einrückung.

    Bewusst kein JS-Parser: die Dateien sind reine verschachtelte Literale mit
    zwei Leerzeichen pro Ebene.
    """
    schluessel = set()
    stapel = []
    for zeile in pfad.read_text().split('\n'):
        ohne = zeile.strip()
        if not ohne or ohne.startswith('//') or ohne.startswith('*'):
            continue
        # Einrückung = Verschachtelungstiefe, zwei Leerzeichen pro Ebene.
        # `  ui: {` steht auf Tiefe 1 und ist das ERSTE Pfadstück — deshalb
        # `tiefe - 1` als Schnittpunkt in den Stapel.
        tiefe = (len(zeile) - len(zeile.lstrip())) // 2
        block = re.match(r"^'?([\w-]+)'?\s*:\s*\{", ohne)
        if block:
            stapel = stapel[:max(0, tiefe - 1)] + [block.group(1)]
            continue
        eintrag = re.match(r"^'?([\w-]+)'?\s*:\s*[\"'`]", ohne)
        if eintrag:
            schluessel.add('.'.join(stapel[:max(0, tiefe - 1)] + [eintrag.group(1)]))
    return schluessel


def sammle_verwendungen():
    """Findet Schlüssel im Quelltext — direkt und über lokale t()-Helfer."""
    verwendungen = []  # (schluessel, datei, zeilennr)
    for datei in sorted(WURZEL.glob('src/**/*.js')) + sorted(WURZEL.glob('src/**/*.jsx')):
        text = datei.read_text(errors='ignore')
        if 'translateUI' not in text:
            continue
        rel = str(datei.relative_to(WURZEL))

        # Präfix eines lokalen t()-Helfers: translateUI(`praefix.${key}`, …)
        praefix = None
        m = re.search(r'translateUI\(`([\w.]+)\.\$\{\w+\}`', text)
        if m:
            praefix = m.group(1)

        for nr, roh in enumerate(text.split('\n'), 1):
            # Zeilenkommentare abschneiden: Erklärtexte nennen Schlüssel gern
            # beispielhaft ("t() = translateUI('settings.'+key)") und erzeugten
            # sonst Geister-Treffer.
            zeile = re.sub(r'^\s*(//|\*).*', '', roh)
            zeile = re.split(r'\s//\s', zeile)[0]
            for treffer in re.finditer(r"translateUI\(\s*'([\w.]+)'", zeile):
                verwendungen.append((treffer.group(1), rel, nr))
            if praefix:
                for treffer in re.finditer(r"(?<![\w.])t\(\s*'([\w.]+)'", zeile):
                    schluessel = treffer.group(1)
                    # `t('settingsInfo.' + key)` u. ä. — der Schlüssel entsteht
                    # erst zur Laufzeit, statisch ist da nichts zu prüfen.
                    if zeile[treffer.end():].lstrip().startswith(('+', '$')):
                        continue
                    verwendungen.append((f'{praefix}.{schluessel}', rel, nr))
    return verwendungen


def main():
    woerter = {name: lies_schluessel(pfad) for name, pfad in SPRACHEN.items()}
    fehlend = []
    for schluessel, datei, nr in sammle_verwendungen():
        # `translateUI` stellt 'ui.' voran — im Wörterbuch steht der volle Pfad.
        voll = f'ui.{schluessel}'
        fehlt_in = [name for name, keys in woerter.items() if voll not in keys]
        if fehlt_in:
            fehlend.append((schluessel, datei, nr, fehlt_in))

    if not fehlend:
        gesamt = len(set(k for k, _, _ in sammle_verwendungen()))
        print(f'check-i18n-keys: {gesamt} Schlüssel, alle in de + en vorhanden.')
        return 0

    print(f'check-i18n-keys: {len(fehlend)} fehlende Schlüssel\n')
    for schluessel, datei, nr, fehlt_in in fehlend:
        print(f'  {schluessel}  ({datei}:{nr})  fehlt in: {", ".join(fehlt_in)}')
    return 1


if __name__ == '__main__':
    sys.exit(main())
