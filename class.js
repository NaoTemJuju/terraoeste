/*
 * Módulo de Classe
 *
 * Trata da seleção de classe, aleatória ou manual, e da transição
 * para as etapas subsequentes (origem, pontos de vida, etc.). Ao
 * Continuar a classe, o módulo chama `attachOriginStep` definido em
 * origens.js e prepara a interface para rolar pontos de vida e ouro.
 */
(function(){
  const { CLASSES, CLASS_DICE, pending, state, randInt, $ } = window.app;
  const classSel = $("#classSelect");
  const btnRandClass = $("#btnRandClass");
  const btnConfirmClass = $("#btnConfirmClass");
  const classInfo = $("#classInfo");
  const classInfoTitle = $("#classInfoTitle");
  const classInfoDescription = $("#classInfoDescription");

  // Descrições da tradução PT-BR do compêndio de classes do Foundry.
  // Só associa classes do site com equivalentes claros no compêndio.
  const CLASS_DESCRIPTIONS = {
    "Bardo": "Bardos são viajantes bem-vindos e conselheiros sábios; sua tarefa é proteger e compartilhar o conhecimento que é repassado através das eras.",
    "Guerreiro": "Gladiadores ensanguentados usando armaduras amassadas, duelistas acrobáticos com suas espadas de arremesso, ou arqueiros élficos de visão aguçada que forjam suas lendas com aço e coragem.",
    "Mago": "Adeptos tatuados com runas, sábios usando óculos, e bruxas conjuradoras de chamas que ousam manipular as terríveis forças da magia.",
    "Patrulheiro": "Rastreadores habilidosos, andarilhos furtivos e guerreiros incomparáveis que têm as terras selvagens como lar.",
    "Sacerdote": "Templários cruzados, xamãs proféticos, ou fanáticos com olhos enlouquecidos que empunham o poder de seus deuses para expurgar os impuros."
  };

  function updateClassInfo(cls){
    if (!classInfo) return;
    classInfo.hidden = !cls;
    if (classInfoTitle && cls) classInfoTitle.textContent = `Informações: ${cls}`;
    if (classInfoDescription) {
      classInfoDescription.textContent = cls ? (CLASS_DESCRIPTIONS[cls] || "Ainda não há uma descrição correspondente no compêndio consultado.") : "A descrição da classe aparecerá aqui.";
    }
  }

  // Sorteia uma classe aleatória
  if (btnRandClass) {
    btnRandClass.addEventListener("click", () => {
      const c = CLASSES[randInt(0, CLASSES.length - 1)];
      if (classSel) {
        classSel.value = c;
        if (classSel.options.length > 0) classSel.options[0].disabled = true;
      }
      pending.cls = c;
      updateClassInfo(c);
      if (btnConfirmClass) btnConfirmClass.disabled = false;
    });
  }
  // Seleção manual da classe
  if (classSel) {
    classSel.addEventListener("change", e => {
      const val = e.target.value;
      pending.cls = val || null;
      updateClassInfo(pending.cls);
      if (btnConfirmClass) btnConfirmClass.disabled = !pending.cls;
    });
  }
  // Confirma a classe e prepara as etapas seguintes
  if (btnConfirmClass) {
    btnConfirmClass.addEventListener("click", () => {
      if (!pending.cls) return;
      state.cls = pending.cls;
      state.origem = null;
      if (classSel) classSel.disabled = true;
      if (btnRandClass) btnRandClass.disabled = true;
      btnConfirmClass.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmClass); } catch {}
      // Reseta visibilidade das seções subsequentes
      const stepMastery = $("#stepMastery");
      const stepOrigin = $("#stepOrigin");
      const stepHP    = $("#stepHP");
      const stepGold  = $("#stepGold");
      const stepAlign = $("#stepAlign");
      const stepFinal = $("#stepFinal");
      if (stepMastery) stepMastery.style.display = "none";
      if (stepOrigin) stepOrigin.style.display = "none";
      if (stepHP)    stepHP.style.display = "none";
      if (stepGold)  stepGold.style.display = "none";
      if (stepAlign) stepAlign.style.display = "none";
      if (stepFinal) stepFinal.style.display = "none";
      const hpOut = $("#hpOut");
      const btnRollHP = $("#btnRollHP");
      const goldOut = $("#goldOut");
      const btnRollGold = $("#btnRollGold");
      if (hpOut) hpOut.style.display = "none";
      if (btnRollHP) btnRollHP.disabled = false;
      if (goldOut) goldOut.style.display = "none";
      if (btnRollGold) btnRollGold.disabled = false;

      // Após a Maestria (se houver para a classe), segue para Origem
      function goToOriginStep(){
        if (stepOrigin) stepOrigin.style.display = "";
        if (typeof window.attachOriginStep === "function") {
          window.attachOriginStep(state, () => {
            // Callback após confirmação da origem
            // Em vez de exibir PV diretamente, avançamos para alinhamento
            // Limpa HP e Ouro e oculta suas seções até o final do fluxo
            state.hp = null;
            if (hpOut) hpOut.style.display = "none";
            if (btnRollHP) btnRollHP.disabled = false;
            state.gold = null;
            if (goldOut) goldOut.style.display = "none";
            if (btnRollGold) btnRollGold.disabled = false;
            // Avança para a etapa de alinhamento
            if (typeof window.app.showAlignmentStep === 'function') {
              window.app.showAlignmentStep();
            } else if (stepAlign) {
              stepAlign.style.display = '';
              stepAlign.scrollIntoView({ behavior:'smooth', block:'start' });
            }
            // Garante que etapas posteriores não apareçam prematuramente
            if (stepHP) stepHP.style.display = 'none';
            if (stepGold) stepGold.style.display = 'none';
            if (stepFinal) stepFinal.style.display = 'none';
          });
        }
      }

      // Etapa de Maestria em Arma (mastery.js): só aparece para classes
      // com opções cadastradas (ex.: Cavaleiro). Para as demais, a
      // etapa é pulada automaticamente e segue direto para Origem.
      if (typeof window.attachMasteryStep === "function") {
        window.attachMasteryStep(state, goToOriginStep);
      } else {
        goToOriginStep();
      }
    });
  }
})();
