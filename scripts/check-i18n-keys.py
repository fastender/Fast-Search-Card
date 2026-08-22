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
    # v1.1.2339: ma/-Unterkomponenten bekommen den musicAssistant-Übersetzer als Prop.
    'components/controls/ma/': 'musicAssistant',
    # v1.1.2343: Domain-Module bekommen `t` (controls.*) im Kontext des Verteilers.
    'utils/deviceConfigs/': 'controls',
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


ohne_uebersetzer = []  # Dateien, die t('…') rufen, ohne t zu definieren/zu bekommen


def sammle_verwendungen():
    """Findet Schlüssel im Quelltext — direkt und über lokale t()-Helfer."""
    verwendungen = []  # (schluessel, datei, zeilennr)
    global ohne_uebersetzer
    for datei in sorted(WURZEL.glob('src/**/*.js')) + sorted(WURZEL.glob('src/**/*.jsx')):
        text = datei.read_text(errors='ignore')
        rel = str(datei.relative_to(WURZEL))
        # Dateien ohne eigenen translateUI-Import können ihr `t` als Prop
        # bekommen — dann entscheidet PROP_PRAEFIXE, ob wir sie prüfen.
        if 'translateUI' not in text and not any(o in rel for o in PROP_PRAEFIXE):
            # v1.1.2352: ruft so eine Datei trotzdem t('…') auf, hat sie weder
            # Übersetzer noch Prop — zur Laufzeit „t is not defined" (so stürzte
            # das Kalender-Popover der Charts seit der Migration bei jedem Öffnen).
            # Lokale Helfer namens t (z.B. Datums-Lambdas) werden nur gemeldet,
            # wenn sie mit einem String-Literal aufgerufen werden.
            code = '\n'.join(re.sub(r'^\s*(//|\*).*', '', z) for z in text.split('\n'))
            # Ohne translateUI in der Datei kann eine lokale `const t` kein
            # Übersetzer sein (im Popover war es ein Datums-Lambda) — nur ein
            # Import oder ein Prop/Parameter namens t gilt als Versorgung.
            # Ein bewusst lokaler Zweisprach-Helfer `const t = (de, en) => …`
            # (NotificationsView) oder ein eigener Schlüssel-Übersetzer zählt
            # ebenfalls als Versorgung — am Parameternamen erkannt.
            versorgt = re.search(r"import[^;]*\bt\b[^;]*from|[{,]\s*t\s*[,}]|^\s*t,\s*$|\bconst\s+t\s*=\s*\(\s*(key|k|de|en|schluessel|id)\b", code, re.M)
            if re.search(r"(?<![\w.])t\(\s*'[\w.]+'", code) and not versorgt:
                ohne_uebersetzer.append(rel)
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
            # v1.1.2337: Info-Popup-Verweise — `infoKey="x"` (JSX) oder `infoKey: 'x'`
            # (Tabellen) zeigen IMMER auf ui.settings.settingsInfo.x (so lösen
            # SettingsSectionHeader/SettingsInfoButton auf). Damit ist die harte
            # Katalog-Regel (Popup-Text muss existieren) erstmals maschinell gedeckt.
            for treffer in re.finditer(r"\binfoKey\s*[:=]\s*[\"']([\w.]+)[\"']", zeile):
                verwendungen.append((f'settings.settingsInfo.{treffer.group(1)}', rel, nr))
            if praefix:
                for treffer in re.finditer(r"(?<![\w.])t\(\s*'([\w.]+)'", zeile):
                    schluessel = treffer.group(1)
                    # `t('settingsInfo.' + key)` u. ä. — der Schlüssel entsteht
                    # erst zur Laufzeit, statisch ist da nichts zu prüfen.
                    if zeile[treffer.end():].lstrip().startswith(('+', '$')):
                        continue
                    verwendungen.append((f'{praefix}.{schluessel}', rel, nr))
                # v1.1.2335: Schlüssel in Spezifikations-Tabellen (`labelKey: '…'`,
                # `infoKey: '…'`), die später per t(eintrag.labelKey) aufgelöst
                # werden — sonst verlöre der Wächter sie (24 Liquid-Glass-Regler-
                # Schlüssel wanderten in eine Tabelle).
                for treffer in re.finditer(r"\b(?:labelKey|titleKey|footerKey)\s*:\s*'([\w.]+)'", zeile):
                    verwendungen.append((f'{praefix}.{treffer.group(1)}', rel, nr))
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
    ohne = sorted(set(ohne_uebersetzer))
    if not fehlend and not verdreht and not ohne:
        gesamt = len(set(k for k, _, _ in sammle_verwendungen()))
        print(f'check-i18n-keys: {gesamt} Schlüssel, alle in de + en vorhanden, '
              f'kein deutscher Text in en.js.')
        return 0
    if ohne:
        print(f'check-i18n-keys: {len(ohne)} Datei(en) rufen t(\'…\') ohne Übersetzer — zur Laufzeit „t is not defined":\n')
        for rel in ohne:
            print(f'  {rel}')
        print()
    if verdreht:
        print(f'check-i18n-keys: {len(verdreht)} verdächtige Einträge in en.js '
              f'(sieht deutsch aus):\n')
        for k, wert, nr in verdreht:
            print(f'  {k}: {wert!r}  (en.js:{nr})')
        if fehlend:
            print()

    if fehlend:
        print(f'check-i18n-keys: {len(fehlend)} fehlende Schlüssel\n')
        for schluessel, datei, nr, fehlt_in in fehlend:
            print(f'  {schluessel}  ({datei}:{nr})  fehlt in: {", ".join(fehlt_in)}')
    return 1


if __name__ == '__main__':
    sys.exit(main())
