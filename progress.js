/*! Indicador de progresso das etapas de criação de personagem.
 *
 * Observa quais seções (<section id="step...">) estão visíveis no DOM e
 * atualiza a barra/legenda de progresso de acordo — sem precisar alterar
 * a lógica de navegação de nenhum dos outros módulos (race.js, class.js,
 * origens.js, etc.), que continuam apenas mostrando/escondendo suas
 * seções via style.display como já faziam.
 */
(function () {
  const STEPS = [
    { id: "stepRace",      label: "Raça" },
    { id: "stepClass",     label: "Classe" },
    { id: "stepMastery",   label: "Maestria em Arma" },
    { id: "stepOrigin",    label: "Origem" },
    { id: "stepAlign",     label: "Alinhamento" },
    { id: "stepDeity",     label: "Divindade" },
    { id: "stepLang",      label: "Línguas" },
    { id: "stepAttrs",     label: "Atributos" },
    { id: "stepClassTalent", label: "Talento da classe" },
    { id: "stepHP",        label: "Pontos de Vida" },
    { id: "stepGold",      label: "Ouro" },
    { id: "stepShop",      label: "Equipamentos" },
    { id: "stepNameEntry", label: "Nome" },
    { id: "stepFinal",     label: "Ficha Final" }
  ];

  const rail  = document.getElementById("progressRail");
  const fill  = document.getElementById("progressFill");
  const lblEl = document.getElementById("progressStepLabel");
  const cntEl = document.getElementById("progressStepText");

  if (!rail || !fill) return;

  function isVisible(el) {
    return !!el && el.style.display !== "none";
  }

  // A etapa de Maestria só existe de fato para classes com opções
  // cadastradas (ver mastery.js); para as demais, ela nunca é aberta e
  // não deve contar no total de etapas.
  function classHasMastery() {
    const cls = window.app && window.app.state && window.app.state.cls;
    const opts = (window.MAESTRIA_POR_CLASSE && cls) ? window.MAESTRIA_POR_CLASSE[cls] : null;
    return !!(opts && opts.length);
  }

  function classHasTalentRoll() {
    const cls = window.app && window.app.state && window.app.state.cls;
    return !!window.app?.hasClassLevelTalent?.(cls);
  }

  function effectiveSteps() {
    return STEPS.filter(s => (s.id !== "stepMastery" || classHasMastery()) && (s.id !== "stepClassTalent" || classHasTalentRoll()));
  }

  function render() {
    // Ficha carregada por link direto: não há um fluxo de criação em
    // andamento pra mostrar progresso.
    if (isVisible(document.getElementById("loadedSection"))) {
      rail.style.display = "none";
      return;
    }

    const eff = effectiveSteps();
    let currentIdx = -1;

    STEPS.forEach((s) => {
      if (isVisible(document.getElementById(s.id))) {
        const effIdx = eff.findIndex(e => e.id === s.id);
        if (effIdx !== -1) currentIdx = effIdx;
      }
    });

    if (currentIdx === -1) {
      rail.style.display = "none";
      return;
    }

    rail.style.display = "";
    const total = eff.length;
    fill.style.width = (((currentIdx + 1) / total) * 100) + "%";
    if (lblEl) lblEl.textContent = eff[currentIdx].label;
    if (cntEl) cntEl.textContent = `${currentIdx + 1}/${total}`;
  }

  // Agrupa múltiplas mudanças de estilo (várias seções trocam de
  // display no mesmo instante) num único re-render por frame.
  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
  }

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true });

  document.addEventListener("DOMContentLoaded", scheduleRender);
  window.addEventListener("load", scheduleRender);
  scheduleRender();
})();

