#!/usr/bin/env bash
# scripts/check-bundle-size.sh — Größenbudget des Bündels (2026-09-13, Auftrag 09)
#
# Die Karte geht als EINE Datei über HACS raus; Splitten ist nicht möglich
# (project_bundle_measurement). Was hinzukommt, lädt jedes Tablet bei jedem
# Start. Gemessen v1.1.2400: 2 190 961 B roh, 599 736 B gzip.
#
# Aufruf:  bash scripts/check-bundle-size.sh [--allow-big]
#   über WARN  → Warnung auf stderr, Exit 0
#   über MAX   → Exit 1, außer mit --allow-big (dann nur Warnung)
# Ausgabe: EINE Zeile auf stdout (Englisch, geht so in die Release-Notizen)
# Prüfen:  DIST_FILE, WARN, MAX lassen sich per Umgebung überschreiben

set -euo pipefail

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_FILE="${DIST_FILE:-$WURZEL/dist/fast-search-card.js}"
WARN="${WARN:-620000}"
MAX="${MAX:-700000}"

fehler() { echo "❌ check-bundle-size: $*" >&2; exit 1; }

GROSS_ERLAUBT=0
for arg in "$@"; do
  case "$arg" in
    --allow-big) GROSS_ERLAUBT=1 ;;
    *) fehler "unbekanntes Argument: $arg" ;;
  esac
done

[ -f "$DIST_FILE" ] || fehler "Bündel fehlt: $DIST_FILE"

ROH=$(wc -c < "$DIST_FILE" | tr -d ' ')
GZ=$(gzip -c "$DIST_FILE" | wc -c | tr -d ' ')
ZEILE="${ROH} bytes raw · ${GZ} bytes gzip (budget: warn ${WARN}, max ${MAX})"

if [ "$GZ" -gt "$MAX" ]; then
  if [ "$GROSS_ERLAUBT" = "1" ]; then
    echo "⚠️  check-bundle-size: ${GZ} B gzip liegt über dem Maximum ${MAX} — mit --allow-big durchgelassen" >&2
  else
    fehler "${GZ} B gzip liegt über dem Maximum ${MAX} (roh ${ROH} B). Absichtlich? Dann --allow-big."
  fi
elif [ "$GZ" -gt "$WARN" ]; then
  echo "⚠️  check-bundle-size: ${GZ} B gzip liegt über der Warnschwelle ${WARN}" >&2
fi

echo "$ZEILE"
