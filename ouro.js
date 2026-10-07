/*
 * Módulo de Ouro
 *
 * Responsável por gerar a quantidade inicial de ouro do personagem.
 * A rolagem utiliza 2d6 multiplicado por 5. Após determinar o
 * resultado, avança para a etapa da loja.
 */
(function(){
  const { state, roll, $ } = window.app;
  const btnRollGold = $("#btnRollGold");

  if (btnRollGold) {
    btnRollGold.addEventListener("click", () => {
      if (btnRollGold.disabled) return; // Impede múltiplos cliques enquanto o botão estiver desabilitado

      // Desabilita o botão imediatamente após o clique para prevenir múltiplos cliques
      btnRollGold.disabled = true;

      window.app.runRollAnimation({
        rollingId: "goldRolling",
        barId: "goldBar",
        countdownContainerId: "goldCountdownContainer",
        countdownId: "goldCountdown",
        label: "Rolando ouro...",
        totalMs: 3000,
        onDone: () => {
          // Rolagem do ouro
          const r = roll(2, 6);
          const gold = r.total * 5;
          state.gold = gold;
          state.goldRolled = gold;

          // Exibe o ouro
          const goldOut = $("#goldOut");
          if (goldOut) {
            goldOut.style.display = "";
            goldOut.textContent = `Ouro inicial: ${gold} PO (2d6=${r.rolls.join("+")} ⇒ ${r.total} × 5)`;
          }

          // Feedback visual
          try { window.app && window.app.showCheck && window.app.showCheck(btnRollGold); } catch {}

          // O ouro vem depois dos atributos, talento e PV.
          if (window.app && typeof window.app.goToShop === 'function') {
            try { window.app.goToShop(); } catch {}
          } else if (window.app && typeof window.app.goToName === 'function') {
            try { window.app.goToName(); } catch {}
          } else if (window.app && typeof window.app.finalizeCharacter === 'function') {
            window.app.finalizeCharacter();
          } else {
            // Fallback: mostra a seção final
            const stepFinal = document.getElementById('stepFinal');
            if (stepFinal) {
              stepFinal.style.display = '';
              try { stepFinal.scrollIntoView({ behavior:'smooth', block:'start' }); } catch{}
            }
          }
        }
      });
    });
  }
})();

