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
  const { CLASS_DICE, ATTRS, state, roll, $, randInt } = window.app;
  const btnRollHP = $("#btnRollHP");
  
  if (btnRollHP) {
    btnRollHP.addEventListener("click", () => {
      if (!state.cls || btnRollHP.disabled) return; // Se já estiver desabilitado, não faz nada.
      
      // Desabilita o botão imediatamente após o clique para prevenir múltiplos cliques
      btnRollHP.disabled = true;
      
      // Mostra animação de rolagem
      const hpRolling = $("#hpRolling");
      if (hpRolling) hpRolling.style.display = "";
      
      const bar = $("#hpBar");
      let elapsed = 0, total = 3000, tick = 100;
      if (bar) bar.style.width = "0%";
      
      const countdownElement = $("#hpCountdown"); // Elemento do contador de vida
      let countdownTime = 5; // Começa com 5 segundos

      // Exibe o GIF de dado à esquerda do texto "Rolando vida..."
      const diceGif = document.createElement("img");
      diceGif.src = "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f3b2.gif";
      diceGif.alt = "Rolando dado";
      diceGif.style.width = "20px"; // Ajuste conforme necessário
      diceGif.style.marginRight = "5px"; // Espaço à direita do gif

      const countdownContainer = document.querySelector("#hpCountdownContainer");
      if (countdownContainer) {
        countdownContainer.innerHTML = ""; // Limpa o conteúdo atual
        countdownContainer.appendChild(diceGif); // Adiciona o gif à esquerda
        countdownContainer.innerHTML += "<strong>Rolando vida...</strong> "; // Frase
      }

      // Agora o contador diminui de 5 para 0
      const countdownInterval = setInterval(() => {
        elapsed += tick;
        if (bar) bar.style.width = Math.min(100, Math.floor(elapsed / total * 100)) + "%";
        
        if (elapsed >= total) {
          clearInterval(countdownInterval);
          
          const sides = CLASS_DICE[state.cls];
          // Calcula modificador de Constituição (se já houver mods)
          const conMod = Array.isArray(state.mods) ? (state.mods[ATTRS.indexOf("Constituição")] || 0) : 0;
          let base;
          let detail;
          
          if (state.race === "Anão") {
            const r1 = roll(1, sides).total;
            const r2 = roll(1, sides).total;
            base = Math.max(r1, r2);
            detail = `(${r1} e ${r2} → vantagem = ${base})`;
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
          state.hp = hp;
          state.hpDetail = `${state.cls} d${sides} ${detail}${bonusStr}`;
          
          // Exibe o resultado
          const hpOut = $("#hpOut");
          if (hpOut) {
            hpOut.style.display = "";
            hpOut.textContent = `PV: ${hp}  —  ${state.hpDetail}`;
          }
          
          // Feedback visual
          try { window.app && window.app.showCheck && window.app.showCheck(btnRollHP); } catch {}
          
          // Esconde a animação de rolagem
          if (hpRolling) hpRolling.style.display = "none";
          
          // Mostra etapa de ouro
          const stepGold = $("#stepGold");
          if (stepGold) {
            stepGold.style.display = "";
            stepGold.scrollIntoView({ behavior:"smooth", block:"start" });
          }
        }
      }, tick);

      // Atualiza o contador de segundos
      if (countdownElement) {
        let countdownTime = 5; // Reinicia o contador a cada rolagem
        const countdownInterval = setInterval(() => {
          countdownTime = Math.max(0, Math.floor((total - elapsed) / 1000)); // Decrementa o tempo
          countdownElement.textContent = `(${countdownTime}s)`; // Atualiza exibição do contador

          if (elapsed >= total) {
            clearInterval(countdownInterval);
          }
        }, tick);
      }
    });
  }
})();
