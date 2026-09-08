/*
 * Módulo de Raça
 *
 * Permite ao usuário escolher ou sortear uma raça para o personagem. A
 * seleção é armazenada em `app.state.race` após a confirmação. Até
 * que seja confirmada, o valor fica em `app.pending.race`. Ao
 * Continuar, a próxima etapa (classe) é revelada.
 */
(function(){
  const { RACES, pending, state, randInt, $, el } = window.app;
  const raceSel = $("#raceSelect");
  const btnRandRace = $("#btnRandRace");
  const btnConfirmRace = $("#btnConfirmRace");

  /**
   * Revela a etapa de Classe (e demais resets de UI) após a raça (e,
   * se necessário, o talento racial) estarem definidos.
   */
  function advanceToClassStep(){
    const stepClass = $("#stepClass");
    if (stepClass) {
      stepClass.style.display = "";
      stepClass.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  /**
   * Caso a raça escolhida conceda um talento com opções (ex.: Elfo,
   * Gnomo), exibe os botões de escolha dentro de #raceTalentArea e só
   * libera a etapa de Classe após a confirmação. Caso contrário,
   * resolve o talento automaticamente (fixo ou inexistente) e segue
   * direto para a Classe.
   */
  function resolveRaceTalent(race){
    const area = $("#raceTalentArea");
    if (!area) { advanceToClassStep(); return; }

    const rt = window.raceTalents;
    if (!rt || !rt.needsChoice(race)) {
      state.raceTalentKey = null;
      area.style.display = "none";
      area.innerHTML = "";
      advanceToClassStep();
      return;
    }

    // Raça com escolha: monta a UI de seleção.
    area.innerHTML = "";
    area.style.display = "";
    const options = rt.getChoiceOptions(race);

    const label = el("div", { class: "pill" }, `Talento racial (${rt.getRaceTalentSpec(race).label || "escolha"}):`);
    area.append(label);

    const wrap = el("div", { class: "row" });
    let selected = null;
    const btnConfirmTalent = el("button", { disabled: "disabled" }, "Confirmar Talento");

    const optionButtons = options.map(opt => {
      const b = el("button", { class: "ghost", type: "button" }, opt.name);
      b.title = opt.desc || "";
      b.addEventListener("click", () => {
        selected = opt.key;
        optionButtons.forEach(ob => ob.classList.remove("selected"));
        b.classList.add("selected");
        btnConfirmTalent.disabled = false;
      });
      wrap.append(b);
      return b;
    });

    wrap.append(btnConfirmTalent);
    area.append(wrap);

    btnConfirmTalent.addEventListener("click", () => {
      if (!selected) return;
      state.raceTalentKey = selected;
      optionButtons.forEach(ob => ob.disabled = true);
      btnConfirmTalent.disabled = true;
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmTalent); } catch {}
      advanceToClassStep();
    });
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
      if (btnConfirmRace) btnConfirmRace.disabled = false;
    });
  }
  // Atualiza raça pendente quando o usuário seleciona manualmente
  if (raceSel) {
    raceSel.addEventListener("change", e => {
      const val = e.target.value;
      pending.race = val || null;
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
      // Resolve o talento racial (pode exigir escolha) antes de liberar a Classe
      resolveRaceTalent(state.race);
    });
  }
})();