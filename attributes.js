/*
 * Módulo de Atributos
 *
 * Responsável por rolar os valores de atributos do personagem (Força,
 * Destreza, Constituição, Inteligência, Sabedoria e Carisma) e
 * permitir que o usuário confirme ou role novamente. Os resultados
 * são armazenados no estado global `app.state` e os modificadores
 * calculados utilizando a função `modFromScore` exposta pelo
 * base.js.
 */
(function(){
  // Extraia utilitários e estado compartilhado
  const { ATTRS, state, roll3d6, modFromScore, $, el, prettyMod, showCheck } = window.app;

  // Referências aos elementos da UI desta etapa
  const btnRollAttrs    = $("#btnRollAttrs");
  const btnConfirmAttrs = $("#btnConfirmAttrs");
  const btnRerollAttrs  = $("#btnRerollAttrs");

  // Estado interno para controle de confirmação de re-rolagem
  let rerollConfirmPending = false;
  let rerollOutsideHandler;

  /**
   * Executa a rolagem de atributos.
   */
  function doReroll(){
    if (window.app.attrsLocked) return;

    $("#rolling").style.display = "";
    $("#attrsResult").style.display = "none";

    const bar = $("#rollBar");
    let elapsed = 0, total = 5000, tick = 100;
    bar.style.width = "0%";

    const countdownElement = $("#attrsCountdown"); // Elemento do contador
    let countdownTime = 5; // Começa com 5 segundos

    // Exibe o GIF de dado à esquerda do texto "Rolando dados..."
    const diceGif = document.createElement("img");
    diceGif.src = "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f3b2.gif";
    diceGif.alt = "Rolando dados";
    diceGif.style.width = "20px"; // Ajuste conforme necessário
    diceGif.style.marginRight = "5px"; // Espaço à direita do gif

    const countdownContainer = document.querySelector("#attrsCountdownContainer");
    if (countdownContainer) {
      countdownContainer.innerHTML = ""; // Limpa o conteúdo atual
      countdownContainer.appendChild(diceGif); // Adiciona o gif à esquerda
      countdownContainer.innerHTML += "<strong>Rolando dados...</strong> "; // Frase
    }

    const it = setInterval(() => {
      elapsed += tick;
      const width = Math.min(100, Math.floor(elapsed / total * 100));
      bar.style.width = width + "%";

      // Atualiza o número ao lado da barra de progresso
      const rollNumber = $("#rollNumber");
      if (rollNumber) {
        rollNumber.textContent = Math.floor(width);  // Sincroniza número com a barra
      }

      // Atualiza o contador de segundos
      if (countdownElement) {
        countdownTime = Math.max(0, Math.floor((total - elapsed) / 1000)); // Decrementa o tempo
        countdownElement.textContent = `(${countdownTime}s)`; // Atualiza exibição do contador
      }

      if (elapsed >= total) {
        clearInterval(it);

        let scores = ATTRS.map(() => roll3d6());
const mods = scores.map(modFromScore);
        state.attrs = scores;
        state.mods  = mods;

        renderAttrs(scores, mods);

        $("#rolling").style.display = "none";
        $("#attrsResult").style.display = "";

        window.app.attrsLocked = false;

        if (btnRerollAttrs)  btnRerollAttrs.disabled  = false;
        if (btnConfirmAttrs) btnConfirmAttrs.disabled = false;
      }
    }, tick);
  }

  /**
   * Renderiza a tabela de atributos.
   */
  function renderAttrs(scores, mods){
    const table = $("#attrsTable");
    if (!table) return;

    table.innerHTML = "";
    table.append(
      el("tr",{},
        el("th",{html:"Atributo"}),
        el("th",{html:"Valor"}),
        el("th",{html:"Mod"})
      )
    );

    ATTRS.forEach((a,i) => {
      table.append(
        el("tr",{},
          el("td",{html:a}),
          el("td",{class:"score", html:String(scores[i])}),
          el("td",{class:"mod",   html: prettyMod(mods[i])})
        )
      );
    });
  }

  // === Eventos ===
  if (btnRollAttrs) {
    btnRollAttrs.addEventListener("click", () => {
      $("#stepAttrs").style.display = "";
      $("#rolling").style.display = "";
      $("#attrsResult").style.display = "none";
      window.app.attrsLocked = false;

      if (btnRerollAttrs)  btnRerollAttrs.disabled  = false;
      if (btnConfirmAttrs) btnConfirmAttrs.disabled = false;

      // esconde o botão inicial "Rolar Atributos"
      btnRollAttrs.style.display = "none";

      const bar = $("#rollBar");
      let elapsed = 0, total = 5000, tick = 100;
      bar.style.width = "0%";

      const countdownElement = $("#attrsCountdown"); // Elemento do contador
      let countdownTime = 5; // Começa com 5 segundos

      // Exibe o GIF de dado à esquerda do texto "Rolando dados..."
      const diceGif = document.createElement("img");
      diceGif.src = "https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f3b2.gif";
      diceGif.alt = "Rolando dados";
      diceGif.style.width = "20px"; // Ajuste conforme necessário
      diceGif.style.marginRight = "5px"; // Espaço à direita do gif

      const countdownContainer = document.querySelector("#attrsCountdownContainer");
      if (countdownContainer) {
        countdownContainer.innerHTML = ""; // Limpa o conteúdo atual
        countdownContainer.appendChild(diceGif); // Adiciona o gif à esquerda
        countdownContainer.innerHTML += "<strong>Rolando dados...</strong> "; // Frase
      }

      const it = setInterval(() => {
        elapsed += tick;
        const width = Math.min(100, Math.floor(elapsed / total * 100));
        bar.style.width = width + "%";

        // Atualiza o número ao lado da barra de progresso
        const rollNumber = $("#rollNumber");
        if (rollNumber) {
          rollNumber.textContent = Math.floor(width);  // Sincroniza número com a barra
        }

        // Atualiza o contador de segundos
        if (countdownElement) {
          countdownTime = Math.max(0, Math.floor((total - elapsed) / 1000)); // Decrementa o tempo
          countdownElement.textContent = `(${countdownTime}s)`; // Atualiza exibição do contador
        }

        if (elapsed >= total) {
          clearInterval(it);

          let scores = ATTRS.map(() => roll3d6());
const mods = scores.map(modFromScore);
          state.attrs = scores;
          state.mods  = mods;

          renderAttrs(scores, mods);

          $("#rolling").style.display = "none";
          $("#attrsResult").style.display = "";
        }
      }, tick);
    });
  }

  if (btnRerollAttrs) {
    btnRerollAttrs.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (window.app.attrsLocked) return;

      if (!rerollConfirmPending) {
        rerollConfirmPending = true;

        const originalText = btnRerollAttrs.dataset.originalText || btnRerollAttrs.textContent;
        btnRerollAttrs.dataset.originalText = originalText;
        btnRerollAttrs.textContent = "Confirmar";

        rerollOutsideHandler = function(e) {
          if (e.target !== btnRerollAttrs) {
            rerollConfirmPending = false;
            btnRerollAttrs.textContent = originalText;
            document.removeEventListener('click', rerollOutsideHandler);
          }
        };
        document.addEventListener('click', rerollOutsideHandler);
        return;
      }

      rerollConfirmPending = false;
      const originalText = btnRerollAttrs.dataset.originalText || "Rolar Novamente";
      btnRerollAttrs.textContent = originalText;
      if (rerollOutsideHandler) document.removeEventListener('click', rerollOutsideHandler);

      try { window.sfx && window.sfx.play('sfx-dice', { volume: 1, overlap: false }); } catch {}

      doReroll();
    });
  }

  if (btnConfirmAttrs) {
    btnConfirmAttrs.addEventListener("click", () => {
      window.app.attrsLocked = true;

      if (btnRerollAttrs)  btnRerollAttrs.disabled  = true;
      if (btnConfirmAttrs) btnConfirmAttrs.disabled = true;

      // Marca visual de confirmação (🗸) ao lado do botão Confirmar
      try { showCheck?.(btnConfirmAttrs); } catch {}

      const stepRace = $("#stepRace");
      if (stepRace) {
        stepRace.style.display = "";
        stepRace.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    });
  }
})();
