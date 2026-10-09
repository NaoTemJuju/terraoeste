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
  const classInfoAbility = $("#classInfoAbility");
  const classTalentChoices = $("#classTalentChoices");
  const classFeatureChoices = $("#classFeatureChoices");
  const classTalentTable = $("#classTalentTable");
  const mageSpellTables = $("#mageSpellTables");
  const classLevelTalent = $("#classLevelTalent");
  const classLevelTalentTable = $("#classLevelTalentTable");
  const btnContinueClassTalent = $("#btnContinueClassTalent");
  const STAT_CODES = { Força: "STR", Destreza: "DEX", Constituição: "CON", Inteligência: "INT", Sabedoria: "WIS", Carisma: "CHA" };
  const FIGHTER_WEAPON_TYPES = [
    { label: "Adaga", value: "Dagger" }, { label: "Arco Curto", value: "Shortbow" },
    { label: "Arco Longo", value: "Longbow" }, { label: "Azagaia", value: "Javelin" },
    { label: "Besta", value: "Crossbow" }, { label: "Boleadeira", value: "Bolas" },
    { label: "Cajado", value: "Staff" }, { label: "Chicote", value: "Whip" },
    { label: "Cimitarra", value: "Scimitar" }, { label: "Clava", value: "Club" },
    { label: "Corrente Laminada", value: "Razor chain" }, { label: "Espada Bastarda", value: "Bastard sword" },
    { label: "Espada Curta", value: "Shortsword" }, { label: "Espada Grande", value: "Greatsword" },
    { label: "Espada Longa", value: "Longsword" }, { label: "Funda", value: "Sling" },
    { label: "Lança", value: "Spear" }, { label: "Maça", value: "Mace" },
    { label: "Maça Estrela", value: "Morning Star" }, { label: "Machadinha", value: "Handaxe" },
    { label: "Machado Grande", value: "Greataxe" }, { label: "Martelo de Guerra", value: "Warhammer" },
    { label: "Pique", value: "Pike" }, { label: "Propulsor", value: "Spear-thrower" },
    { label: "Shuriken", value: "Shuriken" }, { label: "Zarabatana", value: "Blowgun" },
    { label: "Bastão", value: "Stave" }
  ];
  const FIGHTER_CLASS_FEATURES = {
    "Guerreiro": {
      fixedDescription: "Carregador: some seu modificador de Constituição, se positivo, aos espaços de equipamento.",
      choiceDescription: "Maestria em Armas: escolha um tipo de arma para receber +1 em ataques e dano, além de metade do seu nível (arredondada para baixo). Bravura: escolha Força ou Destreza para ter vantagem em testes dessa categoria usados para superar uma força oposta."
    }
  };
  const MAGE_SPELLS = [
    { label: "Alarme", value: "Alarm", duration: "1 dia", range: "Adjacente" },
    { label: "Armadura Arcana", value: "Mage Armor", duration: "10 rodadas", range: "Você" },
    { label: "Detectar Magia", value: "Detect Magic", duration: "Concentração", range: "Perto" },
    { label: "Disco Flutuante", value: "Floating Disk", duration: "10 rodadas", range: "Perto" },
    { label: "Encantar Pessoa", value: "Charm Person", duration: "1d8 dias", range: "Perto" },
    { label: "Luz", value: "Light", duration: "1h (tempo real)", range: "Adjacente" },
    { label: "Mãos Flamejantes", value: "Burning Hands", duration: "Instantâneo", range: "Adjacente" },
    { label: "Míssil Mágico", value: "Magic Missile", duration: "Instantâneo", range: "Longe" },
    { label: "Obstruir Porta", value: "Hold Portal", duration: "10 rodadas", range: "Perto" },
    { label: "Proteção contra o Mal", value: "Protection from Evil", duration: "Concentração", range: "Adjacente" },
    { label: "Queda Suave", value: "Feather Fall", duration: "Instantâneo", range: "Você" },
    { label: "Sono", value: "Sleep", duration: "Instantâneo", range: "Perto" }
  ];
    const RANGER_REMEDIES = [
    { label: "Salve (CD 11)", value: "Salve" },
    { label: "Estimulante (CD 12)", value: "Stimulant" },
    { label: "Foebane (CD 13)", value: "Foebane" },
    { label: "Restaurador (CD 14)", value: "Restorative" },
    { label: "Curativo (CD 15)", value: "Curative" }
  ];
  const MAGE_ITEM_TYPES = [
    { label: "Armadura mágica", value: "Armor" },
    { label: "Arma mágica", value: "Weapon" },
    { label: "Poção", value: "Potion" },
    { label: "Pergaminho", value: "Scroll" },
    { label: "Varinha", value: "Wand" },
    { label: "Item mágico diverso", value: "Miscellaneous" }
  ];
  const FIGHTER_WEAPON_LABELS = Object.fromEntries(FIGHTER_WEAPON_TYPES.map(item => [item.value, item.label]));
  const FIGHTER_ARMOR_TYPES = [
    { label: "Armadura de Couro", value: "Leather armor" },
    { label: "Cota de Malha", value: "Chainmail" },
    { label: "Armadura de Placas", value: "Plate mail" }
  ];

  function makeClassFeatureBonuses(cls, choices){
    if (!["Guerreiro", "Fighter"].includes(cls) || !choices) return [];
    const weapon = FIGHTER_WEAPON_TYPES.find(item => item.value === choices.weaponMastery);
    const grit = choices.grit;
    const sourceName = "Fighter";
    const bonuses = [];
    if (weapon) bonuses.push({
      sourceType: "Class", sourceName, sourceCategory: "Ability", name: "WeaponMastery",
      bonusName: "Plus1AttackAndDamagePlusHalfLevel", bonusTo: weapon.value, gainedAtLevel: 1
    });
    if (grit === "Strength" || grit === "Dexterity") bonuses.push({
      sourceType: "Class", sourceName, sourceCategory: "Ability", name: "Grit",
      bonusName: grit, bonusTo: "AdvantageOnStatChecks", gainedAtLevel: 1
    });
    return bonuses;
  }
  window.app.getClassFeatureBonuses = makeClassFeatureBonuses;
  window.app.getClassFeatureDisplay = (cls, choices) => {
    if (!choices) return "";
    if (cls === "Mago") {
      const spells = (choices.mageSpells || []).map(value => MAGE_SPELLS.find(spell => spell.value === value)?.label).filter(Boolean);
      return spells.length ? `Magias de 1º círculo: ${spells.join(", ")}` : "";
    }
    if (!["Guerreiro", "Fighter"].includes(cls)) return "";
    const weapon = FIGHTER_WEAPON_LABELS[choices.weaponMastery];
    const grit = choices.grit === "Strength" ? "Força" : choices.grit === "Dexterity" ? "Destreza" : "";
    return [weapon ? `Maestria em Armas: ${weapon}` : "", grit ? `Bravura: ${grit}` : ""].filter(Boolean).join("; ");
  };
  window.app.randomClassFeatureChoices = cls => {
    if (cls === "Guerreiro") return {
      weaponMastery: FIGHTER_WEAPON_TYPES[randInt(0, FIGHTER_WEAPON_TYPES.length - 1)].value,
      grit: randInt(0, 1) ? "Strength" : "Dexterity"
    };
    if (cls === "Mago") {
      const pool = [...MAGE_SPELLS];
      const mageSpells = [];
      while (mageSpells.length < 3) mageSpells.push(pool.splice(randInt(0, pool.length - 1), 1)[0].value);
      return { mageSpells };
    }
    return null;
  };

  // Descrições da tradução PT-BR do compêndio de classes do Foundry.
  // Só associa classes do site com equivalentes claros no compêndio.
  const THIEF_DESCRIPTION = "Assassinos que se esgueiram por telhados, vigaristas sorridentes ou escaladores encapuzados que podem arrancar uma pedra preciosa das garras de um demônio adormecido e vendê-la pelo dobro de seu preço.";
  const THIEF_SPECIAL_ABILITY = [
    "Apunhalada Pelas Costas. Se acertar uma criatura que não esteja ciente do seu ataque, você causa dano extra com o dado da arma. Adicione dados de arma adicionais equivalentes à metade do seu nível (arredondando para baixo).",
    "",
    "Ladroagem. Você tem proficiência em habilidades de roubo e possui as ferramentas necessárias para isso escondidas com você (elas não ocupam espaços de equipamento). Você é treinado nas habilidades a seguir e tem Vantagem em qualquer teste associado a elas:",
    "• Escalar.",
    "• Esgueirar-se e esconder-se.",
    "• Usar disfarces.",
    "• Encontrar e desarmar armadilhas.",
    "• Tarefas delicadas como roubar bolsos e abrir fechaduras."
  ].join("\n");
  const RANGER_SPECIAL_ABILITY = [
    "Desbravador. Você tem Vantagem em testes relacionados a navegação, rastreamento, sobrevivência na natureza, furtividade e animais selvagens.",
    "",
    "Herbalismo. Faça um teste de Inteligência para preparar um remédio à sua escolha. Se falhar, não poderá preparar esse remédio novamente até descansar com sucesso. Remédios não usados expiram em 3 rodadas.",
    "11 — Salve: cura 1 PV.",
    "12 — Estimulante: você não pode ser surpreendido por 10 rodadas.",
    "13 — Mata-inimigo: você tem Vantagem em ataques e dano contra um tipo de criatura escolhido por 1d6 rodadas.",
    "14 — Restaurador: encerra um veneno ou uma doença.",
    "15 — Curativo: equivale a uma Poção de Cura."
  ].join("\n");
  const BARD_SPECIAL_ABILITY = [
    "Línguas. Você conhece quatro línguas comuns adicionais e uma língua rara.",
    "",
    "Artes Bárdicas. Você é treinado em oratória, artes cênicas, conhecimento geral e diplomacia. Você tem Vantagem em testes relacionados.",
    "",
    "Fascinar (Foco). Faça um teste de Carisma CD 12. Em caso de sucesso, você transfixa todos os alvos próximos cujo nível seja igual ou inferior a 1 + metade do seu nível (arredondado para baixo). Se falhar (exceto ao perder o foco), não poderá usar Fascinar novamente até descansar.",
    "",
    "Inspirar. A cada dia, você pode conceder um número de fichas de sorte igual ao seu modificador de Carisma (mínimo 1).",
    "",
    "Mago Diletante. Você pode ativar pergaminhos mágicos e varinhas usando Carisma como sua habilidade de conjuração. Em caso de falha crítica, role um acidente mágico. Em vez de fazer uma rolagem de talento, você pode escolher encontrar uma varinha aleatória de sacerdote ou mago."
  ].join("\n");
  const ASSASSIN_SPECIAL_ABILITY = [
    "Assassino. Você tem Vantagem em testes para se esgueirar e se esconder. Seus ataques causam dano dobrado em alvos que não estão cientes de sua presença.",
    "",
    "Passo de Fumaça. 3 vezes por dia, você pode se teleportar para um local visível e próximo. Isso não gasta sua ação.",
    "",
    "Lótus Negra. Você conquistou o direito de comer uma pétala da lendária flor de lótus negra e sobreviveu aos seus efeitos místicos. Role um talento na tabela Talentos da Lótus Negra."
  ].join("\n");
  const CLASS_DESCRIPTIONS = {
    "Assassino": "Assassinos vestidos de preto, treinados desde a infância em um mosteiro oculto no deserto. Eles ganham poderes místicos de uma lendária flor de lótus negra, concedida por um demônio.",
    "Bárbaro": "Guerreiros de fúria primeva que entram em um frenesi cego e sanguinário no calor da batalha, incapazes de distinguir amigo de inimigo.",
    "Malandro": THIEF_DESCRIPTION,
    "Ladrão": THIEF_DESCRIPTION,
    "Bardo": "Bardos são viajantes bem-vindos e conselheiros sábios; sua tarefa é proteger e compartilhar o conhecimento transmitido através dos tempos.",
    "Guerreiro": "Gladiadores ensanguentados usando armaduras amassadas, duelistas acrobáticos com suas espadas de arremesso, ou arqueiros élficos de visão aguçada que forjam suas lendas com aço e coragem.",
    "Mago": "Adeptos tatuados com runas, sábios usando óculos, e bruxas conjuradoras de chamas que ousam manipular as terríveis forças da magia.",
    "Patrulheiro": "Rastreadores habilidosos, andarilhos furtivos e guerreiros incomparáveis que chamam as terras selvagens de lar.",
    "Sacerdote": "Templários cruzados, xamãs proféticos, ou fanáticos com olhos enlouquecidos que empunham o poder de seus deuses para expurgar os impuros."
  };
  const CLASS_EQUIPMENT_INFO = {
    "Assassino": { weapons: "Adaga, boleadeira, chicote de lâminas, cimitarra, lança, shuriken e zarabatana", armor: "Armadura de couro", hp: "1d6 por nível", languages: "Diabólico" },
    "Bárbaro": { weapons: "Adaga, arco longo, espada longa, espadão, lança, machado, machado de batalha e machadão", armor: "Armadura de couro e escudos", hp: "1d8 por nível" },
    "Bardo": { weapons: "Adaga, arco curto, besta, cajado, espada curta, lança e maça", armor: "Armadura de couro, cota de malha e escudos", hp: "1d6 por nível" },
    "Patrulheiro": { weapons: "Adaga, arco longo, espada longa, arco curto, espada curta, lança e cajado", armor: "Armadura de couro e cota de malha", hp: "1d8 por nível" },
    "Guerreiro": { weapons: "Todas as armas", armor: "Todas as armaduras", hp: "1d8 por nível" },
    "Malandro": { weapons: "Adaga, besta, clava, espada curta e arco curto", armor: "Armadura de couro e cota de malha de mithral", hp: "1d4 por nível" },
    "Ladrão": { weapons: "Adaga, besta, clava, espada curta e arco curto", armor: "Armadura de couro e cota de malha de mithral", hp: "1d4 por nível" },
    "Mago": { weapons: "Adaga e cajado", armor: "Nenhuma", hp: "1d4 por nível" }
  };

  const CLASS_TALENT_TABLES = {
    "Assassino": {
      title: "Talentos de Ras-Godai",
      entries: [
        { roll: "2", effect: "Você é treinado no uso de venenos (veja pág. 27)" },
        { roll: "3–6", effect: "Role um talento adicional da tabela Talentos da Lótus Negra" },
        { roll: "7–9", effect: "+2 em Força ou Destreza, ou +1 em ataques corpo a corpo" },
        { roll: "10–11", effect: "Ganhe um uso adicional do talento Passo de Fumaça" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ],
      secondaryTitle: "Talentos da Lótus Negra",
      secondaryDice: "d12",
      secondaryEntries: [
        { roll: "1", effect: "Ganhe dois talentos da Lótus Negra; role novamente qualquer 1 adicional" },
        { roll: "2", effect: "1/dia, ao causar dano com uma arma, paralise um alvo de NV 9 ou menor por 1d4 rodadas" },
        { roll: "3", effect: "Vantagem em testes de Destreza para evitar aprisionamentos ou ferimentos" },
        { roll: "4", effect: "+1 na CA ao empunhar uma arma corpo a corpo em cada mão" },
        { roll: "5", effect: "Ganhe um dado de pontos de vida adicional" },
        { roll: "6", effect: "Você causa o triplo de dano com seu talento Assassino" },
        { roll: "7", effect: "Inimigos que veem você fazem teste de moral CD 18 em vez de 15" },
        { roll: "8", effect: "1/dia, ande sobre a água por 1d4 rodadas como se fosse uma superfície sólida" },
        { roll: "9", effect: "1/dia, escolha uma criatura viva de NV 5 ou menor perto de você; ela deve passar em um teste de Constituição CD 15 ou adormece" },
        { roll: "10", effect: "1/dia, ande em superfícies íngremes, como paredes, por 1d4 rodadas" },
        { roll: "11", effect: "Cause +1 de dano com armas corpo a corpo" },
        { roll: "12", effect: "1/dia, escolha uma criatura viva de NV 9 ou menor que esteja perto; ela deve passar em um teste de Sabedoria CD 15 ou não poderá vê-lo nem ouvi-lo por 1d4 rodadas" }
      ]
    },
    "Mago": {
      title: "Talentos de Mago",
      entries: [
        { roll: "2", effect: "Crie 1 item mágico aleatório de qualquer tipo, à sua escolha (pág. 288)" },
        { roll: "3–7", effect: "+2 em Inteligência ou +1 em testes de conjuração de magias de mago" },
        { roll: "8–9", effect: "Ganhe Vantagem na conjuração de uma magia que você conhece" },
        { roll: "10–11", effect: "Aprenda outra magia de mago de qualquer grau que você conheça" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Bárbaro": {
      title: "Talentos de Bárbaro",
      effectHeader: "Efeito (2 duplicado = aumenta o alcance de crítico em 1; ex.: 18–20)",
      entries: [
        { roll: "2", effect: "Você causa crítico em ataques corpo a corpo com resultado 19" },
        { roll: "3–6", effect: "+1 de dano para ataques corpo a corpo" },
        { roll: "7–9", effect: "+2 em Força ou Constituição, ou +1 em ataques corpo a corpo" },
        { roll: "10–11", effect: "Ganhe um uso adicional da habilidade Fúria a cada dia" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Bardo": {
      title: "Talentos de Bardo",
      effectHeader: "Efeito (2 duplicado = rolar novamente)",
      entries: [
        { roll: "2", effect: "Você tem Vantagem em testes de tempo livre, exceto farra" },
        { roll: "3–6", effect: "+1 para ataques corpo a corpo e à distância ou +1 em testes de Fascinar" },
        { roll: "7–9", effect: "Distribua +2 pontos entre seus atributos" },
        { roll: "10–11", effect: "Adicione +2 às rolagens de Farra do seu grupo" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre seus atributos" }
      ]
    },
    "Guerreiro": {
      title: "Talentos de Guerreiro",
      entries: [
        { roll: "2", effect: "Ganhe Maestria em Armas em um tipo de arma adicional" },
        { roll: "3–6", effect: "+1 em ataques corpo a corpo e à distância" },
        { roll: "7–9", effect: "+2 no atributo Força, Destreza ou Constituição" },
        { roll: "10–11", effect: "Escolha um tipo de armadura e receba +1 na CA ao usá-la" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Patrulheiro": {
      title: "Talentos de Patrulheiro",
      entries: [
        { roll: "2", effect: "Dado de Dano de Arma Aumentado" },
        { roll: "3–6", effect: "Escolha +1 para ataques corpo a corpo e dano ou ataques à distância e dano" },
        { roll: "7–9", effect: "Escolha +2 em Força, Destreza ou Inteligência" },
        { roll: "10–11", effect: "Vantagem em Teste de Herbalismo" },
        { roll: "12", effect: "Escolha um talento da tabela ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Malandro": {
      title: "Talentos de Ladrão",
      entries: [
        { roll: "2", effect: "Ganhe Vantagem nas rolagens de iniciativa (role novamente se repetir)" },
        { roll: "3–5", effect: "Sua Apunhalada Pelas Costas causa +1 dado de dano" },
        { roll: "6–9", effect: "+2 no atributo Força, Destreza ou Carisma" },
        { roll: "10–11", effect: "+1 em ataques corpo a corpo e à distância" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Ladrão": {
      title: "Talentos de Ladrão",
      entries: [
        { roll: "2", effect: "Ganhe Vantagem nas rolagens de iniciativa (role novamente se repetir)" },
        { roll: "3–5", effect: "Sua Apunhalada Pelas Costas causa +1 dado de dano" },
        { roll: "6–9", effect: "+2 no atributo Força, Destreza ou Carisma" },
        { roll: "10–11", effect: "+1 em ataques corpo a corpo e à distância" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    }
  };

  // Dados estruturados para o primeiro talento de classe. Novas tabelas
  // podem usar o mesmo fluxo sem misturar essa rolagem com a escolha de
  // habilidade especial configurada pelo GM.
  const MAGE_SPECIAL_ABILITY = [
    "Aprendendo Magias. Você pode aprender permanentemente uma magia de mago a partir de um pergaminho mágico, ao estudá-lo por um dia e ser bem-sucedido em um teste de Inteligência CD 15. Independentemente de sucesso ou falha, você gasta o pergaminho mágico. Magias que você aprende dessa forma não são contabilizadas no seu número de magias conhecidas.",
    "",
    "Conjuração. Você pode conjurar as magias de mago que você conhece. Você conhece três magias de grau 1, à sua escolha, da lista de magias de mago. A cada nível que você ganhar, escolha novas magias de mago para aprender, de acordo com a tabela de Magias de Mago Conhecidas. Para conjurar magias de mago, veja Conjuração, na pág. 44."
  ].join("\n");
  const CLASS_SPECIAL_ABILITIES = {
    "Assassino": ASSASSIN_SPECIAL_ABILITY,
    "Mago": MAGE_SPECIAL_ABILITY,
    "Bardo": BARD_SPECIAL_ABILITY,
    "Bárbaro": [
      "Instinto Primitivo. Você tem Vantagem em testes para evitar armadilhas e outros perigos que possa ver ou ouvir.",
      "",
      "Devastar. Durante a Fúria, ao finalizar um inimigo, use o dano excedente contra um alvo próximo, desde que a CA dele seja igual ou inferior.",
      "",
      "Fúria. Uma vez por dia, por 3 rodadas:",
      "• Reduz todo o dano sofrido em 1d4.",
      "• Você tem Vantagem em ataques corpo a corpo.",
      "• Você fica imune a efeitos de medo e encantamento.",
      "• Inimigos fazem testes de moral com Desvantagem.",
      "• Você deve atacar um inimigo ou aliado no seu turno.",
      "• Ao fim do efeito, faça um teste de Constituição CD 15 ou perca 1 ponto de Constituição.",
      "Você recupera o ponto de Constituição perdido após uma noite de descanso."
    ].join("\n"),
    "Patrulheiro": RANGER_SPECIAL_ABILITY,
    "Malandro": THIEF_SPECIAL_ABILITY,
    "Ladrão": THIEF_SPECIAL_ABILITY
  };

  const ASSASSIN_BONUS_ALIASES = {
  "AssassinPoisonTraining": "UsePoisons",
  "AssassinSmokeStepExtraUse": "ImpSmokeStep",
  "AssassinLotusParalysis": "ParalyseOnWeaponHit",
  "AssassinLotusDexterityAdvantage": "ADVonDEXToAvoidEntrapment",
  "AssassinLotusDualWieldAC": "Plus1ACWhenDualWield",
  "AssassinLotusExtraHitDie": "PlusOneHitDie",
  "AssassinLotusTripleDamage": "TripleDamageAssassinate",
  "AssassinLotusMoral": "Morale18",
  "AssassinLotusWaterWalking": "WalkOnWater",
  "AssassinLotusSleep": "MakeAsleep",
  "AssassinLotusWallWalking": "WalkOnWalls",
  "AssassinLotusMeleeDamage": "Plus1ToMeleeDamage",
  "AssassinLotusUnseen": "Invisible"
};
  const ASSASSIN_BLACK_LOTUS_TALENTS = [
    null, // d12 index 0 is unused.
    null, // d12 result 1 rolls two additional talents.
    { id: "AssassinLotusParalysis", name: "Paralisar um Alvo", effect: "1/dia, ao causar dano com uma arma, paralise um alvo de NV 9 ou menor por 1d4 rodadas" },
    { id: "AssassinLotusDexterityAdvantage", name: "Evitar Aprisionamento/Ferimentos", effect: "Vantagem em testes de Destreza para evitar aprisionamentos ou ferimentos" },
    { id: "AssassinLotusDualWieldAC", name: "+1 CA com Duas Armas", effect: "+1 na CA ao empunhar uma arma corpo a corpo em cada mão" },
    { id: "AssassinLotusExtraHitDie", name: "PV Adicional", effect: "Ganhe um dado de pontos de vida adicional" },
    { id: "AssassinLotusTripleDamage", name: "Dano Triplo de Assassino", effect: "Você causa o triplo de dano com seu talento Assassino" },
    { id: "AssassinLotusMoral", name: "Testes de Moral com CD 18", effect: "Inimigos que veem você fazem teste de moral CD 18 em vez de 15" },
    { id: "AssassinLotusWaterWalking", name: "Andar sobre a Água", effect: "1/dia, ande sobre a água por 1d4 rodadas como se fosse uma superfície sólida" },
    { id: "AssassinLotusSleep", name: "Adormecer Criatura", effect: "1/dia, uma criatura viva de NV 5 ou menor perto de você testa Constituição CD 15 ou adormece" },
    { id: "AssassinLotusWallWalking", name: "Andar em Superfícies Íngremes", effect: "1/dia, ande em superfícies íngremes, como paredes, por 1d4 rodadas" },
    { id: "AssassinLotusMeleeDamage", name: "+1 para Dano Corpo a Corpo", effect: "Cause +1 de dano com armas corpo a corpo" },
    { id: "AssassinLotusUnseen", name: "Esconder-se de Criatura", effect: "1/dia, uma criatura viva de NV 9 ou menor testa Sabedoria CD 15 ou não poderá vê-lo nem ouvi-lo por 1d4 rodadas" }
  ];
  function rollAssassinLotusResults(){
    const rollOne = () => {
      let roll = randInt(1, 12);
      while (roll === 1) roll = randInt(1, 12);
      const talent = ASSASSIN_BLACK_LOTUS_TALENTS[roll];
      return { roll, id: talent.id, talentRolledName: talent.name, talentRolledDesc: talent.effect, displayDesc: talent.effect, bonusName: ASSASSIN_BONUS_ALIASES[talent.id], bonusTo: ASSASSIN_BONUS_ALIASES[talent.id] };
    };
    const initialRoll = randInt(1, 12);
    if (initialRoll === 1) return [rollOne(), rollOne()];
    const talent = ASSASSIN_BLACK_LOTUS_TALENTS[initialRoll];
    return [{ roll: initialRoll, id: talent.id, talentRolledName: talent.name, talentRolledDesc: talent.effect, displayDesc: talent.effect, bonusName: ASSASSIN_BONUS_ALIASES[talent.id], bonusTo: ASSASSIN_BONUS_ALIASES[talent.id] }];
  }

  const CLASS_LEVEL_TALENTS = {
    "Assassino": {
      foundryName: "Assassino",
      title: "Talentos de Ras-Godai",
      entries: [
        { min: 2, max: 2, id: "AssassinPoisonTraining", name: "Treinamento em Venenos", desc: "Você é treinado no uso de venenos", foundryDesc: "Trained in the use of poisons", bonusName: "UsePoisons" },
        { min: 3, max: 6, id: "AssassinBlackLotusRoll", name: "Talento da Lótus Negra Adicional", choice: "assassinBlackLotus", desc: "Role um talento adicional da tabela Talentos da Lótus Negra", foundryDesc: "Roll an additional Black Lotus talent", bonusName: "" },
        { min: 7, max: 9, id: "AssassinStatOrMelee", choice: "assassinStatOrMelee", desc: "+2 em Força ou Destreza, ou +1 em ataques corpo a corpo", foundryDesc: "+2 Strength or Dexterity, or +1 to melee attacks" },
        { min: 10, max: 11, id: "AssassinSmokeStepExtraUse", name: "Uso Adicional de Passo de Fumaça", desc: "Ganhe um uso adicional do talento Passo de Fumaça", foundryDesc: "Gain one additional use of Smoke Step", bonusName: "ImpSmokeStep" },
        { min: 12, max: 12, id: "AssassinChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos", foundryDesc: "Choose a talent or distribute +2 points among ability scores" }
      ]
    },
    "Mago": {
      foundryName: "Mago",
      title: "Talentos de Mago",
      entries: [
        { min: 2, max: 2, id: "MakeRandomMagicItem", name: "Criar um Item Mágico Aleatório", choice: "magicItem", desc: "Crie 1 item mágico aleatório de qualquer tipo, à sua escolha", foundryDesc: "Create one random magic item of any type, your choice", bonusName: "MakeRandomMagicItem" },
        { min: 3, max: 7, id: "Plus2INTOrPlus1Casting", choice: "mageStatOrCasting", desc: "+2 em Inteligência ou +1 em testes de conjuração de magias de mago", foundryDesc: "+2 Intelligence or +1 to casting checks for mage spells" },
        { min: 8, max: 9, id: "AdvOnCastOneSpell", name: "Vantagem em Conjuração", choice: "mageKnownSpell", desc: "Ganhe Vantagem na conjuração de uma magia que você conhece", foundryDesc: "Gain Advantage casting one spell you know", bonusName: "AdvOnCastOneSpell" },
        { min: 10, max: 11, id: "PickExtraSpell", name: "Aprender uma Magia de Mago", choice: "mageExtraSpell", desc: "Aprenda outra magia de mago de qualquer grau que você conheça", foundryDesc: "Learn one additional mage spell of any tier you know", bonusName: "PickExtraSpell" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Bardo": {
      // O importador do Shadowdark converte o identificador "Bard" em "Bard (Legacy)".
      foundryName: "Bard",
      title: "Talentos de Bardo",
      entries: [
        { min: 2, max: 2, id: "BardDowntimeAdvantage", name: "Vantagem em Testes de Tempo Livre", desc: "Você tem Vantagem em testes de tempo livre, exceto farra. Role novamente se este resultado 2 já tiver sido obtido", foundryDesc: "Advantage on downtime checks, excluding carousing; reroll duplicate results of 2", exportAsBonus: false },
        { min: 3, max: 6, id: "BardAttackOrFascinate", choice: "bardAttackOrFascinate", desc: "+1 para ataques corpo a corpo e à distância ou +1 em testes de Fascinar", foundryDesc: "+1 to melee and ranged attacks or +1 to Fascinate checks" },
        { min: 7, max: 9, id: "TwoStatPoints", choice: "distributeStats", desc: "Distribua +2 pontos entre seus atributos", foundryDesc: "Distribute +2 points among ability scores", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "BardCarousingBonus", name: "+2 em Rolagens de Farra", desc: "Adicione +2 às rolagens de Farra do seu grupo", foundryDesc: "Add +2 to your party's carousing rolls", exportAsBonus: false },
        { min: 12, max: 12, id: "BardChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre seus atributos", foundryDesc: "Choose a talent or distribute +2 points among ability scores" }
      ]
    },
    "Patrulheiro": {
      foundryName: "Patrulheiro",
      title: "Talentos de Patrulheiro",
      entries: [
        { min: 2, max: 2, id: "IncreasedWeaponDamageDie", name: "Dado de Dano de Arma Aumentado", choice: "rangerWeaponDamage", desc: "Dado de Dano de Arma Aumentado", foundryDesc: "Increased Weapon Damage Die", bonusName: "SetWeaponTypeDamage" },
        { min: 3, max: 6, id: "RangerAttackBonus", choice: "rangerAttackBonus", desc: "Escolha +1 para ataques corpo a corpo e dano ou ataques à distância e dano", foundryDesc: "Choose +1 to melee attacks and damage or ranged attacks and damage" },
        { min: 7, max: 9, id: "StatBonus", choice: "stat", statOptions: ["STR", "DEX", "INT"], desc: "+2 em Força, Destreza ou Inteligência", foundryDesc: "+2 Strength, Dexterity, or Intelligence", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "HerbalismCheckAdvantage", name: "Vantagem em Teste de Herbalismo", choice: "rangerHerbalism", desc: "Vantagem em Teste de Herbalismo", foundryDesc: "Herbalism Check Advantage", bonusName: "ReduceHerbalismDC" },
        { min: 12, max: 12, id: "RangerChooseTalentOrStats", choice: "rangerTwelve", desc: "Escolha um talento da tabela ou distribua +2 pontos entre os atributos", foundryDesc: "Choose a talent from the table or distribute +2 points among ability scores" }
      ]
    },
    "Bárbaro": {
      foundryName: "Bárbaro",
      title: "Talentos de Bárbaro",
      entries: [
        { min: 2, max: 2, id: "BarbarianCriticalRange", name: "Crítico corpo a corpo (19)", desc: "Você causa crítico em ataques corpo a corpo com resultado 19. Cada resultado 2 adicional amplia o alcance crítico em 1", foundryDesv󭵶���k�w��automação de expiração de remédios, bloqueio após falha ou todos os efeitos narrativos de cada remédio.

## 9. Duas tabelas do Assassino

### Ras-Godai: 2d6

| Resultado | Tratamento |
| --- | --- |
| 2 | Treinamento em Venenos; a regra determina rolar novamente se duplicado |
| 3–6 | Rolar um talento adicional na Lótus Negra |
| 7–9 | Escolher +2 FOR, +2 DES ou +1 em ataques corpo a corpo |
| 10–11 | Uso adicional de Passo de Fumaça |
| 12 | Escolher talento ou distribuir +2 pontos entre atributos |

### Lótus Negra: d12

| Resultado | Talento/regra |
| --- | --- |
| 1 | Ganhar dois talentos; rerrolar quaisquer novos resultados 1 |
| 2 | Paralisar um Alvo |
| 3 | Evitar Aprisionamento/Ferimentos |
| 4 | +1 CA com Duas Armas |
| 5 | PV Adicional |
| 6 | Dano Triplo de Assassino |
| 7 | Testes de Moral com CD 18 |
| 8 | Andar sobre a Água |
| 9 | Adormecer Criatura |
| 10 | Andar em Superfícies Íngremes |
| 11 | +1 para Dano Corpo a Corpo |
| 12 | Esconder-se de Criatura |

O array tem índices 0 e 1 reservados. A implementação antiga tinha somente um `null`, deslocando os resultados e deixando o 12 sem item. O PR #3 corrigiu isso. O Victor antigo tinha moral registrado com `roll: 6`; a tabela correta associa moral a **7**.

A regra permite manter ou rerrolar talentos duplicados da Lótus Negra. A implementação atual pode retornar duplicados; não descreva os dois talentos do resultado 1 como obrigatoriamente distintos. A rerrolagem de novos resultados 1 é obrigatória.

Ao expandir `AssassinBlackLotusRoll`, `getClassLevelTalent` usa os resultados secundários para formar os bônus. A entrada de ação da tabela não deve virar um bônus técnico desconhecido no importador.

## 10. Formatação das descrições

As informações de equipamento e PV foram levadas para a descrição das classes, mantendo rótulos em negrito e rótulo/valor na mesma linha. Houve duas etapas de ajuste: unir rótulos com seus valores e acrescentar espaço vertical entre o texto introdutório e cada bloco de equipamento/PV.

Formato de referência:

```html
<p><em>Texto introdutório da classe.</em></p>
<p><em><strong>Armas:</strong> lista de armas.</em></p>
<p><em><strong>Armaduras:</strong> lista de armaduras.</em></p>
<p><em><strong>Pontos de Vida:</strong> 1d8 por nível.</em></p>
```

Confira também margens CSS. Não insira um salto de linha entre `Armas:` e o primeiro nome da lista. Um `\n` em uma string HTML não garante espaço vertical visível.


## 11. Bárbaro

O gerador já tinha Bárbaro em `CLASS_DICE` com d8 de PV; a inclusão em `class.js` acrescenta descrição, equipamento, habilidades e a tabela 2d6 enviada pelo usuário. A habilidade Fúria fica descrita com duração, redução de dano, Vantagem, imunidades, moral, obrigação de atacar e teste de Constituição ao fim. A descrição de Devastar preserva a condição de CA do alvo.

Na tabela de talentos, o resultado 7–9 pede uma escolha explícita entre +2 FOR, +2 CON e +1 em ataques corpo a corpo. A escolha manual e o sorteio automático usam `StatBonus` com `STR:+2`/`CON:+2` ou `Plus1ToHit` com `Melee attacks`, identificadores já usados pelo projeto e cobertos pelo mapa oficial consultado. O resultado 3–6 usa `Plus1ToMeleeDamage`, chave já utilizada para o talento de dano da Lótus Negra.

O módulo independente `terraoeste-class-content` fornece documentos nativos para o conteúdo ausente. Crítico e usos adicionais de Fúria agora exportam `TerraOeste.BarbarianCriticalRange` e `TerraOeste.BarbarianExtraFuryUse`, registrados com UUIDs reais em `registry.json`. O efeito de crítico soma -1 em `system.roll.melee.critical-success` por aquisição. A habilidade Fúria usa contador nativo; o módulo ajusta seu máximo conforme os talentos adicionais, mantendo usos gastos. Instinto Primitivo e vantagem da Fúria usam efeitos situacionais selecionáveis. Devastar, duração, redução de dano, imunidades, moral, obrigação de atacar e perda/recuperação de Constituição permanecem manuais.

A opção 12 reutiliza o seletor comum de “talento ou +2 atributos”. A seleção manual e o sorteio aleatório da faixa 7–9 devem resultar no mesmo benefício exportável. A lógica foi revisada no código, mas a interface real do Foundry, o ganho natural em nível e o importador ainda precisam de validação na instalação alvo.

O módulo preserva aliases antigos e recupera talentos descritivos de JSONs anteriores por contagem de ocorrências, sem acrescentar linhas de nível nem duplicar bônus já exportados. As fontes dos compêndios são JSONs editáveis versionados. Ver [documentação do módulo de conteúdo](../foundry-module/terraoeste-class-content/README.md) para expansão, build, instalação e limites de automação.
