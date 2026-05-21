#!/usr/bin/env bash
# Install scripts/git-hooks/* as this repo's active git-hooks via
# `git config core.hooksPath`. Idempotent — re-running is a no-op.
#
# Disable later:   git config --unset core.hooksPath
set -e

ROOT="$(git rev-parse --show-toplevel)"
TARGET="scripts/git-hooks"

if [ ! -d "$ROOT/$TARGET" ]; then
  echo "install-git-hooks: $TARGET/ not found in $ROOT" >&2
  exit 1
fi

# Ensure hook scripts are executable
chmod +x "$ROOT/$TARGET/"* 2>/dev/null || true

git -C "$ROOT" config core.hooksPath "$TARGET"
echo "✓ Git hooks installed: core.hooksPath = $TARGET"
echo "  Hooks: $(ls "$ROOT/$TARGET" | tr '\n' ' ')"
echo "  Disable with: git config --unset core.hooksPath"
