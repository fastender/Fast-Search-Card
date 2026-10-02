// scripts/gen-third-party-notices.cjs
//
// Lizenzvermerke der ins Bündel kompilierten Fremdpakete — aus den Lizenzdateien
// in node_modules kopiert, nicht abgetippt. MIT und Apache-2.0 verlangen, dass
// Copyright-Vermerk und Lizenztext jede Kopie begleiten.
//
// Zwei Ausgaben, beide ruft build.sh bei jedem Build:
//   node scripts/gen-third-party-notices.cjs <version> <datum>
//       schreibt THIRD-PARTY-NOTICES.md (volle Lizenztexte) ins Projektwurzelverzeichnis
//   node scripts/gen-third-party-notices.cjs --banner <version>
//       gibt den Kommentar-Kopf für dist/fast-search-card.js auf stdout aus
//       (HACS lädt nur diese eine Datei — der Vermerk muss also in ihr stehen)
//
// Erfasst werden die `dependencies` aus package.json samt allem, was sie mitbringen.
const fs = require('fs'), path = require('path');

function sammeln() {
  const root = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const seen = new Map();
  function visit(name) {
    if (seen.has(name)) return;
    const dir = path.join('node_modules', name);
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const files = fs.readdirSync(dir).filter(f => /^(licen[sc]e|notice|copying)/i.test(f)).sort();
    if (!files.length) throw new Error('keine Lizenzdatei: ' + name);
    let repo = (m.repository && (m.repository.url || m.repository)) || m.homepage || '';
    repo = String(repo).replace(/^git\+/, '').replace(/\.git$/, '');
    if (/^[\w.-]+\/[\w.-]+$/.test(repo)) repo = 'https://github.com/' + repo;
    const texts = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim());
    const zeile = texts.join('\n').split('\n').map(z => z.trim())
      .find(z => /^Copyright (\(c\)|©|\d{4})/i.test(z));
    if (!zeile) throw new Error('kein Copyright-Vermerk gefunden: ' + name);
    seen.set(name, { version: m.version, license: m.license, repo, texts, copyright: zeile });
    for (const d of Object.keys(m.dependencies || {})) visit(d);
  }
  for (const d of Object.keys(root.dependencies || {})) visit(d);
  const names = [...seen.keys()].sort((a, b) => a.replace(/^@/, '').localeCompare(b.replace(/^@/, '')));
  return names.map(n => ({ name: n, ...seen.get(n) }));
}

const URL_NOTICES = 'https://github.com/fastender/Fast-Search-Card/blob/main/THIRD-PARTY-NOTICES.md';
const args = process.argv.slice(2);
const pakete = sammeln();

if (args[0] === '--banner') {
  const version = args[1];
  if (!version) throw new Error('Aufruf: --banner <version>');
  const z = [
    '/*!',
    ` * Fast Search Card v${version} | GPL-3.0-or-later | https://github.com/fastender/Fast-Search-Card`,
    ' *',
    ' * This file bundles the third-party packages below. Each remains under its own license.',
    ...pakete.map(p => ` *   ${p.name} ${p.version} | ${p.license} | ${p.copyright}`),
    ' *',
    ` * Full license texts: ${URL_NOTICES}`,
    ' */',
  ];
  const text = z.join('\n');
  if (text.slice(3, -2).includes('*/')) throw new Error('Kommentarende im Banner');
  process.stdout.write(text + '\n');
} else {
  const [version, datum] = args;
  if (!version || !datum) throw new Error('Aufruf: <version> <datum>  oder  --banner <version>');
  let out = `# Third-Party Notices

Fast Search Card bundles the packages listed below into \`dist/fast-search-card.js\`. Each one remains under its own license. Their copyright notices and license texts are reproduced here unchanged, as those licenses require.

Fast Search Card itself is licensed under [GPL-3.0-or-later](LICENSE).

Package versions as bundled in v${version} (${datum}).

| Package | Version | License | Source |
|---|---|---|---|
`;
  for (const p of pakete) out += `| ${p.name} | ${p.version} | ${p.license} | ${p.repo} |\n`;
  for (const p of pakete) {
    out += `\n---\n\n## ${p.name} ${p.version}\n\nLicense: ${p.license}\n`;
    for (const t of p.texts) {
      if (t.includes('```')) throw new Error('Zaun im Lizenztext: ' + p.name);
      out += '\n```text\n' + t + '\n```\n';
    }
  }
  fs.writeFileSync('THIRD-PARTY-NOTICES.md', out);
  console.log(`✓ THIRD-PARTY-NOTICES.md: ${pakete.length} Pakete`);
}
