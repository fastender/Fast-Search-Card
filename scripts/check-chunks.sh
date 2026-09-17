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
anz=$(echo "$referenziert" | grep -c . || true)
[ "$fehler" = 0 ] && echo "✓ check-chunks: ${anz} Chunk(s) referenziert, alle vorhanden, keine Waisen"
exit $fehler
