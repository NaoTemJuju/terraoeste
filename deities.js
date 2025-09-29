// deities.js — módulo de Divindades (clássico)
(function () {
  const DEITIES = {
    Ordeiro: [
      { name: "Aorelion",      hint: "Deus criador da Ordem e da Justiça" },
      { name: "Santo Caledros", hint: "Personificação do Sacrifício e da Esperança" },
    ],
    Neutro: [
      { name: "Verdana", hint: "Deusa dos banquetes, da alegria e da natureza" },
      { name: "Nezorox", hint: "Deus da Magia, do Conhecimento, dos Segredos e do Equilíbrio" },
    ],
    Caótico: [
      { name: "Zorraak", hint: "Primeira manifestação do Caos" },
      { name: "Rhuzug",  hint: "O Saqueador, o Bárbaro, a Horda" },
      { name: "Calmira", hint: "Deusa do Ocultismo e Segredos Arcanos" },
    ],
    Any: [
      { name: "Os Perdidos", hint: "Divindades apagadas da história e da memória" },
      // Permite a seleção de “Nenhuma” divindade para classes que não têm divindades obrigatórias.
      // Esta opção não se aplica às classes com divindade fixa (Druida ou Paladino), pois essas
      // são tratadas separadamente em computeDeityOptions. O nome "Nenhuma" será exibido
      // ao usuário e armazenado como a escolha de divindade.
      { name: "Nenhuma", hint: "Nenhuma divindade" },
    ],
  };

  const uniqByName = (arr) => {
    const seen = new Set();
    const out = [];
    for (const d of arr) {
      if (!seen.has(d.name)) { seen.add(d.name); out.push(d); }
    }
    return out;
  };

  /**
   * Regras:
   * - Se classe = Druida → auto = "Verdana"
   * - Se classe = Paladino → auto = "Santo Caledros"
   * - Caso contrário, opções = (por alinhamento) + Any
   */
  function computeDeityOptions({ cls, alignment }) {
    if (cls === "Druida")   return { auto: "Verdana", options: [] };
    if (cls === "Paladino") return { auto: "Santo Caledros", options: [] };

    const aligned = DEITIES[alignment] || [];
    const any = DEITIES.Any || [];
    const options = uniqByName([...aligned, ...any]);
    return { auto: null, options };
  }

  // expõe global
  window.deities = { DEITIES, computeDeityOptions };
})();
