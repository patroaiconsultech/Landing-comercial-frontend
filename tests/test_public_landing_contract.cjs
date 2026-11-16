// Frontend-owned contract moved out of the backend's historical HC11 HTML tests.
// This file validates the real landing distribution, not a copied HTML in the API.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const htmlPath = path.join(ROOT, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('landing HTML is served by the frontend Nginx image', () => {
  const docker = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
  const nginx = fs.readFileSync(path.join(ROOT, 'default.conf.template'), 'utf8');
  assert.match(docker, /^COPY index\.html \/usr\/share\/nginx\/html\/index\.html\s*$/m);
  assert.match(nginx, /root\s+\/usr\/share\/nginx\/html\s*;/);
  assert.match(nginx, /location\s+\/\s*\{[\s\S]*?try_files\s+\$uri\s+\$uri\/\s+=404\s*;/);
  assert.match(html, /<script id="patroai-public-agent-js">/);
  assert.match(html, /<style id="patroai-public-agent-css">/);
  assert.equal((html.match(/<script id="patroai-public-agent-js">/g) ?? []).length, 1);
  assert.equal((html.match(/<style id="patroai-public-agent-css">/g) ?? []).length, 1);
});

test('published landing retains public safety and contact invariants', () => {
  assert.equal((html.match(/<form\b/gi) ?? []).length, 0);
  assert.ok((html.match(/https:\/\/wa\.me\/5551989697605/g) ?? []).length >= 4);
  assert.doesNotMatch(html, /OPENAI_API_KEY/);
  assert.match(html, /content="noindex, nofollow"/);
  assert.match(html, /pa-consent/);
  assert.match(html, /textContent=text/);
});

test('frontend manifest records the exact distributed HTML bytes', () => {
  const manifest = fs.readFileSync(path.join(ROOT, 'SHA256SUMS.txt'), 'utf8');
  const record = manifest.split(/\r?\n/).find(line => /^[0-9a-f]{64}\s+index\.html$/.test(line));
  assert.ok(record, 'SHA256SUMS.txt must include index.html');
  const expected = record.split(/\s+/)[0];
  const actual = crypto.createHash('sha256').update(fs.readFileSync(htmlPath)).digest('hex');
  assert.equal(actual, expected);
});
