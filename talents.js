// talents.js — módulo de Talentos Raciais (Ancestralidade)
//
// Este módulo centraliza o talento inato que cada raça concede ao
// personagem no nível 1 (equivalente ao traço de "Ancestry" do sistema
// Shadowdark no Foundry VTT). A maioria das raças concede um único
// talento fixo; Elfo e Gnomo oferecem uma escolha entre duas opções.
//
// Os nomes usados em `bonusName` correspondem exatamente ao nome do
// Item "Talent" já existente na pasta "Ancestry" do compêndio PT-BR do
// sistema Shadowdark (ver fvtt-Item-pack-shadowdark-talents.json), para
// que o macro/importador do Foundry consiga localizar e anexar o item
// correto ao ator a partir do .json exportado por este site:
//
//   Anão      -> "Robusto"                        (Stout)
//   Elfo      -> "Visão Aguçada (Armas à Distância)" ou
//                "Visão Aguçada (Conjuração)"      (Farsight: Ranged / Spell)
//   Gnomo     -> "Aptidão (Sorte)" ou "Aptidão (Conjuração)" (Knack: Luck / Spellcasting)
//   Goblin    -> "Sentidos Apurados"               (Keen Senses)
//   Humano    -> "Ambicioso"                       (Ambitious)
//   Meio-Elfo -> (nenhum talento próprio; só línguas, ver languages.js)
//   Meio-Orc  -> "Poderoso"                        (Mighty)
//   Pequenino -> "Furtivo"                         (Stealthy)
(function(){
  'use strict';

  /**
   * Especificação dos talentos raciais.
   * mode:
   *  - "fixed":  concede automaticamente `talent`.
   *  - "choice": jogador escolhe uma opção dentre `options`.
   *  - "none":   raça não concede talento próprio.
   */
  const RACE_TALENT_SPEC = {
    "Anão": {
      mode: "fixed",
      talent: {
        name: "Robusto",
        bonusName: "Robusto",
        desc: "Inicia com +2 PV. Role os pontos de vida a cada nível com Vantagem."
      }
    },
    "Elfo": {
      mode: "choice",
      label: "Visão Aguçada",
      options: [
        {
          key: "ranged",
          name: "Visão Aguçada (Armas à Distância)",
          bonusName: "Visão Aguçada (Armas à Distância)",
          desc: "Você recebe um bônus de +1 em jogadas de ataque com armas à distância, ou um bônus de +1 em testes de conjuração."
        },
        {
          key: "spell",
          name: "Visão Aguçada (Conjuração)",
          bonusName: "Visão Aguçada (Conjuração)",
          desc: "Você recebe um bônus de +1 em jogadas de ataque com armas à distância, ou um bônus de +1 em testes de conjuração."
        }
      ]
    },
    "Gnomo": {
      mode: "choice",
      label: "Aptidão",
      options: [
        {
          key: "luck",
          name: "Aptidão (Sorte)",
          bonusName: "Aptidão (Sorte)",
          desc: "Você começa cada sessão com uma ficha de sorte"
        },
        {
          key: "spell",
          name: "Aptidão (Conjuração)",
          bonusName: "Aptidão (Conjuração)",
          desc: "Você ganha +1 em testes de conjuração."
        }
      ]
    },
    "Goblin": {
      mode: "fixed",
      talent: {
        name: "Sentidos Apurados",
        bonusName: "Sentidos Apurados",
        desc: "Você não pode ser surpreendido"
      }
    },
    "Humano": {
      mode: "fixed",
      talent: {
        name: "Ambicioso",
        bonusName: "Ambicioso",
        desc: "Você ganha uma rolagem de talento adicional no nível 1."
      }
    },
    "Meio-Elfo": {
      mode: "none"
    },
    "Meio-Orc": {
      mode: "fixed",
      talent: {
        name: "Poderoso",
        bonusName: "Poderoso",
        desc: "Você recebe um bônus de +1 em jogadas de ataque e dano com armas corpo a corpo."
      }
    },
    "Pequenino": {
      mode: "fixed",
      talent: {
        name: "Furtivo",
        bonusName: "Furtivo",
        desc: "Uma vez por dia, você pode ficar invisível por 3 rodadas."
      }
    }
  };

  /** Retorna a especificação de talento racial (nunca retorna undefined). */
  function getRaceTalentSpec(race){
    return RACE_TALENT_SPEC[race] || { mode: "none" };
  }

  /** Indica se a raça exige uma escolha do jogador. */
  function needsChoice(race){
    return getRaceTalentSpec(race).mode === "choice";
  }

  /** Lista de opções disponíveis para raças com escolha (vazio caso contrário). */
  function getChoiceOptions(race){
    const spec = getRaceTalentSpec(race);
    return spec.mode === "choice" ? spec.options.slice() : [];
  }

  /**
   * Resolve o talento final concedido pela raça.
   * @param {string} race
   * @param {string} [chosenKey] chave da opção escolhida (para raças com "choice")
   * @returns {Object|null} objeto { name, bonusName, desc } ou null se a raça não concede talento
   */
  function resolveTalent(race, chosenKey){
    const spec = getRaceTalentSpec(race);
    if (spec.mode === "fixed") return spec.talent;
    if (spec.mode === "choice"){
      return spec.options.find(o => o.key === chosenKey) || spec.options[0];
    }
    return null;
  }

  /** Escolhe aleatoriamente uma chave válida para raças com "choice" (ou null). */
  function randomChoiceKey(race){
    const opts = getChoiceOptions(race);
    if (!opts.length) return null;
    return opts[Math.floor(Math.random() * opts.length)].key;
  }

  /**
   * Monta as entradas para o array `bonuses` do .json de exportação
   * (mesmo formato usado pelo importador do Foundry para línguas e
   * magias de classe). Retorna um array vazio quando a raça não
   * concede talento (ex.: Meio-Elfo).
   */
  function buildBonuses(race, chosenKey){
    const talent = resolveTalent(race, chosenKey);
    if (!talent) return [];
    return [{
      sourceType: "Race",
      sourceName: race || "",
      sourceCategory: "Talent",
      gainedAtLevel: 1,
      name: talent.name,
      bonusTo: "",
      bonusName: talent.bonusName,
      desc: talent.desc || ""
    }];
  }

  window.raceTalents = {
    getRaceTalentSpec,
    needsChoice,
    getChoiceOptions,
    resolveTalent,
    randomChoiceKey,
    buildBonuses
  };
})();
