#!/usr/bin/env python3
"""
check-purgecss-dynamic.py — rechnet PurgeCSS' Entscheidung nach und meldet
Klassen, die im Build verloren gingen, weil ihr Name im Quelltext nur
ZUSAMMENGESETZT vorkommt (`foo-${x}`, `${x}-foo`, `'foo-' + x`).

Hintergrund: PurgeCSS behält eine CSS-Regel nur, wenn der vollständige
Klassenname irgendwo im Quelltext als Token ([A-Za-z0-9_-]+) steht oder die
Safelist greift. `bento-widget--${size}` fehlte so monatelang (v1.1.2226),
`${prefix}-loading` der Feed-Hülle flog in v1.1.2344 raus. Der Dev-Server
putzt nicht — man sieht es erst im Release.

Was das Skript tut:
  1. alle Klassen aus src/**/*.css sammeln,
  2. alle Tokens aus src/**/*.{js,jsx,html} + index.html wie der Extractor,
  3. die Safelist aus postcss.config.cjs lesen (standard/deep/greedy),
  4. „gepurgt“ = nicht Token UND nicht safelisted,
  5. Template-Fragmente einsammeln, die Klassennamen zusammensetzen,
  6. FEHLER für jede gepurgte Klasse, auf die ein Fragment passt.

Aufruf:  python3 scripts/check-purgecss-dynamic.py            (Wächter, exit 1 bei Fehlern)
         python3 scripts/check-purgecss-dynamic.py --analyse  (zusätzlich: was hält NUR die Safelist?)
"""
import re
import sys
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
ANALYSE = '--analyse' in sys.argv

# ---------------------------------------------------------------- 1) CSS-Klassen
CLASS_RX = re.compile(r'\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)')
css_klassen = {}   # klasse -> set(dateien)
for css in sorted(WURZEL.glob('src/**/*.css')):
    text = css.read_text(errors='ignore')
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    # Nur Selektoren (alles vor `{`), keine Deklarationen — sonst zählen `0.5s`-Artige
    for block in re.findall(r'([^{}]+)\{', text):
        for m in CLASS_RX.finditer(block):
            css_klassen.setdefault(m.group(1), set()).add(str(css.relative_to(WURZEL)))

# ---------------------------------------------------------------- 2) Tokens wie der Extractor
TOKEN_RX = re.compile(r'[A-Za-z0-9_-]+')
tokens = set()
inhalte = []   # (relpfad, text) für die Fragment-Suche
for datei in sorted(WURZEL.glob('src/**/*.js')) + sorted(WURZEL.glob('src/**/*.jsx')) + sorted(WURZEL.glob('src/**/*.html')) + [WURZEL / 'index.html']:
    if not datei.exists():
        continue
    text = datei.read_text(errors='ignore')
    tokens.update(TOKEN_RX.findall(text))
    inhalte.append((str(datei.relative_to(WURZEL)), text))

# ---------------------------------------------------------------- 3) Safelist aus postcss.config.cjs
standard, regexe = set(), []
konfig = WURZEL / 'postcss.config.cjs'
if konfig.exists():
    ktext = konfig.read_text(errors='ignore')
    ktext = re.sub(r'//.*', '', ktext)
    m = re.search(r'standard:\s*\[(.*?)\]', ktext, re.S)
    if m:
        standard = set(re.findall(r"'([^']+)'", m.group(1)))
    for name in ('deep', 'greedy'):
        m = re.search(name + r':\s*\[(.*?)\]', ktext, re.S)
        if m:
            for lit in re.findall(r'/((?:\\.|[^/])+)/[gimsuy]*', m.group(1)):
                try:
                    regexe.append(re.compile(lit))
                except re.error:
                    print(f'WARNUNG: Safelist-Regex nicht lesbar: /{lit}/')
else:
    print('WARNUNG: postcss.config.cjs nicht gefunden — Safelist wird als LEER angenommen.')

def safelisted(klasse):
    return klasse in standard or any(rx.search(klasse) for rx in regexe)

# ---------------------------------------------------------------- 4) gepurgt?
gepurgt = {k for k in css_klassen if k not in tokens and not safelisted(k)}
nur_safelist = {k for k in css_klassen if k not in tokens and safelisted(k)}

# ---------------------------------------------------------------- 5) Fragmente
# Template-Literale mit verschachtelten ${…} zerlegen; Text direkt VOR `${`
# bzw. direkt NACH `}` ist ein Fragment, wenn er ohne Leerraum an der
# Interpolation klebt.
FRAG_RX = re.compile(r'[A-Za-z0-9_-]+')
fragmente = []   # (art, text, datei, zeile)  art = 'prefix' | 'suffix'

def zerlege_template(lit):
    """Liefert Liste von Strings: literale Stücke und None für jede Interpolation."""
    teile, buf, i = [], '', 0
    while i < len(lit):
        if lit.startswith('${', i):
            teile.append(buf); buf = ''
            tiefe, i = 1, i + 2
            while i < len(lit) and tiefe:
                if lit[i] == '{': tiefe += 1
                elif lit[i] == '}': tiefe -= 1
                i += 1
            teile.append(None)
            continue
        buf += lit[i]; i += 1
    teile.append(buf)
    return teile

