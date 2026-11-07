/* R3-A. Opt-in only; legacy chat and WhatsApp stay intact when feature flag is off.
   PII is never stored in localStorage or sent to analytics. Public session is tab-scoped.
*/
(() => {
  "use strict";
  const PREFIX="patroai:r3:diagnosis";
  const URL="/v1/public/diagnoses";
  const mount=document.getElementById("patroai-assist");
  if (!mount || !window.crypto?.randomUUID || !window.sessionStorage) return;

  function elt(tag, attrs={}, text="") {
    const n=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=> {
      if (k==="class") n.className=v;
      else if (k==="type" || k==="placeholder" || k==="href" || k==="target"
             || k==="rel" || k==="id" || k==="aria-label" || k==="maxlength") n.setAttribute(k,String(v));
    });
    if (text) n.textContent=text;
    return n;
  }
  const style=elt("style");
  style.textContent=`
  #pa-r3-open {position:fixed;right:22px;bottom:22px;z-index:9999;border:0;border-radius:28px;background:#66e7a5;color:#092719;font:700 15px system-ui;padding:14px 21px;box-shadow:0 8px 26px #0007;cursor:pointer}
  #pa-r3-panel {position:fixed;right:20px;bottom:80px;width:min(400px,calc(100vw - 30px));max-height:min(690px,calc(100dvh - 104px));z-index:9999;background:#0c211b;color:#f5fff7;border:1px solid #79b99e;display:flex;flex-direction:column;padding:16px;border-radius:16px;font:14px system-ui;box-shadow:0 16px 35px #000a}
  #pa-r3-panel[hidden]{display:none}
  #pa-r3-panel h2{font:700 19px system-ui;margin:0 0 9px}
  #pa-r3-panel label{display:block;margin:8px 0 4px}
  #pa-r3-panel input[type=text],#pa-r3-panel input[type=tel],#pa-r3-panel textarea{box-sizing:border-box;width:100%;border:1px solid #a3ceba;border-radius:8px;padding:10px;font:14px system-ui;color:#112a21;background:#fff}
  #pa-r3-panel .pa-r3-consent{display:flex;align-items:flex-start;gap:8px;font:12px/1.4 system-ui}
  #pa-r3-panel .pa-r3-consent input{flex-shrink:0;margin-top:4px}
  #pa-r3-panel button{border:0;border-radius:8px;padding:10px;background:#77eab2;color:#09281b;font:700 14px system-ui;cursor:pointer}
  #pa-r3-panel button:disabled{opacity:.55;cursor:not-allowed}
  #pa-r3-panel a{color:#9cffce}
  #pa-r3-panel .pa-r3-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}
  #pa-r3-panel .pa-r3-msg{padding:9px;border-radius:10px;margin:7px 0;white-space:pre-wrap;overflow-wrap:anywhere;background:#1c3f35}
  #pa-r3-panel .pa-r3-msg[data-role=user]{background:#164d39}
  #pa-r3-panel .pa-r3-messages{overflow:auto;min-height:75px;max-height:285px;flex:1}
  #pa-r3-panel .pa-r3-note{font:12px/1.5 system-ui;color:#c2e8d4}
  @media(max-width:500px){#pa-r3-panel{right:10px;bottom:72px}}
  `;
  document.head.append(style);
  const button=elt("button",{"id":"pa-r3-open","type":"button"},"✦ Fazer pré-diagnóstico com IA");
  button.hidden=true;
  const panel=elt("section",{"id":"pa-r3-panel","aria-label":"Pré-diagnóstico PatroAI"});
  panel.hidden=true;
  const heading=elt("h2",{},"Pré-diagnóstico PatroAI");
  const close=elt("button",{"type":"button","aria-label":"Fechar"},"Fechar");
  const note=elt("p",{"class":"pa-r3-note"},"Suas respostas serão avaliadas pela equipe somente com seu consentimento. Evite enviar dados sensíveis.");
  const stateText=elt("p",{"class":"pa-r3-note"});
  stateText.setAttribute("role","status");
  const form=elt("form");
  const name=elt("input",{"type":"text","placeholder":"Nome completo","maxlength":"120"});
  name.autocomplete="name";name.required=true;
  const phone=elt("input",{"type":"tel","placeholder":"+5551999999999","maxlength":"16"});
  phone.autocomplete="tel";phone.required=true;
  const company=elt("input",{"type":"text","placeholder":"Empresa (opcional)","maxlength":"120"});
  const contactLabel=elt("label",{},"Nome");contactLabel.append(name);
  const phoneLabel=elt("label",{},"WhatsApp com DDI e DDD");phoneLabel.append(phone);
  const companyLabel=elt("label",{},"Empresa");companyLabel.append(company);
  const aiCheck=elt("input",{"type":"checkbox"});aiCheck.type="checkbox";
  const contactCheck=elt("input",{"type":"checkbox"});contactCheck.type="checkbox";
  const aiLabel=elt("label",{"class":"pa-r3-consent"});
  aiLabel.append(aiCheck,elt("span",{},"Autorizo o processamento das minhas respostas por um fornecedor de IA para elaborar o pré-diagnóstico."));
  const consentLabel=elt("label",{"class":"pa-r3-consent"});
  consentLabel.append(contactCheck,elt("span",{},"Autorizo que a PatroAI guarde minhas respostas e meus dados para análise humana e contato comercial pelo WhatsApp."));
  const info=elt("p",{"class":"pa-r3-note"});
  info.append("Leia as informações de ",elt("a",{"href":"#privacidade-lgpd"},"privacidade e proteção de dados"),". Você pode não aderir e falar diretamente conosco.");
  const start=elt("button",{"type":"submit"},"Iniciar diagnóstico");
  form.append(contactLabel,phoneLabel,companyLabel,aiLabel,consentLabel,info,start);
  const conversation=elt("div");conversation.hidden=true;
  const msgs=elt("div",{"class":"pa-r3-messages"});
  const textarea=elt("textarea",{"placeholder":"Conte sobre o principal desafio do seu negócio...","maxlength":"1200"});
  textarea.rows=3;
  const send=elt("button",{"type":"button"},"Enviar resposta");
  const finish=elt("button",{"type":"button"},"Finalizar e solicitar análise");
  const revoke=elt("button",{"type":"button"},"Revogar e apagar conteúdo");
  const row=elt("div",{"class":"pa-r3-row"});
  row.append(send,finish);
  conversation.append(msgs,textarea,row,revoke);
  const fallback=elt("a",{"href":"https://wa.me/5551989697605","target":"_blank","rel":"noopener noreferrer"},"Prefiro conversar pelo WhatsApp");
  const bottom=elt("div",{"class":"pa-r3-row"});bottom.append(fallback);
  panel.append(heading,close,note,stateText,form,conversation,bottom);
  document.body.append(button,panel);

  let current=null, busy=false;
  try {current=JSON.parse(sessionStorage.getItem(PREFIX)||"null");} catch {current=null;}
  function status(text) {stateText.textContent=text;}
  function ui() {
    form.hidden=!!current;
    conversation.hidden=!current;
    if(current) {
      finish.disabled=busy||current.status!=="in_progress";
      send.disabled=busy||current.turn_count>=7||!["registered","in_progress"].includes(current.status);
      textarea.disabled=send.disabled;
    }
  }
  function store() {if(current)sessionStorage.setItem(PREFIX,JSON.stringify(current));else sessionStorage.removeItem(PREFIX);}
  async function call(path,method,body,extras={}) {
    const headers={"Accept":"application/json", ...(body?{"Content-Type":"application/json"}:{}),...extras};
    if(current?.token) headers.Authorization="Bearer "+current.token;
    const response=await fetch(path,{method,headers,body:body?JSON.stringify(body):undefined,
                                  credentials:"same-origin",cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(typeof data.detail==="string"?data.detail:"REQUEST_FAILED");
    return data;
  }
  function update(data) {
    current={...current,id:data.diagnosis_id,version:data.version,
             turn_count:data.turn_count,status:data.status};store();ui();
  }
  function bubble(role,text) {
    const div=elt("div",{"class":"pa-r3-msg"});
    div.dataset.role=role;
    div.append(elt("strong",{},role==="user"?"Você: ":"PatroAI IA: "),document.createTextNode(text));
    msgs.append(div);msgs.scrollTop=msgs.scrollHeight;
  }
  async function restore() {
    if(!current?.id||!current?.token)return;
    try {
      const data=await call(URL+"/"+encodeURIComponent(current.id)+"/progress","GET");
      update(data);msgs.replaceChildren();
      for(const msg of data.messages||[])bubble(msg.role,msg.content);
      if(data.status==="completed")status("Diagnóstico enviado. Nossa equipe avaliará seu caso.");
    } catch {
      current=null;store();ui();status("Sua sessão terminou. Inicie um novo diagnóstico se desejar.");
    }
  }
  button.addEventListener("click",()=>{panel.hidden=!panel.hidden;if(!panel.hidden){if(!current)name.focus();else textarea.focus();}});
  close.addEventListener("click",()=>{panel.hidden=true;button.focus();});
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(busy)return;
    if(!aiCheck.checked||!contactCheck.checked){status("É necessário confirmar as duas autorizações separadamente.");return;}
    const normalizedPhone=phone.value.replace(/[ ()-]/g,"");
    if(!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)){status("Informe WhatsApp internacional no formato +5551999999999.");return;}
    busy=true;start.disabled=true;status("Registrando sua solicitação...");
    let key=sessionStorage.getItem(PREFIX+":registration-key");
    if(!key){key=crypto.randomUUID();sessionStorage.setItem(PREFIX+":registration-key",key);}
    try {
      const data=await call(URL,"POST",{
        name:name.value.trim(),phone:normalizedPhone,company:company.value.trim()||null,
        consent:{ai_processing:true,commercial_contact:true,notice_version:"patroai-diagnosis-v1"}
      },{"Idempotency-Key":key});
      current={id:data.diagnosis_id,token:data.session_token,version:data.version,
               turn_count:data.turn_count,status:data.status};
      store();sessionStorage.removeItem(PREFIX+":registration-key");ui();
      status("Cadastro recebido. Agora responda às perguntas para o pré-diagnóstico.");textarea.focus();
    } catch {status("Não foi possível confirmar o cadastro. Verifique os dados ou tente novamente.");}
    finally{busy=false;start.disabled=false;ui();}
  });
  send.addEventListener("click",async()=>{
    const message=textarea.value.trim();
    if(!current||busy||!message||message.length>1200)return;
    busy=true;ui();status("A IA está elaborando a resposta...");
    try {
      // Keep the turn ID during a retry in the same tab, preventing duplicate turns.
      let id=sessionStorage.getItem(PREFIX+":pending-turn");
      if(!id){id=crypto.randomUUID();sessionStorage.setItem(PREFIX+":pending-turn",id);}
      const data=await call(URL+"/"+current.id+"/turns","POST",{
        turn_id:id,expected_version:current.version,message,language:"pt"
      });
      bubble("user",message);bubble("assistant",data.reply);textarea.value="";
      sessionStorage.removeItem(PREFIX+":pending-turn");update(data);
      status(current.turn_count>=7?"Sete perguntas respondidas. Finalize seu diagnóstico.":"Resposta registrada no seu pré-diagnóstico.");
    }catch(e){
      status(e.message==="IN_FLIGHT"?"Resposta em processamento. Aguarde.":"Não foi possível confirmar a resposta. Tente novamente sem alterar a pergunta.");
    }finally{busy=false;ui();}
  });
  finish.addEventListener("click",async()=>{
    if(!current||busy)return;
    busy=true;ui();status("Enviando para análise humana...");
    try{
      const data=await call(URL+"/"+current.id+"/complete","POST",{expected_version:current.version});
      update(data);status("Pré-diagnóstico recebido! A equipe PatroAI poderá entrar em contato pelo WhatsApp.");
    }catch{status("A conclusão não foi confirmada. Tente novamente.");}
    finally{busy=false;ui();}
  });
  revoke.addEventListener("click",async()=>{
    if(!current||busy||!window.confirm("Revogar o consentimento e apagar as respostas registradas?"))return;
    busy=true;ui();
    try{
      await call(URL+"/"+current.id,"DELETE");
      current=null;store();sessionStorage.removeItem(PREFIX+":pending-turn");
      msgs.replaceChildren();status("Consentimento revogado. Seus dados foram removidos do atendimento.");
    }catch{status("Não foi possível confirmar a revogação. Tente novamente.");}
    finally{busy=false;ui();}
  });

  fetch(URL+"/status",{cache:"no-store",credentials:"same-origin"})
    .then(r=>r.ok?r.json():{available:false}).then(async data=>{
      if(!data.available){button.remove();panel.remove();style.remove();return;}
      mount.style.setProperty("display","none","important");
      button.hidden=false;
      ui();if(current)await restore();
    }).catch(()=>{button.remove();panel.remove();style.remove();});
})();
