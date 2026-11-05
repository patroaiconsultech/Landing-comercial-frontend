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
