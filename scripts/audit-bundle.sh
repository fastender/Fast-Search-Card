#!/usr/bin/env bash
# Run the bundle-size audit safely. Vite (with emptyOutDir default=true) wipes
# dist/ before building → `dist/fast-search-card.js` gets deleted locally
# without `build.sh`'s wrapper-injection step. This script runs the audit and
# then restores the committed wrapper file so the working tree stays sane.
#
# Output: aggregated leaderboard on stdout + dist/bundle-stats.html opens.
#
# To regenerate just the production bundle, use `./build.sh` instead.
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "== Running vite with ANALYZE=1 (this empties dist/) =="
ANALYZE=1 npm run build

echo ""
echo "== Parsing bundle-stats.html =="
node analyze-bundle.js

echo ""
echo "== Restoring dist/fast-search-card.js from git =="
# vite wiped it; the committed copy is the last production-built wrapper.
git restore dist/fast-search-card.js

echo ""
echo "✓ Audit complete. bundle-stats.html generated. dist/fast-search-card.js"
echo "  restored from HEAD (run ./build.sh to actually re-produce a fresh one)."
