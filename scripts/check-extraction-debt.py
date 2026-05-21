#!/usr/bin/env python3
"""
check-extraction-debt.py — find post-refactor debt in JS/JSX source files.

After a refactor that extracts code into sub-modules, the original file often
still has either:

  * UNUSED IMPORT  — an import statement whose symbol is no longer referenced.
  * DUPLICATE      — a top-level definition whose name is *also* imported
                     from somewhere. One shadows the other; one is debt.

Both indicate the refactor is incomplete. Detecting them gives a quick punch
list after a code-move pass.

Usage:
  scripts/check-extraction-debt.py            # scan src/
  scripts/check-extraction-debt.py path/      # scan a different root
  scripts/check-extraction-debt.py -q         # quiet (exit-code only)

Exit codes: 0 = clean, 1 = at least one file has debt, 2 = bad invocation.

Notes / known limitations:
  * Comments and string literals are stripped before counting refs, so a
    mention of `useState` inside `"useState removed"` does not count.
  * Top-level definitions are matched via line-anchored regex. Destructuring
    declarations (`const { x } = obj`) are intentionally NOT counted, since
    they typically rebind existing names.
  * Re-exports (`export { X }` and `export { X } from "..."`) count as usage.
  * No false-positive on JSX components: `<Foo />` is detected as a Foo ref.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


IMPORT_NAMED = re.compile(
    r"^\s*import\s+(?:type\s+)?"
    r"(?:(\w+)\s*,\s*)?\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]",
    re.MULTILINE,
)
IMPORT_DEFAULT_ONLY = re.compile(
    r"^\s*import\s+(?:type\s+)?(\w+)\s+from\s*['\"]([^'\"]+)['\"]",
    re.MULTILINE,
)
IMPORT_STAR = re.compile(
    r"^\s*import\s*\*\s+as\s+(\w+)\s+from\s*['\"]([^'\"]+)['\"]",
    re.MULTILINE,
)

DEF_CONST = re.compile(
    r"^(?:export\s+(?:default\s+)?)?(?:const|let|var)\s+(\w+)\s*[=:]",
    re.MULTILINE,
)
DEF_FUNCTION = re.compile(
    r"^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*(\w+)",
    re.MULTILINE,
)
DEF_CLASS = re.compile(
    r"^(?:export\s+(?:default\s+)?)?class\s+(\w+)",
    re.MULTILINE,
)

# `export { a, b as c }` — names locally referenced (so they count as usage).
RE_EXPORT_NAMED = re.compile(
    r"^\s*export\s*\{([^}]+)\}(?!\s*from)",
    re.MULTILINE,
)
# `export { a } from "./foo"` — these are pure pass-throughs, name is the
# original from the source module, so it's not a local usage. Skip.


def _scan(text: str, drop_strings: bool) -> str:
    """Tokenize-aware pass. ALWAYS tracks string/template state so a `//` or
    `/*` inside a string is not misread as a comment (this bit `strip_comments`
    on `deviceTypeRegistry.js`, where a template literal contained
    `xmlns="http://www.w3.org/2000/svg"` — the `//` shredded the rest of the
    file). If drop_strings is True, replaces string + template literal
    *contents* with empty (preserving delimiters as `""`), but keeps identifiers
    inside `${...}` template-expressions so they still count as references."""
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""

        if c == "/" and nxt == "*":
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if c == "/" and nxt == "/":
            end = text.find("\n", i + 2)
            i = n if end == -1 else end  # keep the newline
            continue

        if c in ("'", '"'):
            start = i
            i += 1
            while i < n:
                ch = text[i]
                if ch == "\\" and i + 1 < n:
                    i += 2
                    continue
                if ch == c or ch == "\n":  # unterminated bail at newline
                    i += 1
                    break
                i += 1
            out.append('""' if drop_strings else text[start:i])
            continue

        if c == "`":
            i += 1
            kept_exprs: list[str] = []
            raw_parts: list[str] = ["`"]
            while i < n:
                ch = text[i]
                if ch == "\\" and i + 1 < n:
                    raw_parts.append(text[i : i + 2])
                    i += 2
                    continue
                if ch == "`":
                    raw_parts.append("`")
                    i += 1
                    break
                if ch == "$" and i + 1 < n and text[i + 1] == "{":
                    depth = 1
                    j = i + 2
                    while j < n and depth > 0:
                        if text[j] == "{":
                            depth += 1
                        elif text[j] == "}":
                            depth -= 1
                            if depth == 0:
                                break
                        j += 1
                    expr = text[i + 2 : j]
                    kept_exprs.append(expr)
                    raw_parts.append("${" + expr + "}")
                    i = j + 1 if j < n else j
                    continue
                raw_parts.append(ch)
                i += 1
            if drop_strings:
                out.append('""')
                # Keep ${...} expression contents so identifiers still count.
                for ex in kept_exprs:
                    out.append(" " + ex + " ")
            else:
                out.append("".join(raw_parts))
            continue

        out.append(c)
        i += 1
    return "".join(out)


def strip_comments(text: str) -> str:
    return _scan(text, drop_strings=False)


def strip_strings(text: str) -> str:
    # Comments already gone in caller's no_comments; strings now too.
    return _scan(text, drop_strings=True)


def split_named_list(block: str) -> list[str]:
    """Split `a, b as c, d` → [`a`, `c`, `d`] (alias wins as local name)."""
    names: list[str] = []
    for chunk in block.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(r"(\w+)(?:\s+as\s+(\w+))?", chunk)
        if m:
            names.append(m.group(2) or m.group(1))
    return names


def collect(path: Path):
    raw = path.read_text(encoding="utf-8", errors="replace")
    # Parse imports BEFORE stripping strings (we need the `from "..."` paths).
    no_comments = strip_comments(raw)
    # Strip strings for everything else so string literals dont fake refs.
    clean = strip_strings(no_comments)

    imports: dict[str, str] = {}
    for m in IMPORT_NAMED.finditer(no_comments):
        default_name, named_block, source = m.groups()
        if default_name:
            imports.setdefault(default_name, source)
        for name in split_named_list(named_block):
            imports.setdefault(name, source)
    for m in IMPORT_DEFAULT_ONLY.finditer(no_comments):
        name, source = m.groups()
        imports.setdefault(name, source)
    for m in IMPORT_STAR.finditer(no_comments):
        imports.setdefault(m.group(1), m.group(2))

    defs: set[str] = set()
    for pat in (DEF_CONST, DEF_FUNCTION, DEF_CLASS):
        for m in pat.finditer(clean):
            defs.add(m.group(1))

    re_exported: set[str] = set()
    for m in RE_EXPORT_NAMED.finditer(clean):
        for name in split_named_list(m.group(1)):
            re_exported.add(name)

    return clean, no_comments, imports, defs, re_exported


def count_refs(
    name: str,
    clean: str,
    no_comments: str,
    imports: dict[str, str],
    defs: set[str],
) -> int:
    """Count refs to `name` outside its own import + definition lines."""
    total = len(re.findall(rf"\b{re.escape(name)}\b", clean))

    if name in imports:
        # Match imports on `no_comments` (still has the `from "..."` paths).
        for m in IMPORT_NAMED.finditer(no_comments):
            named = split_named_list(m.group(2))
            if name in named or m.group(1) == name:
                total -= 1
        for m in IMPORT_DEFAULT_ONLY.finditer(no_comments):
            if m.group(1) == name:
                total -= 1
        for m in IMPORT_STAR.finditer(no_comments):
            if m.group(1) == name:
                total -= 1

    if name in defs:
        for pat in (DEF_CONST, DEF_FUNCTION, DEF_CLASS):
            for m in pat.finditer(clean):
                if m.group(1) == name:
                    total -= 1

    return total


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("root", nargs="?", default="src")
    ap.add_argument("-q", "--quiet", action="store_true")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.is_dir():
        print(f"check-extraction-debt: not a directory: {root}", file=sys.stderr)
        return 2

    files = sorted(
        list(root.rglob("*.jsx")) + list(root.rglob("*.js")),
        key=lambda p: str(p),
    )

    issues = 0
    for path in files:
        try:
            clean, no_comments, imports, defs, re_exported = collect(path)
        except Exception as exc:
            print(f"check-extraction-debt: parse error in {path}: {exc}", file=sys.stderr)
            continue

        dupes = sorted(set(imports) & defs)

        unused_imports: list[str] = []
        for name in sorted(imports):
            if name in re_exported:
                continue
            if name in defs:
                continue  # reported as DUPLICATE; counts there
            # JSX pragma + Fragment: imported from preact, used implicitly
            # by the JSX transform — skip.
            if name in ("h", "Fragment") and imports[name] == "preact":
                continue
            if count_refs(name, clean, no_comments, imports, defs) == 0:
                unused_imports.append(name)

        if dupes or unused_imports:
            issues += 1
            print(str(path))
            if dupes:
                print(f"  DUPLICATE (imported + defined locally): {', '.join(dupes)}")
            if unused_imports:
                print(f"  UNUSED IMPORT: {', '.join(unused_imports)}")

    if not args.quiet:
        if issues == 0:
            print(f"check-extraction-debt: {len(files)} files clean.")
        else:
            print(
                f"check-extraction-debt: {issues} file(s) with debt (out of {len(files)}).",
                file=sys.stderr,
            )

    return 0 if issues == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
