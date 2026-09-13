#!/usr/bin/env bash
# scripts/check-version.sh — Versionswächter (2026-09-13, Auftrag 09)
#
# Die Karte trägt ihre Version an DREI Stellen, und alle drei müssen gleich sein:
#   1. Über-Reiter   src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx
#                    `ios-item-value">1.1.NNNN<`
#   2. src/version.js  `export const KARTEN_VERSION = '1.1.NNNN';`
#   3. src/version.js  `export const VERSIONS_MARKE = 'fsc-version:1.1.NNNN';`
# Der Versions-Wächter der Karte (useVersionWaechter/StaleLeiste) vergleicht genau
# diese Werte mit dem geladenen Bündel.
#
# 🔑 Die Muster sind absichtlich STRIKT: nur literale Strings in Anführungszeichen.
# v1.1.2397 setzte VERSIONS_MARKE aus einem Template zusammen — der Minifier machte
# daraus einen leeren Marker, und der Wächter der Karte lief ins Leere. Ein
# Template-Literal oder ein zusammengesetzter Wert lässt das Muster hier leer
# laufen, und das Skript bricht ab. Das ist gewollt.
#
# Aufruf:  bash scripts/check-version.sh [--dist]
#   --dist   zusätzlich: das gebaute dist/fast-search-card.js trägt den Marker
# Erfolg:  Exit 0, die Version auf stdout (build.sh übernimmt sie von hier)
# Fehler:  Exit 1, Meldung auf stderr mit allen gefundenen Werten
# Prüfen:  ABOUT_FILE, VERSION_FILE, DIST_FILE überschreiben die Pfade

set -euo pipefail

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ABOUT_FILE="${ABOUT_FILE:-$WURZEL/src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx}"
VERSION_FILE="${VERSION_FILE:-$WURZEL/src/version.js}"
DIST_FILE="${DIST_FILE:-$WURZEL/dist/fast-search-card.js}"

fehler() { echo "❌ check-version: $*" >&2; exit 1; }

MIT_DIST=0
for arg in "$@"; do
  case "$arg" in
    --dist) MIT_DIST=1 ;;
    *) fehler "unbekanntes Argument: $arg" ;;
  esac
done

[ -f "$ABOUT_FILE" ]   || fehler "Datei fehlt: $ABOUT_FILE"
[ -f "$VERSION_FILE" ] || fehler "Datei fehlt: $VERSION_FILE"

# `grep` endet ohne Treffer mit 1 — unter pipefail bräche die Zuweisung sonst ohne
# Meldung ab. Deshalb `|| true` und danach ausdrücklich auf leer prüfen.
# Erste Stelle höchstens dreistellig: so trifft das Muster nicht das Build-Datum
# (`ios-item-value">2026.09.13<`), das im selben Reiter steht.
ABOUT=$(grep -oE 'ios-item-value">[0-9]{1,3}\.[0-9]{1,3}\.[0-9]+<' "$ABOUT_FILE" \
  | head -1 | sed -E 's/^ios-item-value">([0-9.]+)<$/\1/' || true)
KARTE=$(grep -oE "^export const KARTEN_VERSION = ['\"][0-9]{1,3}\.[0-9]{1,3}\.[0-9]+['\"];" "$VERSION_FILE" \
  | head -1 | sed -E "s/^.*['\"]([0-9.]+)['\"];$/\1/" || true)
MARKE=$(grep -oE "^export const VERSIONS_MARKE = ['\"]fsc-version:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]+['\"];" "$VERSION_FILE" \
  | head -1 | sed -E "s/^.*fsc-version:([0-9.]+)['\"];$/\1/" || true)

[ -n "$ABOUT" ] || fehler "keine Version im Über-Reiter (Muster ios-item-value\">X.Y.Z<) in $ABOUT_FILE"
[ -n "$KARTE" ] || fehler "KARTEN_VERSION ist kein literaler String 'X.Y.Z' in $VERSION_FILE (Über-Reiter: $ABOUT)"
[ -n "$MARKE" ] || fehler "VERSIONS_MARKE ist kein literaler String 'fsc-version:X.Y.Z' in $VERSION_FILE (Über-Reiter: $ABOUT, KARTEN_VERSION: $KARTE)"

if [ "$ABOUT" != "$KARTE" ] || [ "$ABOUT" != "$MARKE" ]; then
  fehler "Versionen weichen ab — Über-Reiter: $ABOUT · KARTEN_VERSION: $KARTE · VERSIONS_MARKE: $MARKE"
fi

if [ "$MIT_DIST" = "1" ]; then
  [ -f "$DIST_FILE" ] || fehler "Bündel fehlt: $DIST_FILE"
  grep -qF "fsc-version:$ABOUT" "$DIST_FILE" \
    || fehler "Bündel $DIST_FILE trägt den Marker fsc-version:$ABOUT nicht"
fi

echo "$ABOUT"
