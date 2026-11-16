'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const docker = fs.readFileSync(path.join(base, 'Dockerfile'), 'utf8');

test('hero humano e IA: asset real, caminho relativo e Docker', () => {
  const asset = 'patroai-hero-humano-ia.jpg';
  const file = path.join(base, asset);
  assert.ok(fs.existsSync(file), 'asset da nova foto precisa existir');
  assert.ok(fs.statSync(file).size > 100_000, 'foto não deve estar vazia');
  assert.match(html, /<img class="hero-executivo" src="patroai-hero-humano-ia\.jpg"/);
  assert.match(html, /alt="Liderança empresarial em diálogo com avatar ilustrativo de inteligência artificial[^"]*"/);
  assert.match(docker, /COPY patroai-hero-humano-ia\.jpg \/usr\/share\/nginx\/html\/patroai-hero-humano-ia\.jpg/);
  assert.doesNotMatch(html, /src="\/patroai-hero-humano-ia\.jpg"/);
});

test('responsividade mantém IA e fundador visíveis sem crop lateral forçado', () => {
  assert.match(html, /\.hero-visual \.hero-executivo\{height:auto;aspect-ratio:946\/663;object-position:center\}/);
  assert.doesNotMatch(html, /object-position:7[68]% center/);
});

test('permanece sem filme cinematográfico e sem habilitar indexação pública', () => {
  assert.doesNotMatch(html, /patroai-cinematic-entrada\.mp4/);
  assert.match(html, /name="robots"[^>]*|content="noindex, nofollow" name="robots"/);
  assert.match(html, /patroai-intro\.mp4/);
  assert.match(html, /patroai-ambiente\.mp3/);
});

test('rota de chat preservada e aviso de painel conceitual presente', () => {
  assert.match(html, /\/v1\/public\/chat\/status/);
  assert.match(html, /\/v1\/public\/chat/);
  assert.match(html, /demonstração conceitual|demonstração ilustrativa|conceitual/i);
});
