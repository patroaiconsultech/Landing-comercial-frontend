'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const portraitFile = path.join(root, 'retrato-fundador-patroai.jpg');
const heroFile = path.join(root, 'patroai-hero-humano-ia.jpg');

// Leitura leve de tags/atributos reais, sem dependência de navegador no CI.
// Pula comentários e texto bruto de script/style/textarea/title, respeita
// aspas dentro das tags e nunca confunde "data-id" com "id".
function readAttributes(source) {
  const attrs = new Map();
  let i = 0;
  while (i < source.length) {
    while (i < source.length && (/[\s/]/).test(source[i])) i++;
    if (i >= source.length) break;
    const start = i;
    while (i < source.length && !(/[\s=/>]/).test(source[i])) i++;
    if (i === start) { i++; continue; }
    const name = source.slice(start, i).toLowerCase();
    while (i < source.length && /\s/.test(source[i])) i++;
    let value = '';
    if (source[i] === '=') {
      i++;
      while (i < source.length && /\s/.test(source[i])) i++;
      if (source[i] === '"' || source[i] === "'") {
        const quote = source[i++];
        const begin = i;
        while (i < source.length && source[i] !== quote) i++;
        value = source.slice(begin, i);
        if (source[i] === quote) i++;
      } else {
        const begin = i;
        while (i < source.length && !(/[\s>]/).test(source[i])) i++;
        value = source.slice(begin, i);
      }
    }
    // Como no parser HTML, a primeira ocorrência do atributo prevalece.
    if (!attrs.has(name)) attrs.set(name, value);
  }
  return attrs;
}

function* htmlTags(markup) {
  let cursor = 0;
  let rawText = null;
  while (cursor < markup.length) {
    if (rawText) {
      const close = new RegExp(`</${rawText}\\s*>`, 'gi');
      close.lastIndex = cursor;
      const found = close.exec(markup);
      if (!found) return;
      cursor = found.index;
      rawText = null;
    }

    const start = markup.indexOf('<', cursor);
    if (start < 0) return;
    if (markup.startsWith('<!--', start)) {
      const finish = markup.indexOf('-->', start + 4);
      cursor = finish < 0 ? markup.length : finish + 3;
      continue;
    }
    if (markup.startsWith('<!', start) || markup.startsWith('<?', start)) {
      const finish = markup.indexOf('>', start + 2);
      cursor = finish < 0 ? markup.length : finish + 1;
      continue;
    }

    const prefix = /^<(\/?)([a-z][a-z0-9:-]*)(?=[\s/>])/i.exec(markup.slice(start));
    if (!prefix) { cursor = start + 1; continue; }
    const closing = prefix[1] === '/';
    const name = prefix[2].toLowerCase();
    let end = start + prefix[0].length;
    let quote = null;
    for (; end < markup.length; end++) {
      const ch = markup[end];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
    }
    if (end >= markup.length) return; // tag incompleta
    const raw = markup.slice(start, end + 1);
    const attrs = closing ? new Map() :
      readAttributes(markup.slice(start + prefix[0].length, end));
    const selfClosing = /\/\s*>$/.test(raw);
    cursor = end + 1;
    yield { name, closing, start, end: cursor, raw, attrs, selfClosing };

    if (!closing && !selfClosing &&
        ['script', 'style', 'textarea', 'title'].includes(name)) {
      rawText = name;
    }
  }
}

const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr'
]);

function hasClass(tag, name) {
  return (tag.attrs.get('class') || '').split(/\s+/).includes(name);
}

