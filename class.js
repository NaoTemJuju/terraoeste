/*
 * Módulo de Classe
 *
 * Trata da seleção de classe, aleatória ou manual, e da transição
 * para as etapas subsequentes (origem, pontos de vida, etc.). Ao
 * Continuar a classe, o módulo chama `attachOriginStep` definido em
 * origens.js e prepara a interface para rolar pontos de vida e ouro.
 */
(function(){
  const { CLASSES, CLASS_DICE, pending, state, randInt, $ } = window.app;
  const classSel = $("#classSelect");
  const btnRandClass = $("#btnRandClass");
  const btnConfirmClass = $("#btnConfirmClass");
  const classInfo = $("#classInfo");
  const classInfoTitle = $("#classInfoTitle");
  const classInfoDescription = $("#classInfoDescription");
  const classInfoAbility = $("#classInfoAbility");
  const classTalentChoices = $("#classTalentChoices");
  const classTalentTable = $("#classTalentTable");

  // Descrições da tradução PT-BR do compêndio de classes do Foundry.
  // Só associa classes do site com equivalentes claros no compêndio.
  const CLASS_DESCRIPTIONS = {
    "Bardo": "Bardos são viajantes bem-vindos e conselheiros sábios; sua tarefa é proteger e compartilhar o conhecimento que é repassado através das eras.",
    "Guerreiro": "Gladiadores ensanguentados usando armaduras amassadas, duelistas acrobáticos com suas espadas de arremesso, ou arqueiros élficos de visão aguçada que forjam suas lendas com aço e coragem.",
    "Mago": "Adeptos tatuados com runas, sábios usando óculos, e bruxas conjuradoras de chamas que ousam manipular as terríveis forças da magia.",
    "Patrulheiro": "Rastreadores habilidosos, andarilhos furtivos e guerreiros incomparáveis que têm as terras selvagens como lar.",
    "Sacerdote": "Templários cruzados, xamãs proféticos, ou fanáticos com olhos enlouquecidos que empunham o poder de seus deuses para expurgar os impuros."
  };

  const CLASS_TALENT_TABLES = {
    "Malandro": {
      title: "Talentos de Ladrão",
      entries: [
        { roll: "2", effect: "Ganhe Vantagem nas rolagens de iniciativa (role novamente se repetir)" },
        { roll: "3–5", effect: "Sua Apunhalada Pelas Costas causa +1 dado de dano" },
        { roll: "6–9", effect: "+2 no atributo Força, Destreza ou Carisma" },
        { roll: "10–11", effect: "+1 em ataques corpo a corpo e à distância" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Ladrão": {
      title: "Talentos de Ladrão",
      entries: [
        { roll: "2", effect: "Ganhe Vantagem nas rolagens de iniciativa (role novamente se repetir)" },
        { roll: "3–5", effect: "Sua Apunhalada Pelas Costas causa +1 dado de dano" },
        { roll: "6–9", effect: "+2 no atributo Força, Destreza ou Carisma" },
        { roll: "10–11", effect: "+1 em ataques corpo a corpo e à distância" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    }
  };

  function renderClassTalentTable(cls){
    if (!classTalentTable) return;
    const data = CLASS_TALENT_TABLES[cls];
    classTalentTable.replaceChildren();
    classTalentTable.hidden = !data;
    if (!data) return;

    const title = document.createElement("h4");
    title.textContent = data.title;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    ["2d6", "Efeito"].forEach(label => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      headingRow.append(th);
    });
    thead.append(headingRow);
    const tbody = document.createElement("tbody");
    data.entries.forEach(entry => {
      const row = document.createElement("tr");
      const roll = document.createElement("th");
      roll.scope = "row";
      roll.textContent = entry.roll;
      const effect = document.createElement("td");
      effect.textContent = entry.effect;
      row.append(roll, effect);
      tbody.append(row);
    });
    table.append(thead, tbody);
    classTalentTable.append(title, table);
  }

  function talentOptions(cls){ return window.CUSTOM_CLASS_DATA?.[cls]?.talents || []; }
  function hasClassTalentChoice(cls){ return talentOptions(cls).length > 1 && window.CUSTOM_CLASS_DATA?.[cls]?.talentMode === "choice"; }
  window.app.randomClassTalent = cls => {
    const options = talentOptions(cls);
    return hasClassTalentChoice(cls) ? options[randInt(0, options.length - 1)].id : (options.length === 1 ? options[0].id : null);
  };
  function updateClassInfo(cls){
    if (!classInfo) return;
    classInfo.hidden = !cls;
    renderClassTalentTable(cls);
    if (classInfoTitle && cls) classInfoTitle.textContent = `Informações: ${cls}`;
    if (classInfoDescription) {
      classInfoDescription.textContent = cls ? (window.CUSTOM_CLASS_DATA?.[cls]?.description || CLASS_DESCRIPTIONS[cls] || "Ainda não há uma descrição correspondente no compêndio consultado.") : "A descrição da classe aparecerá aqui.";
    }
    const talents = talentOptions(cls);
    if (classInfoAbility) classInfoAbility.textContent = talents.length
      ? (hasClassTalentChoice(cls) ? "Escolha um dos talentos da classe:" : talents.map(t => `${t.name}: ${t.description || ""}`).join("; "))
      : "Nenhuma habilidade da classe cadastrada.";
    if (classTalentChoices) {
      classTalentChoices.replaceChildren();
      classTalentChoices.hidden = !hasClassTalentChoice(cls);
      if (hasClassTalentChoice(cls)) talents.forEach(talent => {
        const label = document.createElement("label"); label.className = "race-talent-choice";
        const input = document.createElement("input"); input.type = "radio"; input.name = "classTalent"; input.value = talent.id;
        input.checked = pending.classTalent === talent.id;
        const detail = document.createElement("span");
        const name = document.createElement("b"); name.textContent = talent.name;
        const description = document.createElement("small"); description.textContent = talent.description || "";
        detail.append(name, description); label.append(input, detail);
        input.addEventListener("change", () => { pending.classTalent = talent.id; updateConfirmButton(); });
        classTalentChoices.append(label);
      });
    }
    updateConfirmButton();
  }

  function updateConfirmButton(){ if (btnConfirmClass) btnConfirmClass.disabled = !pending.cls || (hasClassTalentChoice(pending.cls) && !talentOptions(pending.cls).some(t => t.id === pending.classTalent)); }

  window.app.getClassContent = cls => ({
    name: cls,
    description: window.CUSTOM_CLASS_DATA?.[cls]?.description ?? CLASS_DESCRIPTIONS[cls] ?? "",
    hp: CLASS_DICE[cls] || 6,
    talents: talentOptions(cls).map(item => ({ ...item })),
    languages: window.langs?.getClassBonusSpec(cls) || {},
    origins: window.getOriginsForClass?.(cls) || (window.CUSTOM_ORIGENS?.[cls] || []).map(item => ({ ...item }))
  });
  window.app.getClassChoiceMetadata = (cls, talentId) => {
    const options = talentOptions(cls);
    const selected = options.find(item => item.id === talentId);
    if (!hasClassTalentChoice(cls) || options.length < 2 || !selected?.originalName || options.some(item => !item.originalName)) return [];
    return [{ sourceType: "Class", sourceName: window.CUSTOM_CLASS_DATA?.[cls]?.foundryName || cls, selected: selected.originalName, options: options.map(item => item.originalName) }];
  };

  // Sorteia uma classe aleatória
  if (btnRandClass) {
    btnRandClass.addEventListener("click", () => {
      const c = CLASSES[randInt(0, CLASSES.length - 1)];
      if (classSel) {
        classSel.value = c;
        if (classSel.options.length > 0) classSel.options[0].disabled = true;
      }
      pending.cls = c;
      pending.classTalent = hasClassTalentChoice(c) ? null : (talentOptions(c).length === 1 ? talentOptions(c)[0].id : null);
      updateClassInfo(c);
      updateConfirmButton();
    });
  }
  // Seleção manual da classe
  if (classSel) {
    classSel.addEventListener("change", e => {
      const val = e.target.value;
      pending.cls = val || null;
      const talents = talentOptions(pending.cls);
      pending.classTalent = hasClassTalentChoice(pending.cls) ? null : (talents.length === 1 ? talents[0].id : null);
      updateClassInfo(pending.cls);
      updateConfirmButton();
    });
  }
  // Confirma a classe e prepara as etapas seguintes
  if (btnConfirmClass) {
    btnConfirmClass.addEventListener("click", () => {
      if (!pending.cls || (hasClassTalentChoice(pending.cls) && !talentOptions(pending.cls).some(t => t.id === pending.classTalent))) return;
      state.cls = pending.cls;
      state.classTalent = pending.classTalent;
      state.origem = null;
      if (classSel) classSel.disabled = true;
      if (btnRandClass) btnRandClass.disabled = true;
      btnConfirmClass.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmClass); } catch {}
      // Reseta visibilidade das seções subsequentes
      const stepMastery = $("#stepMastery");
      const stepOrigin = $("#stepOrigin");
      const stepHP    = $("#stepHP");
      const stepGold  = $("#stepGold");
      const stepAlign = $("#stepAlign");
      const stepFinal = $("#stepFinal");
      if (stepMastery) stepMastery.style.display = "none";
      if (stepOrigin) stepOrigin.style.display = "none";
      if (stepHP)    stepHP.style.display = "none";
      if (stepGold)  stepGold.style.display = "none";
      if (stepAlign) stepAlign.style.display = "none";
      if (stepFinal) stepFinal.style.display = "none";
      const hpOut = $("#hpOut");
      const btnRollHP = $("#btnRollHP");
      const goldOut = $("#goldOut");
      const btnRollGold = $("#btnRollGold");
      if (hpOut) hpOut.style.display = "none";
      if (btnRollHP) btnRollHP.disabled = false;
      if (goldOut) goldOut.style.display = "none";
      if (btnRollGold) btnRollGold.disabled = false;

      // Após a Maestria (se houver para a classe), segue para Origem
      function goToOriginStep(){
        if (stepOrigin) stepOrigin.style.display = "";
        if (typeof window.attachOriginStep === "function") {
          window.attachOriginStep(state, () => {
            // Callback após confirmação da origem
            // Em vez de exibir PV diretamente, avançamos para alinhamento
            // Limpa HP e Ouro e oculta suas seções até o final do fluxo
            state.hp = null;
            if (hpOut) hpOut.style.display = "none";
            if (btnRollHP) btnRollHP.disabled = false;
            state.gold = null;
            if (goldOut) goldOut.style.display = "none";
            if (btnRollGold) btnRollGold.disabled = false;
            // Avança para a etapa de alinhamento
            if (typeof window.app.showAlignmentStep === 'function') {
              window.app.showAlignmentStep();
            } else if (stepAlign) {
              stepAlign.style.display = '';
              stepAlign.scrollIntoView({ behavior:'smooth', block:'start' });
            }
            // Garante que etapas posteriores não apareçam prematuramente
            if (stepHP) stepHP.style.display = 'none';
            if (stepGold) stepGold.style.display = 'none';
            if (stepFinal) stepFinal.style.display = 'none';
          });
        }
      }

      // Etapa de Maestria em Arma (mastery.js): só aparece para classes
      // com opções cadastradas (ex.: Cavaleiro). Para as demais, a
      // etapa é pulada automaticamente e segue direto para Origem.
      if (typeof window.attachMasteryStep === "function") {
        window.attachMasteryStep(state, goToOriginStep);
      } else {
        goToOriginStep();
      }
    });
  }
})();

