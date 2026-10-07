/*
 * Módulo Final e Línguas
 *
 * Contém a lógica para a seleção de línguas e para a etapa final de
 * geração do personagem. Após a divindade ser escolhida, o usuário
 * escolhe as línguas adicionais permitidas e, em seguida, o
 * personagem é finalizado. O objeto salvo no banco utiliza chaves
 * portuguesas para facilitar o carregamento.
 */
(function(){
  const { state, $, el } = window.app;
  const GEAR_SLOTS_TOTAL = Number(window.app.GEAR_SLOTS_TOTAL) || 10;

  // =====================
  // Navegar para Línguas
  // =====================
  function goToLanguages(){
    if (!state.race || !state.cls || !state.align){
      alert("Defina Raça, Classe e Alinhamento antes de escolher línguas.");
      return;
    }
    const langState = window.langs.computeLanguagePools({
      race: state.race,
      cls: state.cls,
      alignment: state.align
    });
    state.langs = langState;

    const step = $("#stepLang");
    if (step) step.style.display = "";
    renderLanguages(langState);
    if (step) step.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  // =========================
  // Render da tela de Línguas
  // =========================
  function renderLanguages(langState){
    const area = $("#langArea");
    if (!area) return;
    area.innerHTML = "";
    // Remove qualquer par antigo de botões dentro de #stepLang que não esteja no header novo
    const stepLang = document.getElementById('stepLang');
    if (stepLang) {
      stepLang.querySelectorAll('#btnConfirmLangs, #btn-lingua-aleatoria').forEach(node => {
        // Se o botão NÃO estiver dentro do nosso cabeçalho (.lang-head), remove
        if (!node.closest('.lang-head')) node.remove();
      });
    }

    // Badge "Concedidas"
    const grantedEl = el("div", {
      class: "pill",
      html: `Concedidas: <strong>${(langState.granted.length ? langState.granted.join(", ") : "—")}</strong>`
    });

    // Cabeçalho (Concedidas à esquerda + Ações à direita)
    const header = el("div", { class: "lang-head" });

    // Grupo de ações (Aleatório + Continuar)
    const actions = el("div", { class: "lang-actions" });
    const randBtnNode = el("button", { id: "btn-lingua-aleatoria", class: "ghost", type: "button" });
    randBtnNode.textContent = "Aleatório";
    const confirmBtnNode = el("button", { id: "btnConfirmLangs", disabled: true });
    confirmBtnNode.textContent = "Continuar";
    actions.append(randBtnNode, confirmBtnNode);

    header.append(grantedEl, actions);
    area.append(header);

    // Selects
    const makeSelects = (label, pool, count, name) => {
      if (count <= 0) return [];
      const arr = [];
      for (let i = 0; i < count; i++){
        const wrap = el("label", { class: "field" });
        wrap.append(document.createTextNode(`${label} #${i+1}:`));
        const sel = el("select", { name });
        sel.append(new Option("— escolher —", ""));
        pool.forEach(l => sel.append(new Option(l, l)));
        wrap.append(sel);
        area.append(wrap);
        arr.push(sel);
      }
      return arr;
    };

    const commonSelects = makeSelects("Língua Comum", langState.pools.common, langState.pickCommon, "langCommon");
    const rareSelects   = makeSelects("Língua Rara",  langState.pools.rare,   langState.pickRare,   "langRare");

    const optSelects = [];
    (langState.optionalSets || []).forEach((opt, idx) => {
      if (opt.type === "one-of" || opt.type === "one-of-or-none"){
        const wrap = el("label",{class:"field"});
        wrap.append(document.createTextNode(`Escolha opcional #${idx+1}:`));
        const sel = el("select",{name:`opt${idx}`});
        sel.append(new Option(opt.type === "one-of-or-none" ? "— nenhuma —" : "— escolher —",""));
        opt.pool.forEach(l => sel.append(new Option(l,l)));
        wrap.append(sel);
        area.append(wrap);
        optSelects.push(sel);
      }
    });

    // Botão Continuar
    const btn = $("#btnConfirmLangs");
    if (!btn) return;

    // Regras para não repetir línguas
    const updateCommon = () => {
      const selected = new Set(commonSelects.map(s => s.value).filter(v => v));
      commonSelects.forEach(sel => {
        Array.from(sel.options).forEach(opt => {
          if (!opt.value) return;
          opt.style.display = (selected.has(opt.value) && opt.value !== sel.value) ? 'none' : '';
        });
      });
    };
    const updateRare = () => {
      const selected = new Set(rareSelects.map(s => s.value).filter(v => v));
      rareSelects.forEach(sel => {
        Array.from(sel.options).forEach(opt => {
          if (!opt.value) return;
          opt.style.display = (selected.has(opt.value) && opt.value !== sel.value) ? 'none' : '';
        });
      });
    };

    // Habilitar/Desabilitar "Continuar Línguas"
    const validateButton = () => {
      const anySelection =
        commonSelects.some(s => s.value) ||
        rareSelects.some(s => s.value) ||
        (optSelects.length && optSelects.some(s => s.value || s.value === "")) ||
        (state.langs && state.langs.granted && state.langs.granted.length > 0);
      btn.disabled = !anySelection;
    };

    updateCommon();
    updateRare();
    validateButton();

    [...commonSelects, ...rareSelects, ...optSelects].forEach(sel => {
      sel.addEventListener('change', () => {
        updateCommon();
        updateRare();
        validateButton();
      });
    });

    btn.onclick = () => {
      // Ao Continuar as línguas, captura as seleções e trava a UI
      const commons   = commonSelects.map(s => s.value).filter(Boolean);
      const rares     = rareSelects.map(s => s.value).filter(Boolean);
      const optionals = optSelects.map(s => s.value || null);
      const final = window.langs.applyChoices(langState, { common: commons, rare: rares, optional: optionals });
      state.langsFinal = final;
      // Desabilita seletores e botões para impedir alterações pós confirmação
      commonSelects.forEach(sel => sel.disabled = true);
      rareSelects.forEach(sel => sel.disabled = true);
      optSelects.forEach(sel => sel.disabled = true);
      // Desabilita botão aleatório (se existir) e o próprio botão de Continuar
      const randBtnEl2 = document.getElementById('btn-lingua-aleatoria');
      if (randBtnEl2) randBtnEl2.disabled = true;
      btn.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btn); } catch {}
      // Os atributos vêm depois das escolhas de identidade e antes das rolagens dependentes.
      if (typeof window.app?.goToAttrs === 'function') window.app.goToAttrs();
    };

    // Botão de Língua aleatória
    const randBtnEl = document.getElementById('btn-lingua-aleatoria');
    if (randBtnEl) {
      randBtnEl.onclick = () => {
        const { choices } = window.langs.applyRandom(langState);
        commonSelects.forEach((sel, i) => sel.value = choices.common?.[i] || "");
        rareSelects.forEach((sel, i) => sel.value   = choices.rare?.[i]   || "");
        optSelects.forEach((sel, i) => sel.value    = choices.optional?.[i] || "");
        updateCommon(); updateRare(); validateButton();
      };
    }
  }

  // =========================
  // Finalização do personagem
  // =========================
  async function finalize(){
    const stats = (() => {
      const by = Object.fromEntries(
        window.app.ATTRS.map((a,i) => [a, { valor: state.attrs[i], mod: state.mods[i] }])
      );
      return {
        STR: by["Força"]?.valor ?? 10,
        DEX: by["Destreza"]?.valor ?? 10,
        CON: by["Constituição"]?.valor ?? 10,
        INT: by["Inteligência"]?.valor ?? 10,
        WIS: by["Sabedoria"]?.valor ?? 10,
        CHA: by["Carisma"]?.valor ?? 10
      };
    })();

    const name       = state.name || "Aventureiro";
    const ancestry   = state.race || "";
    const cls        = state.cls  || "";
    const align      = state.align || "";
    const deity      = state.deity || "";
    const langsFinal = state.langsFinal || (state.langs ? state.langs.granted : []);
    const languagesStr = (langsFinal || []).join(", ");
    const background = state.origem ? state.origem.titulo : "";
    const title      = "Aventureiro";

    // Classes com tabela cadastrada exportam a ficha no nível 1 e incluem
    // o resultado escolhido da rolagem inicial.
    const classLevelTalent = window.app.getClassLevelTalent?.(cls, state.classLevelTalent) || { level: 1, bonuses: [], fields: {} };
    const mageExtraSpells = cls === "Mago" ? (classLevelTalent.talents || []).filter(talent => talent.bonusName === "PickExtraSpell").map(talent => talent.bonusTo).filter(Boolean) : [];
    const mageSpellsKnown = cls === "Mago" ? [...new Set([...(state.classFeatures?.mageSpells || []), ...mageExtraSpells].map(spell => String(spell).toLowerCase() === "arcane armor" ? "Mage Armor" : spell))] : [];
    const spellsKnown = mageSpellsKnown.join(", ") || "None";
    const mageSpellBonuses = cls === "Mago" ? mageSpellsKnown.map((spell, index) => ({
      sourceType: "Class",
      sourceName: "Wizard",
      sourceCategory: "Ability",
      name: `Spell: Wizard, Tier 1, Spell ${index + 1}`,
      bonusName: spell,
      bonusTo: `Tier:1, Spell:${index + 1}`,
      gainedAtLevel: 1
    })) : [];
    const classFeatureBonuses = window.app.getClassFeatureBonuses?.(cls, state.classFeatures) || [];
    const level = classLevelTalent.level;
    const hpRoll  = Number.isFinite(state.hpBaseRoll) ? state.hpBaseRoll : 0;
    const stoutHP = 0;

    // Itens comprados na Lojinha (etapa entre Atributos e Nome). Se o
    // jogador não passou pela lojinha (ex.: fluxo antigo ou "Gerar
    // Aleatório"), essas listas ficam vazias e o ouro permanece intacto.
    const shopGear   = Array.isArray(state.shopGear) ? state.shopGear : [];
    const shopLedger = Array.isArray(state.shopLedger) ? state.shopLedger : [];
    const goldFinal   = state.gold ?? 0;
    const silverFinal = state.silver ?? 0;
    const copperFinal = state.copper ?? 0;
    const gearSlotsUsed = shopGear.reduce((sum, g) => sum + (g.slots || 0), 0);

    // A escolha antiga de maestria de Cavaleiro continua informativa.
    // As escolhas nativas do Guerreiro são exportadas como bônus abaixo.

    // Objeto para import no Foundry (estrutura em EN)
    const exportObj = {
      name,
      stats: { ...stats },
      rolledStats: { ...stats },
      ancestry,
      class: window.app.getFoundryClassName?.(cls) || cls,
      level,
      levels: [{
        level,
        talentRolledDesc: classLevelTalent.fields.talentRolledDesc || "",
        talentRolledName: classLevelTalent.fields.talentRolledName || "",
        Rolled12TalentOrTwoStatPoints: classLevelTalent.fields.Rolled12TalentOrTwoStatPoints || "",
        Rolled12ChosenTalentDesc: classLevelTalent.fields.Rolled12ChosenTalentDesc || "",
        Rolled12ChosenTalentName: classLevelTalent.fields.Rolled12ChosenTalentName || "",
        HitPointRoll: hpRoll,
        stoutHitPointRoll: stoutHP
      }],
      terraOesteClassTalents: classLevelTalent.talents || [],
      terraOesteClassOptions: state.classFeatures ? { ...state.classFeatures } : null,
      XP: 0,
      ambitionTalentLevel: {
        level,
        talentRolledDesc: "",
        talentRolledName: "",
        Rolled12TalentOrTwoStatPoints: "",
        Rolled12ChosenTalentDesc: "",
        Rolled12ChosenTalentName: "",
        HitPointRoll: 0,
        stoutHitPointRoll: 0
      },
      title,
      alignment: window.app.alignmentToEN ? window.app.alignmentToEN(align) : align,
      background,
      deity,
      maxHitPoints: state.hp ?? 1,
      armorClass: 10,
      gearSlotsTotal: GEAR_SLOTS_TOTAL,
      gearSlotsUsed,
      bonuses: [
        ...(window.app.getRaceBonuses?.(ancestry, state.raceTalent) || []),
        ...classFeatureBonuses,
        ...mageSpellBonuses,
        ...(classLevelTalent.bonuses || [])
      ],
      terraOesteChoices: [
        ...(window.app.getRaceChoiceMetadata?.(ancestry, state.raceTalent) || []),
        ...(window.app.getClassChoiceMetadata?.(cls, state.classTalent) || [])
      ],
      goldRolled: state.goldRolled ?? state.gold ?? 0,
      gold: goldFinal,
      silver: silverFinal,
      copper: copperFinal,
      gear: shopGear,
      treasures: [],
      magicItems: [],
      attacks: [],
      ledger: [
        ...((state.goldRolled ?? state.gold) != null ? [{
          goldChange: state.goldRolled ?? state.gold,
          silverChange: 0,
          copperChange: 0,
          desc: "Ouro inicial",
          notes: ""
        }] : []),
        ...shopLedger
      ],
      spellsKnown,
      languages: languagesStr,
      creationMethod: "Exported by Bot",
      coreRulesOnly: true,
      activeSources: ["SD"],
      edits: []
    };

    // Disponibiliza para o botão "Copiar .json"
    if (!window.app) window.app = {};
    window.app.__exportObj = exportObj;

    // Objeto salvo (PT-BR) para compartilhar/recuperar via link
    const renderObj = {
      nome: state.name || "Aventureiro",
      raca: state.race || "",
      talentoRacial: state.raceTalent || null,
      talentoClasse: state.classTalent || null,
      talentoClasseNivel1: Array.isArray(state.classLevelTalent) ? state.classLevelTalent.map(talent => ({ ...talent })) : state.classLevelTalent ? [{ ...state.classLevelTalent }] : null,
      classe: state.cls || "",
      opcoesClasse: state.classFeatures ? { ...state.classFeatures } : null,
      habilidadesClasse: window.app.getClassFeatureDisplay?.(state.cls, state.classFeatures) || "",
      maestria: state.maestria ? state.maestria.nome : null,
      origem: state.origem ? state.origem.titulo : null,
      origem_desc: state.origem ? state.origem.descricao : null,
      alinhamento: state.align || "",
      divindade: state.deity || "",
      linguas: langsFinal,
      atributos: Object.fromEntries(
        window.app.ATTRS.map((a, i) => [a, { valor: state.attrs[i], mod: state.mods[i] }])
      ),
      pv: state.hp ?? 1,
      pv_info: state.hpDetail || "",
      ouro: goldFinal,
      ouroRolado: state.goldRolled ?? goldFinal,
      prata: silverFinal,
      cobre: copperFinal,
      itens: shopGear,
      compras: shopLedger,
      criado_em: new Date().toISOString()
    };

    // Render do resumo final
    const out = $("#finalOut");
    if (window.app && typeof window.app.renderFinal === "function") {
      window.app.renderFinal(renderObj, out);
    } else if (out) {
      out.innerHTML = `<pre>${JSON.stringify(renderObj, null, 2)}</pre>`;
    }

    // Persistência da ficha via API própria do site (mesmo domínio,
    // sem depender de um Worker externo). Se falhar (rede fora do ar,
    // etc.), cai no fallback local em encodeObjToHash mais abaixo.
    async function saveToCloud(data){
      try {
        const response = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) return null;
        const result = await response.json();
        return result.id || null;
      } catch(e){
        return null;
      }
    }

    // Gera link (id remoto ou hash local)
    let identifier = null;
    try { identifier = await saveToCloud(renderObj); } catch { identifier = null; }

    let link;
    if (identifier){
      const base = location.origin + location.pathname;
      link = `${base}?id=${encodeURIComponent(identifier)}`;
    } else {
      const b64 = window.app.encodeObjToHash(renderObj);
      const base = location.origin + location.pathname;
      link = `${base}#${b64}`;
    }

    window.__lastShareLink = link;
    window.app.__loadedRawObj = renderObj;

    const step = $("#stepFinal");
    if (step) {
      step.style.display = "";
      step.scrollIntoView({ behavior:"smooth", block:"start" });
    }

    // Exibe a seção de nome final para que o jogador possa inserir ou
    // ajustar o nome após todas as outras etapas. Preenche com o nome
    // atual em estado para facilitar edições.
    const nameSection = document.getElementById('finalNameSection');
    const nameHint    = document.getElementById('finalNameHint');
    const nameInputEl = document.getElementById('finalNameInput');
    if (nameSection) nameSection.style.display = '';
    if (nameHint)    nameHint.style.display = '';
    if (nameInputEl) nameInputEl.value = window.app?.state?.name || '';

    const btnCopyLink = $("#btnCopyLink");
    if (btnCopyLink) btnCopyLink.onclick = async () => {
      try {
        await navigator.clipboard.writeText(window.__lastShareLink || link);
        alert("Link copiado!");
      } catch {
        prompt("Copie o link:", window.__lastShareLink || link);
      }
    };

    const btnReset = $("#btnReset");
    if (btnReset) {
      // Implementa confirmação para o botão "Recomeçar". Ao clicar
      // pela primeira vez, o texto muda para "Continuar" e aguarda
      // uma segunda confirmação. Caso o usuário clique em qualquer
      // outro lugar, o texto volta ao original. Na segunda
      // confirmação, a página é recarregada.
      let resetConfirmPending = false;
      let resetOutsideHandler;
      const originalResetText = btnReset.textContent || btnReset.innerText;
      btnReset.addEventListener('click', function(ev){
        ev.stopPropagation();
        if (!resetConfirmPending) {
          resetConfirmPending = true;
          btnReset.textContent = 'Confirmar';
          resetOutsideHandler = function(e){
            if (e.target !== btnReset) {
              resetConfirmPending = false;
              btnReset.textContent = originalResetText;
              document.removeEventListener('click', resetOutsideHandler);
            }
          };
          document.addEventListener('click', resetOutsideHandler);
          return;
        }
        // Segunda confirmação: executa reset
        resetConfirmPending = false;
        btnReset.textContent = originalResetText;
        if (resetOutsideHandler) document.removeEventListener('click', resetOutsideHandler);
        location.href = location.origin + location.pathname;
      });
    }
  }

  // ===========================================================
  // Constrói exportObj (EN) a partir de um objeto salvo (PT-BR)
  // ===========================================================
  function buildExportFromRaw(src){
    const a = src?.atributos || {};
    const stats = {
      STR: a["Força"]?.valor ?? 0,
      DEX: a["Destreza"]?.valor ?? 0,
      CON: a["Constituição"]?.valor ?? 0,
      INT: a["Inteligência"]?.valor ?? 0,
      WIS: a["Sabedoria"]?.valor ?? 0,
      CHA: a["Carisma"]?.valor ?? 0
    };
    const languagesStr = Array.isArray(src?.linguas) ? src.linguas.join(", ") : "";
    const classLevelTalent = window.app.getClassLevelTalent?.(src?.classe, src?.terraOesteClassTalents || src?.talentoClasseNivel1) || { level: 0, bonuses: [], talents: [], fields: {} };
    const mageExtraSpells = src?.classe === "Mago" ? (classLevelTalent.talents || []).filter(talent => talent.bonusName === "PickExtraSpell").map(talent => talent.bonusTo).filter(Boolean) : [];
    const mageSpellsKnown = src?.classe === "Mago" ? [...new Set([...(src?.opcoesClasse?.mageSpells || src?.terraOesteClassOptions?.mageSpells || []), ...mageExtraSpells].map(spell => String(spell).toLowerCase() === "arcane armor" ? "Mage Armor" : spell))] : [];
    const spellsKnown = mageSpellsKnown.join(", ") || "None";
    const mageSpellBonuses = src?.classe === "Mago" ? mageSpellsKnown.map((spell, index) => ({
      sourceType: "Class",
      sourceName: "Wizard",
      sourceCategory: "Ability",
      name: `Spell: Wizard, Tier 1, Spell ${index + 1}`,
      bonusName: spell,
      bonusTo: `Tier:1, Spell:${index + 1}`,
      gainedAtLevel: 1
    })) : [];
    const classFeatureBonuses = window.app.getClassFeatureBonuses?.(src?.classe, src?.opcoesClasse || src?.terraOesteClassOptions) || [];
    const level = classLevelTalent.level;
    const gear = Array.isArray(src?.itens) ? src.itens : [];
    const shopLedger = Array.isArray(src?.compras) ? src.compras : [];
    const gearSlotsUsed = gear.reduce((sum, g) => sum + (g.slots || 0), 0);

    // A Maestria em Arma (src.maestria) é apenas informativa e não gera
    // bônus/efeito no .json exportado.

    return {
      name: src?.nome || "",
      stats: { ...stats },
      rolledStats: { ...stats },
      ancestry: src?.raca || "",
      class: window.app.getFoundryClassName?.(src?.classe) || src?.classe || "",
      level,
      levels: [{
        level,
        talentRolledDesc: classLevelTalent.fields.talentRolledDesc || "",
        talentRolledName: classLevelTalent.fields.talentRolledName || "",
        Rolled12TalentOrTwoStatPoints: classLevelTalent.fields.Rolled12TalentOrTwoStatPoints || "",
        Rolled12ChosenTalentDesc: classLevelTalent.fields.Rolled12ChosenTalentDesc || "",
        Rolled12ChosenTalentName: classLevelTalent.fields.Rolled12ChosenTalentName || "",
        HitPointRoll: 0,
        stoutHitPointRoll: 0
      }],
      terraOesteClassTalents: classLevelTalent.talents || [],
      terraOesteClassOptions: src?.opcoesClasse || src?.terraOesteClassOptions || null,
      XP: 0,
      ambitionTalentLevel: {
        level,
        talentRolledDesc: "",
        talentRolledName: "",
        Rolled12TalentOrTwoStatPoints: "",
        Rolled12ChosenTalentDesc: "",
        Rolled12ChosenTalentName: "",
        HitPointRoll: 0,
        stoutHitPointRoll: 0
      },
      title: "Aventureiro",
      alignment: window.app.alignmentToEN ? window.app.alignmentToEN(src?.alinhamento || "") : (src?.alinhamento || ""),
      background: src?.origem || "",
      deity: src?.divindade || "",
      maxHitPoints: src?.pv || 0,
      armorClass: 10,
      gearSlotsTotal: GEAR_SLOTS_TOTAL,
      gearSlotsUsed,
      bonuses: [
        ...(window.app.getRaceBonuses?.(src?.raca, src?.talentoRacial) || []),
        ...classFeatureBonuses,
        ...mageSpellBonuses,
        ...(classLevelTalent.bonuses || [])
      ],
      terraOesteChoices: [
        ...(window.app.getRaceChoiceMetadata?.(src?.raca, src?.talentoRacial) || []),
        ...(window.app.getClassChoiceMetadata?.(src?.classe, src?.talentoClasse) || [])
      ],
      goldRolled: src?.ouroRolado ?? src?.ouro ?? 0,
      gold: src?.ouro || 0,
      silver: src?.prata || 0,
      copper: src?.cobre || 0,
      gear,
      treasures: [],
      magicItems: [],
      attacks: [],
      ledger: [
        {
          goldChange: src?.ouroRolado ?? src?.ouro ?? 0,
          silverChange: 0,
          copperChange: 0,
          desc: "Ouro inicial",
          notes: ""
        },
        ...shopLedger
      ],
      spellsKnown,
      languages: languagesStr,
      creationMethod: "Exported by Bot",
      coreRulesOnly: true,
      activeSources: ["SD"],
      edits: []
    };
  }

  // ====================================
  // Carrega personagem por ?id= (remoto)
  // ====================================
  (async function loadCharacterFromId(){
    try {
      const url = new URL(location.href);
      const id = url.searchParams.get("id");
      if (!id) return;

      const resp = await fetch(`/api/characters?id=${encodeURIComponent(id)}`);
      if (!resp.ok) return;

      const obj = await resp.json();
      window.app.__loadedRawObj = obj;

      // Constrói exportObj e guarda para o botão "Copiar .json"
      try {
        const expObj = buildExportFromRaw(obj);
        if (!window.app) window.app = {};
        window.app.__exportObj = expObj;
      } catch {}

      // Esconde etapas do fluxo e mostra seção de "carregado"
      ["#stepName","#stepAttrs","#stepClassTalent","#stepRace","#stepClass","#stepOrigin",
       "#stepHP","#stepGold","#stepAlign","#stepDeity","#stepLang","#stepShop","#stepNameEntry","#stepFinal"]
       .forEach(sel => { const n = document.querySelector(sel); if (n) n.style.display = "none"; });

      const loadSec = $("#loadedSection");
      if (loadSec) loadSec.style.display = "";

      const loadState = $("#loadState");
      if (loadState) loadState.textContent = "Personagem carregado";

      const summary = $("#loadedSummary");
      if (summary){
        if (window.app && typeof window.app.renderFinal === "function"){
          window.app.renderFinal(obj, summary);
        } else {
          summary.innerHTML = `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
        }
      }

      const btnCopyLoaded = $("#btnCopyLoaded");
      if (btnCopyLoaded) btnCopyLoaded.onclick = async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          alert("Link copiado!");
        } catch {
          prompt("Copie o link:", location.href);
        }
      };

      // "Copiar .json" é configurado em base.js usando window.app.__exportObj

    } catch(e){
      console.error("Erro ao carregar personagem pelo id", e);
    }
  })();

  // Exports do módulo
  window.app.goToLanguages   = goToLanguages;
  window.app.renderLanguages = renderLanguages;
  window.app.finalizeCharacter = finalize;
})();

