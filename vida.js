/*
 * Módulo de Vida (Pontos de Vida)
 *
 * Lida com a rolagem de pontos de vida iniciais do personagem. O
 * cálculo considera o dado de vida da classe e o modificador de
 * Constituição. Anões possuem vantagem (duas rolagens e escolhe o
 * melhor). Após gerar os PV, exibe o resultado e habilita a etapa
 * seguinte (ouro).
 */
(function(){
  const { CLASS_DICE, ATTRS, state, roll, $ } = window.app;
  const btnRollHP = $("#btnRollHP");

  if (btnRollHP) {
    btnRollHP.addEventListener("click", () => {
      if (!state.cls || btnRollHP.disabled) return; // Se já estiver desabilitado, não faz nada.

      // Desabilita o botão imediatamente após o clique para prevenir múltiplos cliques
      btnRollHP.disabled = true;

      window.app.runRollAnimation({
        rollingId: "hpRolling",
        barId: "hpBar",
        countdownContainerId: "hpCountdownContainer",
        countdownId: "hpCountdown",
        label: "Rolando vida...",
        totalMs: 3000,
        onDone: () => {
          const sides = CLASS_DICE[state.cls];
          // Calcula modificador de Constituição (se já houver mods)
          const conMod = Array.isArray(state.mods) ? (state.mods[ATTRS.indexOf("Constituição")] || 0) : 0;
          let base;
          let detail;

          if (state.race === "Anão") {
            base = roll(1, sides).total;
            base += 2;
            detail = `(${base - 2} + 2 de bônus racial)`;
          } else {
            base = roll(1, sides).total;
            detail = `(${base})`;
          }

          const bonus = conMod;
          const hp = Math.max(1, base + bonus);

          // Formatação do bônus (ex.: +2 ou -1)
          const bonusFmt = bonus > 0 ? `+${bonus}` : `${bonus}`;
          const bonusStr = bonus === 0 ? "" : ` + MOD CON ${bonusFmt}`;

          state.hpBaseRoll = base;
          // Guarda o "detalhe puro" do dado (sem o bônus de CON), pois neste
          // momento os Atributos ainda não foram rolados/alocados. O bônus
          // de CON será somado depois, na etapa de Atributos, e o texto
          // final (state.hpDetail) será reconstruído lá.
          state.hpDiceDetail = `${state.cls} d${sides} ${detail}`;
          state.hp = hp;
          state.hpDetail = `${state.hpDiceDetail}${bonusStr}`;

          // Exibe o resultado
          const hpOut = $("#hpOut");
          if (hpOut) {
            hpOut.style.display = "";
            hpOut.textContent = `PV: ${hp}  —  ${state.hpDetail}  (provisório; bônus de CON entra após os Atributos)`;
          }

          // Feedback visual
          try { window.app && window.app.showCheck && window.app.showCheck(btnRollHP); } catch {}

          // Mostra etapa de ouro
          const stepGold = $("#stepGold");
          if (stepGold) {
            stepGold.style.display = "";
            stepGold.scrollIntoView({ behavior:"smooth", block:"start" });
          }
        }
      });
    });
  }
})();
