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

# Ordner, deren Dateien `t` als PROP durchgereicht bekommen (der Präfix wird
# beim Aufrufer gesetzt, hier steht nur `t('key')`). Ohne diese Karte prüft das
# Skript solche Dateien gar nicht — ein Tippfehler bliebe bis zum Nutzer stehen.
PROP_PRAEFIXE = {
    'components/tabs/SettingsTab/': 'settings',   # SettingsTab.jsx:73
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
        rel = str(datei.relative_to(WURZEL))
        # Dateien ohne eigenen translateUI-Import können ihr `t` als Prop
        # bekommen — dann entscheidet PROP_PRAEFIXE, ob wir sie prüfen.
        if 'translateUI' not in text and not any(o in rel for o in PROP_PRAEFIXE):
            continue

        # Präfix eines lokalen t()-Helfers: translateUI(`praefix.${key}`, …)
        praefix = None
        m = re.search(r'translateUI\(`([\w.]+)\.\$\{\w+\}`', text)
        if m:
            praefix = m.group(1)
        elif re.search(r'^\s*t,\s*$|\(\{\s*t[,}]|,\s*t\s*\}\)', text, re.M):
            # Datei bekommt `t` als PROP — der Präfix steht dann beim Aufrufer.
            # Ohne diese Karte blieben ganze Ordner ungeprüft (die vier
            # Einstellungs-Tabs waren 47 Schlüssel lang unsichtbar).
            for ordner, p in PROP_PRAEFIXE.items():
                if ordner in rel:
                    praefix = p
                    break

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


def deutsche_reste_im_englischen():
    """Findet Einträge in en.js, die offensichtlich deutscher Text sind.

    Hintergrund: In v1.1.2301 hat ein Generierskript die englischen Strings nach
    `de.js` geschrieben. Build, Schlüsselprüfung und Tests blieben grün — nur
    die Oberfläche war in der falschen Sprache. Umlaute und ein paar
    unverwechselbare Wörter reichen als Fühler; englische Einträge, die absichtlich
    identisch sind ('Radio', 'Queue'), lösen nichts aus.
    """
    verdaechtig = []
    marker = re.compile(
        r'[äöüßÄÖÜ]|\b(?:Nach|Keine|Nicht|Alle|Immer|Zeit|Anzeige|Auswahl|'
        r'L\u00f6schen|\u00c4ndern|und|oder|der|die|das)\b')
    text = SPRACHEN['en'].read_text()
    for nr, zeile in enumerate(text.split('\n'), 1):
        eintrag = re.match(r"^\s+'?([\w-]+)'?\s*:\s*'((?:[^'\\]|\\.)*)',?$", zeile)
        if eintrag and marker.search(eintrag.group(2)):
            verdaechtig.append((eintrag.group(1), eintrag.group(2), nr))
    return verdaechtig


def main():
    woerter = {name: lies_schluessel(pfad) for name, pfad in SPRACHEN.items()}
    fehlend = []
    for schluessel, datei, nr in sammle_verwendungen():
        # `translateUI` stellt 'ui.' voran — im Wörterbuch steht der volle Pfad.
        voll = f'ui.{schluessel}'
        fehlt_in = [name for name, keys in woerter.items() if voll not in keys]
        if fehlt_in:
            fehlend.append((schluessel, datei, nr, fehlt_in))

    verdreht = deutsche_reste_im_englischen()
    if not fehlend and not verdreht:
        gesamt = len(set(k for k, _, _ in sammle_verwendungen()))
        print(f'check-i18n-keys: {gesamt} Schlüssel, alle in de + en vorhanden, '
              f'kein deutscher Text in en.js.')
        return 0
    if verdreht:
        print(f'check-i18n-keys: {len(verdreht)} verdächtige Einträge in en.js '
              f'(sieht deutsch aus):\n')
        for k, wert, nr in verdreht:
            print(f'  {k}: {wert!r}  (en.js:{nr})')
        if fehlend:
            print()

    print(f'check-i18n-keys: {len(fehlend)} fehlende Schlüssel\n')
    for schluessel, datei, nr, fehlt_in in fehlend:
        print(f'  {schluessel}  ({datei}:{nr})  fehlt in: {", ".join(fehlt_in)}')
    return 1


if __name__ == '__main__':
    sys.exit(main())
