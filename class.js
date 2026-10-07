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
  const classFeatureChoices = $("#classFeatureChoices");
  const classTalentTable = $("#classTalentTable");
  const classLevelTalent = $("#classLevelTalent");
  const classLevelTalentTable = $("#classLevelTalentTable");
  const btnContinueClassTalent = $("#btnContinueClassTalent");
  const STAT_CODES = { Força: "STR", Destreza: "DEX", Constituição: "CON", Inteligência: "INT", Sabedoria: "WIS", Carisma: "CHA" };
  const FIGHTER_WEAPON_TYPES = [
    { label: "Adaga", value: "Dagger" }, { label: "Arco Curto", value: "Shortbow" },
    { label: "Arco Longo", value: "Longbow" }, { label: "Azagaia", value: "Javelin" },
    { label: "Besta", value: "Crossbow" }, { label: "Boleadeira", value: "Bolas" },
    { label: "Cajado", value: "Staff" }, { label: "Chicote", value: "Whip" },
    { label: "Cimitarra", value: "Scimitar" }, { label: "Clava", value: "Club" },
    { label: "Corrente Laminada", value: "Razor chain" }, { label: "Espada Bastarda", value: "Bastard sword" },
    { label: "Espada Curta", value: "Shortsword" }, { label: "Espada Grande", value: "Greatsword" },
    { label: "Espada Longa", value: "Longsword" }, { label: "Funda", value: "Sling" },
    { label: "Lança", value: "Spear" }, { label: "Maça", value: "Mace" },
    { label: "Maça Estrela", value: "Morning Star" }, { label: "Machadinha", value: "Handaxe" },
    { label: "Machado Grande", value: "Greataxe" }, { label: "Martelo de Guerra", value: "Warhammer" },
    { label: "Pique", value: "Pike" }, { label: "Propulsor", value: "Spear-thrower" },
    { label: "Shuriken", value: "Shuriken" }, { label: "Zarabatana", value: "Blowgun" },
    { label: "Bastão", value: "Stave" }
  ];
  const FIGHTER_CLASS_FEATURES = {
    "Guerreiro": {
      fixedDescription: "Carregador: some seu modificador de Constituição, se positivo, aos espaços de equipamento.",
      choiceDescription: "Maestria em Armas: escolha um tipo de arma para receber +1 em ataques e dano, além de metade do seu nível (arredondada para baixo). Bravura: escolha Força ou Destreza para ter vantagem em testes dessa categoria usados para superar uma força oposta."
    }
  };
  const FIGHTER_WEAPON_LABELS = Object.fromEntries(FIGHTER_WEAPON_TYPES.map(item => [item.value, item.label]));

  function makeClassFeatureBonuses(cls, choices){
    if (!["Guerreiro", "Fighter"].includes(cls) || !choices) return [];
    const weapon = FIGHTER_WEAPON_TYPES.find(item => item.value === choices.weaponMastery);
    const grit = choices.grit;
    const sourceName = "Fighter";
    const bonuses = [];
    if (weapon) bonuses.push({
      sourceType: "Class", sourceName, sourceCategory: "Ability", name: "WeaponMastery",
      bonusName: "Plus1AttackAndDamagePlusHalfLevel", bonusTo: weapon.value, gainedAtLevel: 1
    });
    if (grit === "Strength" || grit === "Dexterity") bonuses.push({
      sourceType: "Class", sourceName, sourceCategory: "Ability", name: "Grit",
      bonusName: grit, bonusTo: "AdvantageOnStatChecks", gainedAtLevel: 1
    });
    return bonuses;
  }
  window.app.getClassFeatureBonuses = makeClassFeatureBonuses;
  window.app.getClassFeatureDisplay = (cls, choices) => {
    if (!["Guerreiro", "Fighter"].includes(cls) || !choices) return "";
    const weapon = FIGHTER_WEAPON_LABELS[choices.weaponMastery];
    const grit = choices.grit === "Strength" ? "Força" : choices.grit === "Dexterity" ? "Destreza" : "";
    return [weapon ? `Maestria em Armas: ${weapon}` : "", grit ? `Bravura: ${grit}` : ""].filter(Boolean).join("; ");
  };
  window.app.randomClassFeatureChoices = cls => cls === "Guerreiro" ? {
    weaponMastery: FIGHTER_WEAPON_TYPES[randInt(0, FIGHTER_WEAPON_TYPES.length - 1)].value,
    grit: randInt(0, 1) ? "Strength" : "Dexterity"
  } : null;

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

  // Dados estruturados para o primeiro talento de classe. Novas tabelas
  // podem usar o mesmo fluxo sem misturar essa rolagem com a escolha de
  // habilidade especial configurada pelo GM.
  const CLASS_LEVEL_TALENTS = {
    "Malandro": {
      foundryName: "Ladrão",
      title: "Talentos de Ladrão",
      entries: [
        { min: 2, max: 2, id: "InitiativeAdvantage", name: "Vantagem na Iniciativa", desc: "Vantagem nas rolagens de iniciativa (role novamente se repetir)", foundryDesc: "Advantage on initiative rolls (reroll if tied)", bonusTo: "Initiative", bonusName: "AdvOnInitiative" },
        { min: 3, max: 5, id: "BackstabIncrease", name: "BackstabIncrease", desc: "Sua Apunhalada pelas Costas causa +1 dado de dano", foundryDesc: "Your Backstab deals +1 dice of damage", bonusTo: "Backstab", bonusName: "BackstabIncrease" },
        { min: 6, max: 9, id: "StatBonus", choice: "stat", desc: "+2 em Força, Destreza ou Carisma", foundryDesc: "+2 Strength, Dexterity, or Charisma", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "Plus1ToHit", name: "+1 para Ataques Corpo a Corpo ou à Distância", desc: "+1 em ataques corpo a corpo e à distância", foundryDesc: "+1 to melee and ranged attacks", bonusTo: "Melee and ranged attacks", bonusName: "Plus1ToHit" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Ladrão": {
      foundryName: "Ladrão",
      title: "Talentos de Ladrão",
      entries: null
    }
  };
  CLASS_LEVEL_TALENTS.Ladrão.entries = CLASS_LEVEL_TALENTS.Malandro.entries;
  const STAT_TALENT_OPTIONS = ["InitiativeAdvantage", "BackstabIncrease", "StatBonus", "Plus1ToHit"];
  const CLASS_TALENT_DISPLAY = {
    InitiativeAdvantage: "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    "Initiative Advantage": "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    BackstabIncrease: "Sua Apunhalada pelas Costas causa +1 dado de dano",
    BackstabPlus1DamageDice: "Sua Apunhalada pelas Costas causa +1 dado de dano",
    StatBonus: "+2 em atributo",
    Plus1ToHit: "+1 em ataques corpo a corpo e à distância",
    "Vantagem na Iniciativa": "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    "+1 para Ataques Corpo a Corpo ou à Distância": "+1 em ataques corpo a corpo e à distância",
    "Apunhalada pelas Costas: +1 Dado de Dano": "Sua Apunhalada pelas Costas causa +1 dado de dano"
  };
  const STAT_LABELS = Object.keys(STAT_CODES);

  function classLevelTalentConfig(cls){ return CLASS_LEVEL_TALENTS[cls] || null; }
  window.app.getFoundryClassName = cls => classLevelTalentConfig(cls)?.foundryName || window.CUSTOM_CLASS_DATA?.[cls]?.foundryName || cls || "";
  function resultForEntry(entry, roll){ return { roll, id: entry.id, talentRolledName: entry.name || "", talentRolledDesc: entry.foundryDesc || entry.desc, displayDesc: entry.desc, bonusName: entry.bonusName || entry.id, bonusTo: entry.bonusTo || "", needsChoice: entry.choice || "" }; }
  function makeTalentBonus(result, cls){
    if (!result || !(result.bonusName || result.id)) return [];
    const config = classLevelTalentConfig(cls);
    const effectName = result.bonusName || result.id;
    const bonusTo = result.bonusTo || result.talentRolledName || effectName;
    return [{ sourceType: "Class", sourceName: window.app.getFoundryClassName(cls) || config?.foundryName || cls, sourceCategory: "Talent", name: result.talentRolledName || effectName, bonusName: effectName, bonusTo, gainedAtLevel: 1 }];
  }
  function renderLevelTalentChoices(result, rollIndex){
    if (!classLevelTalent) return;
    const choiceArea = document.createElement("div");
    choiceArea.className = "class-level-talent-choice";
    const finish = chosen => {
      pending.classLevelTalents[rollIndex] = chosen || result;
      pending.classLevelTalentDraft = null;
      renderClassLevelTalent(pending.cls);
      updateTalentContinueButton();
    };
    const makeStatSelect = (labelText, onChange, selected = "") => {
      const label = document.createElement("label");
      label.textContent = labelText;
      const select = document.createElement("select");
      select.append(new Option("Escolha um atributo", ""));
      const availableStats = labelText.includes("+2") ? ["Força", "Destreza", "Carisma"] : STAT_LABELS;
      availableStats.forEach(stat => {
        const current = state.attrs?.[STAT_LABELS.indexOf(stat)];
        const increase = labelText.includes("+2") ? 2 : 1;
        const optionLabel = Number.isFinite(current) ? `${stat} (${current} → ${current + increase})` : stat;
        select.append(new Option(optionLabel, STAT_CODES[stat]));
      });
      select.value = selected;
      select.addEventListener("change", () => onChange(select.value));
      label.append(select);
      return label;
    };
    if (result.needsChoice === "stat") {
      const statLabel = makeStatSelect("Atributo para o bônus +2", code => {
        if (!code) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
        result.talentRolledName = `+2 de ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
        result.bonusName = "StatBonus";
        result.bonusTo = `${code}:+2`;
        result.talentRolledDesc = `+2 ${({STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"})[code]}`;
        result.displayDesc = `+2 em ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
        finish(result);
      });
      choiceArea.append(statLabel);
    } else if (result.needsChoice === "twelve") {
      const mode = document.createElement("select");
      mode.append(new Option("Escolha: talento ou +2 nos atributos", ""), new Option("Escolher um talento da tabela", "talent"), new Option("Distribuir +2 pontos entre atributos", "stats"));
      const details = document.createElement("div");
      details.className = "class-level-talent-choice-details";
      mode.addEventListener("change", () => {
        details.replaceChildren();
        pending.classLevelTalents[rollIndex] = null;
        if (mode.value === "talent") {
          const select = document.createElement("select");
          select.append(new Option("Escolha um talento", ""));
          STAT_TALENT_OPTIONS.forEach(id => {
            const entry = CLASS_LEVEL_TALENTS.Malandro.entries.find(item => item.id === id);
            select.append(new Option(entry.desc, id));
          });
          select.addEventListener("change", () => {
            const entry = CLASS_LEVEL_TALENTS.Malandro.entries.find(item => item.id === select.value);
            if (!entry) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
            const chosen = resultForEntry(entry, result.roll);
            chosen.rolled12Mode = "talent";
            if (entry.choice === "stat") {
              const statLabel = makeStatSelect("Atributo para o bônus +2", code => {
                if (!code) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
                chosen.bonusTo = `${code}:+2`;
                chosen.talentRolledDesc = `+2 ${{STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"}[code]}`;
                chosen.displayDesc = `+2 em ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
                chosen.rolled12TalentOrTwoStatPoints = "Talent";
                chosen.talentRolledName = `+2 de ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
                chosen.rolled12ChosenTalentName = chosen.talentRolledName;
                chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
                finishWith(chosen);
              });
              details.append(statLabel);
            } else {
              chosen.rolled12TalentOrTwoStatPoints = "Talent";
              chosen.rolled12ChosenTalentName = chosen.talentRolledName;
              chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
              finishWith(chosen);
            }
          });
          details.append(select);
        } else if (mode.value === "stats") {
          const selected = [];
          const updateStats = () => {
            if (selected.length === 2 && selected.every(Boolean)) {
              const names = selected.map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
              const counts = selected.reduce((acc, code) => ({ ...acc, [code]: (acc[code] || 0) + 1 }), {});
              const bonusTo = Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", ");
          finishWith({ roll: result.roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo, rolled12Mode: "twoStatPoints", displayDesc: `+2 pontos nos atributos: ${names.join(" e ")}`, rolled12TalentOrTwoStatPoints: "TwoStatPoints" });
              } else { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); }
          };
          details.append(makeStatSelect("Primeiro ponto", code => { selected[0] = code; updateStats(); }));
          details.append(makeStatSelect("Segundo ponto", code => { selected[1] = code; updateStats(); }));
        }
      });
      choiceArea.append(mode, details);
    }
    function finishWith(chosen){ finish(chosen); }
    classLevelTalent.append(choiceArea);
  }

  function renderClassLevelTalent(cls){
    if (!classLevelTalent) return;
    const config = classLevelTalentConfig(cls);
    classLevelTalent.replaceChildren();
    classLevelTalent.hidden = !config;
    if (!config) return;
    const count = Math.max(1, Number(pending.classLevelTalentRollCount) || 1);
    pending.classLevelTalents = Array.isArray(pending.classLevelTalents) ? pending.classLevelTalents : [];
    pending.classLevelTalents.forEach((result, index) => {
      if (!result) return;
      const status = document.createElement("p");
      status.className = "class-level-talent-result";
      status.textContent = `Talento ${index + 1}/${count} — Resultado ${result.roll}: ${result.displayDesc || result.talentRolledDesc || "Talento registrado"}`;
      classLevelTalent.append(status);
    });
    const nextIndex = pending.classLevelTalents.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = `Rolar talento ${Math.min(nextIndex + 1, count)}/${count} (2d6)`;
    button.disabled = nextIndex >= count || !!pending.classLevelTalentDraft;
    button.addEventListener("click", () => {
      const roll = randInt(1, 6) + randInt(1, 6);
      const entry = config.entries.find(item => roll >= item.min && roll <= item.max);
      const result = resultForEntry(entry, roll);
      pending.classLevelTalentDraft = { result, index: nextIndex };
      if (!result.needsChoice) {
        pending.classLevelTalents[nextIndex] = result;
        pending.classLevelTalentDraft = null;
      }
      renderClassLevelTalent(cls);
      updateTalentContinueButton();
      updateConfirmButton();
    });
    if (nextIndex < count && !pending.classLevelTalentDraft) classLevelTalent.append(button);
    if (pending.classLevelTalentDraft) {
      const { result, index } = pending.classLevelTalentDraft;
      const status = document.createElement("p");
      status.className = "class-level-talent-result";
      const entry = config.entries.find(item => result.roll >= item.min && result.roll <= item.max);
      status.textContent = `Talento ${index + 1}/${count} — Resultado ${result.roll}: ${entry?.desc || "Escolha uma opção"}`;
      classLevelTalent.append(status);
      renderLevelTalentChoices(result, index);
    }
  }

  function renderClassTalentTable(cls, target = classTalentTable){
    if (!target) return;
    const data = CLASS_TALENT_TABLES[cls];
    target.replaceChildren();
    target.hidden = !data;
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
    target.append(title, table);
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
    renderClassLevelTalent(cls);
    if (classInfoTitle && cls) classInfoTitle.textContent = `Informações: ${cls}`;
    if (classInfoDescription) {
      classInfoDescription.textContent = cls ? (window.CUSTOM_CLASS_DATA?.[cls]?.description || CLASS_DESCRIPTIONS[cls] || "Ainda não há uma descrição correspondente no compêndio consultado.") : "A descrição da classe aparecerá aqui.";
    }
    const talents = talentOptions(cls);
    if (classInfoAbility) classInfoAbility.textContent = talents.length
      ? (hasClassTalentChoice(cls) ? "Escolha um dos talentos da classe:" : talents.map(t => `${t.name}: ${t.description || ""}`).join("; "))
      : "Nenhuma habilidade da classe cadastrada.";
    const featureConfig = FIGHTER_CLASS_FEATURES[cls] || (cls === "Fighter" ? FIGHTER_CLASS_FEATURES.Guerreiro : null);
    if (classInfoAbility && featureConfig) classInfoAbility.textContent = `${featureConfig.fixedDescription} ${featureConfig.choiceDescription}`;
    if (classFeatureChoices) {
      classFeatureChoices.replaceChildren();
      classFeatureChoices.hidden = !featureConfig;
      if (featureConfig) {
        const makeFeatureSelect = (title, description, options, value, onChange) => {
          const wrap = document.createElement("label");
          wrap.className = "class-feature-choice";
          const heading = document.createElement("strong"); heading.textContent = title;
          const detail = document.createElement("small"); detail.textContent = description;
          const select = document.createElement("select");
          select.append(new Option("Escolha uma opção", ""));
          options.forEach(option => select.append(new Option(option.label, option.value)));
          select.value = value || "";
          select.addEventListener("change", () => { onChange(select.value); updateConfirmButton(); });
          wrap.append(heading, detail, select);
          return wrap;
        };
        pending.classFeatureChoices = pending.classFeatureChoices || {};
        classFeatureChoices.append(
          makeFeatureSelect("Maestria em Armas", "Escolha um tipo de arma.", FIGHTER_WEAPON_TYPES, pending.classFeatureChoices.weaponMastery,
            value => { pending.classFeatureChoices.weaponMastery = value; }),
          makeFeatureSelect("Bravura", "Escolha Força ou Destreza.", [
            { label: "Força", value: "Strength" }, { label: "Destreza", value: "Dexterity" }
          ], pending.classFeatureChoices.grit, value => { pending.classFeatureChoices.grit = value; })
        );
      }
    }
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

  function classLevelTalentRollCount(cls, race = state.race, raceTalent = state.raceTalent){
    if (!classLevelTalentConfig(cls)) return 0;
    return 1 + Math.max(0, Number(window.app.getRaceExtraClassTalentRolls?.(race, raceTalent)) || 0);
  }
  function updateTalentContinueButton(){
    const count = Number(pending.classLevelTalentRollCount) || 0;
    const complete = count > 0 && Array.isArray(pending.classLevelTalents) && pending.classLevelTalents.length >= count && pending.classLevelTalents.slice(0, count).every(Boolean) && !pending.classLevelTalentDraft;
    if (btnContinueClassTalent) btnContinueClassTalent.disabled = !complete;
  }
  function updateConfirmButton(){
    if (!btnConfirmClass) return;
    const missingTalentChoice = hasClassTalentChoice(pending.cls) && !talentOptions(pending.cls).some(t => t.id === pending.classTalent);
    const featureChoices = pending.classFeatureChoices || {};
    const missingCoreFeatureChoice = pending.cls === "Guerreiro" && (!featureChoices.weaponMastery || !featureChoices.grit);
    btnConfirmClass.disabled = !pending.cls || missingTalentChoice || missingCoreFeatureChoice;
  }

  function goToClassLevelTalent(){
    const cls = state.cls;
    const step = $("#stepClassTalent");
    if (!classLevelTalentConfig(cls)) {
      if (step) step.style.display = "none";
      state.classLevelTalent = null;
      if (typeof window.app.goToShop === "function") window.app.goToShop();
      return;
    }
    pending.cls = cls;
    pending.classLevelTalents = [];
    pending.classLevelTalentDraft = null;
    pending.classLevelTalentRollCount = classLevelTalentRollCount(cls);
    if (step) step.style.display = "";
    if (btnContinueClassTalent) btnContinueClassTalent.textContent = "Confirmar talento e continuar";
    renderClassTalentTable(cls, classLevelTalentTable);
    renderClassLevelTalent(cls);
    updateTalentContinueButton();
    step?.scrollIntoView({ behavior:"smooth", block:"start" });
  }
  window.app.hasClassLevelTalent = cls => !!classLevelTalentConfig(cls);
  window.app.goToClassLevelTalent = goToClassLevelTalent;
  window.app.getClassLevelTalentRollCount = classLevelTalentRollCount;

  btnContinueClassTalent?.addEventListener("click", () => {
    const count = Number(pending.classLevelTalentRollCount) || 0;
    if (!count || pending.classLevelTalents.length < count || !pending.classLevelTalents.slice(0, count).every(Boolean)) return;
    state.classLevelTalent = pending.classLevelTalents.slice(0, count).map(result => ({ ...result }));
    btnContinueClassTalent.disabled = true;
    btnContinueClassTalent.textContent = "Talento confirmado";
    try { window.app.showCheck?.(btnContinueClassTalent); } catch {}
    if (typeof window.app.goToShop === "function") window.app.goToShop();
  });

  window.app.getClassLevelTalent = (cls, result) => {
    const empty = { level: 1, bonuses: [], talents: [], fields: { talentRolledDesc: "", talentRolledName: "", Rolled12TalentOrTwoStatPoints: "", Rolled12ChosenTalentDesc: "", Rolled12ChosenTalentName: "" } };
    if (!classLevelTalentConfig(cls) || !result) return empty;
    const results = (Array.isArray(result) ? result : [result]).filter(Boolean).map(item => {
      const isInitiativeAdvantage = item.id === "InitiativeAdvantage" || item.bonusName === "InitiativeAdvantage" || item.bonusName === "AdvOnInitiative" || item.talentRolledName === "Vantagem na Iniciativa" || item.talentRolledName === "Initiative Advantage";
      return isInitiativeAdvantage ? { ...item, bonusName: "AdvOnInitiative" } : item;
    });
    if (!results.length) return empty;
    const first = results[0];
    return { level: 1, talents: results, bonuses: results.flatMap(item => makeTalentBonus(item, cls)), fields: {
      talentRolledDesc: first.talentRolledDesc || "",
      talentRolledName: first.talentRolledName || "",
      Rolled12TalentOrTwoStatPoints: first.rolled12TalentOrTwoStatPoints || "",
      Rolled12ChosenTalentDesc: first.rolled12ChosenTalentDesc || "",
      Rolled12ChosenTalentName: first.rolled12ChosenTalentName || ""
    } };
  };
  window.app.getClassLevelTalentDisplay = result => (Array.isArray(result) ? result : result ? [result] : []).map(item => item.displayDesc || CLASS_TALENT_DISPLAY[item.talentRolledName] || item.talentRolledDesc || "Talento de atributo registrado").filter(Boolean).join("; ");
  window.app.randomClassLevelTalents = (cls, race = state.race, raceTalent = state.raceTalent) => {
    const count = classLevelTalentRollCount(cls, race, raceTalent);
    return Array.from({ length: count }, () => window.app.randomClassLevelTalent?.(cls)).filter(Boolean);
  };
  window.app.randomClassLevelTalent = cls => {
    const config = classLevelTalentConfig(cls);
    if (!config) return null;
    const roll = randInt(1, 6) + randInt(1, 6);
    const entry = config.entries.find(item => roll >= item.min && roll <= item.max);
    const result = resultForEntry(entry, roll);
    if (entry.choice === "stat") {
      const code = ["STR", "DEX", "CHA"][randInt(0, 2)];
      result.bonusTo = `${code}:+2`;
      result.talentRolledName = `+2 de ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
      result.talentRolledDesc = `+2 ${{STR:"Strength",DEX:"Dexterity",CHA:"Charisma"}[code]}`;
      result.displayDesc = `+2 em ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
    } else if (entry.choice === "twelve") {
      if (randInt(0, 1) === 0) {
        const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
        const first = stats[randInt(0, stats.length - 1)];
        const second = stats[randInt(0, stats.length - 1)];
        const counts = [first, second].reduce((acc, code) => ({ ...acc, [code]: (acc[code] || 0) + 1 }), {});
        const labels = [first, second].map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
        return { roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", "), rolled12Mode: "twoStatPoints", rolled12TalentOrTwoStatPoints: "TwoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}` };
      }
      const chosenId = STAT_TALENT_OPTIONS[randInt(0, STAT_TALENT_OPTIONS.length - 1)];
      const chosen = resultForEntry(config.entries.find(item => item.id === chosenId), roll);
      chosen.rolled12TalentOrTwoStatPoints = "Talent";
      chosen.rolled12ChosenTalentName = chosen.talentRolledName;
      chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
      chosen.displayDesc = `Escolheu talento: ${CLASS_TALENT_DISPLAY[chosen.talentRolledName] || chosen.talentRolledDesc}`;
      if (chosen.needsChoice === "stat") {
        const code = ["STR", "DEX", "CHA"][randInt(0, 2)];
        chosen.bonusTo = `${code}:+2`;
        chosen.talentRolledName = `+2 de ${STAT_LABELS.find(stat => STAT_CODES[stat] === code)}`;
        chosen.rolled12ChosenTalentName = chosen.talentRolledName;
        chosen.talentRolledDesc = `+2 ${{STR:"Strength",DEX:"Dexterity",CHA:"Charisma"}[code]}`;
        chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
      }
      return chosen;
    }
    return result;
  };

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
      pending.classLevelTalents = [];
      pending.classLevelTalentDraft = null;
      pending.classFeatureChoices = window.app.randomClassFeatureChoices?.(c) || null;
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
      pending.classLevelTalents = [];
      pending.classLevelTalentDraft = null;
      pending.classFeatureChoices = null;
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
      state.classFeatures = pending.classFeatureChoices ? { ...pending.classFeatureChoices } : null;
      state.classLevelTalent = null;
      state.origem = null;
      if (classSel) classSel.disabled = true;
      if (btnRandClass) btnRandClass.disabled = true;
      btnConfirmClass.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmClass); } catch {}
      // Reseta visibilidade das seções subsequentes
      const stepMastery = $("#stepMastery");
      const stepOrigin = $("#stepOrigin");
      const stepClassTalent = $("#stepClassTalent");
      const stepHP    = $("#stepHP");
      const stepGold  = $("#stepGold");
      const stepAlign = $("#stepAlign");
      const stepFinal = $("#stepFinal");
      if (stepMastery) stepMastery.style.display = "none";
      if (stepOrigin) stepOrigin.style.display = "none";
      if (stepClassTalent) stepClassTalent.style.display = "none";
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

