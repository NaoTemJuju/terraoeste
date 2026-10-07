/*
 * Base module for Shadowdark Character Generator
 *
 * This file contains the core data structures, helper functions and
 * initialization logic shared across the different step modules. It
 * exposes a single `app` namespace on the global object (window) so
 * that other modules can read and update shared state.  The goal of
 * splitting the original monolithic script into multiple files is to
 * improve organisation and readability without changing any runtime
 * behaviour.
 */

// A lógica de efeitos sonoros foi movida para audio.js. Aqui não definimos window.sfx.

(function(){
  // ====================== Dados base ======================
  /**
   * Atributos utilizados para geração de personagens. A ordem
   * corresponde aos valores retornados pelas rolagens de dados.
   * Ex.: Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma.
   */
  const ATTRS = ["Força","Destreza","Constituição","Inteligência","Sabedoria","Carisma"];

  /**
   * O sistema Shadowdark do Foundry VTT (mesmo com a interface em
   * Português) espera que o campo `alignment` do JSON importado
   * contenha uma das chaves internas em inglês ("Lawful", "Neutral",
   * "Chaotic"), pois a localização PT-BR apenas traduz esses valores
   * na exibição — não são aceitos como chave. Este site trabalha
   * internamente em Português (Ordeiro/Neutro/Caótico), então
   * convertendo apenas na hora de montar o JSON de exportação.
   */
  const ALIGNMENT_PT_TO_EN = { "Ordeiro":"Lawful", "Neutro":"Neutral", "Caótico":"Chaotic" };
  const ALIGNMENT_EN_TO_PT = { "Lawful":"Ordeiro", "Neutral":"Neutro", "Chaotic":"Caótico" };
  function alignmentToEN(pt){
    if (!pt) return pt || "";
    return ALIGNMENT_PT_TO_EN[pt] || pt;
  }
  function alignmentToPT(en){
    if (!en) return en || "";
    return ALIGNMENT_EN_TO_PT[en] || en;
  }

  /**
   * Lista de raças disponíveis. Cada raça possui habilidades
   * específicas definidas em módulos externos (por exemplo, línguas
   * concedidas em languages.js). A lógica de escolha e aleatoriedade
   * é tratada em race.js.
   */
  const RACES = [
    "Anão","Elfo","Gnomo","Goblin","Humano","Meio-Elfo","Meio-Orc","Pequenino"
  ];

  /**
   * Tabela de dados de classe. A chave do objeto é o nome da classe e
   * o valor indica o dado de vida utilizado para o cálculo dos pontos
   * de vida iniciais. A lista de classes é derivada deste objeto.
   */
  const CLASS_DICE = {
    "Assassino":6,"Bárbaro":8,"Bardo":6,"Bruxo":4,"Caçador":6,"Cavaleiro":8,
    "Druida":6,"Explorador":6,"Feiticeiro":6,"Guerreiro":8,"Mago":4,"Malandro":6,
    "Pactário":6,"Paladino":8,"Patrulheiro":8,"Sacerdote":6
  };
  const GEAR_SLOTS_TOTAL = 10;
  const CLASSES = Object.keys(CLASS_DICE);
  const ALL_CLASSES = [...CLASSES];
  const ALL_RACES = [...RACES];
  const CORE_CLASS_DICE = { ...CLASS_DICE };
  const CORE_CLASS_NAMES = [...ALL_CLASSES];
  const CORE_RACE_NAMES = [...ALL_RACES];

  // ====================== Utilitários ======================
  /** Seleciona um elemento do DOM utilizando querySelector. */
  const $ = sel => document.querySelector(sel);

  /**
   * Cria um elemento DOM parametrizado. Permite definição de
   * propriedades, atributos, eventos e filhos de forma declarativa.
   * Utilizado em vários módulos para construção dinâmica da interface.
   *
   * @param {string} tag  Nome da tag a ser criada
   * @param {Object} props Atributos e event listeners para configurar no elemento
   * @param {...(Node|string)} children Filhos a serem adicionados ao elemento
   * @returns {HTMLElement} O elemento criado
   */
  const el = (tag, props = {}, ...children) => {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.substring(2), v);
      else e.setAttribute(k, v);
    });
    children.forEach(c => e.append(c));
    return e;
  };

  /**
   * Retorna um número inteiro aleatório entre `min` e `max`, inclusive.
   * Utilizado para sorteios de atributos, raças, classes e outras
   * escolhas aleatórias.
   */
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  /**
   * Rola `n` dados de `sides` lados, acumulando o total e registrando
   * cada resultado individual no array `rolls`. Retorna um objeto com
   * propriedades `total` e `rolls`.
   */
  const roll = (n, sides) => {
    let total = 0;
    const rolls = [];
    for (let i = 0; i < n; i++) {
      const r = randInt(1, sides);
      rolls.push(r);
      total += r;
    }
    return { total, rolls };
  };

  /** Rola 3d6 e retorna apenas o valor total. */
  const roll3d6 = () => roll(3, 6).total;

  /**
   * Calcula o modificador de um valor de atributo.
   */
  const modFromScore = s => {
    if (s <= 3) return -4;
    if (s <= 5) return -3;
    if (s <= 7) return -2;
    if (s <= 9) return -1;
    if (s <= 11) return 0;
    if (s <= 13) return 1;
    if (s <= 15) return 2;
    if (s <= 17) return 3;
    return 4;
  };

  // ---------- Permalinks ----------
  function encodeObjToHash(obj){
    const uuid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    try {
      localStorage.setItem(`pc_${uuid}`, JSON.stringify(obj));
      return uuid;
    } catch(err){
      try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
      } catch(e){
        return uuid;
      }
    }
  }

  function decodeHashToObj(val){
    if (!val) return null;
    try {
      const stored = localStorage.getItem(`pc_${val}`);
      if (stored) return JSON.parse(stored);
    } catch(err){}
    try {
      return JSON.parse(decodeURIComponent(escape(atob(val))));
    } catch(e){
      return null;
    }
  }

  const prettyMod = m => (m >= 0 ? `+${m}` : `${m}`);

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[m]));
  }

  function renderFinal(result, container) {
    const attrsRows = ATTRS.map(a => {
      const o = result.atributos[a];
      return `<tr><td>${a}</td><td class="score">${o.valor}</td><td class="mod">${prettyMod(o.mod)}</td></tr>`;
    }).join("");

    const moneyBits = [];
    if (result.ouro) moneyBits.push(`${result.ouro} PO`);
    if (result.prata) moneyBits.push(`${result.prata} PP`);
    if (result.cobre || moneyBits.length === 0) moneyBits.push(`${result.cobre ?? 0} PC`);
    const moneyStr = moneyBits.join(", ");
    const raceTalentName = window.app?.getRaceTalentDisplay?.(result.raca, result.talentoRacial) || "";
    const classLevelTalentName = window.app?.getClassLevelTalentDisplay?.(result.talentoClasseNivel1) || "";

    const itens = Array.isArray(result.itens) ? result.itens : [];
    const itensHTML = itens.length
      ? `<div style="margin-top:12px"><strong>Itens comprados</strong></div>
         <ul style="margin-top:6px">
           ${itens.map(g => `<li>${escapeHTML(g.name)}${g.quantity > 1 ? ` ×${g.quantity}` : ""}</li>`).join("")}
         </ul>`
      : "";

    container.innerHTML = `
        <div class="grid cols-2">
          <div><strong>Nome</strong><br>${escapeHTML(result.nome || "—")}</div>
          <div><strong>Raça</strong><br>${result.raca || "—"}</div>
          ${raceTalentName ? `<div><strong>Talento racial</strong><br>${escapeHTML(raceTalentName)}</div>` : ""}
          <div><strong>Classe</strong><br>${result.classe || "—"}</div>
          ${classLevelTalentName ? `<div><strong>Talento de classe (nível 1)</strong><br>${escapeHTML(classLevelTalentName)}</div>` : ""}
          ${result.maestria ? `<div><strong>Maestria em Arma</strong><br>${escapeHTML(result.maestria)}</div>` : ""}
          ${result.habilidadesClasse ? `<div><strong>Habilidades de classe</strong><br>${escapeHTML(result.habilidadesClasse)}</div>` : ""}
          <div><strong>Origem</strong><br>${result.origem || "—"}</div>
          <div><strong>Alinhamento</strong><br>${result.alinhamento || "—"}</div>
          <div><strong>Divindade</strong><br>${result.divindade || "—"}</div>
          <div><strong>Línguas</strong><br>${Array.isArray(result.linguas) ? result.linguas.join(", ") : (result.linguas || "—")}</div>
          <div><strong>PV</strong><br>${result.pv ?? "—"}</div>
          <div><strong>Dinheiro</strong><br>${moneyStr}</div>
        </div>
        ${itensHTML}
        <div style="margin-top:12px"><strong>Atributos</strong></div>
        <table class="attrs" style="margin-top:6px">
          <tr><th>Atributo</th><th>Valor</th><th>Mod</th></tr>
          ${attrsRows}
        </table>
      `;
  }

  // ====================== Animação de rolagem (barra de progresso) ======================
  /**
   * Anima uma barra de progresso de forma suave usando
   * requestAnimationFrame (interpola quadro a quadro, em vez de saltar
   * de 100 em 100ms via setInterval — o que antes causava a sensação
   * de "engasgado"/baixo FPS). Garante também que a barra chegue
   * visualmente a 100% e permaneça assim por um instante antes de
   * chamar `onDone`, para nunca avançar de etapa com a barra "quase
   * cheia".
   *
   * @param {Object} opts
   * @param {string} opts.rollingId            id do container da animação (mostrado/escondido)
   * @param {string} opts.barId                id do elemento .bar
   * @param {string} opts.countdownContainerId id do container do texto + dado
   * @param {string} opts.countdownId          id do <span> do contador (Xs)
   * @param {string} [opts.label]              texto exibido (ex.: "Rolando ouro...")
   * @param {number} [opts.totalMs]            duração total da animação
   * @param {Function} [opts.onDone]           chamado quando a barra termina (já em 100%)
   */
  function runRollAnimation(opts){
    const {
      rollingId, barId, countdownContainerId, countdownId,
      label = "Rolando...", totalMs = 3000, onDone
    } = opts || {};

    const rolling = rollingId ? document.getElementById(rollingId) : null;
    const bar = barId ? document.getElementById(barId) : null;
    const countdownContainer = countdownContainerId ? document.getElementById(countdownContainerId) : null;
    const countdownEl = countdownId ? document.getElementById(countdownId) : null;

    if (__availability?.instantRolls === true) {
      if (bar) { bar.classList.remove("bar--rolling"); bar.style.width = "100%"; }
      if (rolling) rolling.style.display = "none";
      if (typeof onDone === "function") onDone();
      return;
    }

    if (rolling) rolling.style.display = "";
    if (bar) {
      bar.classList.add("bar--rolling");
      bar.style.width = "0%";
    }

    // Monta o cabeçalho da animação (ícone do dado + texto + contador),
    // preservando o <span> do contador dentro do DOM (antes ele era
    // descartado por engano e o "(5s)...(0s)" nunca aparecia de fato).
    if (countdownContainer) {
      countdownContainer.innerHTML = "";
      const diceGif = document.createElement("img");
      diceGif.src = "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f3b2.gif";
      diceGif.alt = "Rolando dado";
      diceGif.className = "roll-dice-icon";
      countdownContainer.appendChild(diceGif);

      const strong = document.createElement("strong");
      strong.textContent = label + " ";
      countdownContainer.appendChild(strong);

      if (countdownEl) countdownContainer.appendChild(countdownEl);
    }

    const start = performance.now();

    function frame(now){
      const elapsed = Math.min(totalMs, now - start);
      const pct = (elapsed / totalMs) * 100;
      if (bar) bar.style.width = pct.toFixed(2) + "%";
      if (countdownEl) {
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
        countdownEl.textContent = `(${remaining}s)`;
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(frame);
      } else {
        if (bar) bar.style.width = "100%";
        // Segura a barra cheia visível por um instante antes de avançar.
        setTimeout(() => {
          if (bar) bar.classList.remove("bar--rolling");
          if (rolling) rolling.style.display = "none";
          if (typeof onDone === "function") onDone();
        }, 220);
      }
    }

    requestAnimationFrame(frame);
  }

  // ====================== Indicador de progresso (stepper) ======================
  /**
   * Etapas do fluxo de criação, na ordem em que aparecem no HTML.
   * Usado apenas para exibir "Etapa X de N — Nome" no topo da página;
   * não interfere em nenhuma lógica de navegação existente.
   */
  const STEP_DEFS = [
    { id: "stepRace",      label: "Raça" },
    { id: "stepClass",     label: "Classe" },
    { id: "stepMastery",   label: "Maestria em Arma" },
    { id: "stepOrigin",    label: "Origem" },
    { id: "stepAlign",     label: "Alinhamento" },
    { id: "stepDeity",     label: "Divindade" },
    { id: "stepLang",      label: "Línguas" },
    { id: "stepAttrs",     label: "Atributos" },
    { id: "stepHP",        label: "Pontos de Vida" },
    { id: "stepGold",      label: "Ouro Inicial" },
    { id: "stepClassTalent", label: "Talento de Classe" },
    { id: "stepShop",      label: "Lojinha" },
    { id: "stepNameEntry", label: "Nome" },
    { id: "stepFinal",     label: "Ficha Final" }
  ];

  function effectiveSteps(){
    const cls = state.cls;
    const customMastery = window.CUSTOM_MAESTRIAS && window.CUSTOM_MAESTRIAS[cls];
    const mastery = window.MAESTRIA_POR_CLASSE && window.MAESTRIA_POR_CLASSE[cls];
    const hasMastery = (Array.isArray(customMastery) && customMastery.length > 0)
      || (Array.isArray(mastery) && mastery.length > 0);
    const hasClassTalent = window.app?.hasClassLevelTalent?.(cls);
    return STEP_DEFS.filter(step => (step.id !== "stepMastery" || hasMastery) && (step.id !== "stepClassTalent" || hasClassTalent));
  }

  function initStepper(){
    const stepperEl = document.getElementById("progressStepper");
    const fill = document.getElementById("stepperFill");
    const text = document.getElementById("stepperText");
    if (!stepperEl || !fill || !text) return;

    function refresh(){
      const loaded = document.getElementById("loadedSection");
      if (loaded && loaded.style.display !== "none") {
        stepperEl.style.display = "none";
        return;
      }
      const steps = effectiveSteps();
      let lastVisibleIdx = -1;
      steps.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.style.display !== "none") lastVisibleIdx = i;
      });
      if (lastVisibleIdx === -1) {
        stepperEl.style.display = "none";
        return;
      }
      stepperEl.style.display = "";
      const pct = Math.round(((lastVisibleIdx + 1) / steps.length) * 100);
      fill.style.width = pct + "%";
      text.textContent = `Etapa ${lastVisibleIdx + 1} de ${steps.length} — ${steps[lastVisibleIdx].label}`;
    }

    const observer = new MutationObserver(refresh);
    STEP_DEFS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["style"] });
    });
    const loaded = document.getElementById("loadedSection");
    if (loaded) observer.observe(loaded, { attributes: true, attributeFilter: ["style"] });

    refresh();
  }

  function hideCreationUI(){
    const ids = [
      "stepName","stepAttrs","stepClassTalent","stepRace","stepClass","stepOrigin","stepHP",
      "stepGold","stepAlign","stepDeity","stepLang","stepShop","stepNameEntry","stepFinal"
    ];
    ids.forEach(id => {
      const s = document.getElementById(id);
      if (s) s.style.display = "none";
    });
  }

  // ====================== Feedback visual (✔️) ======================
  /**
   * Exibe um pequeno ícone de marca de verificação ao lado de um
   * elemento de botão para indicar que a ação foi confirmada. A marca
   * desaparece automaticamente após alguns segundos. Caso o elemento
   * fornecido seja nulo, nada acontece.
   *
   * @param {HTMLElement} btn O botão próximo ao qual exibir a marca.
   */
  function showCheck(btn){
    if (!btn) return;
    // Evita inserir marcas duplicadas consecutivamente
    // Cria o span com o emoji de check em verde. A marca não é removida
    // automaticamente para que permaneça visível ao usuário.
    const mark = document.createElement('span');
    /*
     * Utiliza o caractere "✔️" (U+2714 U+FE0F) em vez de "🗸". O
     * caractere anterior não é amplamente suportado em todas as
     * plataformas móveis e podia aparecer como um quadrado em branco.
     * O símbolo "✔️" é mais comum e possui boa compatibilidade.
     */
    mark.textContent = '✔';
    mark.className = 'check-mark';
    // Aplica estilos diretamente caso a folha de estilos não esteja presente
    mark.style.marginLeft = '6px';
    mark.style.color = 'black';
    mark.style.fontSize = '1.2em';
    mark.style.display = 'inline-block';
    mark.style.verticalAlign = 'middle';
    // Insere logo após o botão
    if (btn.parentNode) {
      btn.parentNode.insertBefore(mark, btn.nextSibling);
    }
  }

  // A geração de nomes por raça foi movida para nome.js. Consulte esse módulo para obter randomNameByRace.

  // A função toggleMusic foi movida para audio.js.

  // ====================== Gerar tudo automaticamente ======================
  /**
   * Gera um personagem completo de forma aleatória. Este atalho
   * percorre todas as etapas internamente sem exibir a animação de
   * rolagem de dados ou exigir interações do usuário. Ao final,
   * apresenta a ficha pronta e o link de compartilhamento.
   */
  async function generateEverything(){
    try {
      // Rola atributos (garante pelo menos um >14)
      let scores;
      do { scores = ATTRS.map(() => roll3d6()); }
      while (!scores.some(s => s > 14));
      const mods = scores.map(modFromScore);
      state.attrs = scores;
      state.mods  = mods;
      // Bloqueia alterações posteriores
      attrsLocked = true;
      // Escolhe raça e classe aleatórias
      const race = RACES[randInt(0, RACES.length - 1)];
      state.race = race;
      state.raceTalent = window.app.randomRaceTalent?.(race) || null;
      const classKeys = CLASSES;
      const cls = classKeys[randInt(0, classKeys.length - 1)];
      state.cls = cls;
      state.classTalent = window.app.randomClassTalent?.(cls) || null;
      state.classFeatures = window.app.randomClassFeatureChoices?.(cls) || null;
      // Seleciona uma origem aleatória da classe
      const origens = window.getOriginsForClass?.(cls) || (window.ORIGENS_POR_CLASSE?.[cls] || []);
      if (origens.length > 0){
        const idx = randInt(0, origens.length - 1);
        const pick = origens[idx];
        state.origem = { titulo: pick.titulo, descricao: pick.d };
      } else {
        state.origem = null;
      }
      // Determina alinhamento (forçado ou aleatório)
      let align;
      if (cls === 'Paladino') align = 'Ordeiro';
      else if (cls === 'Druida') align = 'Neutro';
      else {
        const opts = ['Ordeiro','Neutro','Caótico'];
        align = opts[randInt(0, opts.length - 1)];
      }
      state.align = align;
      state.alignLocked = true;
      // Escolhe divindade (automática ou aleatória) via módulo deities
      if (window.deities && typeof window.deities.computeDeityOptions === 'function'){
        const { auto, options } = window.deities.computeDeityOptions({ cls, alignment: align });
        if (auto){
          state.deity = auto;
        } else if (options && options.length){
          const pick = options[randInt(0, options.length - 1)];
          state.deity = pick.name;
        } else {
          state.deity = '';
        }
        state.deityLocked = true;
      }
      // Calcula línguas
      if (window.langs && typeof window.langs.computeLanguagePools === 'function'){
        const langState = window.langs.computeLanguagePools({ race, cls, alignment: align });
        state.langs = langState;
        const { final, choices } = window.langs.applyRandom(langState);
        state.langsFinal = final;
      }
      // Rola PV
      if (cls){
        const sides = CLASS_DICE[cls];
        const conMod = Array.isArray(state.mods) ? (state.mods[ATTRS.indexOf('Constituição')] || 0) : 0;
        let base;
        if (race === 'Anão'){
          const r1 = roll(1, sides).total;
          const r2 = roll(1, sides).total;
          base = Math.max(r1, r2);
        } else {
          base = roll(1, sides).total;
        }
        const hp = Math.max(1, base + conMod);
        state.hpBaseRoll = base;
        state.hp = hp;
        state.hpDetail = `${cls} d${sides} (${base})${conMod !== 0 ? ' + MOD CON ' + conMod : ''}`;
      }
      // Rola Ouro
      {
        const g = roll(2,6);
        state.gold = g.total * 5;
        state.goldRolled = state.gold;
      }
      const initialClassTalents = window.app.randomClassLevelTalents
        ? window.app.randomClassLevelTalents(cls, race, state.raceTalent)
        : [window.app.randomClassLevelTalent?.(cls)].filter(Boolean);
      state.classLevelTalent = initialClassTalents.length ? initialClassTalents : null;
      // Define nome aleatório baseado na raça
      // randomNameByRace é definido em nome.js e anexado ao namespace app
      const nameGenFn = (window.app && typeof window.app.randomNameByRace === 'function') ? window.app.randomNameByRace : null;
      const name = nameGenFn ? nameGenFn(race) : '';
      state.name = name;
      // Após preencher tudo, finaliza e mostra ficha
      if (window.app && typeof window.app.finalizeCharacter === 'function'){
        await window.app.finalizeCharacter();
        // Ao exibir a ficha, também mostrar o campo de nome para edição
        const finalNameSec = document.getElementById('finalNameSection');
        const finalNameHint = document.getElementById('finalNameHint');
        if (finalNameSec) finalNameSec.style.display = '';
        if (finalNameHint) finalNameHint.style.display = '';
        const input = document.getElementById('finalNameInput');
        if (input) input.value = state.name || '';
      }
    } catch(err){
      console.error('Erro ao gerar personagem aleatoriamente:', err);
    }
  }

  function normalizeForView(obj){
    if (obj && obj.stats && obj.name){
      const mapAttr = {
        "Força":"STR", "Destreza":"DEX", "Constituição":"CON",
        "Inteligência":"INT", "Sabedoria":"WIS", "Carisma":"CHA"
      };
      const atributos = {};
      for (const [pt,en] of Object.entries(mapAttr)){
        const v = obj.stats?.[en] ?? 10;
        let m;
        if (v<=3) m=-4; else if (v<=5) m=-3; else if (v<=7) m=-2; else if (v<=9) m=-1;
        else if (v<=11) m=0; else if (v<=13) m=1; else if (v<=15) m=2; else if (v<=17) m=3; else m=4;
        atributos[pt] = { valor: v, mod: m };
      }
      let linguas = obj.languages;
      if (typeof linguas === "string") linguas = linguas.split(",").map(s=>s.trim()).filter(Boolean);
      if (!Array.isArray(linguas)) linguas = [];
      const classFeatureBonuses = Array.isArray(obj.bonuses) ? obj.bonuses : [];
      const fighterOptions = obj.opcoesClasse || obj.terraOesteClassOptions || {
        weaponMastery: classFeatureBonuses.find(bonus => bonus.bonusName === "Plus1AttackAndDamagePlusHalfLevel")?.bonusTo || "",
        grit: classFeatureBonuses.find(bonus => bonus.bonusTo === "AdvantageOnStatChecks" && ["Strength", "Dexterity"].includes(bonus.bonusName))?.bonusName || ""
      };
      return {
        nome: obj.name || "—",
        raca: obj.ancestry || "—",
        classe: obj.class || "—",
        opcoesClasse: fighterOptions,
        habilidadesClasse: window.app?.getClassFeatureDisplay?.(obj.class, fighterOptions) || "",
        talentoClasseNivel1: Array.isArray(obj.terraOesteClassTalents) && obj.terraOesteClassTalents.length ? obj.terraOesteClassTalents : Array.isArray(obj.levels) && obj.levels[0]?.talentRolledName ? [{
          talentRolledName: obj.levels[0].talentRolledName,
          talentRolledDesc: obj.levels[0].talentRolledDesc,
          displayDesc: window.app?.getClassLevelTalentDisplay?.({ talentRolledName: obj.levels[0].talentRolledName, talentRolledDesc: obj.levels[0].talentRolledDesc }) || obj.levels[0].Rolled12ChosenTalentDesc || obj.levels[0].talentRolledDesc
        }] : null,
        origem: obj.background || "—",
        origem_desc: "",
        alinhamento: alignmentToPT(obj.alignment) || "—",
        divindade: obj.deity || "—",
        linguas,
        atributos,
        pv: obj.maxHitPoints ?? "—",
        pv_info: "",
        ouro: obj.gold ?? 0,
        prata: obj.silver ?? 0,
        cobre: obj.copper ?? 0,
        itens: Array.isArray(obj.gear) ? obj.gear : [],
        criado_em: "" + (obj.created_at || "")
      };
    }
    return obj;
  }

  // ====================== Estado global ======================
  const state = {
    name:"",
    attrs:null,
    mods:null,
    race:null,
    raceTalent:null,
    classTalent:null,
    classLevelTalent:null,
    cls:null,
    classFeatures:null,
    origem:null,
    maestria:null,
    hp:null,
    hpDetail:null,
    gold:null,
    align:null,
    langs:null,
    deity:null,
    hpBaseRoll:null
  };

  const pending = { race:null, raceTalent:null, cls:null, classTalent:null, classFeatureChoices:null, classLevelTalents:[], classLevelTalentDraft:null, classLevelTalentRollCount:1 };
  let attrsLocked = false;
  let __loadedRawObj = null;

  // ====================== Inicialização da UI ======================
  function setupSelectOptions(){
    const raceSel = $("#raceSelect");
    const classSel = $("#classSelect");
    if (!raceSel || !classSel) return;
    const racePlaceholder = el("option",{value:"", html:"Selecionar...", selected:true});
    const classPlaceholder = el("option",{value:"", html:"Selecionar...", selected:true});
    raceSel.append(racePlaceholder);
    classSel.append(classPlaceholder);
    RACES.forEach(r => raceSel.append(el("option",{value:r, html:r})));
    CLASSES.forEach(c => classSel.append(el("option",{value:c, html:c})));
  }

  function setupNameInput(){
    const nomeInput = $("#nome");
    const btnRollAttrs = $("#btnRollAttrs");
    if (!nomeInput || !btnRollAttrs) return;
    nomeInput.addEventListener("input", () => {
      // Atualiza o estado do nome à medida que o usuário digita, mas não
      // desabilita mais o botão de rolar atributos. O nome definitivo
      // poderá ser alterado na etapa final.
      state.name = nomeInput.value.trim();
    });
  }

  /**
   * Carrega um personagem a partir do hash da URL (permalink).
   */
  function tryLoadFromHash(){
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    if (!hash) return;

    const obj = decodeHashToObj(hash);
    if (!obj) return;

    __loadedRawObj = obj;

    // Monta exportObj (Foundry) uma única vez
    try {
      const a = obj?.atributos || {};
      const stats = {
        STR: a["Força"]?.valor ?? 0,
        DEX: a["Destreza"]?.valor ?? 0,
        CON: a["Constituição"]?.valor ?? 0,
        INT: a["Inteligência"]?.valor ?? 0,
        WIS: a["Sabedoria"]?.valor ?? 0,
        CHA: a["Carisma"]?.valor ?? 0
      };
      const languagesStr = Array.isArray(obj?.linguas) ? obj.linguas.join(", ") : "";
      const classLevelTalent = window.app.getClassLevelTalent?.(obj?.classe, obj?.terraOesteClassTalents || obj?.talentoClasseNivel1) || { level: 0, bonuses: [], fields: {} };
      const level = classLevelTalent.level;
      const gear = Array.isArray(obj?.itens) ? obj.itens : [];
      const shopLedger = Array.isArray(obj?.compras) ? obj.compras : [];
      const gearSlotsUsed = gear.reduce((sum, g) => sum + (g.slots || 0), 0);

      const exportObj = {
        name: obj?.nome || "",
        stats: { ...stats },
        rolledStats: { ...stats },
        ancestry: obj?.raca || "",
        class: window.app.getFoundryClassName?.(obj?.classe) || obj?.classe || "",
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
        alignment: alignmentToEN(obj?.alinhamento || ""),
        background: obj?.origem || "",
        deity: obj?.divindade || "",
        maxHitPoints: obj?.pv || 0,
        armorClass: 10,
        gearSlotsTotal: GEAR_SLOTS_TOTAL,
        gearSlotsUsed,
        bonuses: [
          ...(window.app.getRaceBonuses?.(obj?.raca, obj?.talentoRacial) || []),
          ...(window.app.getClassFeatureBonuses?.(obj?.classe, obj?.opcoesClasse || obj?.terraOesteClassOptions) || []),
          ...(classLevelTalent.bonuses || [])
        ],
        terraOesteChoices: [
          ...(window.app.getRaceChoiceMetadata?.(obj?.raca, obj?.talentoRacial) || []),
          ...(window.app.getClassChoiceMetadata?.(obj?.classe, obj?.talentoClasse) || [])
        ],
        goldRolled: obj?.ouroRolado ?? obj?.ouro ?? 0,
        gold: obj?.ouro || 0,
        silver: obj?.prata || 0,
        copper: obj?.cobre || 0,
        gear,
        treasures: [],
        magicItems: [],
        attacks: [],
        ledger: [
          {
            goldChange: obj?.ouroRolado ?? obj?.ouro ?? 0,
            silverChange: 0,
            copperChange: 0,
            desc: "Ouro inicial",
            notes: ""
          },
          ...shopLedger
        ],
        spellsKnown: "None",
        languages: languagesStr,
        creationMethod: "Exported by Bot",
        coreRulesOnly: true,
        activeSources: ["SD"],
        edits: []
      };

      if (!window.app) window.app = {};
      window.app.__exportObj = exportObj;
    } catch(e){
      if (window.app) window.app.__exportObj = undefined;
    }

    // UI de carregado
    const loadStateEl = $("#loadState");
    if (loadStateEl) loadStateEl.textContent = "Personagem carregado";
    const loadedSection = $("#loadedSection");
    if (loadedSection) loadedSection.style.display = "";

    const viewObj = normalizeForView(obj);
    const summaryEl = $("#loadedSummary");
    if (viewObj && summaryEl){
      renderFinal(viewObj, summaryEl);
      hideCreationUI();
    } else if (summaryEl) {
      summaryEl.innerHTML = "<em class='muted'>Não foi possível ler os dados do personagem.</em>";
    }
  }

  /**
   * Botões da seção "Resultado carregado".
   */
  function setupLoadedButtons(){
    const btnNewFromLoaded = $("#btnNewFromLoaded");
    if (btnNewFromLoaded) btnNewFromLoaded.addEventListener("click", () => {
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete("id");
      cleanUrl.hash = "";
      location.assign(cleanUrl.toString());
    });

    const btnCopyLoaded = $("#btnCopyLoaded");
    if (btnCopyLoaded) btnCopyLoaded.addEventListener("click", () => {
      navigator.clipboard.writeText(location.href).then(() => alert("Link copiado!"));
    });

    const btnCopyLoadedJSON = $("#btnCopyLoadedJSON");
    if (btnCopyLoadedJSON) btnCopyLoadedJSON.addEventListener("click", () => {
      const raw = window.app?.__loadedRawObj;
      if (raw && window.app.hasRaceTalentChoice?.(raw.raca) &&
          !window.app.isRaceTalentValid?.(raw.raca, raw.talentoRacial)) {
        alert("Esta ficha antiga não registra qual talento racial foi escolhido. Crie um novo personagem para exportar o JSON corretamente.");
        return;
      }
      const exportObj = window.app?.__exportObj;
      if (!exportObj){ alert("Nenhum JSON carregado."); return; }
      const pretty = JSON.stringify(exportObj, null, 2);
      navigator.clipboard.writeText(pretty).then(() => {
        alert(".json copiado!");
      }).catch(() => {
        prompt("Copie o JSON:", pretty);
      });
    });
  }

  
  // ====================== Classes Personalizadas (via KV) ======================
  async function loadCustomClasses(){
    try {
      const resp = await fetch("/api/classes", { headers: { "cache-control": "no-store" } });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || !Array.isArray(data.classes)) return;
      const extras = data.classes;
      window.LEGACY_CUSTOM_CLASSES = extras;
      const customSpec = {};
      const customOrigens = {};
      extras.forEach(cls => {
        if (!cls || !cls.name) return;
        const name = String(cls.name);
        const hp = parseInt(cls.hp, 10);
        if (!isNaN(hp) && hp > 0) {
          CLASS_DICE[name] = hp;
          if (!ALL_CLASSES.includes(name)) ALL_CLASSES.push(name);
        }
        if (Array.isArray(cls.origins)) {
          const arr = cls.origins.slice(0,6).map(o => {
            if (!o) return null;
            if (typeof o === "string") return { titulo: o, d: "" };
            const t = (o.titulo || o.title || "").toString();
            const d = (o.d || o.desc || o.descricao || "").toString();
            if (!t) return null;
            return { titulo: t, d };
          }).filter(Boolean);
          if (arr.length) customOrigens[name] = arr;
        }
        if (cls.languages && typeof cls.languages === "object"){
          const spec = {};
          if (Array.isArray(cls.languages.grant)) spec.grant = cls.languages.grant.slice();
          if (cls.languages.bonus && typeof cls.languages.bonus === "object"){
            const bc = parseInt(cls.languages.bonus.common||0,10) || 0;
            const br = parseInt(cls.languages.bonus.rare||0,10) || 0;
            if (bc>0 || br>0) spec.bonus = { common: bc, rare: br };
          }
          if (Array.isArray(cls.languages.pickOne) && cls.languages.pickOne.length) spec.pickOne = cls.languages.pickOne.slice();
          if (Array.isArray(cls.languages.pickOneOrNone) && cls.languages.pickOneOrNone.length) spec.pickOneOrNone = cls.languages.pickOneOrNone.slice();
          if (Object.keys(spec).length) customSpec[name] = spec;
        }
      });
      window.CUSTOM_CLASS_SPEC = customSpec;
      window.CUSTOM_ORIGENS = customOrigens;
    } catch {}
  }

  async function loadContentCatalog(){
    try {
      const resp = await fetch("/api/content", { headers: { "cache-control": "no-store" } });
      if (!resp.ok) return;
      const data = await resp.json();
      const content = { races: Array.isArray(data.races) ? data.races : [], classes: Array.isArray(data.classes) ? data.classes : [] };
      Object.keys(CLASS_DICE).forEach(name => { if (!Object.prototype.hasOwnProperty.call(CORE_CLASS_DICE, name)) delete CLASS_DICE[name]; });
      Object.assign(CLASS_DICE, CORE_CLASS_DICE);
      ALL_RACES.splice(0, ALL_RACES.length, ...CORE_RACE_NAMES);
      ALL_CLASSES.splice(0, ALL_CLASSES.length, ...CORE_CLASS_NAMES);
      (window.LEGACY_CUSTOM_CLASSES || []).forEach(item => {
        const hp = parseInt(item?.hp, 10);
        if (item?.name && hp > 0) CLASS_DICE[item.name] = hp;
        if (item?.name && !ALL_CLASSES.includes(item.name)) ALL_CLASSES.push(item.name);
      });
      window.CUSTOM_ORIGENS = {};
      (window.LEGACY_CUSTOM_CLASSES || []).forEach(item => { if (item?.name && Array.isArray(item.origins)) window.CUSTOM_ORIGENS[item.name] = item.origins; });
      content.races.forEach(item => { if (item?.name && !ALL_RACES.includes(item.name)) ALL_RACES.push(item.name); });
      content.classes.forEach(item => {
        if (!item?.name) return;
        const hp = parseInt(item.hp, 10);
        if (hp > 0) CLASS_DICE[item.name] = hp;
        if (!ALL_CLASSES.includes(item.name)) ALL_CLASSES.push(item.name);
        if (Array.isArray(item.origins) && item.origins.length) {
          window.CUSTOM_ORIGENS = window.CUSTOM_ORIGENS || {};
          window.CUSTOM_ORIGENS[item.name] = item.origins;
        }
      });
      window.langs?.applyContentLanguages?.(content);
      window.app?.applyContentCatalog?.(content);
      window.CUSTOM_CLASS_DATA = Object.fromEntries(content.classes.map(item => [item.name, item]));
      window.CONTENT_CATALOG = content;
    } catch {}
  }

  // ====================== Disponibilidade (GM) via Cloudflare KV ======================
  let __availability = { classes:{}, races:{}, instantRolls:false };

  function availabilityDefault(){
    const def = { classes:{}, races:{}, instantRolls:false };
    (ALL_CLASSES||CLASSES).forEach(c => def.classes[c] = true);
    (ALL_RACES||RACES).forEach(r => def.races[r] = true);
    return def;
  }

  function applyAvailability(av){
    const enabledClasses = (ALL_CLASSES||CLASSES).filter(c => av.classes[c] !== false);
    const enabledRaces   = (ALL_RACES||RACES).filter(r => av.races[r]   !== false);
    CLASSES.length = 0; enabledClasses.forEach(c => CLASSES.push(c));
    RACES.length   = 0; enabledRaces.forEach(r => RACES.push(r));
  }

  async function loadAvailability(){
    __availability = availabilityDefault();
    try {
      const resp = await fetch("/api/availability", { headers: { "cache-control": "no-store" } });
      if (resp.ok){
        const data = await resp.json();
        if (data && typeof data === "object") __availability = Object.assign(availabilityDefault(), data);
      }
    } catch {}
    applyAvailability(__availability);
  }
  function getAvailability(){ return JSON.parse(JSON.stringify(__availability)); }