# Klassen werden mit `-`/`_` zusammengesetzt (`bento-widget--${size}`,
# `${prefix}-loading`). Ein Fragment ohne diesen Kleber (`hour${n}`, `Tag${x}`)
# ist fast immer Text/Zeit/ID — und bliebe sonst ein Dauer-Fehlalarm.
def prefix_fragment(vorher):
    mm = re.search(r'[A-Za-z0-9_-]+$', vorher)
    if not mm:
        return None
    frag = mm.group(0)
    if not frag.endswith(('-', '_')) or not re.search(r'[A-Za-z]', frag):
        return None
    return frag

def suffix_fragment(nachher):
    mm = re.match(r'[A-Za-z0-9_-]+', nachher)
    if not mm:
        return None
    frag = mm.group(0)
    if not frag.startswith(('-', '_')) or not re.search(r'[A-Za-z]', frag):
        return None
    return frag

# Template-Literale, die sicher KEINE Klassen sind (React-Keys, IDs, URLs …),
# überspringen — sonst meldet `key={`filter-${id}`}` das tote `.filter-item`.
KEIN_KLASSEN_KONTEXT = re.compile(r'(?:\bkey|\bid|\bhref|\bsrc|\btitle|\balt|\bname|\baria-[a-z]+|\bdata-[a-z-]+|\bfor|\bplaceholder)\s*=\s*\{?\s*$')

for rel, text in inhalte:
    # Backtick-Literale (Kommentare sind egal: sie erzeugen höchstens Fragmente,
    # die nur auf ohnehin gepurgte Klassen passen würden)
    for m in re.finditer(r'`((?:\\.|[^`\\])*)`', text, re.S):
        lit = m.group(1)
        if '${' not in lit:
            continue
        if KEIN_KLASSEN_KONTEXT.search(text[max(0, m.start() - 40):m.start()]):
            continue
        zeile = text.count('\n', 0, m.start()) + 1
        teile = zerlege_template(lit)
        for idx, t in enumerate(teile):
            if t is not None:
                continue
            vorher = teile[idx - 1] if idx > 0 else ''
            nachher = teile[idx + 1] if idx + 1 < len(teile) else ''
            if vorher is not None:
                frag = prefix_fragment(vorher)
                if frag:
                    fragmente.append(('prefix', frag, rel, zeile))
            if nachher is not None:
                frag = suffix_fragment(nachher)
                if frag:
                    fragmente.append(('suffix', frag, rel, zeile))
    # String-Verkettung: 'foo-' + x  /  x + '-foo'
    for m in re.finditer(r"['\"]([A-Za-z0-9_-]*[A-Za-z][A-Za-z0-9_-]*-)['\"]\s*\+", text):
        fragmente.append(('prefix', m.group(1), rel, text.count('\n', 0, m.start()) + 1))
    for m in re.finditer(r"\+\s*['\"](-[A-Za-z0-9_-]*[A-Za-z][A-Za-z0-9_-]*)['\"]", text):
        fragmente.append(('suffix', m.group(1), rel, text.count('\n', 0, m.start()) + 1))

def passt(klasse, art, frag):
    if art == 'prefix':
        return klasse.startswith(frag) and len(klasse) > len(frag)
    return klasse.endswith(frag) and len(klasse) > len(frag)

# ---------------------------------------------------------------- 6) Befund
fehler = {}
for k in sorted(gepurgt):
    treffer = [(art, frag, rel, zeile) for (art, frag, rel, zeile) in fragmente if passt(k, art, frag)]
    if treffer:
        fehler[k] = treffer

print(f'check-purgecss-dynamic: {len(css_klassen)} CSS-Klassen, {len(tokens)} Tokens, Safelist {len(standard)} exakt + {len(regexe)} Regexe; '
      f'{len(gepurgt)} Klassen würden gepurgt (kein Token, keine Safelist), {len(nur_safelist)} hängen NUR an der Safelist.')
if fehler:
    print(f'\n{len(fehler)} Klasse(n) würden im Build VERLOREN gehen, obwohl der Quelltext sie zusammensetzt:')
    for k, treffer in fehler.items():
        orte = sorted({f'{rel}:{zeile} ({art} "{frag}")' for (art, frag, rel, zeile) in treffer})
        print(f'  .{k}   CSS: {", ".join(sorted(css_klassen[k]))}')
        for o in orte[:4]:
            print(f'      ← {o}')
    print('\nAbhilfe: den vollständigen Klassennamen wörtlich hinterlegen (Tabelle statt Template, vgl. FeedShell.KLASSEN)\n'
          'oder eine passende Safelist-Regel in postcss.config.cjs.')

if ANALYSE:
    print('\n--- Analyse: Klassen, die NUR die Safelist am Leben hält (kein Token im Quelltext) ---')
    nach_regel = {}
    for k in sorted(nur_safelist):
        grund = 'standard' if k in standard else next((rx.pattern for rx in regexe if rx.search(k)), '?')
        nach_regel.setdefault(grund, []).append(k)
    for grund, ks in sorted(nach_regel.items(), key=lambda kv: -len(kv[1])):
        komponiert = [k for k in ks if any(passt(k, art, frag) for (art, frag, _, _) in fragmente)]
        print(f'  {grund:24s} {len(ks):4d} Klassen, davon {len(komponiert):3d} durch Fragmente erklärbar'
              + (f'  z. B. {", ".join(ks[:5])}' if ks else ''))
    print(f'\n--- {len(gepurgt)} ohnehin gepurgte Klassen (kein Token, keine Safelist, kein Fragment = mutmaßlich tot) ---')
    tot = [k for k in sorted(gepurgt) if k not in fehler]
    print('  ' + ', '.join(tot[:60]) + (' …' if len(tot) > 60 else ''))

sys.exit(1 if fehler else 0)
