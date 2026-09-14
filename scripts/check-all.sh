#!/usr/bin/env bash
# Run every sanity check against src/. Use this before pushing big refactors.
# The pre-commit hook runs the three fast python guards; this one adds the slow
# hook-import check and the version guard (Auftrag 09, 2026-09-13).
set -e

ROOT="$(git rev-parse --show-toplevel)"
SRC="$ROOT/src"

echo "== check-hooks.sh (Preact hook imports) =="
bash "$ROOT/scripts/check-hooks.sh" "$SRC"

echo ""
echo "== check-extraction-debt.py (unused imports + duplicates) =="
python3 "$ROOT/scripts/check-extraction-debt.py" "$SRC"

echo ""
echo "== check-i18n-keys.py (dictionary keys de + en) =="
python3 "$ROOT/scripts/check-i18n-keys.py"

echo ""
echo "== check-purgecss-dynamic.py (class names PurgeCSS would drop) =="
python3 "$ROOT/scripts/check-purgecss-dynamic.py"

echo ""
echo "== check-einstellungs-register.mjs (settings search register covers every setting) =="
node --no-warnings "$ROOT/scripts/check-einstellungs-register.mjs"

echo ""
echo "== check-version.sh (About tab = KARTEN_VERSION = VERSIONS_MARKE) =="
bash "$ROOT/scripts/check-version.sh"
