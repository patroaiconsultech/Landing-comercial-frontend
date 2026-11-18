'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script id="r4-contact-talents-js">([\s\S]*?)<\/script>/)[1];
const words=JSON.parse(js.match(/const words = (\{.*\});/)[1]);
test('all three manual journeys visible; every live link is the existing official channel',()=>{
 const talent=html.match(/<section\b[^>]*id="talentos"[^>]*>/)[0];
 assert.doesNotMatch(talent,/\b(?:hidden|inert|aria-hidden)\b/);
 assert.equal((html.match(/href="#talentos" data-r4-text="nav"/g)||[]).length,2);
 for(const k of ['career','consultant','contact']){
   const group=html.match(new RegExp('<details[^>]*data-r4-journey="'+k+'"[\\s\\S]*?</details>'))[0];
   assert.match(group,/href="https:\/\/wa\.me\/5551989697605" target="_blank" rel="noopener noreferrer"/);
   assert.match(group,/<button type="button" data-r4-copy disabled/);
   assert.doesNotMatch(group,/type="file"|<form\b|name=|(?:https:\/\/wa\.me\/5551989697605\?)/);
 }
 assert.equal((html.match(/<form\b/gi)||[]).length,0);
 assert.match(html, /content="noindex, nofollow"/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|window\.open|innerHTML/);
});
test('translation keys complete; locale and clipboard behavior, no implicit copy',async()=>{
 const k=['career','consultant','contact'];
 const groups=k.map(key=>{
   const field={value:words.pt[key+'Draft'],focus(){this.focused=true},select(){this.selected=true},addEventListener(type,fn){this[type]=fn}};
   const button={disabled:true,addEventListener(type,fn){this[type]=fn}};
   const feedback={textContent:''};
   return {dataset:{r4Journey:key},field,button,feedback,querySelector(s){return {'textarea':field,'[data-r4-copy]':button,'[data-r4-status]':feedback}[s]}};
 });
 const keys=[...html.matchAll(/data-r4-text="([^"]+)"/g)].map(m=>m[1]);
 for(const lang of ['pt','en','es']) for(const key of keys) assert.ok(words[lang][key],lang+':'+key);
 const label={dataset:{r4Text:'nav'},textContent:''};
 const root={lang:'pt-BR'};
 const received=[];let render;
 const navigator={clipboard:{async writeText(v){received.push(v)}}};
 const document={documentElement:root,querySelectorAll(s){return s==='[data-r4-journey]'?groups:[label]}};
 class MutationObserver{constructor(fn){render=fn}observe(){}}
 vm.runInNewContext(js,{document,navigator,MutationObserver});
 assert.equal(received.length,0);
 assert.equal(label.textContent,'Carreiras');
 assert.ok(groups.every(x=>!x.button.disabled));
 groups[0].field.value='My edited draft';
 root.lang='en';render();
 assert.equal(label.textContent,'Careers');
 assert.equal(groups[0].field.value,'My edited draft');
 assert.equal(groups[1].field.value,words.en.consultantDraft);
 assert.equal(received.length,0);
 await groups[0].button.click();
 assert.deepEqual(received,['My edited draft']);
 assert.equal(groups[0].feedback.textContent,words.en.copied);
 root.lang='es';render();
 assert.equal(groups[0].feedback.textContent,words.es.copied);
 navigator.clipboard.writeText=async()=>{throw Error('denied')};
 await groups[2].button.click();
 assert.ok(groups[2].field.selected);
 assert.equal(groups[2].feedback.textContent,words.es.manual);
 groups[0].field.input();
 assert.equal(groups[0].feedback.textContent,words.es.status);
});
