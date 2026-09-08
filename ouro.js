/*
 * Módulo de Ouro
 *
 * Responsável por gerar a quantidade inicial de ouro do personagem.
 * A rolagem utiliza 2d6 multiplicado por 5. Após determinar o
 * resultado, avança para a etapa de Alinhamento.
 */
(function(){
  const { state, roll, $, randInt } = window.app;
  const btnRollGold = $("#btnRollGold");
  
  if (btnRollGold) {
    btnRollGold.addEventListener("click", () => {
      if (btnRollGold.disabled) return; // Impede múltiplos cliques enquanto o botão estiver desabilitado
      
      // Desabilita o botão imediatamente após o clique para prevenir múltiplos cliques
      btnRollGold.disabled = true;

      // Animação da rolagem de ouro
      const goldRolling = $("#goldRolling");
      if (goldRolling) goldRolling.style.display = "";
      const bar = $("#goldBar");
      let elapsed = 0, total = 3000, tick = 100;
      if (bar) bar.style.width = "0%";
      
      const countdownElement = $("#goldCountdown"); // Elemento do contador de ouro
      let countdownTime = 5; // Começa com 5 segundos

      // Exibe o GIF de dado à esquerda do texto "Rolando ouro..."
      const diceGif = document.createElement("img");
      diceGif.src = "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f3b2.gif";
      diceGif.alt = "Rolando dado";
      diceGif.style.width = "20px"; // Ajuste conforme necessário
      diceGif.style.marginRight = "5px"; // Espaço à direita do gif

      const countdownContainer = document.querySelector("#goldCountdownContainer");
      if (countdownContainer) {
        countdownContainer.innerHTML = ""; // Limpa o conteúdo atual
        countdownContainer.appendChild(diceGif); // Adiciona o gif à esquerda
        countdownContainer.innerHTML += "<strong>Rolando ouro...</strong> "; // Frase
      }

      // Agora o contador diminui de 5 para 0
      const countdownInterval = setInterval(() => {
        elapsed += tick;
        if (bar) bar.style.width = Math.min(100, Math.floor(elapsed / total * 100)) + "%";
        
        if (elapsed >= total) {
          clearInterval(countdownInterval);
          
          // Rolagem do ouro
          const r = roll(2, 6);
          const gold = r.total * 5;
          state.gold = gold;
          
          // Exibe o ouro
          const goldOut = $("#goldOut");
          if (goldOut) {
            goldOut.style.display = "";
            goldOut.textContent = `Ouro inicial: ${gold} PO (2d6=${r.rolls.join("+")} ⇒ ${r.total} × 5)`;
          }
          
          // Feedback visual
          try { window.app && window.app.showCheck && window.app.showCheck(btnRollGold); } catch {}
          
          // Esconde animação de rolagem
          if (goldRolling) goldRolling.style.display = "none";
          
          // Após definir o ouro, avança para a etapa de Nome.
          // Se a função de navegação de nome existir, chama-a;
          // caso contrário finaliza diretamente como antes.
          if (window.app && typeof window.app.goToName === 'function') {
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
