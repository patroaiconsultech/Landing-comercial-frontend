
(()=>{'use strict';
const root=document.getElementById('patroai-assist');
if(!root)return;
const $=id=>document.getElementById(id);
const open=$('pa-open'),close=$('pa-close'),panel=$('pa-panel'),msgs=$('pa-messages'),status=$('pa-status'),consent=$('pa-consent'),input=$('pa-message'),send=$('pa-send');
let busy=false,available=false,history=[],language='pt';
const i18n={
pt:{toggle:'✦ Pergunte à IA',title:'Assistente PatroAI · IA',intro:'Posso explicar os serviços da PatroAI e ajudar você a solicitar uma demonstração. Sou uma IA; não faço propostas comerciais vinculantes.',disclosure:'Ao enviar, o texto da conversa será processado por um provedor de IA. Não envie senhas ou dados pessoais sensíveis. Não há integração com o backend C01.',consent:'Concordo com o envio das mensagens para processamento pela IA.',prompt:'Sua pergunta',placeholder:'Como a PatroAI pode ajudar minha empresa?',contact:'Falar pelo WhatsApp',send:'Enviar',busy:'Respondendo...',offline:'IA indisponível agora. Entre em contato pelo WhatsApp.',failed:'Não foi possível obter uma resposta. Tente novamente ou fale conosco pelo WhatsApp.',privacy:'Confirme a opção de processamento de mensagens.',length:'Digite uma pergunta de até 1.200 caracteres.',welcome:'Digite sua pergunta sobre a PatroAI.',close:'Fechar assistente'},
en:{toggle:'✦ Ask AI',title:'PatroAI Assistant · AI',intro:'I can explain PatroAI services and help you request a demo. I am an AI; I cannot make binding commercial offers.',disclosure:'Messages are sent to an AI provider for processing. Do not share passwords or sensitive personal data. No C01 backend integration.',consent:'I agree to send messages for AI processing.',prompt:'Your question',placeholder:'How can PatroAI help my company?',contact:'Contact via WhatsApp',send:'Send',busy:'Replying...',offline:'AI is unavailable. Contact us via WhatsApp.',failed:'Could not get an answer. Try again or contact us via WhatsApp.',privacy:'Please accept message processing.',length:'Enter a question under 1,200 characters.',welcome:'Ask a question about PatroAI.',close:'Close assistant'},
es:{toggle:'✦ Pregunta a la IA',title:'Asistente PatroAI · IA',intro:'Puedo explicar los servicios PatroAI y ayudar a solicitar una demostración. Soy una IA; no realizo ofertas comerciales vinculantes.',disclosure:'Los mensajes se envían a un proveedor de IA para su procesamiento. No compartas contraseñas ni datos sensibles. Sin integración con backend C01.',consent:'Acepto enviar mensajes para procesamiento por IA.',prompt:'Tu pregunta',placeholder:'¿Cómo puede ayudar PatroAI a mi empresa?',contact:'Contactar por WhatsApp',send:'Enviar',busy:'Respondiendo...',offline:'La IA no está disponible. Contáctanos por WhatsApp.',failed:'No se pudo responder. Inténtalo de nuevo o usa WhatsApp.',privacy:'Confirma el procesamiento del mensaje.',length:'Escribe hasta 1.200 caracteres.',welcome:'Haz una pregunta sobre PatroAI.',close:'Cerrar asistente'}
};
function render(){let t=i18n[language];open.textContent=t.toggle;$('pa-title').textContent=t.title;$('pa-intro').textContent=t.intro;$('pa-disclosure').textContent=t.disclosure;$('pa-consent-label').textContent=t.consent;$('pa-prompt').textContent=t.prompt;input.placeholder=t.placeholder;$('pa-contact').textContent=t.contact;send.textContent=t.send;close.setAttribute('aria-label',t.close);refresh();}
function refresh(){send.disabled=busy||!available||!consent.checked||!input.value.trim();}
function bubble(author,text){const div=document.createElement('div');div.className='pa-bubble';div.dataset.author=author;div.textContent=text;msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;}
function message(text){status.textContent=text||'';}
async function check(){try{const r=await fetch('/v1/public/chat/status',{cache:'no-store',credentials:'same-origin'});const d=await r.json();available=Boolean(r.ok&&d.available);}catch(_){available=false;}if(!available)message(i18n[language].offline);refresh();}
open.addEventListener('click',()=>{panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){input.focus();check();}});
close.addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');open.focus();});
consent.addEventListener('change',refresh);input.addEventListener('input',refresh);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(!send.disabled)send.click();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){close.click();}});
document.querySelectorAll('.locale-button').forEach(el=>el.addEventListener('click',()=>{const x=el.getAttribute('data-lang');if(i18n[x]){language=x;render();if(!available)message(i18n[x].offline);}}));
send.addEventListener('click',async()=>{
 const text=input.value.trim();const t=i18n[language];
 if(!consent.checked){message(t.privacy);return;}
 if(!text||text.length>1200){message(t.length);return;}
 if(!available||busy){message(t.offline);return;}
 busy=true;refresh();message(t.busy);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),24000);
 try{
  const r=await fetch('/v1/public/chat',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:controller.signal,body:JSON.stringify({message:text,history:history.slice(-6),language,consent:true})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||typeof d.reply!=='string'||!d.reply.trim())throw new Error('not available');
  bubble('user',text);bubble('assistant',d.reply);
  history.push({role:'user',content:text},{role:'assistant',content:d.reply});history=history.slice(-6);
  input.value='';message('');
 }catch(_){message(t.failed);}
 finally{clearTimeout(timer);busy=false;refresh();}
});
render();
})();
