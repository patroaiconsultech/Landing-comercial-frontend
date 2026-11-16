'use strict';
// PATROAI Business Plan Mestre v2.1 — candidate commercial copy only.
// No browser, network, credentials or paid AI provider involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const SHA = crypto.createHash('sha256').update(html).digest('hex');

function translations() {
  const m = html.match(/const content = (\{.*?\});\s*\n\s*Object\.assign\(content\.pt/s);
  assert.ok(m, 'PATROAI p22 translation dictionary missing');
  const catalog = JSON.parse(m[1]);
  for (const lang of ['pt', 'en', 'es']) {
    const pattern = new RegExp('Object\\.assign\\(content\\.' + lang + ', (\\{.*?\\})\\);');
    const override = html.match(pattern);
    assert.ok(override, `missing translation overlay ${lang}`);
    Object.assign(catalog[lang], JSON.parse(override[1]));
  }
  return catalog;
}

test('executive offers displayed once, with CEOaaS five modes and CTA', () => {
  const m = html.match(/<section\b[^>]*id="lideranca-como-servico"[\s\S]*?<\/section>/);
  assert.ok(m, 'executive section is missing');
  assert.equal((html.match(/id="lideranca-como-servico"/g) || []).length, 1);
  assert.match(m[0], /data-p22="bp21CeoTitle"/);
  assert.match(m[0], /data-p22="bp21CtoTitle"/);
  assert.match(m[0], /data-p22="bp21CommercialTitle"/);
  assert.match(m[0], /data-p22="bp21OpsTitle"/);
  assert.match(m[0], /href="#contato"/);
  for (let i = 1; i <= 5; i++) assert.ok(m[0].includes(`data-p22="bp21CeoMode${i}"`));
  assert.match(m[0], /modalidades sob consulta|Modalidades sob consulta/);
});

test('translations cover each executive content key in PT, EN and ES', () => {
  const m = html.match(/<section\b[^>]*id="lideranca-como-servico"[\s\S]*?<\/section>/);
  assert.ok(m);
  const keys = [...m[0].matchAll(/data-p22="([^"]+)"/g)].map(x => x[1]);
  const d = translations();
  assert.deepEqual(Object.keys(d).sort(), ['en', 'es', 'pt']);
  for (const lang of ['pt', 'en', 'es']) {
    for (const key of keys) assert.ok(typeof d[lang][key] === 'string' && d[lang][key].length >= 2, `${lang}.${key} missing`);
    assert.match(d[lang].bp21CeoDesc, /contrat|agreement|contract/i);
    assert.match(d[lang].bp21Disclaimer, /representa|representat/i);
    assert.match(d[lang].bp21Disclaimer, /approv|aprova|aprob|formalidad|formaliti/i);
  }
});

test('SEO remains non-indexable and OfferCatalog uses conditional language', () => {
  assert.match(html, /content="noindex, nofollow"/);
  const match = html.match(/<script type="application\/ld\+json" id="patroai-service-schema">\s*(\{[\s\S]*?\})\s*<\/script>/);
  assert.ok(match);
  const catalog = JSON.parse(match[1]);
  assert.equal(catalog['@type'], 'OfferCatalog');
  const conditional = catalog.itemListElement.find(x => x.name.includes('sob consulta'));
  assert.ok(conditional);
  assert.equal(conditional.itemListElement.length, 4);
  assert.match(JSON.stringify(conditional), /CEOaaS/);
  assert.match(JSON.stringify(conditional), /CTOaaS/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test('SHA256SUMS matches modified HTML and new test', () => {
  const records = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trim().split(/\r?\n/).map(x => {
    const m = x.match(/^([0-9a-f]{64})  (.+)$/);
    assert.ok(m, `invalid manifest line: ${x}`); return [m[2], m[1]];
  }));
  assert.equal(records.get('index.html'), SHA);
  const testHash = crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
  assert.equal(records.get('tests/test_bp21_services.cjs'), testHash);
});
