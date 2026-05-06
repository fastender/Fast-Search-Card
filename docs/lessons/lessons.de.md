# Lektionen

Kuratierte Patterns und Lessons aus der Arbeit an dieser Codebase. Apple-Tipps-Stil — jeder Eintrag passt auf einen Bildschirm: was, warum, wie. Nicht chronologisch — wird aus den Session-Notes destilliert wenn ein Pattern sich über mehrere Vorfälle bewährt hat.

Rohmaterial liegt in [`../session-notes/`](../session-notes/) — das sind die Tageslogs. Diese Datei ist die destillierte Form.

---

## Audit · Symbol-Grep findet Dead Code in Minuten

**Das Pattern.** Eine kurze Bash-Schleife über jedes `^export`-Symbol, Grep durch `src/`, definierende Datei und Barrel-Files filtern. Alles mit 0 Hits ist tot.

**Warum es funktioniert.** Die meisten "wird das noch benutzt?"-Fragen sind String-Suchen. Über 16 Audit-Runden (R1–R16, 4.–6. Mai 2026) fand diese Schleife 60+ tote Symbole, ~5/Minute auf gewachsener Codebase. Diminishing Returns ab Runde ~10 — das Signal, dass der Cleanup fertig ist.

**Wie.**
```bash
for sym in $(grep -E "^export (const|function)" "$file" \
              | grep -oE "(const|function) [A-Za-z][A-Za-z0-9_]+" \
              | awk '{print $NF}'); do
  ext=$(grep -rln "\b$sym\b" src --include="*.js" --include="*.jsx" \
        | grep -v "$file" | grep -v "barrel_file" | wc -l | tr -d ' ')
  [[ "$ext" == "0" ]] && echo "TOT: $sym"
done
```

**Wann nicht.** CSS-Dead-Code (keine Symbol-Struktur — braucht PurgeCSS). Default-Export-Objekte maskieren ihre Members — siehe *Barrel-Files maskieren tote Symbole*.

---

## Audit · Barrel-Files maskieren tote Symbole

**Das Pattern.** Re-Exports sehen aus wie Verwendung, sind aber keine. Ein Symbol kann an drei Stellen auftauchen — named re-export, default-import für das Default-Export-Objekt, Default-Export-Property — und trotzdem keinen echten Konsumenten haben.

**Warum es zählt.** R6 (Animations-Barrel) hatte ~50 Variants, davon 22 tot. Jedes Symbol erschien 3× im Code, der Symbol-Grep sah gesund aus, bis der Filter `grep -v defining_file | grep -v barrel_file` dazukam.

**Wie prüfen.** Wenn eine Datei wie ein Barrel aussieht (viele `export ... from`), nach echten *Imports* des Defaults greppen: `grep -rn "import [A-Z][a-zA-Z]* from.*animationVariants"`. 0 Hits → die ganze Default-Export-Mechanik ist tot.

---

## Audit · Cascade-Detection nach jeder Löschung

**Das Pattern.** Symbol-Grep nach jedem Lösch-Batch erneut laufen lassen. Symbole die von gerade gelöschtem Code abhingen werden auch tot. Wiederholen bis Fixpunkt.

**Warum.** R7 (`chartConfig.js`) fand 4 Helper die erst tot wurden nachdem die Wurzel `createChartConfig` weg war. Single-Pass-Audits übersehen das — die Kette sieht lebendig aus wenn man nur einmal von oben misst.

**Anwenden wenn.** Du eine Funktion mit internen Callees löschst. Immer neu auditieren bevor die Datei als clean deklariert wird.

---

## Refactor · Sub-Component-Splits lassen Parent-Imports zurück

**Das Pattern.** Wenn du eine Sub-Component extrahierst, werden die `import`-Zeilen im Parent für die verschobenen Symbole nicht automatisch gecleant. IDEs cleanen unused Imports nur für die aktuell offene Datei, on save.

**Warum es uns gebissen hat.** R15 fand **30 unused Imports in SearchField.jsx** — Icons und Animation-Variants die in `FilterControlPanel`/`CategoryButtonsPanel`/`SearchInputSection` gewandert waren. Kaskade: 8 Icons in `Icons.jsx` wurden orphan, sobald der Parent sie nicht mehr nutzte.

**Anwenden wenn.** Nach jedem Split. Strict-Grep speziell auf die Parent-Datei. HMR nicht trauen — Production-Build fängt mehr.

---

## Build · Production-Compile fängt was HMR übersieht

**Das Pattern.** HMR läuft manchmal mit broken Module-Resolution weiter, wenn die Datei nicht aktiv hot-updated wird. `./build.sh` (Production-Rollup) verweigert die Kompilierung und zeigt den echten Fehler.

**Warum es uns gebissen hat.** R11 verschob `utils/formatters/timeFormatters.js` → `utils/timeFormatters.js`. Der interne `import '../historyConstants'` war jetzt falsch. HMR hat's nicht gemerkt; der Build schon.

**Anwenden wenn.** Bei jedem File-Move. Immer den Production-Build laufen lassen bevor du eine Struktur-Änderung als done deklarierst — relative Imports *innerhalb* der verschobenen Datei sind leicht zu übersehen.

---

## Home Assistant · `hass`-Ref hält State stabil über Backend-Ticks

**Das Pattern.** Das aktuelle `hass`-Objekt in einer Ref speichern statt als Hook-Dependency. Effects die `hass` lesen feuern nicht bei jedem Backend-Tick neu.

**Warum.** Sonst löst jedes WebSocket-Update von HA alle subscribed Effects neu aus — verschwenderisch und führt zu Flicker bei schnell-updatenden Entities.

**Anwenden wenn.** Du aktuelles `hass` in einem Effect/Callback brauchst, aber der Effect soll nicht neu laufen wenn unverwandter State sich ändert.

---

## Home Assistant · Optimistic Toggle mit Pending-Lock

**Das Pattern.** Optimistic UI-Flip + Lock auf den Toggle bis das Backend den neuen State bestätigt. Ohne Lock racet ein schneller zweiter Tap während der Latency den ersten Call.

**Warum.** Toggles in HA-Cards haben spürbare Round-Trip-Latency (50–500 ms). Ohne Optimistic-Update fühlen sie sich träge an; ohne Lock feuern sie doppelt.

**Anwenden wenn.** Bei jedem Switch-artigen Control der `hass.callService` triggert. Implementierung in `LiquidGlassSwitch`.
