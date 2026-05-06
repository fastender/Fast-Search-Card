# Lessons

Curated patterns and lessons from working on this codebase. Apple-Tips-style — each entry is one screen: what, why, how. Not chronological — pulled from session notes when a pattern proved itself across multiple incidents.

Source material lives in [`../session-notes/`](../session-notes/) — those are the raw daily logs. This file is the distilled version.

---

## Audit · Symbol-grep finds dead code in minutes

**The pattern.** A short Bash loop over each `^export` symbol, grep across `src/`, filter out the defining file and any barrel files. Anything with zero hits is dead.

**Why it works.** Most "is this used?" questions reduce to a string search. After 16 audit rounds (R1–R16, May 4–6 2026), this loop found 60+ dead symbols at ~5/minute on warm code. Diminishing returns kick in around round 10 — that's the signal cleanup is done.

**How.**
```bash
for sym in $(grep -E "^export (const|function)" "$file" \
              | grep -oE "(const|function) [A-Za-z][A-Za-z0-9_]+" \
              | awk '{print $NF}'); do
  ext=$(grep -rln "\b$sym\b" src --include="*.js" --include="*.jsx" \
        | grep -v "$file" | grep -v "barrel_file" | wc -l | tr -d ' ')
  [[ "$ext" == "0" ]] && echo "DEAD: $sym"
done
```

**When not.** CSS dead-code (no symbol structure — needs PurgeCSS). Default-export objects mask their members — see *Barrel files mask dead symbols*.

---

## Audit · Barrel files mask dead symbols

**The pattern.** Re-exports look like usage but aren't. A symbol can appear in three places — named re-export, default-import for the default-export object, default-export property — and still have zero real consumers.

**Why it matters.** R6 (animations barrel) had ~50 variants where 22 were dead. Each appeared 3× in code, making the symbol-grep look healthy until the filter `grep -v defining_file | grep -v barrel_file` was added.

**How to check.** When a file looks like a barrel (lots of `export ... from`), grep for actual *imports* of the default: `grep -rn "import [A-Z][a-zA-Z]* from.*animationVariants"`. Zero hits → the whole default-export plumbing is dead.

---

## Audit · Cascade detection after each deletion

**The pattern.** Re-run the symbol-grep after every batch of deletions. Symbols that depended on just-removed code become dead too. Repeat until fixed point.

**Why.** R7 (`chartConfig.js`) found 4 helpers becoming dead only after the root `createChartConfig` was removed. Single-pass audits miss this — the chain looks alive when measured top-down only once.

**Apply when.** You delete any function with internal callees. Always re-audit before declaring the file clean.

---

## Refactor · Sub-component splits leave parent imports

**The pattern.** When you extract a sub-component, the parent's `import` lines for the moved symbols don't auto-clean. IDEs only fix unused imports for the file currently focused, on save.

**Why it bit us.** R15 found **30 unused imports in SearchField.jsx** — icons and animation variants that had migrated to `FilterControlPanel`/`CategoryButtonsPanel`/`SearchInputSection`. Cascade: 8 icons in `Icons.jsx` became orphans once the parent stopped using them.

**Apply when.** After any split. Run a strict-grep on the parent file specifically. Don't trust HMR — production build catches more.

---

## Build · Production compile catches what HMR misses

**The pattern.** HMR can keep running with broken module resolution if the file isn't actively hot-updated. `./build.sh` (production rollup) refuses to compile and surfaces the real error.

**Why it bit us.** R11 moved `utils/formatters/timeFormatters.js` → `utils/timeFormatters.js`. Internal `import '../historyConstants'` was now wrong. HMR didn't flag it; the build did.

**Apply when.** Any file move. Always run the production build before declaring a structural change done — relative imports inside the moved file are easy to miss.

---

## Home Assistant · `hass`-ref keeps state stable across backend ticks

**The pattern.** Store the latest `hass` object in a ref instead of as a hook dependency. Effects that read `hass` don't re-fire on every backend tick.

**Why.** Otherwise every WebSocket update from HA re-runs subscribed effects, which is both wasteful and causes flicker on rapidly-updating entities.

**Apply when.** You need current `hass` inside an effect/callback but you don't want the effect to re-run when unrelated state changes.

---

## Home Assistant · Optimistic toggle with pending lock

**The pattern.** Optimistic UI flip + lock the toggle until the backend confirms the new state. Without the lock, a fast second tap during latency races the first call.

**Why.** Toggles in HA cards have meaningful round-trip latency (50–500 ms). Without optimistic update they feel sluggish; without the lock they double-fire.

**Apply when.** Any switch-style control hitting `hass.callService`. See `LiquidGlassSwitch` for the implementation.
