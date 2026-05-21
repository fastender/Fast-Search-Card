#!/usr/bin/env bash
# check-hooks.sh — verify every Preact built-in hook referenced in a file
# is imported from 'preact/hooks'. Catches the v1.1.1570-class of mistake
# (refactor strips an `import { useRef }` but leaves a `useRef(null)` call).
#
# Usage:
#   scripts/check-hooks.sh                # scan src/ (default)
#   scripts/check-hooks.sh path/to/dir    # scan a different root
#   scripts/check-hooks.sh -q             # quiet — no output unless errors
#
# Exit codes: 0 = clean, 1 = at least one file is missing an import.

set -u

ROOT="src"
QUIET=0
for arg in "$@"; do
  case "$arg" in
    -q|--quiet) QUIET=1 ;;
    -*) echo "unknown flag: $arg" >&2; exit 2 ;;
    *)  ROOT="$arg" ;;
  esac
done

if [ ! -d "$ROOT" ]; then
  echo "check-hooks.sh: directory not found: $ROOT" >&2
  exit 2
fi

BUILTINS="useState useEffect useRef useMemo useCallback useContext useReducer useLayoutEffect useErrorBoundary useImperativeHandle useDebugValue useId"

errors=0
files_checked=0

while IFS= read -r file; do
  files_checked=$((files_checked + 1))

  # 1. Extract hook names imported from preact/hooks OR preact/compat (both
  #    re-export the same hook surface). Handles multi-line brace blocks.
  imported="$(awk '
    /from [\x27"]preact\/(hooks|compat)[\x27"]/ { in_block = 1 }
    in_block {
      buf = buf " " $0
      if (index($0, "}")) { print buf; buf = ""; in_block = 0 }
    }
  ' "$file" | grep -oE 'use[A-Z][a-zA-Z]+' | sort -u)"

  # 2. Strip top-level import statements AND comments so imported names + comment
  #    mentions dont count as usage. Block comments via state machine, line
  #    comments via sed after.
  body="$(awk '
    /^[[:space:]]*import[[:space:]]/ { in_imp = 1 }
    in_imp { if (index($0, ";")) in_imp = 0; next }
    { print }
  ' "$file" | awk '
    BEGIN { in_block = 0 }
    {
      line = $0
      out = ""
      i = 1
      while (i <= length(line)) {
        two = substr(line, i, 2)
        if (in_block) {
          if (two == "*/") { in_block = 0; i += 2 } else { i++ }
        } else {
          if (two == "/*") { in_block = 1; i += 2 }
          else { out = out substr(line, i, 1); i++ }
        }
      }
      print out
    }
  ' | sed -E 's://.*$::')"

  # 3. For each built-in, flag if used in body but not imported.
  missing=""
  for h in $BUILTINS; do
    if printf '%s' "$body" | grep -qE "\b$h\b"; then
      if ! printf '%s\n' "$imported" | grep -qx "$h"; then
        missing="$missing $h"
      fi
    fi
  done

  if [ -n "$missing" ]; then
    echo "MISSING IMPORT in $file:$missing"
    errors=$((errors + 1))
  fi
done < <(find "$ROOT" -type f \( -name "*.jsx" -o -name "*.js" \))

if [ "$QUIET" -eq 0 ]; then
  if [ "$errors" -eq 0 ]; then
    echo "check-hooks: $files_checked files clean."
  else
    echo "check-hooks: $errors file(s) with missing imports (out of $files_checked checked)." >&2
  fi
fi

exit "$([ "$errors" -eq 0 ] && echo 0 || echo 1)"
