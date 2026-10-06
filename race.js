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

  function updateRaceInfo(race){
    if (!raceInfo) return;
    raceInfo.hidden = !race;
    if (raceInfoTitle && race) raceInfoTitle.textContent = `Informações: ${race}`;
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
