/*
 * Módulo de Atributos
 *
 * Agora esta é a ÚLTIMA etapa antes do Nome. O jogador rola 3d6 seis
 * vezes (uma "pool" de 6 valores) e depois escolhe livremente em qual
 * atributo (Força, Destreza, Constituição, Inteligência, Sabedoria e
 * Carisma) cada valor rolado será alocado. Os resultados finais são
 * armazenados no estado global `app.state` e os modificadores
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

  // pool: os 6 valores rolados (3d6 cada), em nenhuma ordem de atributo específica
  let pool = [];
  // assignment[i] = índice em `pool` alocado ao atributo ATTRS[i], ou null se ainda não escolhido
  let assignment = new Array(ATTRS.length).fill(null);

  // Estado interno para controle de confirmação de re-rolagem
  let rerollConfirmPending = false;
  let rerollOutsideHandler;

  /**
   * Retorna true quando todos os 6 atributos já receberam um valor.
   */
  function isFullyAssigned(){
    return assignment.every(v => v !== null && v !== undefined);
  }

  /**
   * Índices de `pool` já usados por outros atributos (excluindo o
   * próprio atributo `excludeAttrIdx`, para que seu valor atual
   * continue aparecendo como opção selecionada).
   */
  function usedIndices(excludeAttrIdx){
    const used = new Set();
    assignment.forEach((poolIdx, attrIdx) => {
      if (attrIdx === excludeAttrIdx) return;
      if (poolIdx !== null && poolIdx !== undefined) used.add(poolIdx);
    });
    return used;
  }

  function updateConfirmState(){
    if (!btnConfirmAttrs) return;
    btnConfirmAttrs.disabled = window.app.attrsLocked || !isFullyAssigned();
  }

  /**
   * Renderiza a tabela de atributos com um <select> por linha,
   * permitindo escolher qual valor rolado vai para cada atributo.
   */
  function renderAssignment(){
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

    ATTRS.forEach((attrName, attrIdx) => {
      const select = el("select", { "aria-label": `Valor para ${attrName}` });
      select.disabled = window.app.attrsLocked;

      select.append(new Option("--", ""));

      const used = usedIndices(attrIdx);
      pool.forEach((val, poolIdx) => {
        if (used.has(poolIdx)) return; // já alocado em outro atributo
        select.append(new Option(String(val), String(poolIdx)));
      });

      const current = assignment[attrIdx];
      select.value = (current !== null && current !== undefined) ? String(current) : "";

      select.addEventListener("change", () => {
        const v = select.value;
        assignment[attrIdx] = (v === "") ? null : Number(v);
        renderAssignment();
        updateConfirmState();
      });

      const modVal = (current !== null && current !== undefined)
        ? prettyMod(modFromScore(pool[current]))
        : "—";

      table.append(
        el("tr",{},
          el("td",{html:attrName}),
          el("td",{}, select),
          el("td",{class:"mod", html: modVal})
        )
      );
    });
  }

  /**
   * Executa a animação de rolagem e, ao final, sorteia os 6 valores
   * (3d6 cada) e reinicia a alocação.
   */
  function doRoll(){
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
    diceGif.style.width = "20px";
    diceGif.style.marginRight = "5px";

    const countdownContainer = document.querySelector("#attrsCountdownContainer");
    if (countdownContainer) {
      countdownContainer.innerHTML = "";
      countdownContainer.appendChild(diceGif);
      countdownContainer.innerHTML += "<strong>Rolando dados...</strong> ";
    }

    const it = setInterval(() => {
      elapsed += tick;
      const width = Math.min(100, Math.floor(elapsed / total * 100));
      bar.style.width = width + "%";

      const rollNumber = $("#rollNumber");
      if (rollNumber) {
        rollNumber.textContent = Math.floor(width);
      }

      if (countdownElement) {
        countdownTime = Math.max(0, Math.floor((total - elapsed) / 1000));
        countdownElement.textContent = `(${countdownTime}s)`;
      }

      if (elapsed >= total) {
        clearInterval(it);

        // Rola 3d6 seis vezes, formando a pool de valores disponíveis
        pool = Array.from({ length: ATTRS.length }, () => roll3d6());
        assignment = new Array(ATTRS.length).fill(null);

        renderAssignment();

        $("#rolling").style.display = "none";
        $("#attrsResult").style.display = "";

        window.app.attrsLocked = false;

        if (btnRerollAttrs)  btnRerollAttrs.disabled  = false;
        updateConfirmState();
      }
    }, tick);
  }

  // === Eventos ===
  if (btnRollAttrs) {
    btnRollAttrs.addEventListener("click", () => {
      $("#stepAttrs").style.display = "";
      window.app.attrsLocked = false;

      if (btnRerollAttrs)  btnRerollAttrs.disabled  = false;
      if (btnConfirmAttrs) btnConfirmAttrs.disabled = true;

      // esconde o botão inicial "Rolar Atributos"
      btnRollAttrs.style.display = "none";

      doRoll();
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

      doRoll();
    });
  }

  if (btnConfirmAttrs) {
    btnConfirmAttrs.addEventListener("click", () => {
      if (!isFullyAssigned()) return;

      // Monta os valores finais na ordem de ATTRS, a partir da alocação escolhida
      const scores = ATTRS.map((_, i) => pool[assignment[i]]);
      const mods = scores.map(modFromScore);
      state.attrs = scores;
      state.mods  = mods;

      window.app.attrsLocked = true;

      if (btnRerollAttrs)  btnRerollAttrs.disabled  = true;
      btnConfirmAttrs.disabled = true;

      // Re-renderiza para travar os selects visualmente
      renderAssignment();

      // Marca visual de confirmação (✔) ao lado do botão Confirmar
      try { showCheck?.(btnConfirmAttrs); } catch {}

      // Avança para a etapa de Nome (agora a próxima etapa do fluxo)
      if (typeof window.app.goToName === "function") {
        window.app.goToName();
      } else {
        const stepFinal = $("#stepFinal");
        if (stepFinal) {
          stepFinal.style.display = "";
          stepFinal.scrollIntoView({ behavior:"smooth", block:"start" });
        }
      }
    });
  }

  /**
   * Exibe a etapa de Atributos. Chamada pela etapa de Ouro ao final
   * do fluxo, já que Atributos agora vem por último, antes do Nome.
   */
  function goToAttrs(){
    const step = $("#stepAttrs");
    if (!step) return;
    step.style.display = "";

    if (window.app.attrsLocked && Array.isArray(state.attrs)) {
      // Já confirmado anteriormente (ex.: reabrindo a etapa)
      $("#rolling").style.display = "none";
      $("#attrsResult").style.display = "";
      if (btnRollAttrs) btnRollAttrs.style.display = "none";
      if (btnRerollAttrs) btnRerollAttrs.disabled = true;
      renderAssignment();
      updateConfirmState();
    } else {
      $("#attrsResult").style.display = "none";
      $("#rolling").style.display = "none";
      if (btnRollAttrs) btnRollAttrs.style.display = "";
      if (btnConfirmAttrs) btnConfirmAttrs.disabled = true;
      if (btnRerollAttrs) btnRerollAttrs.disabled = true;
    }

    step.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  window.app.goToAttrs = goToAttrs;
})();
