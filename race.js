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

  // Descrições transcritas do export Babele enviado pelo usuário.
  // Pequenino usa a entrada "Halfling" do export.
  const RACE_DESCRIPTIONS = {
    "Anão": "Brave, stalwart folk as sturdy as the stone kingdoms they carve inside mountains.",
    "Elfo": "Ethereal, graceful people who revere knowledge and beauty. Elves see far and live long.",
    "Gnomo": "Pequenos e inteligentes seres das florestas e montanhas, os Gnomos têm uma afinidade natural com a magia.",
    "Goblin": "Criaturas verdes e espertas que prosperam em locais escuros e apertados. Os goblins são tão ferozes quanto pequenos. Você conhece os idiomas Comum e Goblin.",
    "Pequenino": "Pequenos e alegres habitantes do campo, com personalidades travessas. Eles apreciam os prazeres simples da vida. Você conhece o idioma Comum.",
    "Humano": "Bold, adaptable, and diverse people who learn quickly and accomplish mighty deeds.",
    "Meio-Elfo": "Seres etéreos e graciosos que reverenciam o conhecimento e a beleza. Os elfos veem longe e vivem muito.",
    "Meio-Orc": "Towering, tusked warriors who are as daring as humans and as relentless as orcs."
  };

  function updateRaceInfo(race){
    if (!raceInfo) return;
    raceInfo.hidden = !race;
    if (raceInfoTitle && race) raceInfoTitle.textContent = `Informações: ${race}`;
    if (raceInfoDescription) {
      raceInfoDescription.textContent = race ? (RACE_DESCRIPTIONS[race] || "Descrição não disponível no export de ancestralidades.") : "A descrição da ancestralidade aparecerá aqui.";
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
