const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const docker = fs.readFileSync(path.join(root,'Dockerfile'),'utf8');

for (const text of ['Business Plan','viabilidade econômico-financeira',
  'consultores e auditores associados','tecnologia proprietária multiagente',
  'dados', 'investidores autorizados']) {
  assert.ok(html.toLowerCase().includes(text.toLowerCase()), `Missing content: ${text}`);
}
for (const section of ['venture-studio','planejamento-inteligente','modelos-de-atuacao',
  'jornada-de-valor','governanca-investidores','consultores-auditores','perguntas-frequentes']) {
  assert.ok(html.includes(`id="${section}"`), `Missing section ${section}`);
}
assert.match(html, /name="description"/);
assert.match(html, /property="og:title"/);
assert.match(html, /property="og:description"/);
assert.match(html, /name="twitter:description"/);
assert.match(html, /"@type":"OfferCatalog"/);
assert.match(html, /name="robots"[\s\S]*?\/>/); // staging intentionally not indexed
assert.match(html, /noindex, nofollow/);
assert.doesNotMatch(html, /rel="canonical"/); // domain has NOT been verified
assert.doesNotMatch(html, /data:video\/mp4;base64,/);
assert.doesNotMatch(html, /data:audio\/mpeg;base64,/);
assert.ok(fs.statSync(path.join(root,'index.html')).size < 800*1024, 'HTML should stay lean');
for (const [name, min] of [['patroai-intro.mp4',100000],['patroai-ambiente.mp3',100000],
['patroai-inteligencia-negocios.webp',20000]]) {
  assert.ok(fs.statSync(path.join(root,name)).size > min, `Missing media: ${name}`);
  assert.ok(docker.includes(`COPY ${name} /usr/share/nginx/html/${name}`));
  assert.ok(html.includes(`${name}`));
}
const tagRegex = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const jsonBlocks = [...html.matchAll(tagRegex)];
assert.ok(jsonBlocks.length >= 2);
jsonBlocks.forEach(m=>assert.ok(JSON.parse(m[1])['@context']));
for (const id of ['vs-tab-plan','vs-tab-operate','vs-tab-govern'])
 assert.ok(html.includes(id));
assert.ok(html.includes('Não prometemos risco zero') || html.includes('não prometemos risco zero'));
console.log('PASS: comercial, SEO staging, assets, governance and privacy checks');
