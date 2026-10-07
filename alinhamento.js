/*
 * Módulo de Alinhamento e Divindades
 *
 * Gerencia a etapa de escolha de alinhamento e, em seguida, a
 * seleção da divindade. Inclui toda a lógica necessária para
 * apresentar opções diferentes dependendo da classe (por exemplo,
 * Paladino e Druida têm alinhamento fixo) e prossegue para a
 * seleção de línguas após a divindade ser confirmada.
 */
(function(){
  const { state, $, el, randInt } = window.app;

  const ALIGNMENT_DESCRIPTIONS = {
    "Caótico": "Personagens caóticos se alinham à destruição, ambição e perdição, adotando a mentalidade “os mais fortes sobrevivem”.",
    "Ordeiro": "Personagens ordeiros se alinham à justiça, ordem e virtude. Personagens ordeiros agem de acordo com uma mentalidade de “pelo bem da maioria”.",
    "Neutro": "Personagens neutros encontram um equilíbrio entre a Ordem e o Caos. Eles se alinham ao ciclo de crescimento e declínio, aderindo à uma mentalidade de que “a natureza deve seguir seu curso”."
  };

  function createAlignmentDescription(alignment){
    const box = document.createElement("div");
    box.className = "selection-info selection-description alignment-description";
    const title = document.createElement("strong");
    const description = document.createElement("p");
    box.append(title, description);

    function update(value){
      const text = ALIGNMENT_DESCRIPTIONS[value];
      box.hidden = !text;
      title.textContent = text ? value.toUpperCase() : "";
      description.textContent = text || "";
    }
    update(alignment);
    return { box, update };
  }

  /**
   * Exibe a interface de alinhamento. Se o alinhamento já estiver
   * bloqueado (confirmado), mostra a escolha anterior e um botão
   * para seguir para as divindades. Caso o alinhamento seja
   * determinado automaticamente pela classe, mostra a opção fixa.
   */
  function showAlignmentStep(){
    const step = $("#stepAlign");
    if (!step) return;
    step.style.display = "";
    const area = $("#alignArea");
    if (!area) return;
    area.innerHTML = "";
    // Determina se a classe impõe um alinhamento
    const forced = (state.cls === "Paladino") ? "Ordeiro" : (state.cls === "Druida") ? "Neutro" : null;
    // Se já confirmado anteriormente, não permite alteração
    if (state.alignLocked) {
      const info = forced
        ? `Alinhamento definido pela classe: <strong>${state.align}</strong>`
        : `Alinhamento confirmado: <strong>${state.align || "—"}</strong>`;
      area.append( el("div",{class:"pill", html:info}) );
      const description = createAlignmentDescription(state.align);
      const btn = el("button",{html:"Prosseguir para Divindades"});
      btn.addEventListener("click", () => {
        goToDeity();
      });
      area.append(btn);
      area.append(description.box);
      step.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    }
    // Caso de alinhamento fixo (Paladino / Druida)
    if (forced){
      state.align = forced;
      area.append( el("div",{class:"pill", html:`Alinhamento definido pela classe: <strong>${forced}</strong>`}) );
      const description = createAlignmentDescription(forced);
      const btn = el("button",{html:"Continuar"});
      btn.addEventListener("click", () => {
        state.alignLocked = true;
        btn.disabled = true;
        // Feedback visual
        try { window.app && window.app.showCheck && window.app.showCheck(btn); } catch {}
        goToDeity();
      });
      area.append(btn);
      area.append(description.box);
      step.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    }
    // Caso de escolha livre de alinhamento
    const select = el("select",{ id:"alignSelect", "aria-label":"Escolher alinhamento" });
    select.append(new Option("-- Escolha --",""));
    select.append(new Option("Ordeiro","Ordeiro"));
    select.append(new Option("Neutro","Neutro"));
    select.append(new Option("Caótico","Caótico"));
    const btnRand = el("button",{ class:"ghost", html:"Aleatório" });
    const btnFin  = el("button",{ html:"Continuar", disabled:true });
    const alignmentDescription = createAlignmentDescription(select.value);
    // Pré-seleciona se já havia um valor salvo
    if (state.align) {
      select.value = state.align;
      btnFin.disabled = !select.value;
      alignmentDescription.update(state.align);
    }
    const validate = () => {
      const ok = select.selectedIndex > 0 && select.value.trim() !== "";
      btnFin.disabled = !ok;
    };
    select.addEventListener("change", () => {
      state.align = select.value || null;
      alignmentDescription.update(state.align);
      validate();
    });
    btnRand.addEventListener("click", () => {
      const opts = ["Ordeiro","Neutro","Caótico"];
      state.align = opts[randInt(0,2)];
      select.value = state.align;
      alignmentDescription.update(state.align);
      validate();
    });
    btnFin.addEventListener("click", () => {
      if (!state.align) return;
      state.alignLocked = true;
      select.disabled = true;
      btnRand.disabled = true;
      btnFin.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnFin); } catch {}
      goToDeity();
    });
    area.append(select, btnRand, btnFin);
    area.append(alignmentDescription.box);
    step.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  /**
   * Processa a escolha de divindade. Caso a classe determine
   * automaticamente uma divindade (Druida e Paladino), mostra a
   * opção fixa. Caso contrário, apresenta opções de acordo com o
   * alinhamento.
   */
  function goToDeity(){
    // Pré-condições: precisa de classe e alinhamento definidos
    if (!state.cls || !state.align){
      alert("Defina Classe e Alinhamento antes de escolher uma divindade.");
      return;
    }
    // Garante que módulo de divindades está carregado
    if (!window.deities || !window.deities.computeDeityOptions){
      alert("Módulo de divindades não carregado. Verifique o arquivo deities.js.");
      return;
    }
    // Remove botão template se existir
    const tpl = document.getElementById("btnConfirmDeity");
    if (tpl) tpl.remove();
    const { auto, options } = window.deities.computeDeityOptions({ cls: state.cls, alignment: state.align });
    const step = $("#stepDeity");
    if (!step) return;
    step.style.display = "";
    const area = $("#deityArea");
    if (!area) return;
    area.innerHTML = "";
    // Se já confirmado anteriormente, trava
    if (state.deityLocked && state.deity){
      const groups = window.deities?.DEITIES || {};
      const all = Object.values(groups).flat();
      const info = all.find(d => d.name === state.deity);
      const row = el("div",{class:"row"});
      row.append(
        el("div",{ class:"pill", html:`Divindade confirmada: <strong>${state.deity}</strong>` }),
        el("button",{ html:"Prosseguir para Línguas", onclick: () => { window.app.goToLanguages && window.app.goToLanguages(); } })
      );
      area.append(row);
      area.append(
        el("div",{ class:"selection-info selection-description", html:`<strong>${state.deity}</strong><p>${info?.hint || "—"}</p>` })
      );
      step.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    }
    // Caso automático (Druida/Paladino)
    if (auto){
      state.deity = auto;
      const groups = window.deities?.DEITIES || {};
      const all = Object.values(groups).flat();
      const info = all.find(d => d.name === auto);
      const row = el("div",{class:"row"});
      const pill = el("div",{ class:"pill", html:`Divindade definida pela classe: <strong>${auto}</strong>` });
      const btnConfirm = el("button",{ html:"Continuar" });
      btnConfirm.addEventListener("click", () => {
        state.deityLocked = true;
        btnConfirm.disabled = true;
        // Feedback visual
        try { window.app && window.app.showCheck && window.app.showCheck(btnConfirm); } catch {}
        // Avança para línguas
        if (window.app.goToLanguages) window.app.goToLanguages();
      });
      row.append(pill, btnConfirm);
      area.append(row);
      area.append(
        el("div",{ class:"selection-info selection-description", html:`<strong>${auto}</strong><p>${info?.hint || "—"}</p>` })
      );
      step.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    }
    // Caso normal: gera interface de seleção
    renderDeities(options);
    step.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  /**
   * Renderiza o menu suspenso de divindades e permite que o
   * usuário selecione, aleatorize ou confirme a divindade. Após a
   * confirmação, avança para a etapa de línguas.
   */
  function renderDeities(options){
    const area = $("#deityArea");
    if (!area) return;
    area.innerHTML = "";
    if (!options || !options.length){
      area.append( el("div",{class:"pill", html:"Nenhuma opção disponível para este alinhamento."}) );
      return;
    }
    const row = el("div",{ class:"row" });
    const fieldWrap = el("label",{ class:"field" });
    const sel = el("select",{ id:"deitySelect", "aria-label":"Escolher divindade" });
    sel.append(new Option("-- Escolha --",""));
    options.forEach(d => {
      const opt = new Option(d.name, d.name);
      opt.title = d.hint || "";
      sel.append(opt);
    });
    fieldWrap.append(sel);
    const btnRand = el("button",{ class:"ghost", html:"Aleatório" });
    const btnConfirm = el("button",{ id:"btnConfirmDeity", html:"Continuar", disabled:true });
    row.append(fieldWrap, btnRand, btnConfirm);
    area.append(row);
    const descBox = el("div",{ class:"selection-info selection-description", id:"deityDesc", html:"<em class='muted'>Selecione uma divindade para ver a descrição.</em>" });
    area.append(descBox);
    // Helpers
    const byName = name => options.find(o => o.name === name);
    const isValid = () => sel.selectedIndex > 0 && String(sel.value).trim() !== "";
    const updateDesc = () => {
      const pick = isValid() ? byName(sel.value) : null;
      descBox.innerHTML = pick
        ? `<strong>${pick.name}</strong><p>${pick.hint || "—"}</p>`
        : `<em class='muted'>Selecione uma divindade para ver a descrição.</em>`;
      btnConfirm.disabled = !isValid();
    };
    sel.addEventListener("change", () => {
      if (!isValid()) state.deity = null;
      updateDesc();
    });
    btnRand.addEventListener("click", () => {
      const idx = 1 + Math.floor(Math.random() * options.length);
      sel.selectedIndex = idx;
      updateDesc();
    });
    sel.selectedIndex = 0;
    updateDesc();
    btnConfirm.addEventListener("click", () => {
      if (!isValid()) return;
      state.deity = sel.value;
      state.deityLocked = true;
      sel.disabled = true;
      btnRand.disabled = true;
      btnConfirm.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirm); } catch {}
      // Avança para línguas
      if (window.app.goToLanguages) window.app.goToLanguages();
    });
  }
  // Expõe a função de alinhamento no namespace app para ser invocada por ouro.js
  window.app.showAlignmentStep = showAlignmentStep;
})();

