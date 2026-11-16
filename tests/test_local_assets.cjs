const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const asset of [
  'patroai-hero-humano-ia.jpg','patroai-inteligencia-negocios.webp',
  'retrato-fundador-patroai.jpg','patroai-intro.mp4','patroai-ambiente.mp3',
  'handoff-ui.js','diagnosis-ui.js'
]) {
  assert.ok(fs.statSync(path.join(root, asset)).size > 0, `${asset} missing`);
  assert.ok(html.includes(`="${asset}"`), `${asset} must be relative for local preview`);
  assert.ok(!html.includes(`="/${asset}"`), `${asset} absolute path breaks file preview`);
}
assert.doesNotMatch(html, /<p[^>]*class="p10-legal-note"[^>]*>/);
assert.match(html, /PATROAI CONSULTECH LTDA/);
assert.match(html, /45\.860\.926\/0001-95/);
assert.match(html, /noindex, nofollow/);
assert.doesNotMatch(html, /rel="canonical"/);
console.log('PASS: local media paths, legal banner absent, company identification and SEO staging gate');
