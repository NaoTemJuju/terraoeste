/*
 * Módulo de Raça
 *
 * Permite ao usuário escolher ou sortear uma raça para o personagem. A
 * seleção é armazenada em `app.state.race` após a confirmação. Até
 * que seja confirmada, o valor fica em `app.pending.race`. Ao
 * Continuar, a próxima etapa (classe) é revelada.
 */
(function(){
  const { RACES, pending, state, randInt, $ } = window.app;
  const raceSel = $("#raceSelect");
  const btnRandRace = $("#btnRandRace");
  const btnConfirmRace = $("#btnConfirmRace");
  const raceInfo = $("#raceInfo");
  const raceInfoTitle = $("#raceInfoTitle");
  const raceInfoDescription = $("#raceInfoDescription");
  const raceInfoLanguages = $("#raceInfoLanguages");
  const raceInfoAbility = $("#raceInfoAbility");
  const raceTalentChoices = $("#raceTalentChoices");

  // Descrições obtidas do Babele pt-BR instalado no Foundry.
  // Gnomo e Meio-Elfo não existem no compêndio Babele ativo e mantêm
  // as descrições do export fornecido pelo usuário.
  // Pequenino usa o nome adotado no site para a ancestralidade Halfling.
  const RACE_DESCRIPTIONS = {
    "Anão": "Povo corajoso e robusto, tão resiliente quanto os reinos de pedra que eles esculpem dentro das montanhas.",
    "Elfo": "Povo etéreo e gracioso, que venera o conhecimento e a beleza. Os elfos enxergam longe e vivem bastante.",
    "Gnomo": "Pequenos e inteligentes seres das florestas e montanhas, os Gnomos têm uma afinidade natural com a magia.",
    "Goblin": "Criaturas verdes e espertas que prosperam em locais escuros e apertados. Os goblins são tão ferozes quanto pequenos.",
    "Pequenino": "Pequenos e alegres habitantes do campo, com personalidades travessas. Eles apreciam os prazeres simples da vida.",
    "Humano": "Povo corajoso, adaptável e diverso que aprende de forma rápida e realiza feitos poderosos.",
    "Meio-Elfo": "Seres etéreos e graciosos que reverenciam o conhecimento e a beleza. Os elfos veem longe e vivem muito.",
    "Meio-Orc": "Guerreiros imponentes e com presas, que são tão implacáveis quanto os orcs e tão ousados quanto os humanos."
  };

  // As opções correspondem ao compêndio de ancestralidades do Foundry.
  // Os bônus FarSight e Knack identificam a opção escolhida para o importador.
  // Os talentos únicos são carregados diretamente pelo compêndio da raça.
  const RACE_TALENTS = {
    "Anão": [
      { id: "stout", name: "Robusto", description: "Começa com +2 PV. Role os pontos de vida a cada nível com Vantagem." }
    ],
    "Elfo": [
      { id: "farsight-ranged", name: "Visão Aguçada (Armas à Distância)", description: "+1 em jogadas de ataque com armas à distância.", sourceName: "Elf", bonus: { name: "FarSight", bonusName: "AttackBonus", bonusTo: "RangedWeapons", bonusAmount: 1 } },
      { id: "farsight-spell", name: "Visão Aguçada (Conjuração)", description: "+1 em testes de conjuração.", sourceName: "Elf", bonus: { name: "FarSight", bonusName: "Plus1ToCastingSpells", bonusAmount: 1 } }
    ],
    "Gnomo": [
      { id: "knack-spellcasting", name: "Aptidão (Conjuração)", description: "+1 em testes de conjuração.", sourceName: "Gnome", bonus: { name: "Knack", bonusName: "Plus1ToCastingSpells", bonusAmount: 1 } },
      { id: "knack-luck", name: "Aptidão (Sorte)", description: "Começa cada sessão com uma ficha de sorte.", sourceName: "Gnome", bonus: { name: "Knack", bonusName: "LuckTokenAtStartOfSession" } }
    ],
    "Goblin": [
      { id: "keen-senses", name: "Sentidos Apurados", description: "Você não pode ser surpreendido." }
    ],
    "Pequenino": [
      { id: "stealthy", name: "Furtivo", description: "Uma vez por dia, você pode ficar invisível por 3 rodadas." }
    ],
    "Humano": [
      { id: "ambitious", name: "Ambicioso", description: "Ganha uma rolagem de talento adicional no nível 1." }
    ],
    "Meio-Orc": [
      { id: "mighty", name: "Poderoso", description: "Recebe +1 em jogadas de ataque e dano com armas corpo a corpo." }
    ]
  };

  function talentOptions(race){ return RACE_TALENTS[race] || []; }
  function hasRaceTalentChoice(race){ return talentOptions(race).length > 1; }
  function isRaceTalentValid(race, talentId){
    return talentOptions(race).some(talent => talent.id === talentId);
  }
  function randomRaceTalent(race){
    const options = talentOptions(race);
    return options.length ? options[randInt(0, options.length - 1)].id : null;
  }
  function getRaceTalentDisplay(race, talentId){
    const options = talentOptions(race);
    const talent = options.find(item => item.id === talentId) || (options.length === 1 ? options[0] : null);
    return talent ? talent.name : "";
  }
  function getRaceBonuses(race, talentId){
    const talent = talentOptions(race).find(item => item.id === talentId);
    if (!talent || !talent.bonus) return [];
    return [{
      sourceType: "Ancestry",
      sourceName: talent.sourceName,
      sourceCategory: "Ability",
      ...talent.bonus,
      gainedAtLevel: 1
    }];
  }

  window.app.hasRaceTalentChoice = hasRaceTalentChoice;
  window.app.isRaceTalentValid = isRaceTalentValid;
  window.app.randomRaceTalent = randomRaceTalent;
  window.app.getRaceTalentDisplay = getRaceTalentDisplay;
  window.app.getRaceBonuses = getRaceBonuses;

  function updateConfirmButton(){
    if (btnConfirmRace) btnConfirmRace.disabled = !pending.race ||
      (hasRaceTalentChoice(pending.race) && !isRaceTalentValid(pending.race, pending.raceTalent));
  }

  function updateRaceInfo(race){
    if (!raceInfo) return;
    raceInfo.hidden = !race;
    if (raceInfoTitle && race) raceInfoTitle.textContent = `Informações: ${race}`;
    if (raceInfoDescription) {
      raceInfoDescription.textContent = race ? (RACE_DESCRIPTIONS[race] || "Descrição não disponível no export de ancestralidades.") : "A descrição da ancestralidade aparecerá aqui.";
    }
    if (raceInfoLanguages) {
      const languageInfo = race && window.langs && window.langs.getRaceBaseLanguages(race);
      const nativeLanguages = languageInfo && languageInfo.granted.length
        ? languageInfo.granted.join(", ")
        : "Nenhum idioma nativo definido.";
      const extraCommon = languageInfo && languageInfo.bonus && languageInfo.bonus.common;
      raceInfoLanguages.textContent = extraCommon
        ? `${nativeLanguages} (+${extraCommon} idioma${extraCommon === 1 ? "" : "s"} comum à escolha)`
        : nativeLanguages;
    }
    const options = talentOptions(race);
    if (raceInfoAbility) {
      raceInfoAbility.textContent = options.length > 1
        ? "Escolha um dos talentos raciais:"
        : options.length === 1
          ? `${options[0].name}: ${options[0].description}`
          : "O registro do Foundry informa 2 escolhas de talento para Meio-Elfo, mas não lista as opções disponíveis.";
    }
    if (raceTalentChoices) {
      raceTalentChoices.replaceChildren();
      raceTalentChoices.hidden = options.length <= 1;
      if (options.length > 1) options.forEach(talent => {
        const label = document.createElement("label");
        label.className = "race-talent-choice";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "raceTalent";
        input.value = talent.id;
        input.checked = pending.raceTalent === talent.id;
        const detail = document.createElement("span");
        const name = document.createElement("b");
        name.textContent = talent.name;
        const description = document.createElement("small");
        description.textContent = talent.description;
        detail.append(name, description);
        label.append(input, detail);
        input.addEventListener("change", () => {
          pending.raceTalent = talent.id;
          updateConfirmButton();
        });
        raceTalentChoices.append(label);
      });
    }
  }

  function selectRace(race){
    pending.race = race || null;
    const options = talentOptions(pending.race);
    pending.raceTalent = options.length === 1 ? options[0].id : null;
    updateRaceInfo(pending.race);
    updateConfirmButton();
  }

  // Sorteia uma raça aleatória
  if (btnRandRace) {
    btnRandRace.addEventListener("click", () => {
      const r = RACES[randInt(0, RACES.length - 1)];
      if (raceSel) {
        raceSel.value = r;
        // Desabilita o placeholder para evitar seleção nula
        if (raceSel.options.length > 0) raceSel.options[0].disabled = true;
      }
      selectRace(r);
    });
  }
  // Atualiza raça pendente quando o usuário seleciona manualmente
  if (raceSel) {
    raceSel.addEventListener("change", e => {
      const val = e.target.value;
      selectRace(val);
    });
  }
  // Confirma a raça e avança para a etapa de classe
  if (btnConfirmRace) {
    btnConfirmRace.addEventListener("click", () => {
      if (!pending.race || (hasRaceTalentChoice(pending.race) && !isRaceTalentValid(pending.race, pending.raceTalent))) return;
      state.race = pending.race;
      state.raceTalent = pending.raceTalent;
      if (raceSel) raceSel.disabled = true;
      if (btnRandRace) btnRandRace.disabled = true;
      if (raceTalentChoices) raceTalentChoices.querySelectorAll("input").forEach(input => { input.disabled = true; });
      btnConfirmRace.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmRace); } catch {}
      const stepClass = $("#stepClass");
      if (stepClass) {
        stepClass.style.display = "";
        stepClass.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    });
  }
})();
