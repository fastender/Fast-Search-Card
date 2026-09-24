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
# v1.1.2431: Summe über 26 Dateien trägt ~7 KB Chunk-Overhead → Warnschwelle 640 000.
WARN="${WARN:-640000}"
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
# v1.1.2431 (Auftrag 16): Mehrdatei — die Hauptdatei ist die Startlast, die Summe
# aller .js in dist/ die Gesamtlast. Budgets: Hauptdatei WARN_START/MAX_START,
# Summe WARN/MAX (wie bisher).
WARN_START="${WARN_START:-500000}"
MAX_START="${MAX_START:-560000}"
DIST_DIR="$(dirname "$DIST_FILE")"
CHUNKS=$(find "$DIST_DIR" -maxdepth 1 -name '*-*.js' ! -name 'fast-search-card.js' 2>/dev/null | sort)
ANZ=$(echo "$CHUNKS" | grep -c . || true)
if [ "$ANZ" -gt 0 ]; then
  # Startlast = Hauptdatei + Kern + die Entity-Register (index-*.js, lädt
  # registry.autoDiscover beim Boot). Ansichten und chartKern kommen erst beim Öffnen.
  START_FILES=$(printf '%s\n' "$DIST_FILE"; echo "$CHUNKS" | grep -E '/(kern|index)-[A-Za-z0-9_-]+\.js$' || true)
  GZ_START=$(cat $START_FILES | gzip -c | wc -c | tr -d ' ')
  GZ=$(cat "$DIST_FILE" $CHUNKS | gzip -c | wc -c | tr -d ' ')
  ROH=$(cat "$DIST_FILE" $CHUNKS | wc -c | tr -d ' ')
  ZEILE="start ${GZ_START} bytes gzip (main file) · total ${GZ} bytes gzip / ${ROH} raw in $((ANZ+1)) files (budget: start warn ${WARN_START}, total warn ${WARN}, max ${MAX})"
  if [ "$GZ_START" -gt "$MAX_START" ]; then
    if [ "$GROSS_ERLAUBT" = "1" ]; then echo "⚠️  check-bundle-size: Hauptdatei ${GZ_START} B gzip über dem Maximum ${MAX_START} — mit --allow-big durchgelassen" >&2
    else fehler "Hauptdatei ${GZ_START} B gzip liegt über dem Maximum ${MAX_START}. Absichtlich? Dann --allow-big."; fi
  elif [ "$GZ_START" -gt "$WARN_START" ]; then echo "⚠️  check-bundle-size: Hauptdatei ${GZ_START} B gzip über der Warnschwelle ${WARN_START}" >&2; fi
else
  ZEILE="${ROH} bytes raw · ${GZ} bytes gzip (budget: warn ${WARN}, max ${MAX})"
fi

if [ "$GZ" -gt "$MAX" ]; then
  if [ "$GROSS_ERLAUBT" = "1" ]; then
    echo "⚠️  check-bundle-size: ${GZ} B gzip liegt über dem Maximum ${MAX} — mit --allow-big durchgelassen" >&2
  else
    fehler "${GZ} B gzip liegt über dem Maximum ${MAX} (roh ${ROH} B). Absichtlich? Dann --allow-big."
  fi
elif [ "$GZ" -gt "$WARN" ]; then
  echo "⚠️  check-bundle-size: ${GZ} B gzip liegt über der Warnschwelle ${WARN}" >&2
fi

# v1.1.2468 (B17): logger.debug streicht terser per pure_funcs (vite.config.js),
# gemessen −2,9 KB gzip. Die Regel vergleicht den NAMEN — heißt die Bindung nach
# einer Umbenennung durch Rollup (logger$1) oder einem Alias anders, bleiben die
# Aufrufe still im Bündel. Nichts geht kaputt, nur die Ersparnis fehlt → Warnung
# auf stderr, kein Abbruch (stdout bleibt die eine Zeile für build.sh).
DEBUG_ANZ=$( { grep -o '\.debug(' "$DIST_FILE" $CHUNKS 2>/dev/null || true; } | wc -l | tr -d ' ')
if [ "$DEBUG_ANZ" -gt 0 ]; then
  echo "⚠️  check-bundle-size: ${DEBUG_ANZ}× '.debug(' im Bündel — greift pure_funcs 'logger.debug' in vite.config.js noch?" >&2
fi

echo "$ZEILE"
