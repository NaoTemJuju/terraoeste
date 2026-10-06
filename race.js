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

  // Descrições obtidas do Babele pt-BR instalado no Foundry.
  // Gnomo e Meio-Elfo não existem no compêndio Babele ativo e mantêm
  // as descrições do export fornecido pelo usuário.
  // Pequenino usa o nome adotado no site para a ancestralidade Halfling.
  const RACE_DESCRIPTIONS = {
    "Anão": "Povo corajoso e robusto, tão resiliente quanto os reinos de pedra que eles esculpem dentro das montanhas. Você conhece os idiomas Comum e Anão.",
    "Elfo": "Povo etéreo e gracioso, que venera o conhecimento e a beleza. Os elfos enxergam longe e vivem bastante. Você conhece os idiomas Comum, Élfico e Silvestre.",
    "Gnomo": "Pequenos e inteligentes seres das florestas e montanhas, os Gnomos têm uma afinidade natural com a magia.",
    "Goblin": "Criaturas verdes e espertas que prosperam em locais escuros e apertados. Os goblins são tão ferozes quanto pequenos. Você conhece os idiomas Comum e Goblin.",
    "Pequenino": "Pequenos e alegres habitantes do campo, com personalidades travessas. Eles apreciam os prazeres simples da vida. Você conhece o idioma Comum.",
    "Humano": "Povo corajoso, adaptável e diverso que aprende de forma rápida e realiza feitos poderosos. Você conhece o idioma Comum e um idioma comum adicional.",
    "Meio-Elfo": "Seres etéreos e graciosos que reverenciam o conhecimento e a beleza. Os elfos veem longe e vivem muito.",
    "Meio-Orc": "Guerreiros imponentes e com presas, que são tão implacáveis quanto os orcs e tão ousados quanto os humanos. Você conhece os idiomas Comum e Orc."
  };

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
      pending.race = r;
      updateRaceInfo(r);
      if (btnConfirmRace) btnConfirmRace.disabled = false;
    });
  }
  // Atualiza raça pendente quando o usuário seleciona manualmente
  if (raceSel) {
    raceSel.addEventListener("change", e => {
      const val = e.target.value;
      pending.race = val || null;
      updateRaceInfo(pending.race);
      if (btnConfirmRace) btnConfirmRace.disabled = !pending.race;
    });
  }
  // Confirma a raça e avança para a etapa de classe
  if (btnConfirmRace) {
    btnConfirmRace.addEventListener("click", () => {
      if (!pending.race) return;
      state.race = pending.race;
      if (raceSel) raceSel.disabled = true;
      if (btnRandRace) btnRandRace.disabled = true;
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

