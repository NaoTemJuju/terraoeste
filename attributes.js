/*
 * Módulo de Atributos
 *
 * Última etapa antes do Nome. O jogador rola 3d6 seis vezes (formando
 * uma "pool" de 6 cartas) e depois aloca livremente cada carta em um
 * dos 6 atributos (Força, Destreza, Constituição, Inteligência,
 * Sabedoria e Carisma), arrastando a cartinha até a caixinha do
 * atributo (no desktop) ou tocando na carta e depois na caixinha (no
 * celular). Uma única re-rolagem é permitida.
 *
 * Como os Pontos de Vida (PV) agora são rolados ANTES desta etapa, o
 * bônus de Constituição ainda não existe no momento da rolagem de PV.
 * Por isso, ao confirmar os atributos aqui, recalculamos o PV final
 * somando o modificador de Constituição recém-descoberto.
 */
(function(){
  const { ATTRS, state, roll3d6, modFromScore, $, el, prettyMod, showCheck } = window.app;

  const btnRollAttrs    = $("#btnRollAttrs");
  const btnConfirmAttrs = $("#btnConfirmAttrs");
  const btnRerollAttrs  = $("#btnRerollAttrs");
  const REROLL_LIMIT = 1;

  // pool: os 6 valores rolados (3d6 cada)
  let pool = [];
  // assignment[i] = índice em `pool` alocado ao atributo ATTRS[i], ou null
  let assignment = new Array(ATTRS.length).fill(null);
  // carta atualmente "na mão" (selecionada por toque), aguardando um destino
  let heldPoolIdx = null;
  // controla o fluxo de confirmação de re-rolagem (clique duplo)
  let rerollConfirmPending = false;
  let rerollOutsideHandler;
  let rerollsUsed = 0;

  function isFullyAssigned(){
    return assignment.every(v => v !== null && v !== undefined);
  }

  function updateConfirmState(){
    if (!btnConfirmAttrs) return;
    btnConfirmAttrs.disabled = window.app.attrsLocked || !isFullyAssigned();
  }

  function updateRerollButtonLabel(){
    if (!btnRerollAttrs) return;
    const hint = $("#attrsRerollHint");
    const eligible = poolQualifiesForReroll();

    if (rerollsUsed >= REROLL_LIMIT){
      btnRerollAttrs.disabled = true;
      btnRerollAttrs.textContent = "Rerolagem já usada";
      if (hint) hint.style.display = "none";
    } else if (!eligible){
      // Veio pelo menos 1 atributo 14+: não tem direito à rerolagem.
      btnRerollAttrs.disabled = true;
      btnRerollAttrs.textContent = "Rolar Novamente (1x)";
      if (hint) hint.style.display = "none";
    } else {
      // Nenhum atributo 14+: pode rolar novamente se quiser.
      btnRerollAttrs.disabled = false;
      btnRerollAttrs.textContent = "Rolar Novamente (1x)";
      if (hint) hint.style.display = "";
    }
  }

  /**
   * Só tem direito à rerolagem se NENHUM dos 6 valores rolados for
   * 14 ou mais (ou seja, a pool inteira precisa estar abaixo de 14).
   */
  function poolQualifiesForReroll(){
    return pool.length > 0 && pool.every(v => v < 14);
  }

  /**
   * Renderiza a pilha de cartas ainda não alocadas.
   */
  function renderPool(){
    const poolEl = $("#attrsCardsPool");
    if (!poolEl) return;
    poolEl.innerHTML = "";

    pool.forEach((val, poolIdx) => {
      const isAssigned = assignment.includes(poolIdx);
      if (isAssigned) return; // já está numa caixinha

      const card = el("div", {
        class: "attr-card" + (heldPoolIdx === poolIdx ? " selected" : ""),
        draggable: "true",
        role: "button",
        tabindex: "0",
        "aria-label": `Valor rolado ${val}`,
        html: String(val)
      });

      if (window.app.attrsLocked) {
        card.setAttribute("draggable", "false");
      } else {
        card.addEventListener("click", () => {
          heldPoolIdx = (heldPoolIdx === poolIdx) ? null : poolIdx;
          renderAll();
        });

        card.addEventListener("dragstart", (ev) => {
          card.classList.add("dragging");
          ev.dataTransfer.setData("text/plain", JSON.stringify({ poolIdx, fromAttrIdx: null }));
        });
        card.addEventListener("dragend", () => card.classList.remove("dragging"));
      }

      poolEl.append(card);
    });

    // Permite soltar uma carta de volta na pilha (devolver de uma caixinha)
    poolEl.ondragover = (ev) => { if (!window.app.attrsLocked) ev.preventDefault(); };
    poolEl.ondrop = (ev) => {
      ev.preventDefault();
      if (window.app.attrsLocked) return;
      let payload;
      try { payload = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (payload && payload.fromAttrIdx !== null && payload.fromAttrIdx !== undefined) {
        assignment[payload.fromAttrIdx] = null;
        renderAll();
      }
    };
  }

  /**
   * Renderiza as 6 caixinhas de atributo (destino das cartas).
   */
  function renderSlots(){
    const grid = $("#attrsSlotsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    ATTRS.forEach((attrName, attrIdx) => {
      const poolIdx = assignment[attrIdx];
      const filled = (poolIdx !== null && poolIdx !== undefined);
      const locked = window.app.attrsLocked;

      const slot = el("div", {
        class: "attr-slot" + (filled ? " filled" : "") + (locked ? " locked" : ""),
        role: "button",
        tabindex: "0",
        "aria-label": `Atributo ${attrName}`
      });

      slot.append(el("div", { class: "slot-label", html: attrName }));

      if (filled) {
        const val = pool[poolIdx];
        slot.append(el("div", { class: "slot-value", html: String(val) }));
        slot.append(el("div", { class: "slot-mod", html: `Mod ${prettyMod(modFromScore(val))}` }));

        if (!locked) {
          slot.setAttribute("draggable", "true");
          slot.addEventListener("dragstart", (ev) => {
            slot.classList.add("dragging");
            ev.dataTransfer.setData("text/plain", JSON.stringify({ poolIdx, fromAttrIdx: attrIdx }));
          });
          slot.addEventListener("dragend", () => slot.classList.remove("dragging"));
        }
      } else {
        slot.append(el("div", { class: "slot-placeholder", html: "Arraste ou toque numa carta" }));
      }

      if (!locked) {
        slot.addEventListener("click", () => {
          if (heldPoolIdx !== null) {
            // Coloca a carta da mão aqui (o valor anterior, se houver, volta pra pilha)
            assignment[attrIdx] = heldPoolIdx;
            heldPoolIdx = null;
          } else if (filled) {
            // Pega a carta desta caixinha de volta pra mão
            heldPoolIdx = poolIdx;
            assignment[attrIdx] = null;
          }
          renderAll();
        });

        slot.addEventListener("dragover", (ev) => { ev.preventDefault(); slot.classList.add("dragover"); });
        slot.addEventListener("dragleave", () => slot.classList.remove("dragover"));
        slot.addEventListener("drop", (ev) => {
          ev.preventDefault();
          slot.classList.remove("dragover");
          let payload;
          try { payload = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
          if (!payload) return;

          const displaced = assignment[attrIdx];
          if (payload.fromAttrIdx !== null && payload.fromAttrIdx !== undefined) {
            assignment[payload.fromAttrIdx] = displaced; // troca entre duas caixinhas
          }
          assignment[attrIdx] = payload.poolIdx;
          if (heldPoolIdx === payload.poolIdx) heldPoolIdx = null;
          renderAll();
        });
      }

      grid.append(slot);
    });
  }

  function renderAll(){
    renderPool();
    renderSlots();
    updateConfirmState();
  }

  /**
   * Executa a animação de rolagem e, ao final, sorteia os 6 valores
   * (3d6 cada) e reinicia a alocação.
   */
  function doRoll(){
    $("#rolling").style.display = "";
    $("#attrsResult").style.display = "none";

    window.app.runRollAnimation({
      rollingId: "rolling",
      barId: "rollBar",
      countdownContainerId: "attrsCountdownContainer",
      countdownId: "attrsCountdown",
      label: "Rolando dados...",
      totalMs: 5000,
      onDone: () => {
        pool = Array.from({ length: ATTRS.length }, () => roll3d6());
        assignment = new Array(ATTRS.length).fill(null);
        heldPoolIdx = null;

        renderAll();

        $("#attrsResult").style.display = "";

        window.app.attrsLocked = false;
        updateRerollButtonLabel();
      }
    });
  }

  // === Eventos ===
  if (btnRollAttrs) {
    btnRollAttrs.addEventListener("click", () => {
      $("#stepAttrs").style.display = "";
      window.app.attrsLocked = false;

      if (btnConfirmAttrs) btnConfirmAttrs.disabled = true;
      btnRollAttrs.style.display = "none";

      doRoll();
    });
  }

  if (btnRerollAttrs) {
    btnRerollAttrs.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (window.app.attrsLocked || rerollsUsed >= REROLL_LIMIT || !poolQualifiesForReroll()) return;

      if (!rerollConfirmPending) {
        rerollConfirmPending = true;

        const originalText = btnRerollAttrs.dataset.originalText || btnRerollAttrs.textContent;
        btnRerollAttrs.dataset.originalText = originalText;
        btnRerollAttrs.textContent = "Confirmar (só resta 1x)";

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
      if (rerollOutsideHandler) document.removeEventListener('click', rerollOutsideHandler);

      rerollsUsed += 1;

      try { window.sfx && window.sfx.play('sfx-dice', { volume: 1, overlap: false }); } catch {}

      doRoll(); // doRoll() chama updateRerollButtonLabel() ao final, já refletindo o novo rerollsUsed
    });
  }

  if (btnConfirmAttrs) {
    btnConfirmAttrs.addEventListener("click", () => {
      if (!isFullyAssigned()) return;

      const scores = ATTRS.map((_, i) => pool[assignment[i]]);
      const mods = scores.map(modFromScore);
      state.attrs = scores;
      state.mods  = mods;

      // Recalcula o PV agora que o modificador de Constituição é conhecido
      // (o PV foi rolado antes desta etapa, sem o bônus de CON).
      if (Number.isFinite(state.hpBaseRoll)) {
        const conMod = mods[ATTRS.indexOf("Constituição")] || 0;
        const bonusFmt = conMod > 0 ? `+${conMod}` : `${conMod}`;
        const bonusStr = conMod === 0 ? "" : ` + MOD CON ${bonusFmt}`;
        state.hp = Math.max(1, state.hpBaseRoll + conMod);
        state.hpDetail = `${state.hpDiceDetail || ""}${bonusStr}`;

        const hpOut = $("#hpOut");
        if (hpOut) {
          hpOut.style.display = "";
          hpOut.textContent = `PV: ${state.hp}  —  ${state.hpDetail}`;
        }
      }

      window.app.attrsLocked = true;
      if (btnRerollAttrs) btnRerollAttrs.disabled = true;
      btnConfirmAttrs.disabled = true;
      heldPoolIdx = null;

      renderAll(); // re-renderiza travando cartas e caixinhas

      try { showCheck?.(btnConfirmAttrs); } catch {}

      if (typeof window.app.goToShop === "function") {
        window.app.goToShop();
      } else if (typeof window.app.goToName === "function") {
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
      renderAll();
      updateRerollButtonLabel();
      if (btnRerollAttrs) btnRerollAttrs.disabled = true;
    } else {
      $("#attrsResult").style.display = "none";
      $("#rolling").style.display = "none";
      if (btnRollAttrs) btnRollAttrs.style.display = "";
      if (btnConfirmAttrs) btnConfirmAttrs.disabled = true;
      updateRerollButtonLabel();
    }

    step.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  window.app.goToAttrs = goToAttrs;
})();
