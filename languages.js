// languages.js — módulo de Línguas
//
// Este módulo centraliza as regras de línguas para Shadowdark. Ele define as
// línguas comuns e raras disponíveis no jogo, mapeia as raças para as
// línguas concedidas e descreve os bônus e opções fornecidos por cada
// classe. Também expõe funções utilitárias para calcular o conjunto de
// línguas concedidas e as escolhas adicionais permitidas, bem como para
// aplicar as escolhas do usuário. Ao final, as funcionalidades são
// expostas através de `window.langs` para uso no restante da aplicação.

(function(){
  'use strict';

  /**
   * Lista de línguas comuns. Estas línguas podem ser escolhidas livremente
   * quando um personagem recebe bônus de línguas comuns.
   */
  const COMMON_LANGS = [
    "Comum","Anânico","Élfico","Gigantês","Gnômico","Goblínico",
    "Merês","Reptiliano","Silvestre","Tânico","Órquico"
  ];

  /**
   * Lista de línguas raras. Estas línguas só podem ser escolhidas quando
   * um personagem recebe bônus de línguas raras.
   */
  const RARE_LANGS = [
    "Celestial","Diabólico","Dracônico","Primordial"
  ];

  /**
   * Mapeamento de raças para línguas concedidas de forma automática.
   * Algumas raças também concedem bônus de escolha de línguas comuns.
   */
  const RACE_BASE = {
    "Anão":      { granted: ["Comum","Anânico"] },
    "Elfo":      { granted: ["Comum","Élfico"] },
    "Gnomo":     { granted: ["Comum","Gnômico"] },
    "Goblin":    { granted: ["Comum","Goblínico"] },
    "Humano":    { granted: ["Comum"],          bonus: { common: 1 } },
    "Meio-Elfo": { granted: ["Comum","Élfico"], bonus: { common: 1 } },
    "Meio-Orc":  { granted: ["Comum","Órquico"] },
    "Pequenino": { granted: ["Comum"] }
  };

  /**
   * Mapeamento de classes para bônus de línguas ou escolhas especiais.
   *
   * As propriedades disponíveis são:
   * - `bonus.common` (number): número de línguas comuns extras que o
   *   personagem pode escolher.
   * - `bonus.rare` (number): número de línguas raras extras que o personagem
   *   pode escolher.
   * - `grant` (string[]): línguas concedidas automaticamente pela classe.
   * - `pickOne` (string[]): o personagem escolhe exatamente uma dessas
   *   línguas.
   * - `pickOneOrNone` (string[]): o personagem pode escolher uma dessas
   *   línguas ou nenhuma.
   * - `byAlignment` (Record<Alignment,string>): conceda uma língua
   *   específica dependendo do alinhamento do personagem. Usado pelo
   *   Feiticeiro.
   */
  const CLASS_SPEC = {
    "Assassino":   { grant: ["Diabólico"] },
    "Bárbaro":     { },
    "Bardo":       { bonus: { common: 4, rare: 1 } },
    "Bruxo":       { pickOne: ["Diabólico","Primordial","Silvestre"] },
    "Caçador":     { pickOneOrNone: ["Celestial","Merês","Tânico","Diabólico","Dracônico","Primordial","Silvestre","Gigantês"] },
    "Druida":      { grant: ["Druídico","Silvestre"] },
    "Cavaleiro":   { },
    "Explorador":  { bonus: { common: 2 } },
    "Feiticeiro":  { byAlignment: { Ordeiro: "Celestial", Neutro: "Primordial", Caótico: "Diabólico" } },
    "Guerreiro":   { },
    "Mago":        { bonus: { common: 2, rare: 2 } },
    "Malandro":    { },
    "Pactário":    { pickOne: ["Celestial","Diabólico","Dracônico","Primordial","Silvestre"] },
    "Paladino":    { pickOne: ["Celestial","Diabólico"] },
    "Patrulheiro": { },
    "Sacerdote":   { pickOne: ["Celestial","Diabólico","Primordial"] }
  };

// A lógica de sorteio de línguas é implementada no módulo final.js.
// Este arquivo define apenas as regras e utilitários de línguas, sem
// adicionar manipuladores de eventos. O botão "Língua aleatória" é
// configurado em tempo de execução dentro de renderLanguages.

  /**
   * Remove duplicados de um array.
   * @param {string[]} arr
   * @returns {string[]}
   */
  function dedupe(arr){ return [...new Set(arr)]; }

  /**
   * Converte um array em Set, tratando `undefined`/`null` como array vazio.
   * @param {string[]|undefined} arr
   * @returns {Set<string>}
   */
  function toSet(arr){ return new Set(arr || []); }

  /**
   * Retorna as línguas concedidas e bônus por raça.
   * @param {string} race
   */
  function getRaceBaseLanguages(race){
    const r = (window.CUSTOM_RACE_LANGUAGES || {})[race] || RACE_BASE[race] || { granted: [] };
    return { granted: dedupe(r.granted || []), bonus: r.bonus || {} };
  }

  /**
   * Retorna as especificações de bônus para a classe.
   * @param {string} cls
   */
  function getClassBonusSpec(cls){ const extra=(window.CUSTOM_CLASS_SPEC||{}); const base=(CLASS_SPEC||{})[cls]||{}; const ex=extra[cls]||{}; return Object.assign({}, base, ex); }

  function applyContentLanguages(content){
    window.CUSTOM_RACE_LANGUAGES = {};
    window.CUSTOM_CLASS_SPEC = Object.assign({}, window.CUSTOM_CLASS_SPEC || {});
    (content?.races || []).forEach(item => { if (item?.name && item.languages) window.CUSTOM_RACE_LANGUAGES[item.name] = item.languages; });
    (content?.classes || []).forEach(item => { if (item?.name && item.languages) window.CUSTOM_CLASS_SPEC[item.name] = item.languages; });
  }

  /**
   * Calcula as línguas concedidas, os bônus e as escolhas opcionais
   * disponíveis com base na raça, classe e alinhamento fornecidos.
   *
   * @param {Object} opts
   * @param {string} opts.race
   * @param {string} opts.cls
   * @param {string} [opts.alignment]
   * @param {*} [opts.prey] Parâmetro reservado para caçadores (gancho futuro)
   * @returns {Object} Um objeto contendo as línguas concedidas, as
   *   quantidades de escolhas de línguas comuns/raras e as listas de
   *   escolhas opcionais.
   */
  function computeLanguagePools({ race, cls, alignment, prey }){
    const raceInfo = getRaceBaseLanguages(race);
    const clsInfo  = getClassBonusSpec(cls);

    // Línguas concedidas inicialmente
    let granted = [...raceInfo.granted];
    let pickCommon = raceInfo.bonus?.common || 0;
    let pickRare   = raceInfo.bonus?.rare   || 0;

    // Adiciona concessões da classe
    if (clsInfo.grant) { granted.push(...clsInfo.grant); }
    // Bônus de línguas extras da classe
    if (clsInfo.bonus?.common) pickCommon += clsInfo.bonus.common;
    if (clsInfo.bonus?.rare)   pickRare   += clsInfo.bonus.rare;
    // Concessão baseada em alinhamento (Feiticeiro)
    if (clsInfo.byAlignment && alignment){
      const v = clsInfo.byAlignment[alignment];
      if (v) granted.push(v);
    }

    // Conjuntos opcionais de escolhas fornecidos pela classe
    const optionalSets = [];
    if (Array.isArray(clsInfo.pickOne) && clsInfo.pickOne.length){
      optionalSets.push({ type: "one-of", pool: clsInfo.pickOne });
    }
    if (Array.isArray(clsInfo.pickOneOrNone) && clsInfo.pickOneOrNone.length){
      optionalSets.push({ type: "one-of-or-none", pool: clsInfo.pickOneOrNone });
    }
    // (gancho futuro) filtrar pool por presa no caso de Caçador
    if (cls === "Caçador" && prey){
      // Implementação futura para restringir opções baseadas em presa
    }

    // Remove duplicados antes de construir os pools de seleção
    granted = dedupe(granted);
    const exclude = toSet(granted);
    const commonPool = COMMON_LANGS.filter(l => !exclude.has(l));
    const rarePool   = RARE_LANGS.filter(l => !exclude.has(l));

    return { granted, pickCommon, pickRare, pools: { common: commonPool, rare: rarePool }, optionalSets };
  }

  /**
   * Aplica as escolhas do usuário a um estado de línguas previamente
   * calculado, retornando a lista final de línguas do personagem.
   *
   * @param {Object} state Estado retornado por `computeLanguagePools`
   * @param {Object} choices Seleções do usuário: `common`, `rare` e
   *   `optional` (array de strings ou null) conforme indicado pelo módulo
   *   de UI.
   * @returns {string[]} Lista final de línguas do personagem (sem
   *   duplicadas).
   */
  function applyChoices(state, { common = [], rare = [], optional = [] }){
    const out = new Set(state.granted);
    // Valida e aplica línguas comuns escolhidas
    const validCommon = common.filter(l => state.pools.common.includes(l)).slice(0, state.pickCommon);
    validCommon.forEach(l => out.add(l));
    // Valida e aplica línguas raras escolhidas
    const validRare   = rare.filter(l => state.pools.rare.includes(l)).slice(0, state.pickRare);
    validRare.forEach(l => out.add(l));
    // Aplica escolhas opcionais
    optional.forEach((choice, idx) => {
      const spec = state.optionalSets?.[idx];
      if (!spec) return;
      // Para "one-of-or-none", uma escolha vazia é aceitável
      if (!choice) return;
      if (spec.pool.includes(choice)) out.add(choice);
    });
    return Array.from(out);
  }

  // --- util de aleatoriedade ---
  function randPick(arr){ return arr.length ? arr[Math.floor(Math.random()*arr.length)] : undefined; }
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Gera escolhas aleatórias válidas a partir de um `state` de línguas.
   * Retorna no mesmo formato esperado por `applyChoices`.
   */
  function pickRandomChoices(state){
    const out = { common: [], rare: [], optional: [] };

    // comuns
    if (state.pickCommon > 0 && state.pools.common?.length){
      out.common = shuffle(state.pools.common).slice(0, state.pickCommon);
    }

    // raras
    if (state.pickRare > 0 && state.pools.rare?.length){
      out.rare = shuffle(state.pools.rare).slice(0, state.pickRare);
    }

    // opcionais (por índice)
    if (Array.isArray(state.optionalSets)){
      out.optional = state.optionalSets.map(spec => {
        if (!spec?.pool?.length) return null;
        if (spec.type === "one-of") {
          return randPick(spec.pool);
        }
        if (spec.type === "one-of-or-none") {
          // 50% de chance de não escolher; ajuste se quiser sempre escolher
          return Math.random() < 0.5 ? null : randPick(spec.pool);
        }
        return null;
      });
    }

    return out;
  }

  /**
   * Atalho: aplica escolhas aleatórias e já devolve a lista final.
   * Retorna { final, choices }.
   */
  function applyRandom(state){
    const choices = pickRandomChoices(state);
    return { final: applyChoices(state, choices), choices };
  }


  // Expõe apenas o objeto `langs` no escopo global. Todas as constantes
  // internas permanecem encapsuladas no IIFE.
  window.langs = {
    COMMON_LANGS: COMMON_LANGS.slice(),
    RARE_LANGS: RARE_LANGS.slice(),
    getRaceBaseLanguages,
    getClassBonusSpec,
    applyContentLanguages,
    computeLanguagePools,
    applyChoices,
	pickRandomChoices,
	applyRandom
  };
})();