// Verifica descendência estrutural na árvore de elementos, não proximidade
// textual. Uma foto comentada, fora da section ou com "data-src" é inválida.
function inspect(markup) {
  const stack = [];
  let hero = null;
  let ceo = null;
  let portrait = null;

  for (const tag of htmlTags(markup)) {
    if (tag.closing) {
      const index = stack.findLastIndex(entry => entry.name === tag.name);
      if (index >= 0) {
        for (const entry of stack.slice(index)) {
          if (entry.isCeo && ceo) ceo.closeEnd = tag.end;
        }
        stack.length = index;
      }
      continue;
    }

    if (tag.name === 'img') {
      if (hasClass(tag, 'hero-executivo') &&
          tag.attrs.get('src') === 'patroai-hero-humano-ia.jpg') hero = tag;
      if (hasClass(tag, 'ceo-v11-portrait') &&
          tag.attrs.get('src') === 'retrato-fundador-patroai.jpg' &&
          stack.some(entry => entry.isCeo)) portrait = tag;
    }

    const isCeo = tag.name === 'section' &&
      tag.attrs.get('id') === 'palavra-do-ceo' &&
      hasClass(tag, 'ceo-v11');
    if (isCeo && !ceo) ceo = { open: tag, closeEnd: null };
    if (!tag.selfClosing && !voidElements.has(tag.name)) {
      stack.push({ name: tag.name, isCeo });
    }
  }
  return {
    hero, ceo, portrait,
    valid: Boolean(hero && ceo && ceo.closeEnd != null && portrait)
  };
}

function splice(markup, start, end, replacement) {
  return markup.slice(0, start) + replacement + markup.slice(end);
}

const original = inspect(html);
assert.ok(original.valid,
  'Hero humano–IA e retrato institucional devem existir em suas posições reais');

const portraitTag = original.portrait;
const sectionTag = original.ceo.open;
const withoutPortrait = splice(html, portraitTag.start, portraitTag.end, '');

const rejectionCases = [
  ['retrato removido', withoutPortrait],
  ['retrato deslocado após </section>',
    splice(withoutPortrait,
      inspect(withoutPortrait).ceo.closeEnd,
      inspect(withoutPortrait).ceo.closeEnd,
      '\n' + portraitTag.raw)],
  ['retrato só em comentário HTML',
    splice(html, portraitTag.start, portraitTag.end, `<!-- ${portraitTag.raw} -->`)],
  ['data-class em vez de class',
    splice(html, portraitTag.start, portraitTag.end,
      portraitTag.raw.replace(/\sclass=/i, ' data-class='))],
  ['data-src em vez de src',
    splice(html, portraitTag.start, portraitTag.end,
      portraitTag.raw.replace(/\ssrc=/i, ' data-src='))],
  ['data-id em vez de id na section',
    splice(html, sectionTag.start, sectionTag.end,
      sectionTag.raw.replace(/\sid=/i, ' data-id='))]
];

for (const [scenario, mutated] of rejectionCases) {
  assert.equal(inspect(mutated).valid, false,
    `O contrato deve rejeitar: ${scenario}`);
}

// Regressões de atributos/elementos aparentes, também para o hero.
const fakeHero = splice(html, original.hero.start, original.hero.end,
  `<!-- ${original.hero.raw} -->`);
assert.equal(inspect(fakeHero).valid, false, 'Hero apenas comentado é inválido');

assert.match(dockerfile,
  /^COPY retrato-fundador-patroai\.jpg \/usr\/share\/nginx\/html\/retrato-fundador-patroai\.jpg$/m);
assert.match(dockerfile,
  /^COPY patroai-hero-humano-ia\.jpg \/usr\/share\/nginx\/html\/patroai-hero-humano-ia\.jpg$/m);
assert.ok(fs.statSync(portraitFile).size > 10_000, 'O retrato não pode estar vazio');
assert.ok(fs.statSync(heroFile).size > 10_000, 'O hero não pode estar vazio');

// Assinaturas rápidas; a decodificação completa é validada separadamente
// por tests/test_decodificacao_imagens.py, sem Pillow no container Nginx.
for (const file of [portraitFile, heroFile]) {
  const jpg = fs.readFileSync(file);
  assert.equal(jpg[0], 0xff);
  assert.equal(jpg[1], 0xd8);
  assert.equal(jpg.at(-2), 0xff);
  assert.equal(jpg.at(-1), 0xd9);
}

console.log('PASS: HTML real + 7 mutações rejeitadas + Dockerfile + mídia.');
