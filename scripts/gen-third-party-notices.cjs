// Erzeugt THIRD-PARTY-NOTICES.md aus den Lizenzdateien in node_modules.
// Aufruf im Projektwurzelverzeichnis:  node scripts/gen-third-party-notices.cjs <version> <datum>
// Neu erzeugen, sobald sich eine Laufzeit-Abhängigkeit oder deren Version ändert.
const fs = require('fs'), path = require('path');
const [version, datum] = process.argv.slice(2);
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
  seen.set(name, { version: m.version, license: m.license, repo,
    texts: files.map(f => ({ f, t: fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim() })) });
  for (const d of Object.keys(m.dependencies || {})) visit(d);
}
for (const d of Object.keys(root.dependencies || {})) visit(d);
const names = [...seen.keys()].sort((a, b) => a.replace(/^@/, '').localeCompare(b.replace(/^@/, '')));
let out = `# Third-Party Notices

Fast Search Card bundles the packages listed below into \`dist/fast-search-card.js\`. Each one remains under its own license. Their copyright notices and license texts are reproduced here unchanged, as those licenses require.

Fast Search Card itself is licensed under [GPL-3.0-or-later](LICENSE).

Package versions as bundled in v${version} (${datum}).

| Package | Version | License | Source |
|---|---|---|---|
`;
for (const n of names) { const i = seen.get(n); out += `| ${n} | ${i.version} | ${i.license} | ${i.repo} |\n`; }
for (const n of names) {
  const i = seen.get(n);
  out += `\n---\n\n## ${n} ${i.version}\n\nLicense: ${i.license}\n`;
  for (const { t } of i.texts) {
    if (t.includes('```')) throw new Error('Zaun im Lizenztext: ' + n);
    out += '\n```text\n' + t + '\n```\n';
  }
}
fs.writeFileSync('THIRD-PARTY-NOTICES.md', out);
console.log(names.length + ' Pakete, ' + out.length + ' Zeichen');
