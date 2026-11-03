/* PatroAI local review candidate — NOT released. No automatic transcript transfer.
   This UI collects browser-supplied messages and does NOT attest their authenticity. */
(() => {
  "use strict";
  const root = document.getElementById("patroai-assist");
  const panel = document.getElementById("pa-panel");
  const messages = document.getElementById("pa-messages");
  const consent = document.getElementById("pa-consent");
  const disclosure = document.getElementById("pa-disclosure");
  if (!root || !panel || !messages || !consent || !disclosure) return;

  const styles = document.createElement("style");
  styles.textContent = `
  #patroai-assist .pa-privacy-toggle{border:1px solid #6eb698;color:#e4fff0;background:#143d31;padding:5px 9px;border-radius:8px;font-size:11px;margin:0 0 7px;width:100%;text-align:left}
  #patroai-assist .pa-privacy-wrap[hidden]{display:none!important}
  #patroai-assist .pa-handoff{border:1px solid #72ba93;background:#144136;color:#effff4;padding:12px;border-radius:12px;display:flex;flex-direction:column;gap:8px;font-size:12px;line-height:1.45}
  #patroai-assist .pa-handoff button{padding:8px;border-radius:8px;border:0;background:#8decba;color:#0a2d20;font-weight:700}
  #patroai-assist .pa-handoff button:disabled{opacity:.55;cursor:not-allowed}
  #patroai-assist .pa-handoff button.secondary{background:transparent;color:#ecfff1;border:1px solid #80bc9e}
  #patroai-assist .pa-handoff select,#patroai-assist .pa-handoff input:not([type=checkbox]){padding:7px;border-radius:6px;color:#12261e;background:#fff;width:100%;box-sizing:border-box}
  #patroai-assist .pa-handoff label{display:block}
  #patroai-assist .pa-handoff .pa-picks{max-height:150px;overflow-y:auto}
  #patroai-assist .pa-handoff .pa-picks label{display:flex;align-items:flex-start;gap:5px}
  `;
  root.append(styles);

  function elem(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  // Display-only consent compacting. A separate opt-in is required for handoff.
  const privacyDetails = elem("div", undefined, "pa-privacy-wrap");
  disclosure.parentNode.insertBefore(privacyDetails, disclosure);
  privacyDetails.append(disclosure);
  const consentLabel = consent.closest("label");
  if (consentLabel) privacyDetails.append(consentLabel);
  const privacyButton = elem("button", "Privacidade da IA · Minimizar aviso", "pa-privacy-toggle");
  privacyButton.type = "button";
  privacyButton.setAttribute("aria-expanded", "true");
  privacyDetails.parentNode.insertBefore(privacyButton, privacyDetails);
  function setPrivacy(open) {
    privacyDetails.hidden = !open;
    privacyButton.setAttribute("aria-expanded", String(open));
    privacyButton.textContent = open
      ? "Privacidade da IA · Minimizar aviso"
      : "Privacidade da IA · Ver detalhes";
  }
  privacyButton.addEventListener("click", () => setPrivacy(privacyDetails.hidden));
  consent.addEventListener("change", () => setPrivacy(!consent.checked));
  setPrivacy(!consent.checked);

  // Count *completed successful requests* through an explicit event from the
  // existing chat's success branch. DOM mutations, partial replies, failures,
  // cancellations and extra bubbles cannot increment this counter.
  // This remains a UI convenience, not a trustworthy backend assertion.
  let offered = false;
  let answeredCount = 0;
  const completedMessages = [];
  const conversationId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : null;

  root.addEventListener("patroai:chat-turn-complete", event => {
    const detail = event && event.detail;
    if (!detail || typeof detail.user !== "string" ||
        typeof detail.assistant !== "string" ||
        !detail.user.trim() || !detail.assistant.trim()) return;

    answeredCount += 1;
    completedMessages.push({role:"user", content:detail.user});
    completedMessages.push({role:"assistant", content:detail.assistant});
    // Limit what remains available for voluntary selection, not turn counting.
    if (completedMessages.length > 16) completedMessages.splice(0, completedMessages.length - 16);
    if (offered || answeredCount < 3) return;
    offered = true;
    offerHandoff();
  });

  function offerHandoff() {
    const card = elem("div", undefined, "pa-handoff");
    card.append(elem("strong","Deseja que a equipe PatroAI analise esta conversa?"));
    card.append(elem("p","Você escolhe as mensagens e autoriza o compartilhamento. O conteúdo é fornecido pelo navegador, não é um registro autenticado da conversa. Não enviamos nada automaticamente."));
    const open = elem("button","Solicitar análise");
    const dismiss = elem("button","Continuar conversando","secondary");
    open.type = dismiss.type = "button";
    card.append(open,dismiss);
    messages.append(card);
    messages.scrollTop = messages.scrollHeight;
    dismiss.addEventListener("click",()=>card.remove());
    open.addEventListener("click",()=>showForm(card));
  }

  function showForm(card) {
    card.replaceChildren(elem("strong","Escolha as mensagens para compartilhar:"));
    const all = completedMessages.map(m => ({role:m.role,content:m.content}));
    const picks = elem("div",undefined,"pa-picks");
    const checks = [];
    all.forEach(msg => {
      const label = elem("label");
      const checkbox = elem("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checks.push(checkbox);
      label.append(checkbox,elem("span",(msg.role==="user"?"Visitante: ":"IA: ")+msg.content.slice(0,140)));
      picks.append(label);
    });
    card.append(picks);
    card.append(elem("p","A equipe receberá somente as mensagens selecionadas, identificadas como fornecidas pelo visitante."));

    function checkboxRow(text) {
      const label = elem("label");
      const check = elem("input");
      check.type="checkbox"; check.checked=false;
      label.append(check,elem("span",text));
      return [label,check];
    }
    const [shareLabel, share] = checkboxRow("Autorizo o compartilhamento das mensagens selecionadas com a equipe PatroAI.");
    card.append(shareLabel);
    const label = elem("label","Contato (opcional):");
    const channel = elem("select");
    for (const [value,txt] of [["none","Não desejo contato"],["email","E-mail"],["whatsapp","WhatsApp"]]) {
      const option = elem("option",txt);
      option.value=value;
      channel.append(option);
    }
    channel.value="none";
    label.append(channel);card.append(label);
    const contact=elem("input");
    contact.type="email";contact.autocomplete="off";contact.hidden=true;card.append(contact);
    const [contactLabel, contactOptin] = checkboxRow("Autorizo a equipe a entrar em contato pelo canal selecionado.");
    contactLabel.hidden=true;card.append(contactLabel);
    channel.addEventListener("change",()=>{
      contact.hidden=channel.value==="none";contactLabel.hidden=channel.value==="none";
      contactOptin.checked=false;contact.value="";
      contact.type=channel.value==="email"?"email":"tel";
      contact.placeholder=channel.value==="email"?"email@exemplo.com":"+5551999999999";
    });
    const status=elem("p");status.setAttribute("role","status");
    const submit=elem("button","Confirmar encaminhamento");
    const cancel=elem("button","Voltar ao chat","secondary");
    submit.type=cancel.type="button";
    card.append(submit,cancel,status);
    cancel.addEventListener("click",()=>card.remove());

    const REPLAY_WINDOW_MS = 72 * 60 * 60 * 1000;  // DEC-04 proposal only
    let pending=null;
    let terminal=false;

    function finishAsUnconfirmed(text) {
      terminal=true;
      status.textContent=text;
      submit.disabled=true;
      submit.textContent="Não reenviar";
    }

    submit.addEventListener("click",async()=>{
      if (terminal) return;
      if(!conversationId || typeof crypto.randomUUID !== "function"){
        status.textContent="Encaminhamento indisponível neste navegador.";return;
      }

      if(!pending) {
        const selected=all.filter((_,i)=>checks[i].checked);
        if(selected.length<2||selected.length>16||!selected.some(m=>m.role==="user")||
           !selected.some(m=>m.role==="assistant")) {
          status.textContent="Selecione mensagens do visitante e da IA.";return;
        }
        if(!share.checked) {status.textContent="Autorize o compartilhamento antes de enviar.";return;}
        const pref=channel.value;
        if(pref!=="none"&&(!contactOptin.checked||!contact.value.trim())) {
          status.textContent="Autorize e informe o contato, ou escolha sem contato.";return;
        }
        const body={conversation_id:conversationId,messages:selected,contact_preference:pref,
          consent:{share_transcript:true,contact_permission:pref!=="none",notice_version:"patroai-handoff-v1"}};
        if(pref==="email")body.contact={email:contact.value.trim()};
        if(pref==="whatsapp")body.contact={phone:contact.value.trim()};
        const json=JSON.stringify(body);
        if(new TextEncoder().encode(json).length>49152) {
          status.textContent="Selecione menos mensagens.";return;
        }
        // Browser never decides or asserts server provenance.
        pending={key:crypto.randomUUID(),json,startedAt:Date.now()};
        // Key/payload frozen across *manual* retries. No localStorage/auto retry.
        card.querySelectorAll("input,select").forEach(input=>{input.disabled=true;});
      }
      if(Date.now()-pending.startedAt>=REPLAY_WINDOW_MS) {
        finishAsUnconfirmed("Prazo local de repetição esgotado. O recebimento é desconhecido; não geraremos nova solicitação automaticamente. Contate a equipe para conferir.");
        return;
      }
      submit.disabled=true;
      status.textContent="Verificando recebimento…";
      try {
        const reply=await fetch("/v1/public/handoffs",{
          method:"POST",
          headers:{"Content-Type":"application/json","Idempotency-Key":pending.key},
          credentials:"same-origin",cache:"no-store",body:pending.json
        });
        let result=null;
        try { result=await reply.json(); } catch (_) { /* ambiguous response */ }

        if(reply.status===409) {
          const code=result && result.error && result.error.code;
          if(code==="IDEMPOTENCY_EXPIRED") {
            finishAsUnconfirmed("Prazo de repetição encerrado pelo servidor. Não envie nova chave; confirme com a equipe antes de fazer outra solicitação.");
          } else {
            finishAsUnconfirmed("Conflito de solicitação. Não gere outro pedido automaticamente; procure a equipe comercial.");
          }
          return;
        }
        if(reply.ok && result && typeof result.handoff_id==="string") {
          status.textContent="Solicitação recebida. Identificador: "+result.handoff_id;
          terminal=true;
          submit.remove();cancel.remove();
          return;
        }
        // 4xx errors (except 409 above) cannot be retried with the frozen invalid payload.
        if(reply.status>=400 && reply.status<500) {
          finishAsUnconfirmed("Solicitação não aceita. Para corrigir ou reenviar, procure a equipe; não criaremos outra chave automaticamente.");
          return;
        }
        throw new Error("receipt not confirmed");
      } catch (_) {
        status.textContent="Recebimento não confirmado (erro de rede ou servidor). Se desejar, tente manualmente com a mesma chave e as mesmas mensagens, dentro do prazo de 72 horas. Não abra outro pedido para compensar.";
      } finally {
        if(!terminal)submit.disabled=false;
      }
    });
  }
})();
