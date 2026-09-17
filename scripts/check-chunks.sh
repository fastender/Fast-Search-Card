#!/usr/bin/env bash
# v1.1.2431 (Auftrag 16): Chunk-Wächter für die Mehrdatei-Auslieferung.
# Jede Datei, die die Karte oder ein Chunk per import("./Name-hash.js") lädt,
# muss in dist/ liegen; kein Chunk darf verwaist sein. Läuft in build.sh nach
# dem Kopieren. Aufruf: bash scripts/check-chunks.sh [DIST_DIR]
set -euo pipefail
WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${1:-$WURZEL/dist}"
KARTE="$DIST/fast-search-card.js"
[ -f "$KARTE" ] || { echo "❌ check-chunks: $KARTE fehlt" >&2; exit 1; }

fehler=0
# Dynamisch `import("./X.js")` UND statisch `from"./X.js"` (geteilte Chunks wie FeedShell, WheelSubPage).
referenziert=$(cat "$KARTE" "$DIST"/*-*.js 2>/dev/null | grep -oE '(import\(|from ?)"\./[A-Za-z0-9_.-]+\.js"' | sed -E 's/.*"\.\/(.*)"$/\1/' | sort -u || true)
for f in $referenziert; do
  [ -f "$DIST/$f" ] || { echo "❌ check-chunks: importiert, aber fehlt: $f" >&2; fehler=1; }
done
for f in "$DIST"/*-*.js; do
  [ -e "$f" ] || continue
  b=$(basename "$f"); [ "$b" = "fast-search-card.js" ] && continue
  echo "$referenziert" | grep -qx "$b" || { echo "❌ check-chunks: verwaister Chunk: $b" >&2; fehler=1; }
done
# Git-Gegenprobe: getrackte dist/*.js, die auf der Platte fehlen (alte Chunks), wären
# nach dem Commit wieder im Tag — HACS lüde sie mit. build.sh staged Löschungen per
# git-Pathspec; hier zählen wir nach, falls jemand das Skript umbaut.
if git -C "$WURZEL" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r t; do
    [ -n "$t" ] || continue
    [ -f "$WURZEL/$t" ] || echo "⚠️  check-chunks: getrackt, aber nicht mehr auf der Platte (wird als Löschung gestaged): $t" >&2
  done < <(git -C "$WURZEL" ls-files 'dist/*.js')
fi
anz=$(echo "$referenziert" | grep -c . || true)
[ "$fehler" = 0 ] && echo "✓ check-chunks: ${anz} Chunk(s) referenziert, alle vorhanden, keine Waisen"
exit $fehler
