'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const imageFile = path.join(root, 'retrato-fundador-patroai.jpg');

assert.match(html, /class="ceo-v11-portrait"[^>]*src="retrato-fundador-patroai\.jpg"/);
assert.match(html, /hero-executivo-patroai\.jpg/);
assert.match(dockerfile, /^COPY retrato-fundador-patroai\.jpg \/usr\/share\/nginx\/html\/retrato-fundador-patroai\.jpg$/m);
assert.match(dockerfile, /^COPY hero-executivo-patroai\.jpg \/usr\/share\/nginx\/html\/hero-executivo-patroai\.jpg$/m);
assert.ok(fs.statSync(imageFile).size > 10_000, 'O retrato não pode estar vazio');

const jpg = fs.readFileSync(imageFile);
assert.equal(jpg[0], 0xff);
assert.equal(jpg[1], 0xd8);
assert.equal(jpg[jpg.length - 2], 0xff);
assert.equal(jpg[jpg.length - 1], 0xd9);

console.log('PASS: retrato institucional, hero preservado e Dockerfile consistente.');
