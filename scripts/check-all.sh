#!/usr/bin/env bash
# Run both sanity scripts against src/. Use this before pushing big refactors.
# Pre-commit hook only runs the fast python check; this one bundles both.
set -e

ROOT="$(git rev-parse --show-toplevel)"
SRC="$ROOT/src"

echo "== check-hooks.sh (Preact hook imports) =="
bash "$ROOT/scripts/check-hooks.sh" "$SRC"

echo ""
echo "== check-extraction-debt.py (unused imports + duplicates) =="
python3 "$ROOT/scripts/check-extraction-debt.py" "$SRC"