// ====================== Bootstrap ======================
	document.addEventListener('DOMContentLoaded', async () => {
  await loadCustomClasses();
  await loadContentCatalog();
  await loadAvailability();
  try {
    const headerActions = document.querySelector('.header-actions');
    // Na própria aba GM não faz sentido mostrar o botão "GM" de novo.
    if (headerActions && !document.body.classList.contains('gm-page')){
      const btnGM = document.createElement('button');
      btnGM.id = 'btnGM'; btnGM.className='ghost'; btnGM.textContent='GM';
      // Verifica o código ANTES de navegar: se estiver errado, o
      // usuário nunca chega a sair desta página nem a carregar gm.html.
      btnGM.addEventListener('click', async ()=>{
        const code = prompt('Código do GM:');
        if (code === null) return;
        btnGM.disabled = true;
        try {
          const r = await fetch('/api/gm-auth', {
            method: 'POST',
            headers: { 'X-GM-Code': code }
          });
          if (r.ok){
            sessionStorage.setItem('gmCode', code);
            window.location.href = 'gm.html';
          } else {
            alert('Código incorreto.');
          }
        } catch {
          alert('Não foi possível verificar o código agora. Tente novamente.');
        } finally {
          btnGM.disabled = false;
        }
      });
      headerActions.appendChild(btnGM);
    }
  } catch {}

	  setupSelectOptions();
	  setupNameInput();
	  tryLoadFromHash();
	  setupLoadedButtons();
	  initStepper();

	// === Botão de Geração Aleatória ===
	const btnGenAll = document.getElementById('btnGenerateAll');
	if (btnGenAll) {
	  btnGenAll.addEventListener('click', async () => {
		// Limpa qualquer "check" anterior antes de gerar o novo personagem
		const existingCheck = btnGenAll.parentNode.querySelector('.check-mark');
		if (existingCheck) {
		  existingCheck.remove(); // Remove o "check" anterior
		}

		try {
		  // Gera o personagem
		  await (window.app && window.app.generateEverything && window.app.generateEverything());

		  // Exibe um novo "check"
		  window.app && window.app.showCheck && window.app.showCheck(btnGenAll);
		} catch (err) {
		  console.error('Erro na geração:', err);
		}
	  });
    }

	});

  // ====================== Exposição pública ======================
  window.app = {
    ATTRS,
    RACES,
    CLASS_DICE,
    GEAR_SLOTS_TOTAL,
    CLASSES,
    $, el,
    randInt, roll, roll3d6, modFromScore,
    encodeObjToHash, decodeHashToObj,
    prettyMod,
    escapeHTML,
    renderFinal,
    hideCreationUI,
    normalizeForView,
    alignmentToEN,
    alignmentToPT,
    // Novas utilidades
    showCheck,
    runRollAnimation,
    // randomNameByRace e toggleMusic agora são definidos em módulos separados.
    generateEverything,
    // GM
    getAvailability,
    applyAvailability,
    ALL_CLASSES,
    ALL_RACES,
    loadCustomClasses,
    loadContentCatalog,
    // estado e utilitários
    state,
    pending,
    get attrsLocked(){ return attrsLocked; },
    set attrsLocked(val){ attrsLocked = val; },
    get __loadedRawObj(){ return __loadedRawObj; },
    set __loadedRawObj(val){ __loadedRawObj = val; }
  };
})();

