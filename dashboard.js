"use strict";
/* PatroAI dashboard. No raw server text is ever assigned to innerHTML. */
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { csrf: null, role: null, staffId: null, challenge: null, cursor: null,
                  selected: null, etag: null, status: "", rows: [] };
  const names = {new:"Novo",in_review:"Em análise",closed:"Concluído"};
  const visibility = (id,on) => $(id).classList.toggle("hidden",!on);
  const notice = (message,type="") => {
    $("notice").textContent=message;
    $("notice").className="notice"+(type?" "+type:"");
  };
  function node(tag,cls,txt) {
    const e=document.createElement(tag);
    if(cls) e.className=cls;
    if(txt!==undefined) e.textContent=txt;
    return e;
  }
  async function api(path,options={}) {
    const headers = {"Accept":"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})};
    if(options.method && options.method!=="GET" && state.csrf) headers["X-CSRF-Token"]=state.csrf;
    let res;
    try {res=await fetch("/v1/admin"+path,{credentials:"same-origin",cache:"no-store",...options,headers});}
    catch {throw new Error("Não foi possível acessar o serviço administrativo.");}
    const data=await res.json().catch(()=>({}));
    if(!res.ok) {
      const allowed=["UNAUTHENTICATED","INVALID_CREDENTIALS","INVALID_CHALLENGE","RATE_LIMITED","ADMIN_UNAVAILABLE","FEATURE_DISABLED","FORBIDDEN","VERSION_CONFLICT","INVALID_STATUS_TRANSITION"];
      const detail=allowed.includes(data.detail)?data.detail:"REQUEST_FAILED";
      const translations={
        UNAUTHENTICATED:"Sessão expirada. Faça login novamente.",
        INVALID_CREDENTIALS:"Credenciais inválidas.",
        INVALID_CHALLENGE:"Código inválido ou expirado.",
        RATE_LIMITED:"Muitas tentativas. Aguarde para tentar novamente.",
        ADMIN_UNAVAILABLE:"Painel administrativo ainda não habilitado.",
        FEATURE_DISABLED:"Funcionalidade desabilitada.",
        FORBIDDEN:"Você não tem permissão para esta operação.",
        VERSION_CONFLICT:"Registro modificado por outra pessoa. Atualize a página.",
        INVALID_STATUS_TRANSITION:"Mudança de situação não permitida."
      };
      if(res.status===401 && !path.startsWith("/auth/")) showLogin();
      throw new Error(translations[detail]||"A operação não pôde ser concluída.");
    }
    return {data,etag:res.headers.get("ETag")};
  }
  function showLogin() {
    visibility("login-panel",true);visibility("workspace",false);visibility("logout",false);
    $("who").textContent="Sessão não iniciada";
    state.csrf=null;state.role=null;state.staffId=null;state.selected=null;
  }
  function showWorkspace() {
    visibility("login-panel",false);visibility("workspace",true);visibility("logout",true);
    $("who").textContent=state.role==="super_admin"?"Super Admin PatroAI":
                        state.role==="manager"?"Gestor autenticado":"Analista autenticado";
    visibility("staff-admin", state.role==="super_admin");
    refresh();
    refreshR3();
    if(state.role==="super_admin") loadStaff();
  }
  async function refresh(cursor=null) {
    notice("Carregando solicitações...");
    const args=new URLSearchParams({limit:"25"});
    if(state.status) args.set("status",state.status);
    if(cursor) args.set("cursor",cursor);
    try {
      const {data}=await api("/handoffs?"+args.toString());
      state.rows=data.items||[];state.cursor=data.next_cursor||null;
      renderRows();
      notice("Fila atualizada.","success");
    } catch(e){notice(e.message,"error");}
  }
  function setStats(rows){
    $("stat-total").textContent=String(rows.length);
    for(const [key,id] of [["new","stat-new"],["in_review","stat-review"],["closed","stat-closed"]])
      $(id).textContent=String(rows.filter(x=>x.status===key).length);
  }
  function renderRows(){
    const target=$("queue-list");target.replaceChildren();
    setStats(state.rows);
    $("queue-count").textContent=`${state.rows.length} solicitação(ões) nesta página`;
    $("next").disabled=!state.cursor;
    if(!state.rows.length) {
      target.append(node("div","empty-state","Não há solicitações autorizadas neste filtro."));
      return;
    }
    for(const row of state.rows) {
      const button=node("button","queue-item");button.type="button";
      const first=node("div","queue-first");
      first.append(node("span","queue-id","Solicitação "+String(row.handoff_id).slice(0,8)));
      first.append(node("span","pill "+row.status,names[row.status]||"Status"));
      button.append(first);
      button.append(node("div","queue-meta",new Date(row.received_at).toLocaleString("pt-BR")));
      button.addEventListener("click",()=>openDetail(row.handoff_id));
      target.append(button);
    }
  }
  async function openDetail(id){
    $("detail-empty").textContent="Carregando detalhes...";
    try{
      const {data,etag}=await api("/handoffs/"+encodeURIComponent(id));
      state.selected=id;state.etag=etag;
      visibility("detail-empty",false);visibility("detail-content",true);
      $("detail-status").textContent=names[data.status]||data.status;
      $("detail-date").textContent=new Date(data.received_at).toLocaleString("pt-BR");
      const messages=$("messages");messages.replaceChildren();
      for(const item of data.selected_messages||[]){
        const bubble=node("div","message "+(item.role==="user"?"user":"assistant"));
        bubble.append(node("label","",item.role==="user"?"VISITANTE":"IA"));
        bubble.append(node("div","",item.content));
        messages.append(bubble);
      }
      const contact=data.contact;
      let txt="O visitante não autorizou dados de contato.";
      if(contact&&data.contact_preference==="email") txt="E-mail: "+contact.email+(contact.name?"\nNome: "+contact.name:"");
      if(contact&&data.contact_preference==="whatsapp") txt="WhatsApp: "+contact.phone+(contact.name?"\nNome: "+contact.name:"");
      $("contact").textContent=txt;
      const manager=["manager","super_admin"].includes(state.role) && data.status!=="closed";
      visibility("manager-actions",manager);
      $("new-status").replaceChildren();
      const next=data.status==="new"?"in_review":"closed";
      $("new-status").append(new Option(names[next],next));
      notice("Leitura registrada para auditoria.","success");
    }catch(e){notice(e.message,"error");}
  }
  async function loadStaff(){
    const target=$("staff-list");target.replaceChildren();
    try{
      const {data}=await api("/staff");
      for(const account of data.items||[]){
        const item=node("div","staff-row");
        const descr=node("div","staff-description");
        descr.append(node("strong","",account.email));
        descr.append(node("div","muted",account.role+" · "+(account.active?"Ativo":"Desativado")));
        item.append(descr);
        if(account.active && account.staff_id!==state.staffId){
          const action=node("button","ghost","Desativar");action.type="button";
          action.addEventListener("click",async()=>{
            if(!window.confirm("Desativar esta conta e revogar todas as sessões ativas?")) return;
            try{
              await api("/staff/"+encodeURIComponent(account.staff_id)+"/deactivate",{method:"POST"});
              notice("Conta desativada e sessões revogadas.","success");
              await loadStaff();
            }catch(err){notice(err.message,"error");}
          });
          item.append(action);
        }
        target.append(item);
      }
      if(!(data.items||[]).length) target.append(node("div","empty-state","Nenhuma conta encontrada."));
    }catch(err){target.append(node("div","empty-state",err.message));}
  }

  /* R3-A. Separate, gated workspace; does not change R2 handoff behavior. */
  const r3Names={
    registered:"Cadastro iniciado",in_progress:"Em pré-diagnóstico",
    completed:"Aguardando análise",in_review:"Em análise",
    qualified:"Qualificado",disqualified:"Não qualificado",
    contacted:"Contato realizado"
  };
  const r3Transitions={
    completed:["in_review"],
    in_review:["qualified","disqualified"],
    qualified:["contacted"]
  };
  const r3State={offset:0,next:null,selected:null,etag:null};
  const r3Notice=msg=>{$("diagnoses-notice").textContent=msg;};
  async function refreshR3(offset=0){
    r3Notice("Carregando pré-diagnósticos...");
    try{
      const {data}=await api("/diagnoses?limit=25&offset="+encodeURIComponent(offset));
      r3State.offset=offset;r3State.next=data.next_offset;
      const list=$("diagnoses-list");list.replaceChildren();
      for(const item of data.items||[]){
        const button=node("button","queue-item");
        button.type="button";
        button.append(node("strong","",r3Names[item.status]||item.status));
        button.append(node("div","queue-meta","Pré-diagnóstico "+String(item.diagnosis_id).slice(0,8)
                      +" · "+new Date(item.created_at).toLocaleString("pt-BR")
                      +" · "+item.turn_count+" resposta(s)"));
        button.addEventListener("click",()=>detailR3(item.diagnosis_id));
        list.append(button);
      }
      if(!(data.items||[]).length)list.append(node("div","empty-state","Nenhum pré-diagnóstico registrado."));
      visibility("diagnoses-next",data.next_offset!==null&&data.next_offset!==undefined);
      r3Notice("Lista atualizada. Novos cadastros aparecem aqui mesmo antes da primeira pergunta.");
    }catch(e){r3Notice(e.message);}
  }
  async function detailR3(id){
    r3Notice("Carregando detalhes autorizados...");
    const detail=$("diagnoses-detail");detail.replaceChildren();
    try {
      const {data,etag}=await api("/diagnoses/"+encodeURIComponent(id));
      r3State.selected=id;r3State.etag=etag;
      detail.append(node("h3","",r3Names[data.status]||data.status));
      detail.append(node("p","muted","Identificação em "+new Date(data.created_at).toLocaleString("pt-BR")
                    +" · Consentimento "+data.consent_version));
      const contact=node("div","r3-contact");
      contact.append(node("strong","",data.contact?.name||"Interessado"));
      if(data.contact?.company)contact.append(node("p","",data.contact.company));
      if(data.contact?.phone){
        const number=String(data.contact.phone);
        contact.append(node("p","",number));
        if(/^\+[1-9][0-9]{7,14}$/.test(number)){
          const link=node("a","","Abrir conversa no WhatsApp Business");
          link.href="https://wa.me/"+number.slice(1);link.target="_blank";link.rel="noopener noreferrer";
          contact.append(link);
        }
      }
      detail.append(contact);
      detail.append(node("h3","","Histórico registrado pelo servidor"));
      for(const item of data.messages||[]){
        const itemNode=node("div","r3-message "+(item.role==="user"?"user":"assistant"));
        itemNode.append(node("strong","",item.role==="user"?"VISITANTE":"IA"));
        itemNode.append(node("div","",item.content));
        detail.append(itemNode);
      }
      if(!(data.messages||[]).length)
        detail.append(node("p","muted","O visitante ainda não concluiu nenhuma resposta."));
      const next=r3Transitions[data.status]||[];
      if(next.length&&["manager","super_admin"].includes(state.role)){
        const actions=node("div","r3-actions");
        for(const status of next){
          const button=node("button","primary",r3Names[status]);button.type="button";
          button.addEventListener("click",async()=>{
            button.disabled=true;
            try{
              await api("/diagnoses/"+encodeURIComponent(id)+"/status",{
                method:"PATCH",headers:{"If-Match":r3State.etag},
                body:JSON.stringify({status})
              });
              await refreshR3(r3State.offset);await detailR3(id);
              r3Notice("Decisão humana registrada com auditoria.");
            }catch(e){r3Notice(e.message);button.disabled=false;}
          });
          actions.append(button);
        }
        detail.append(actions);
      }
      r3Notice("Leitura de pré-diagnóstico registrada para auditoria.");
    }catch(e){r3Notice(e.message);}
  }
  $("diagnoses-refresh").addEventListener("click",()=>refreshR3());
  $("diagnoses-next").addEventListener("click",()=>{
    if(r3State.next!==null)refreshR3(r3State.next);
  });

  $("staff-refresh").addEventListener("click",loadStaff);
  $("password-form").addEventListener("submit",async e=>{
    e.preventDefault();notice("Verificando credenciais...");
    try{
      const {data}=await api("/auth/password",{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})});
      state.challenge=data.challenge_id;
      $("password").value="";
      visibility("password-form",false);visibility("mfa-form",true);
      $("code").focus();notice("Informe o código do autenticador.");
    }catch(err){notice(err.message,"error");}
  });
  $("mfa-form").addEventListener("submit",async e=>{
    e.preventDefault();notice("Validando segundo fator...");
    try{
      const {data}=await api("/auth/mfa",{method:"POST",body:JSON.stringify({challenge_id:state.challenge,code:$("code").value})});
      $("code").value="";state.challenge=null;state.csrf=data.csrf_token;
      const session=await api("/auth/session");
      state.role=session.data.role;state.staffId=session.data.staff_id;state.csrf=session.data.csrf_token;
      showWorkspace();
    }catch(err){notice(err.message,"error");}
  });
  $("logout").addEventListener("click",async()=>{
    try{await api("/auth/logout",{method:"POST"});}catch{}
    showLogin();notice("Sessão encerrada.");
  });
  $("refresh").addEventListener("click",()=>refresh());
  $("next").addEventListener("click",()=>{if(state.cursor) refresh(state.cursor);});
  $("filter-status").addEventListener("change",e=>{state.status=e.target.value;refresh();});
  $("save-status").addEventListener("click",async()=>{
    if(!state.selected||!state.etag)return;
    try{
      await api("/handoffs/"+encodeURIComponent(state.selected)+"/status",{
        method:"PATCH",headers:{"If-Match":state.etag},
        body:JSON.stringify({status:$("new-status").value})
      });
      await refresh();await openDetail(state.selected);
      notice("Situação atualizada e auditada.","success");
    }catch(err){notice(err.message,"error");}
  });
  (async()=>{
    try{
      const {data}=await api("/auth/session");
      state.role=data.role;state.staffId=data.staff_id;state.csrf=data.csrf_token;
      showWorkspace();
    }catch{showLogin();notice("Entre com sua conta administrativa.");}
  })();
})();
