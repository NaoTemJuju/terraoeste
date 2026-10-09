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
  // Lista conferida no compêndio de magias de Bruxo da instalação Shadowdark.
  // `value` conserva o nome original para a resolução pelo importador.
  const WITCH_SPELLS = [
    { label: "Caldeirão", value: "Cauldron", duration: "1 rodada", range: "Adjacente", description: "Você conjura um caldeirão borbulhante ao seu lado. Ele pode consertar um item mundano quebrado colocado dentro dele; fazer um sapo gordo e coaxante saltar para fora e seguir suas instruções por 3 rodadas; ou guardar até 3 espaços de itens, que serão expelidos na próxima vez que você conjurar esta magia." },
    { label: "Carvalho, Freixo e Espinheiro", value: "Oak, Ash, Thorn", duration: "Concentração", range: "Você", description: "Enquanto a magia durar, fadas, demônios e diabos não podem atacar você. Esses seres também não podem possuir, compelir nem enfeitiçar você." },
    { label: "Dança das Sombras", value: "Shadowdance", duration: "3 rodadas", range: "Perto", description: "Você molda sombras em uma ilusão visual e audível convincente, em um ponto Perto. A ilusão pode ter o tamanho de uma pessoa e se mover dentro de uma distância Perto do local onde surgiu. Ela não afeta objetos físicos; tocá-la revela que é falsa." },
    { label: "Encantar Pessoa", value: "Charm Person", duration: "1d8 dias", range: "Perto", description: "Você enfeitiça um humanoide de nível 2 ou inferior dentro do alcance Perto, que passa a considerar você um amigo. A magia termina se você ou seus aliados fizerem algo prejudicial ao alvo. Quando o efeito acaba, o alvo sabe que foi enfeitiçado magicamente." },
    { label: "Fantoche", value: "Puppet", duration: "Concentração", range: "Adjacente", description: "Um humanoide de nível 2 ou inferior que você tocar fica preso aos seus movimentos e os imita no seu turno. Se isso fizer a criatura ferir diretamente a si mesma ou a um aliado, ela pode fazer um teste de Carisma CD 15; se passar, resiste à imitação." },
    { label: "Hipnotizar", value: "Hypnotize", duration: "Concentração", range: "Perto", description: "Uma criatura de nível 3 ou inferior que possa ver você fica atordoada. Se perder a linha de visão para você, pode fazer um teste de Carisma CD 15; se passar, a magia termina." },
    { label: "Homem-Salgueiro", value: "Willowman", duration: "Instantâneo", range: "Perto", description: "Você invoca o Homem-Salgueiro na mente de uma criatura, enchendo-a de terror sobrenatural. Escolha uma criatura de nível 2 ou inferior dentro do alcance: ela deve fazer imediatamente um teste de moral, mesmo que normalmente não pudesse fazê-lo, como no caso de mortos-vivos." },
    { label: "Luz de Bruxa", value: "Witchlight", duration: "Concentração", range: "Perto", description: "Você invoca uma luz flutuante de pântano que ilumina um raio Adjacente ao redor dela. A luz pode mudar de cor e assumir formas vagas; no seu turno, ela pode flutuar até uma distância Perto." },
    { label: "Mau Olhado", value: "Eyebite", duration: "Instantâneo", range: "Perto", description: "Uma criatura à sua escolha sofre 1d4 de dano e não consegue ver você até o fim do próximo turno dela." },
    { label: "Névoa", value: "Fog", duration: "Concentração", range: "Adjacente", description: "Uma nuvem espessa de névoa surge em uma área Adjacente ao seu redor, dificultando que vejam você. A nuvem se move com você. Ataques contra criaturas dentro dela são feitos com desvantagem." }
  ];
  const classSpells = cls => cls === "Bruxo" ? WITCH_SPELLS : cls === "Mago" ? MAGE_SPELLS : [];
  const spellListKey = cls => cls === "Bruxo" ? "witchSpells" : "mageSpells";
  const witchKnownSpellRows = [
    ["1","3","–","–","–","–"], ["2","4","–","–","–","–"],
    ["3","4","1","–","–","–"], ["4","4","2","–","–","–"],
    ["5","4","2","1","–","–"], ["6","4","3","2","–","–"],
    ["7","4","3","2","1","–"], ["8","4","4","2","2","–"],
    ["9","4","4","3","2","1"], ["10","4","4","4","2","2"]
  ];
  window.app.getClassSpellExportData = (cls, choices = {}, talents = []) => {
    if (!["Mago", "Bruxo"].includes(cls)) return { spellsKnown: "None", bonuses: [] };
    const spells = classSpells(cls);
    const key = spellListKey(cls);
    const selected = Array.isArray(choices?.[key]) ? choices[key] : [];
    const extra = (Array.isArray(talents) ? talents : [])
      .filter(talent => talent?.bonusName === "PickExtraSpell" && talent.bonusTo)
      .map(talent => String(talent.bonusTo).trim());
    const normalize = value => String(value || "").trim().toLowerCase() === "arcane armor" ? "Mage Armor" : String(value || "").trim();
    const known = [...new Set([...selected, ...extra].map(normalize))]
      .filter(value => spells.some(spell => spell.value.toLowerCase() === value.toLowerCase()));
    const labels = known.map(value => spells.find(spell => spell.value.toLowerCase() === value.toLowerCase()).label);
    return {
      spellsKnown: labels.join(", ") || "None",
      bonuses: labels.map((label, index) => ({
        sourceType: "Class", sourceName: cls, sourceCategory: "Ability",
        name: `Spell: ${cls}, Tier 1, Spell ${index + 1}`, bonusName: label,
        bonusTo: `Tier:1, Spell:${index + 1}`, gainedAtLevel: 1
      }))
    };
  };
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
    if (cls === "Bruxo") {
      const pool = [...WITCH_SPELLS];
      const witchSpells = [];
      while (witchSpells.length < 3) witchSpells.push(pool.splice(randInt(0, pool.length - 1), 1)[0].value);
      return { witchSpells };
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
    "Bruxo": "Manipuladores dos segredos ocultos e da magia ancestral, tecendo feitiços com elementos misteriosos e pactos sombrios. Guiados por intuições profundas, portadores de maldições.",
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
    "Mago": { weapons: "Adaga e cajado", armor: "Nenhuma", hp: "1d4 por nível" },
    "Bruxo": { weapons: "Adaga e cajado", armor: "Armadura de couro", hp: "1d4 por nível", languages: "Diabólico, Primordial ou Silvestre" }
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
    "Bruxo": {
      title: "Talentos de Bruxo",
      effectHeader: "Efeito (2 duplicado = +1 uso por dia)",
      entries: [
        { roll: "2", effect: "1/dia, teleporte-se para o local do seu familiar como um movimento" },
        { roll: "3–7", effect: "+2 para Carisma ou +1 para testes de conjuração" },
        { roll: "8–9", effect: "Ganhe Vantagem para conjurar uma magia que você conhece" },
        { roll: "10–11", effect: "Aprenda uma magia adicional de um nível que você conheça" },
        { roll: "12", effect: "Escolha um talento ou distribua +2 pontos entre seus atributos" }
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
  const WITCH_SPECIAL_ABILITY = [
    "Familiar. Você tem um pequeno animal, como um corvo, rato ou sapo, que o serve lealmente. Ele pode falar Comum. Seu familiar pode ser a fonte das magias que você conjura; trate-o como se fosse você para determinar o alcance das magias. Se seu familiar morrer, você pode restaurá-lo à vida sacrificando permanentemente 1d4 pontos de vida.",
    "",
    "Conjuração. Você pode conjurar as magias de Bruxo que conhece. Você conhece três magias de nível 1, à sua escolha, da lista de magias de Bruxo. A cada nível que ganhar, escolha novas magias de Bruxo para aprender, de acordo com a tabela de Magias de Bruxo Conhecidas. Você usa Carisma como atributo de conjuração; a CD é 10 + o nível da magia. Se falhar em um teste de conjuração, não poderá conjurar aquela magia novamente até completar um descanso. Se tirar 1 natural em um teste de conjuração, role também na tabela de Desastre Diabólico correspondente ao nível da magia."
  ].join("\n");
  const CLASS_SPECIAL_ABILITIES = {
    "Assassino": ASSASSIN_SPECIAL_ABILITY,
    "Mago": MAGE_SPECIAL_ABILITY,
    "Bruxo": WITCH_SPECIAL_ABILITY,
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
    "Bruxo": {
      foundryName: "Bruxo",
      title: "Talentos de Bruxo",
      entries: [
        { min: 2, max: 2, id: "TeleportToFamiliar", name: "Teleporte até o Familiar", desc: "1/dia, teleporte-se para o local do seu familiar como um movimento; resultados 2 adicionais concedem +1 uso diário", foundryDesc: "Once per day, teleport to your familiar's location as a move; each additional result of 2 grants one extra daily use", bonusName: "TeleportToFamiliar", bonusTo: "TeleportToFamiliar" },
        { min: 3, max: 7, id: "WitchStatOrCasting", choice: "witchStatOrCasting", desc: "+2 para Carisma ou +1 para testes de conjuração", foundryDesc: "+2 Charisma or +1 to casting checks" },
        { min: 8, max: 9, id: "AdvOnCastOneSpell", name: "Vantagem em Conjuração", choice: "witchKnownSpell", desc: "Ganhe Vantagem para conjurar uma magia que você conhece", foundryDesc: "Gain Advantage casting one spell you know", bonusName: "AdvOnCastOneSpell" },
        { min: 10, max: 11, id: "PickExtraSpell", name: "Aprender uma Magia de Bruxo", choice: "witchExtraSpell", desc: "Aprenda uma magia adicional de um nível que você conheça", foundryDesc: "Learn one additional witch spell of a tier you know", bonusName: "PickExtraSpell" },
        { min: 12, max: 12, id: "WitchChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre seus atributos", foundryDesc: "Choose a talent or distribute +2 points among ability scores" }
      ]
    },
    "Bardo": {
      // Exporta o nome localizado usado pelo compêndio/instalação em português.
      foundryName: "Bardo",
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
        { min: 2, max: 2, id: "BarbarianCriticalRange", name: "Crítico corpo a corpo (19)", desc: "Você causa crítico em ataques corpo a corpo com resultado 19. Cada resultado 2 adicional amplia o alcance crítico em 1", foundryDesc: "Critical hit on melee attacks with a result of 19; each additional result of 2 expands the critical range by 1", bonusName: "TerraOeste.BarbarianCriticalRange", bonusTo: "TerraOeste.BarbarianCriticalRange" },
        { min: 3, max: 6, id: "Plus1ToMeleeDamage", name: "+1 para Dano Corpo a Corpo", desc: "+1 de dano para ataques corpo a corpo", foundryDesc: "+1 to melee damage", bonusName: "Plus1ToMeleeDamage", bonusTo: "Plus1ToMeleeDamage" },
        { min: 7, max: 9, id: "BarbarianStatOrMelee", choice: "barbarianStatOrMelee", desc: "+2 em Força ou Constituição, ou +1 em ataques corpo a corpo", foundryDesc: "+2 Strength or Constitution, or +1 to melee attacks" },
        { min: 10, max: 11, id: "BarbarianExtraFuryUse", name: "Uso Adicional de Fúria", desc: "Ganhe um uso adicional da habilidade Fúria a cada dia", foundryDesc: "Gain one additional use of Fury per day", bonusName: "TerraOeste.BarbarianExtraFuryUse", bonusTo: "TerraOeste.BarbarianExtraFuryUse" },
        { min: 12, max: 12, id: "BarbarianChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos", foundryDesc: "Choose a talent or distribute +2 points among ability scores" }
      ]
    },
    "Guerreiro": {
      foundryName: "Guerreiro",
      title: "Talentos de Guerreiro",
      entries: [
        { min: 2, max: 2, id: "WeaponMastery", name: "Maestria em Armas", choice: "weaponMastery", desc: "Ganhe Maestria em Armas em um tipo de arma adicional", foundryDesc: "Gain Weapon Mastery with one additional weapon", bonusName: "Plus1AttackAndDamagePlusHalfLevel" },
        { min: 3, max: 6, id: "Plus1ToHit", name: "+1 para Ataques Corpo a Corpo ou à Distância", desc: "+1 em ataques corpo a corpo e à distância", foundryDesc: "+1 to melee and ranged attacks", bonusTo: "Melee and ranged attacks", bonusName: "Plus1ToHit" },
        { min: 7, max: 9, id: "StatBonus", choice: "stat", statOptions: ["STR", "DEX", "CON"], desc: "+2 em Força, Destreza ou Constituição", foundryDesc: "+2 Strength, Dexterity, or Constitution", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "ArmorMastery", name: "Maestria em Armaduras", choice: "armorMastery", desc: "Escolha um tipo de armadura e receba +1 na CA ao usá-la", foundryDesc: "Choose one kind of armor. You get +1 AC from that armor", bonusName: "ArmorMastery" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Malandro": {
      foundryName: "Ladrão",
      title: "Talentos de Ladrão",
      entries: [
        { min: 2, max: 2, id: "InitiativeAdvantage", name: "Vantagem na Iniciativa", desc: "Vantagem nas rolagens de iniciativa (role novamente se repetir)", foundryDesc: "Advantage on initiative rolls (reroll if tied)", bonusTo: "Initiative", bonusName: "AdvOnInitiative" },
        { min: 3, max: 5, id: "BackstabIncrease", name: "Apunhalada pelas Costas: +1 Dado de Dano", desc: "Sua Apunhalada pelas Costas causa +1 dado de dano", foundryDesc: "Your Backstab deals +1 dice of damage", bonusTo: "Backstab", bonusName: "BackstabIncrease" },
        { min: 6, max: 9, id: "StatBonus", choice: "stat", desc: "+2 em Força, Destreza ou Carisma", foundryDesc: "+2 Strength, Dexterity, or Charisma", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "Plus1ToHit", name: "+1 para Ataques Corpo a Corpo ou à Distância", desc: "+1 em ataques corpo a corpo e à distância", foundryDesc: "+1 to melee and ranged attacks", bonusTo: "Melee and ranged attacks", bonusName: "Plus1ToHit" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Ladrão": {
      foundryName: "Ladrão",
      title: "Talentos de Ladrão",
      entries: null
    }
  };
  CLASS_LEVEL_TALENTS.Ladrão.entries = CLASS_LEVEL_TALENTS.Malandro.entries;
  const STAT_TALENT_OPTIONS = ["InitiativeAdvantage", "BackstabIncrease", "StatBonus", "Plus1ToHit"];
  const CLASS_TALENT_DISPLAY = {
    InitiativeAdvantage: "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    "Initiative Advantage": "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    BackstabIncrease: "Sua Apunhalada pelas Costas causa +1 dado de dano",
    BackstabPlus1DamageDice: "Sua Apunhalada pelas Costas causa +1 dado de dano",
    StatBonus: "+2 em atributo",
    Plus1ToHit: "+1 em ataques corpo a corpo e à distância",
    "Vantagem na Iniciativa": "Vantagem nas rolagens de iniciativa (role novamente se repetir)",
    "+1 para Ataques Corpo a Corpo ou à Distância": "+1 em ataques corpo a corpo e à distância",
    "Apunhalada pelas Costas: +1 Dado de Dano": "Sua Apunhalada pelas Costas causa +1 dado de dano"
  };
  const STAT_LABELS = Object.keys(STAT_CODES);

  const CLASS_TALENT_NAME_ALIASES = {
    "make random magic item": "Criar um Item Mágico Aleatório",
    "advoncastonespell": "Vantagem em Conjuração",
    "pickextraspell": "Aprender uma Magia de Mago",
    "plus1tocastingspells": "+1 em Testes de Conjuração de Magia",
    "weaponmastery": "Maestria em Armas",
    "armormastery": "Maestria em Armaduras",
    "backstabincrease": "Apunhalada pelas Costas: +1 Dado de Dano",
    "assassinpoisontraining": "Treinamento em Venenos",
    "treinamento com venenos": "Treinamento em Venenos",
    "lotus negra: paralisia": "Paralisar um Alvo",
    "lotus negra: reflexos": "Evitar Aprisionamento/Ferimentos",
    "lotus negra: defesa com duas armas": "+1 CA com Duas Armas",
    "lotus negra: vitalidade": "PV Adicional",
    "lotus negra: dano triplo": "Dano Triplo de Assassino",
    "lotus negra: presenca aterradora": "Testes de Moral com CD 18",
    "lotus negra: caminhar sobre a agua": "Andar sobre a Água",
    "lotus negra: sono": "Adormecer Criatura",
    "lotus negra: escalar paredes": "Andar em Superfícies Íngremes",
    "lotus negra: dano corpo a corpo": "+1 para Dano Corpo a Corpo",
    "lotus negra: invisibilidade aos sentidos": "Esconder-se de Criatura"
  };
  function normalizedTalentRecord(item){
    if (!item || typeof item !== "object") return item;
    const name = String(item.talentRolledName || "");
    const nameKey = name.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR").trim();
    const alias = CLASS_TALENT_NAME_ALIASES[nameKey];
    const talentRolledName = item.id === "TwoStatPoints" ? "Distribuir entre Atributos"
      : item.id === "AssassinBlackLotusRoll" ? "Talento da Lótus Negra Adicional"
      : alias || name;
    return {
      ...item,
      talentRolledName,
      bonusName: ASSASSIN_BONUS_ALIASES[item.bonusName] || ASSASSIN_BONUS_ALIASES[item.id] || item.bonusName,
      bonusTo: ASSASSIN_BONUS_ALIASES[item.bonusTo] || item.bonusTo,
      blackLotusResults: Array.isArray(item.blackLotusResults) ? item.blackLotusResults.map(normalizedTalentRecord) : item.blackLotusResults
    };
  }

  function classLevelTalentConfig(cls){ return CLASS_LEVEL_TALENTS[cls] || null; }
  window.app.getFoundryClassName = cls => classLevelTalentConfig(cls)?.foundryName || window.CUSTOM_CLASS_DATA?.[cls]?.foundryName || cls || "";
  function resultForEntry(entry, roll){ return { roll, id: entry.id, talentRolledName: entry.name || "", talentRolledDesc: entry.foundryDesc || entry.desc, displayDesc: entry.desc, bonusName: entry.exportAsBonus === false ? "" : (entry.bonusName ?? entry.id), bonusTo: entry.bonusTo || "", needsChoice: entry.choice || "", statOptions: entry.statOptions || null, exportAsBonus: entry.exportAsBonus !== false }; }
  function makeTalentBonus(result, cls){
    if (!result || result.exportAsBonus === false || !(result.bonusName || result.id)) return [];
    const config = classLevelTalentConfig(cls);
    const effectName = result.bonusName || result.id;
    const bonusTo = result.bonusTo || result.talentRolledName || effectName;
    return String(bonusTo).split(/,\s*/).filter(Boolean).map(target => ({ sourceType: "Class", sourceName: window.app.getFoundryClassName(cls) || config?.foundryName || cls, sourceCategory: "Talent", name: result.talentRolledName || effectName, bonusName: effectName, bonusTo: target, gainedAtLevel: 1 }));
  }
  function renderLevelTalentChoices(result, rollIndex){
    if (!classLevelTalent) return;
    const choiceArea = document.createElement("div");
    choiceArea.className = "class-level-talent-choice";
    const config = classLevelTalentConfig(pending.cls);
    const finish = chosen => {
      pending.classLevelTalents[rollIndex] = chosen || result;
      pending.classLevelTalentDraft = null;
      renderClassLevelTalent(pending.cls);
      updateTalentContinueButton();
    };
    const makeStatSelect = (labelText, onChange, codes = null, amount = 2) => {
      const label = document.createElement("label");
      label.textContent = labelText;
      const select = document.createElement("select");
      select.append(new Option("Escolha um atributo", ""));
      const allowed = codes || ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
      allowed.forEach(code => {
        const stat = STAT_LABELS.find(name => STAT_CODES[name] === code);
        const current = state.attrs?.[STAT_LABELS.indexOf(stat)];
        const optionLabel = Number.isFinite(current) ? `${stat} (${current} → ${current + amount})` : stat;
        select.append(new Option(optionLabel, code));
      });
      select.addEventListener("change", () => onChange(select.value));
      label.append(select);
      return label;
    };
    const finishRolled12Talent = chosen => {
      chosen.rolled12TalentOrTwoStatPoints = "Talent";
      chosen.rolled12ChosenTalentName = chosen.talentRolledName;
      chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
      finish(chosen);
    };
    const showEntryChoice = (entry, chosen, details, isRolled12 = false) => {
      const complete = value => isRolled12 ? finishRolled12Talent(value) : finish(value);
      if (entry.choice === "stat") {
        details.append(makeStatSelect("Atributo para o bônus +2", code => {
          if (!code) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const stat = STAT_LABELS.find(name => STAT_CODES[name] === code);
          const english = {STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"}[code];
          chosen.talentRolledName = `+2 de ${stat}`;
          chosen.bonusName = "StatBonus";
          chosen.bonusTo = `${code}:+2`;
          chosen.talentRolledDesc = `+2 ${english}`;
          chosen.displayDesc = `+2 em ${stat}`;
          complete(chosen);
        }, entry.statOptions || ["STR","DEX","CHA"]));
      } else if (entry.choice === "distributeStats") {
        const selected = [];
        const updateStats = () => {
          if (selected.length !== 2 || !selected.every(Boolean)) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const counts = selected.reduce((acc, code) => ({...acc,[code]:(acc[code]||0)+1}), {});
          const labels = selected.map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
          chosen.id = "TwoStatPoints";
          chosen.talentRolledName = "Distribuir entre Atributos";
          chosen.talentRolledDesc = "+2 to ability scores";
          chosen.bonusName = "StatBonus";
          chosen.bonusTo = Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", ");
          chosen.displayDesc = `+2 pontos nos atributos: ${labels.join(" e ")}`;
          complete(chosen);
        };
        details.append(makeStatSelect("Primeiro ponto", code => { selected[0] = code; updateStats(); }, null, 1));
        details.append(makeStatSelect("Segundo ponto", code => { selected[1] = code; updateStats(); }, null, 1));
      } else if (entry.choice === "weaponMastery" || entry.choice === "armorMastery") {
        const weapon = entry.choice === "weaponMastery";
        const select = document.createElement("select");
        select.append(new Option(weapon ? "Escolha uma arma" : "Escolha uma armadura", ""));
        (weapon ? FIGHTER_WEAPON_TYPES : FIGHTER_ARMOR_TYPES).forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          chosen.bonusTo = select.value;
          chosen.talentRolledName = entry.name || (weapon ? "Maestria em Armas" : "Maestria em Armaduras");
          chosen.displayDesc = weapon ? `Maestria em Armas adicional: ${(FIGHTER_WEAPON_TYPES.find(item => item.value === select.value) || {}).label}` : `+1 na CA usando ${(FIGHTER_ARMOR_TYPES.find(item => item.value === select.value) || {}).label}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "barbarianStatOrMelee") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o benefício", ""), new Option("+2 em Força", "STR"), new Option("+2 em Constituição", "CON"), new Option("+1 em ataques corpo a corpo", "melee"));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          if (select.value === "melee") {
            chosen.id = "BarbarianMeleeAttackBonus";
            chosen.talentRolledName = "+1 para Ataques Corpo a Corpo";
            chosen.talentRolledDesc = "+1 to melee attacks";
            chosen.bonusName = "Plus1ToHit";
            chosen.bonusTo = "Melee attacks";
            chosen.displayDesc = "+1 em ataques corpo a corpo";
          } else {
            const code = select.value;
            const stat = code === "STR" ? "Força" : "Constituição";
            chosen.id = "StatBonus";
            chosen.talentRolledName = "+2 de " + stat;
            chosen.talentRolledDesc = "+2 " + (code === "STR" ? "Strength" : "Constitution");
            chosen.bonusName = "StatBonus";
            chosen.bonusTo = code + ":+2";
            chosen.displayDesc = "+2 em " + stat;
          }
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "bardAttackOrFascinate") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o benefício", ""), new Option("+1 em ataques corpo a corpo e à distância", "attacks"), new Option("+1 em testes de Fascinar", "fascinate"));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          if (select.value === "attacks") {
            chosen.id = "Plus1ToHit";
            chosen.talentRolledName = "+1 para Ataques Corpo a Corpo e à Distância";
            chosen.talentRolledDesc = "+1 to melee and ranged attacks";
            chosen.bonusName = "Plus1ToHit";
            chosen.bonusTo = "Melee and ranged attacks";
            chosen.exportAsBonus = true;
            chosen.displayDesc = "+1 em ataques corpo a corpo e à distância";
          } else {
            chosen.id = "BardFascinateBonus";
            chosen.talentRolledName = "+1 em Testes de Fascinar";
            chosen.talentRolledDesc = "+1 to Fascinate checks";
            chosen.bonusName = "";
            chosen.bonusTo = "";
            chosen.exportAsBonus = false;
            chosen.displayDesc = "+1 em testes de Fascinar";
          }
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "assassinStatOrMelee") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o benefício", ""), new Option("+2 em Força", "STR"), new Option("+2 em Destreza", "DEX"), new Option("+1 em ataques corpo a corpo", "melee"));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          if (select.value === "melee") {
            chosen.id = "AssassinMeleeAttackBonus"; chosen.talentRolledName = "+1 para Ataques Corpo a Corpo";
            chosen.talentRolledDesc = "+1 to melee attacks"; chosen.bonusName = "Plus1ToHit";
            chosen.bonusTo = "Melee attacks"; chosen.displayDesc = "+1 em ataques corpo a corpo";
          } else {
            const code = select.value, stat = code === "STR" ? "Força" : "Destreza";
            chosen.id = "StatBonus"; chosen.talentRolledName = "+2 de " + stat;
            chosen.talentRolledDesc = "+2 " + (code === "STR" ? "Strength" : "Dexterity");
            chosen.bonusName = "StatBonus"; chosen.bonusTo = code + ":+2"; chosen.displayDesc = "+2 em " + stat;
          }
          finish(chosen);
        });
        details.append(select);
      } else if (entry.choice === "assassinBlackLotus") {
        const button = document.createElement("button");
        button.type = "button"; button.className = "ghost";
        button.textContent = "Rolar Talento da Lótus Negra (1d12)";
        button.addEventListener("click", () => {
          const results = rollAssassinLotusResults(); chosen.blackLotusResults = results;
          chosen.displayDesc = results.length === 2
            ? "Lótus Negra (1: dois talentos): " + results.map(item => "d12 " + item.roll + " — " + item.displayDesc).join("; ")
            : "Lótus Negra (d12 " + results[0].roll + "): " + results[0].displayDesc;
          finish(chosen);
        });
        details.append(button);
      } else if (entry.choice === "rangerWeaponDamage") {
        const select = document.createElement("select");
        select.append(new Option("Escolha a arma", ""));
        FIGHTER_WEAPON_TYPES.forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const weapon = FIGHTER_WEAPON_TYPES.find(item => item.value === select.value);
          chosen.talentRolledName = "Dado de Dano de Arma Aumentado";
          chosen.bonusName = "SetWeaponTypeDamage";
          chosen.bonusTo = weapon.value;
          chosen.displayDesc = `Dado de dano aumentado: ${weapon.label}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "rangerAttackBonus") {
        const applyAttackBonus = attackType => {
          const melee = attackType === "melee";
          chosen.id = melee ? "RangerMeleeAttackDamage" : "RangerRangedAttackDamage";
          chosen.talentRolledName = melee ? "+1 para Ataques Corpo a Corpo e Dano" : "+1 para Ataques à Distância e Dano";
          chosen.bonusName = "Plus1ToHitAndDamage";
          chosen.bonusTo = melee ? "Melee attacks" : "Ranged attacks";
          chosen.displayDesc = melee ? "+1 para ataques corpo a corpo e dano" : "+1 para ataques à distância e dano";
          complete(chosen);
        };
        if (entry.rangerAttackType) {
          applyAttackBonus(entry.rangerAttackType);
        } else {
          const select = document.createElement("select");
          select.append(new Option("Escolha o tipo de ataque", ""), new Option("+1 em ataques corpo a corpo e dano", "melee"), new Option("+1 em ataques à distância e dano", "ranged"));
          select.addEventListener("change", () => {
            if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
            applyAttackBonus(select.value);
          });
          details.append(select);
        }
      } else if (entry.choice === "rangerHerbalism") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o remédio", ""));
        RANGER_REMEDIES.forEach(remedy => select.append(new Option(remedy.label, remedy.value)));
        select.addEventListener("change", () => {
          const remedy = RANGER_REMEDIES.find(item => item.value === select.value);
          if (!remedy) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          chosen.talentRolledName = "Vantagem em Teste de Herbalismo";
          chosen.bonusName = "ReduceHerbalismDC";
          chosen.bonusTo = remedy.value;
          chosen.displayDesc = `Vantagem em Herbalismo para preparar: ${remedy.label.replace(/ \(CD \d+\)$/, "")}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "magicItem") {
        const select = document.createElement("select");
        select.append(new Option("Selecione uma categoria de item mágico", ""));
        MAGE_ITEM_TYPES.forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const category = MAGE_ITEM_TYPES.find(item => item.value === select.value);
          chosen.talentRolledName = "Criar um Item Mágico Aleatório";
          chosen.bonusName = "MakeRandomMagicItem";
          chosen.bonusTo = select.value;
          chosen.displayDesc = `Crie 1 item mágico aleatório: ${category.label}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "mageStatOrCasting") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o benefício", ""), new Option("+2 em Inteligência", "int"), new Option("+1 em testes de conjuração de magias de mago", "casting"));
        select.addEventListener("change", () => {
          if (select.value === "int") {
            chosen.id = "StatBonus";
            chosen.talentRolledName = "+2 de Inteligência";
            chosen.bonusName = "StatBonus";
            chosen.bonusTo = "INT:+2";
            chosen.talentRolledDesc = "+2 Intelligence";
            chosen.displayDesc = "+2 em Inteligência";
            complete(chosen);
          } else if (select.value === "casting") {
            chosen.id = "Plus1ToCastingSpells";
            chosen.talentRolledName = "+1 em Testes de Conjuração de Magia";
            chosen.bonusName = "Plus1ToCastingSpells";
            chosen.bonusTo = "Casting spells";
            chosen.talentRolledDesc = "+1 to casting checks for mage spells";
            chosen.displayDesc = "+1 em testes de conjuração de magias de mago";
            complete(chosen);
          } else {
            pending.classLevelTalents[rollIndex] = null;
            updateTalentContinueButton();
          }
        });
        details.append(select);
      } else if (entry.choice === "witchStatOrCasting") {
        const select = document.createElement("select");
        select.append(new Option("Escolha o benefício", ""), new Option("+2 em Carisma", "cha"), new Option("+1 em testes de conjuração", "casting"));
        select.addEventListener("change", () => {
          if (select.value === "cha") {
            chosen.id = "StatBonus"; chosen.talentRolledName = "+2 de Carisma";
            chosen.bonusName = "StatBonus"; chosen.bonusTo = "CHA:+2";
            chosen.talentRolledDesc = "+2 Charisma"; chosen.displayDesc = "+2 para Carisma";
            complete(chosen);
          } else if (select.value === "casting") {
            chosen.id = "Plus1ToCastingSpells"; chosen.talentRolledName = "+1 em Testes de Conjuração de Magia";
            chosen.bonusName = "Plus1ToCastingSpells"; chosen.bonusTo = "Casting spells";
            chosen.talentRolledDesc = "+1 to casting checks"; chosen.displayDesc = "+1 para testes de conjuração";
            complete(chosen);
          } else { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); }
        });
        details.append(select);
      } else if (["mageKnownSpell", "mageExtraSpell", "witchKnownSpell", "witchExtraSpell"].includes(entry.choice)) {
        const spellChoices = classSpells(pending.cls);
        const listKey = spellListKey(pending.cls);
        const previousExtras = (pending.classLevelTalents || [])
          .filter((talent, index) => index !== rollIndex && talent?.bonusName === "PickExtraSpell")
          .map(talent => talent.bonusTo);
        const known = [...(state.classFeatures?.[listKey] || []), ...previousExtras];
        const choosesKnown = entry.choice === "mageKnownSpell" || entry.choice === "witchKnownSpell";
        const options = choosesKnown
          ? spellChoices.filter(spell => known.includes(spell.value))
          : spellChoices.filter(spell => !known.includes(spell.value));
        const select = document.createElement("select");
        select.append(new Option(choosesKnown ? "Escolha uma magia conhecida" : "Escolha a magia adicional", ""));
        options.forEach(spell => select.append(new Option(spell.label, spell.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const spell = spellChoices.find(item => item.value === select.value);
          chosen.bonusTo = entry.choice.startsWith("witch") && choosesKnown ? spell.label : spell.value;
          chosen.talentRolledName = entry.name;
          chosen.displayDesc = choosesKnown
            ? `Vantagem ao conjurar: ${spell.label}`
            : `Magia adicional aprendida: ${spell.label}`;
          complete(chosen);
        });
        details.append(select);
      } else {
        complete(chosen);
      }
    };
    if (result.needsChoice === "stat") {
      choiceArea.append(makeStatSelect("Atributo para o bônus +2", code => {
        if (!code) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
        const stat = STAT_LABELS.find(name => STAT_CODES[name] === code);
        const english = {STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"}[code];
        result.talentRolledName = `+2 de ${stat}`;
        result.bonusName = "StatBonus";
        result.bonusTo = `${code}:+2`;
        result.talentRolledDesc = `+2 ${english}`;
        result.displayDesc = `+2 em ${stat}`;
        finish(result);
      }, result.statOptions || ["STR","DEX","CHA"]));
    } else if (["weaponMastery", "armorMastery", "magicItem", "mageStatOrCasting", "mageKnownSpell", "mageExtraSpell", "witchStatOrCasting", "witchKnownSpell", "witchExtraSpell", "rangerWeaponDamage", "rangerAttackBonus", "rangerHerbalism", "assassinStatOrMelee", "assassinBlackLotus", "barbarianStatOrMelee", "bardAttackOrFascinate", "distributeStats"].includes(result.needsChoice)) {
      showEntryChoice(config.entries.find(entry => entry.id === result.id), result, choiceArea);
    } else if (result.needsChoice === "rangerTwelve") {
      const select = document.createElement("select");
      select.append(new Option("Escolha um benefício", ""));
      const choices = config.entries.filter(entry => ["rangerWeaponDamage", "rangerAttackBonus", "rangerHerbalism"].includes(entry.choice)).flatMap(entry => entry.choice === "rangerAttackBonus" ? [
        { ...entry, id: "RangerMeleeAttackDamage", desc: "+1 para ataques corpo a corpo e dano", rangerAttackType: "melee" },
        { ...entry, id: "RangerRangedAttackDamage", desc: "+1 para ataques à distância e dano", rangerAttackType: "ranged" }
      ] : [entry]);
      choices.forEach(entry => select.append(new Option(entry.desc, entry.id)));
      select.append(new Option("Distribuir +2 pontos entre atributos", "stats"));
      const details = document.createElement("div");
      details.className = "class-level-talent-choice-details";
      select.addEventListener("change", () => {
        details.replaceChildren();
        pending.classLevelTalents[rollIndex] = null;
        if (select.value === "stats") {
          const selected = [];
          const updateStats = () => {
            if (selected.length !== 2 || !selected.every(Boolean)) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
            const counts = selected.reduce((acc, code) => ({...acc,[code]:(acc[code]||0)+1}), {});
            const labels = selected.map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
            finish({ roll: result.roll, id: "TwoStatPoints", talentRolledName: "Distribuir entre Atributos", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code,n]) => `${code}:+${n}`).join(", "), rolled12Mode: "twoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}`, rolled12TalentOrTwoStatPoints: "TwoStatPoints" });
          };
          details.append(makeStatSelect("Primeiro ponto", code => { selected[0]=code; updateStats(); }, null, 1));
          details.append(makeStatSelect("Segundo ponto", code => { selected[1]=code; updateStats(); }, null, 1));
          return;
        }
        const entry = choices.find(item => item.id === select.value);
        if (!entry) { updateTalentContinueButton(); return; }
        const chosen = resultForEntry(entry, result.roll);
        if (entry.rangerAttackType) chosen.rangerAttackType = entry.rangerAttackType;
        chosen.rolled12Mode = "talent";
        chosen.rolled12TalentOrTwoStatPoints = "Talent";
        chosen.rolled12ChosenTalentName = chosen.talentRolledName;
        chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
        showEntryChoice(entry, chosen, details, true);
      });
      choiceArea.append(select, details);
    } else if (result.needsChoice === "twelve") {
      const mode = document.createElement("select");
      mode.append(new Option("Escolha: talento ou +2 nos atributos", ""), new Option("Escolher um talento da tabela", "talent"), new Option("Distribuir +2 pontos entre atributos", "stats"));
      const details = document.createElement("div");
      details.className = "class-level-talent-choice-details";
      mode.addEventListener("change", () => {
        details.replaceChildren();
        pending.classLevelTalents[rollIndex] = null;
        if (mode.value === "talent") {
          const choices = (config?.entries || []).filter(entry => entry.choice !== "twelve");
          const select = document.createElement("select");
          select.append(new Option("Escolha um talento", ""));
          choices.forEach(entry => select.append(new Option(entry.desc, entry.id)));
          const choiceDetails = document.createElement("div");
          choiceDetails.className = "class-level-talent-choice-details";
          select.addEventListener("change", () => {
            choiceDetails.replaceChildren();
            pending.classLevelTalents[rollIndex] = null;
            const entry = choices.find(item => item.id === select.value);
            if (!entry) { updateTalentContinueButton(); return; }
            const chosen = resultForEntry(entry, result.roll);
            chosen.rolled12Mode = "talent";
            showEntryChoice(entry, chosen, choiceDetails, true);
          });
          details.append(select, choiceDetails);
        } else if (mode.value === "stats") {
          const selected = [];
          const updateStats = () => {
            if (selected.length !== 2 || !selected.every(Boolean)) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
            const counts = selected.reduce((acc, code) => ({...acc,[code]:(acc[code]||0)+1}), {});
            const labels = selected.map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
            finish({
              roll: result.roll, id: "TwoStatPoints", talentRolledName: "Distribuir entre Atributos", talentRolledDesc: "+2 to ability scores",
              bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code,n]) => `${code}:+${n}`).join(", "),
              rolled12Mode: "twoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}`,
              rolled12TalentOrTwoStatPoints: "TwoStatPoints"
            });
          };
          details.append(makeStatSelect("Primeiro ponto", code => { selected[0]=code; updateStats(); }, null, 1));
          details.append(makeStatSelect("Segundo ponto", code => { selected[1]=code; updateStats(); }, null, 1));
        }
      });
      choiceArea.append(mode, details);
    }
    classLevelTalent.append(choiceArea);
  }

  function renderClassLevelTalent(cls){
    if (!classLevelTalent) return;
    const config = classLevelTalentConfig(cls);
    classLevelTalent.replaceChildren();
    classLevelTalent.hidden = !config;
    if (!config) return;
    const count = Math.max(1, Number(pending.classLevelTalentRollCount) || 1);
    pending.classLevelTalents = Array.isArray(pending.classLevelTalents) ? pending.classLevelTalents : [];
    pending.classLevelTalents.forEach((result, index) => {
      if (!result) return;
      const status = document.createElement("p");
      status.className = "class-level-talent-result";
      status.textContent = `Talento ${index + 1}/${count} — Resultado ${result.roll}: ${result.displayDesc || result.talentRolledDesc || "Talento registrado"}`;
      classLevelTalent.append(status);
    });
    const nextIndex = pending.classLevelTalents.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = `Rolar talento ${Math.min(nextIndex + 1, count)}/${count} (2d6)`;
    button.disabled = nextIndex >= count || !!pending.classLevelTalentDraft;
    button.addEventListener("click", () => {
      let roll = randInt(1, 6) + randInt(1, 6);
      while (cls === "Bardo" && roll === 2 && pending.classLevelTalents.some(item => item?.roll === 2)) roll = randInt(1, 6) + randInt(1, 6);
      const entry = config.entries.find(item => roll >= item.min && roll <= item.max);
      const result = resultForEntry(entry, roll);
      pending.classLevelTalentDraft = { result, index: nextIndex };
      if (!result.needsChoice) {
        pending.classLevelTalents[nextIndex] = result;
        pending.classLevelTalentDraft = null;
      }
      renderClassLevelTalent(cls);
      updateTalentContinueButton();
      updateConfirmButton();
    });
    if (nextIndex < count && !pending.classLevelTalentDraft) classLevelTalent.append(button);
    if (pending.classLevelTalentDraft) {
      const { result, index } = pending.classLevelTalentDraft;
      const status = document.createElement("p");
      status.className = "class-level-talent-result";
      const entry = config.entries.find(item => result.roll >= item.min && result.roll <= item.max);
      status.textContent = `Talento ${index + 1}/${count} — Resultado ${result.roll}: ${entry?.desc || "Escolha uma opção"}`;
      classLevelTalent.append(status);
      renderLevelTalentChoices(result, index);
    }
  }

  function renderClassTalentTable(cls, target = classTalentTable){
    if (!target) return;
    const data = CLASS_TALENT_TABLES[cls];
    target.replaceChildren();
    target.hidden = !data;
    if (!data) return;

    const tables = [
      { title: data.title, dice: "2d6", effectHeader: data.effectHeader, entries: data.entries },
      ...(data.secondaryEntries ? [{ title: data.secondaryTitle, dice: data.secondaryDice || "d12", entries: data.secondaryEntries }] : [])
    ];
    tables.forEach(section => {
      const title = document.createElement("h4"); title.textContent = section.title;
      const table = document.createElement("table"), thead = document.createElement("thead"), headingRow = document.createElement("tr");
      [section.dice, section.effectHeader || "Efeito"].forEach(label => { const th = document.createElement("th"); th.scope = "col"; th.textContent = label; headingRow.append(th); });
      thead.append(headingRow);
      const tbody = document.createElement("tbody");
      section.entries.forEach(entry => {
        const row = document.createElement("tr"), roll = document.createElement("th"), effect = document.createElement("td");
        roll.scope = "row"; roll.textContent = entry.roll; effect.textContent = entry.effect; row.append(roll, effect); tbody.append(row);
      });
      table.append(thead, tbody); target.append(title, table);
    });
  }

  function renderMageSpellTables(cls){
    if (!mageSpellTables) return;
    mageSpellTables.replaceChildren();
    mageSpellTables.hidden = !["Mago", "Bruxo"].includes(cls);
    if (!["Mago", "Bruxo"].includes(cls)) return;
    const makeTable = (titleText, headers, rows, captionText = "") => {
      const title = document.createElement("h4");
      title.textContent = titleText;
      const table = document.createElement("table");
      if (captionText) {
        const caption = table.createCaption();
        caption.textContent = captionText;
      }
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headers.forEach(text => { const th=document.createElement("th"); th.scope="col"; th.textContent=text; headerRow.append(th); });
      thead.append(headerRow);
      const tbody = document.createElement("tbody");
      rows.forEach(values => {
        const row=document.createElement("tr");
        values.forEach((text,index) => {
          const cell=document.createElement(index===0 ? "th" : "td");
          if(index===0) cell.scope="row";
          cell.textContent=text;
          row.append(cell);
        });
        tbody.append(row);
      });
      table.append(thead,tbody);
      return { title, table };
    };
    const isWitch = cls === "Bruxo";
    const knownSpellRows = isWitch ? witchKnownSpellRows : [
      ["1","3","–","–","–","–"],
      ["2","4","–","–","–","–"],
      ["3","4","1","–","–","–"],
      ["4","4","2","–","–","–"],
      ["5","4","2","1","–","–"],
      ["6","4","3","2","–","–"],
      ["7","4","3","2","1","–"],
      ["8","4","4","2","2","–"],
      ["9","4","4","3","2","1"],
      ["10","4","4","4","2","2"]
    ];
    const knownSpellTable = makeTable(isWitch ? "Magias de Bruxo Conhecidas" : "Magias de Mago Conhecidas", ["Nível","1","2","3","4","5"], knownSpellRows, "Magias Conhecidas por Nível de Magia");
    const info = document.createElement("details");
    info.className = "mage-known-spells-info";
    info.style.margin = "8px 0";
    const trigger = document.createElement("summary");
    trigger.className = "mage-known-spells-info__trigger";
    trigger.textContent = "i";
    trigger.title = `Ver tabela completa de magias de ${cls.toLocaleLowerCase("pt-BR")} conhecidas`;
    trigger.setAttribute("aria-label", trigger.title);
    trigger.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid currentColor;border-radius:50%;font-size:14px;font-weight:700;line-height:1;cursor:pointer;list-style:none;";
    info.append(trigger, knownSpellTable.title, knownSpellTable.table);
    mageSpellTables.append(info);
    const spellList = classSpells(cls);
    const spellListTable = isWitch
      ? makeTable("Magias de 1º nível de Bruxo", ["Magia","Duração","Alcance"], spellList.map(spell => [spell.label,spell.duration,spell.range]))
      : makeTable("Magias de 1º círculo", ["Magia","Duração","Alcance"], spellList.map(spell => [spell.label,spell.duration,spell.range]));
    if (isWitch) {
      spellListTable.table.classList.add("witch-spell-list");
      spellListTable.table.querySelectorAll("tbody tr").forEach((row, index) => {
        const spell = spellList[index];
        const nameCell = row.querySelector("th");
        const name = document.createElement("span");
        name.className = "witch-spell-name";
        const label = document.createElement("button");
        label.type = "button";
        label.className = "witch-spell-name__label";
        label.textContent = spell.label;
        const description = document.createElement("div");
        description.className = "witch-spell-info__content";
        description.id = `witch-spell-description-${index + 1}`;
        description.textContent = spell.description;
        label.setAttribute("aria-label", `Mostrar descrição de ${spell.label}`);
        label.setAttribute("aria-controls", description.id);
        label.setAttribute("aria-expanded", "false");
        label.addEventListener("click", () => {
          const expanded = name.classList.toggle("is-open");
          label.setAttribute("aria-expanded", String(expanded));
        });
        name.append(label, description);
        nameCell.replaceChildren(name);
      });
    }
    mageSpellTables.append(spellListTable.title, spellListTable.table);
  }

  function talentOptions(cls){ return window.CUSTOM_CLASS_DATA?.[cls]?.talents || []; }
  function hasClassTalentChoice(cls){ return talentOptions(cls).length > 1 && window.CUSTOM_CLASS_DATA?.[cls]?.talentMode === "choice"; }
  window.app.randomClassTalent = cls => {
    const options = talentOptions(cls);
    return hasClassTalentChoice(cls) ? options[randInt(0, options.length - 1)].id : (options.length === 1 ? options[0].id : null);
  };
  function updateClassInfo(cls){
    if (!classInfo) return;
    classInfo.hidden = !cls;
    renderClassTalentTable(cls);
    renderMageSpellTables(cls);
    renderClassLevelTalent(cls);
    if (classInfoTitle && cls) classInfoTitle.textContent = `Informações: ${cls}`;
    if (classInfoDescription) {
      const description = cls ? (window.CUSTOM_CLASS_DATA?.[cls]?.description || CLASS_DESCRIPTIONS[cls] || "Ainda não há uma descrição correspondente no compêndio consultado.") : "A descrição da classe aparecerá aqui.";
      classInfoDescription.replaceChildren(document.createTextNode(description));
      const equipment = CLASS_EQUIPMENT_INFO[cls];
      if (equipment) {
        [
          ["Armas", equipment.weapons],
          ["Armaduras", equipment.armor],
          ["Pontos de Vida", equipment.hp],
          ...(equipment.languages ? [["Idiomas", equipment.languages]] : [])
        ].forEach(([label, value]) => {
          classInfoDescription.append(document.createElement("br"), document.createElement("br"));
          const strong = document.createElement("strong");
          strong.style.display = "inline";
          strong.textContent = `${label}:`;
          classInfoDescription.append(strong, document.createTextNode(` ${value}.`));
        });
      }
    }
    const talents = talentOptions(cls);
    if (classInfoAbility) classInfoAbility.textContent = talents.length
      ? (hasClassTalentChoice(cls) ? "Escolha um dos talentos da classe:" : talents.map(t => `${t.name}: ${t.description || ""}`).join("; "))
      : "Nenhuma habilidade da classe cadastrada.";
    const featureConfig = FIGHTER_CLASS_FEATURES[cls] || (cls === "Fighter" ? FIGHTER_CLASS_FEATURES.Guerreiro : null);
    if (classInfoAbility && featureConfig) {
      const featureSections = [
        ["Carregador", "Some seu modificador de Constituição, se positivo, aos espaços de equipamento."],
        ["Maestria em Armas", "Escolha um tipo de arma para receber +1 em ataques e dano, além de metade do seu nível (arredondada para baixo)."],
        ["Bravura", "Escolha Força ou Destreza para ter vantagem em testes dessa categoria usados para superar uma força oposta."]
      ];
      classInfoAbility.replaceChildren();
      featureSections.forEach(([name, description], index) => {
        if (index) classInfoAbility.append(document.createElement("br"));
        const strong = document.createElement("strong");
        strong.style.display = "inline";
        strong.style.fontStyle = "normal";
        strong.textContent = `${name}.`;
        classInfoAbility.append(strong, document.createTextNode(` ${description}`));
      });
    }
    if (classInfoAbility) {
      const specialAbility = CLASS_SPECIAL_ABILITIES[cls];
      if (specialAbility) {
        classInfoAbility.replaceChildren();
        specialAbility.split(String.fromCharCode(10)).forEach((line, index) => {
          if (index) classInfoAbility.append(document.createElement("br"));
          const heading = line.match(/^(Assassino|Passo de Fumaça|Lótus Negra|Apunhalada Pelas Costas|Ladroagem|Aprendendo Magias|Conjuração|Familiar|Desbravador|Herbalismo|Instinto Primitivo|Devastar|Fúria)[.](.*)$/);
          if (heading) {
            const strong = document.createElement("strong");
            strong.style.display = "inline";
            strong.style.fontStyle = "normal";
            strong.textContent = `${heading[1]}.`;
            classInfoAbility.append(strong, document.createTextNode(heading[2]));
          } else {
            classInfoAbility.append(document.createTextNode(line));
          }
        });
      }
      classInfoAbility.style.whiteSpace = specialAbility ? "normal" : "";
    }
    if (classFeatureChoices) {
      classFeatureChoices.replaceChildren();
      const isMage = cls === "Mago";
      const isWitch = cls === "Bruxo";
      const isSpellcaster = isMage || isWitch;
      classFeatureChoices.hidden = !featureConfig && !isSpellcaster;
      if (featureConfig) {
        const makeFeatureSelect = (title, description, options, value, onChange) => {
          const wrap = document.createElement("label");
          wrap.className = "class-feature-choice";
          const heading = document.createElement("strong"); heading.textContent = title;
          const detail = document.createElement("small"); detail.textContent = description;
          const select = document.createElement("select");
          select.append(new Option("Escolha uma opção", ""));
          options.forEach(option => select.append(new Option(option.label, option.value)));
          select.value = value || "";
          select.addEventListener("change", () => { onChange(select.value); updateConfirmButton(); });
          wrap.append(heading, detail, select);
          return wrap;
        };
        pending.classFeatureChoices = pending.classFeatureChoices || {};
        classFeatureChoices.append(
          makeFeatureSelect("Maestria em Armas", "Escolha um tipo de arma.", FIGHTER_WEAPON_TYPES, pending.classFeatureChoices.weaponMastery,
            value => { pending.classFeatureChoices.weaponMastery = value; }),
          makeFeatureSelect("Bravura", "Escolha Força ou Destreza.", [
            { label: "Força", value: "Strength" }, { label: "Destreza", value: "Dexterity" }
          ], pending.classFeatureChoices.grit, value => { pending.classFeatureChoices.grit = value; })
        );
      } else if (isSpellcaster) {
        const spells = classSpells(cls);
        const listKey = spellListKey(cls);
        pending.classFeatureChoices = pending.classFeatureChoices || {};
        const selectedSpells = Array.isArray(pending.classFeatureChoices[listKey]) ? pending.classFeatureChoices[listKey] : [];
        pending.classFeatureChoices[listKey] = selectedSpells.slice(0, 3);
        const heading = document.createElement("strong");
        heading.textContent = `Magias conhecidas de 1º ${isWitch ? "nível" : "círculo"} (escolha 3)`;
        classFeatureChoices.append(heading);
        const selects = [];
        const refreshSpellOptions = () => {
          const selected = pending.classFeatureChoices[listKey].filter(Boolean);
          selects.forEach((select, index) => {
            [...select.options].forEach(option => {
              option.disabled = !!option.value && option.value !== select.value && selected.includes(option.value);
            });
            const wrap=select.closest("label");
            if(wrap) wrap.querySelector("strong").textContent = `Magia ${index + 1}`;
          });
        };
        for (let index = 0; index < 3; index++) {
          const wrap = document.createElement("label");
          wrap.className = "class-feature-choice";
          const label = document.createElement("strong");
          label.textContent = `Magia ${index + 1}`;
          const select = document.createElement("select");
          select.append(new Option("Escolha uma magia", ""));
          spells.forEach(spell => select.append(new Option(spell.label, spell.value)));
          select.value = pending.classFeatureChoices[listKey][index] || "";
          select.addEventListener("change", () => {
            pending.classFeatureChoices[listKey][index] = select.value;
            refreshSpellOptions();
            updateConfirmButton();
          });
          wrap.append(label,select);
          classFeatureChoices.append(wrap);
          selects.push(select);
        }
        refreshSpellOptions();
      }
    }
    if (classTalentChoices) {
      classTalentChoices.replaceChildren();
      classTalentChoices.hidden = !hasClassTalentChoice(cls);
      if (hasClassTalentChoice(cls)) talents.forEach(talent => {
        const label = document.createElement("label"); label.className = "race-talent-choice";
        const input = document.createElement("input"); input.type = "radio"; input.name = "classTalent"; input.value = talent.id;
        input.checked = pending.classTalent === talent.id;
        const detail = document.createElement("span");
        const name = document.createElement("b"); name.textContent = talent.name;
        const description = document.createElement("small"); description.textContent = talent.description || "";
        detail.append(name, description); label.append(input, detail);
        input.addEventListener("change", () => { pending.classTalent = talent.id; updateConfirmButton(); });
        classTalentChoices.append(label);
      });
    }
    updateConfirmButton();
  }

  function classLevelTalentRollCount(cls, race = state.race, raceTalent = state.raceTalent){
    if (!classLevelTalentConfig(cls)) return 0;
    return 1 + Math.max(0, Number(window.app.getRaceExtraClassTalentRolls?.(race, raceTalent)) || 0);
  }
  function updateTalentContinueButton(){
    const count = Number(pending.classLevelTalentRollCount) || 0;
    const complete = count > 0 && Array.isArray(pending.classLevelTalents) && pending.classLevelTalents.length >= count && pending.classLevelTalents.slice(0, count).every(Boolean) && !pending.classLevelTalentDraft;
    if (btnContinueClassTalent) btnContinueClassTalent.disabled = !complete;
  }
  function updateConfirmButton(){
    if (!btnConfirmClass) return;
    const missingTalentChoice = hasClassTalentChoice(pending.cls) && !talentOptions(pending.cls).some(t => t.id === pending.classTalent);
    const featureChoices = pending.classFeatureChoices || {};
    const missingCoreFeatureChoice = pending.cls === "Guerreiro" && (!featureChoices.weaponMastery || !featureChoices.grit);
    const isSpellcaster = ["Mago", "Bruxo"].includes(pending.cls);
    const knownSpells = Array.isArray(featureChoices[spellListKey(pending.cls)]) ? featureChoices[spellListKey(pending.cls)].filter(Boolean) : [];
    const missingKnownSpells = isSpellcaster && (knownSpells.length !== 3 || new Set(knownSpells).size !== 3);
    btnConfirmClass.disabled = !pending.cls || missingTalentChoice || missingCoreFeatureChoice || missingKnownSpells;
  }

  function goToClassLevelTalent(){
    const cls = state.cls;
    const step = $("#stepClassTalent");
    if (!classLevelTalentConfig(cls)) {
      if (step) step.style.display = "none";
      state.classLevelTalent = null;
      if (typeof window.app.goToShop === "function") window.app.goToShop();
      return;
    }
    pending.cls = cls;
    pending.classLevelTalents = [];
    pending.classLevelTalentDraft = null;
    pending.classLevelTalentRollCount = classLevelTalentRollCount(cls);
    if (step) step.style.display = "";
    if (btnContinueClassTalent) btnContinueClassTalent.textContent = "Confirmar talento e continuar";
    renderClassTalentTable(cls, classLevelTalentTable);
    renderClassLevelTalent(cls);
    updateTalentContinueButton();
    step?.scrollIntoView({ behavior:"smooth", block:"start" });
  }
  window.app.hasClassLevelTalent = cls => !!classLevelTalentConfig(cls);
  window.app.goToClassLevelTalent = goToClassLevelTalent;
  window.app.getClassLevelTalentRollCount = classLevelTalentRollCount;

  btnContinueClassTalent?.addEventListener("click", () => {
    const count = Number(pending.classLevelTalentRollCount) || 0;
    if (!count || pending.classLevelTalents.length < count || !pending.classLevelTalents.slice(0, count).every(Boolean)) return;
    state.classLevelTalent = pending.classLevelTalents.slice(0, count).map(result => ({ ...result }));
    btnContinueClassTalent.disabled = true;
    btnContinueClassTalent.textContent = "Talento confirmado";
    try { window.app.showCheck?.(btnContinueClassTalent); } catch {}
    if (typeof window.app.goToShop === "function") window.app.goToShop();
  });

  window.app.getClassLevelTalent = (cls, result) => {
    const empty = { level: 1, bonuses: [], talents: [], fields: { talentRolledDesc: "", talentRolledName: "", Rolled12TalentOrTwoStatPoints: "", Rolled12ChosenTalentDesc: "", Rolled12ChosenTalentName: "" } };
    if (!classLevelTalentConfig(cls) || !result) return empty;
    const results = (Array.isArray(result) ? result : [result]).filter(Boolean).map(normalizedTalentRecord).map(item => {
      const isInitiativeAdvantage = item.id === "InitiativeAdvantage" || item.bonusName === "InitiativeAdvantage" || item.bonusName === "AdvOnInitiative" || item.talentRolledName === "Vantagem na Iniciativa" || item.talentRolledName === "Initiative Advantage";
      return isInitiativeAdvantage ? { ...item, bonusName: "AdvOnInitiative" } : item;
    });
    if (!results.length) return empty;
    const first = results[0];
    const bonusResults = results.flatMap(item => item.id === "AssassinBlackLotusRoll" ? (item.blackLotusResults || []) : [item]);
    const talentResults = results.flatMap(item => item.id === "AssassinBlackLotusRoll" ? (item.blackLotusResults || []) : [item]);
    return { level: 1, talents: talentResults, bonuses: bonusResults.flatMap(item => makeTalentBonus(item, cls)), fields: {
      talentRolledDesc: first.talentRolledDesc || "",
      talentRolledName: first.talentRolledName || "",
      Rolled12TalentOrTwoStatPoints: first.rolled12TalentOrTwoStatPoints || "",
      Rolled12ChosenTalentDesc: first.rolled12ChosenTalentDesc || "",
      Rolled12ChosenTalentName: first.rolled12ChosenTalentName || ""
    } };
  };
  window.app.getClassLevelTalentDisplay = result => (Array.isArray(result) ? result : result ? [result] : []).map(item => item.displayDesc || CLASS_TALENT_DISPLAY[item.talentRolledName] || item.talentRolledDesc || "Talento de atributo registrado").filter(Boolean).join("; ");
  window.app.randomClassLevelTalents = (cls, race = state.race, raceTalent = state.raceTalent) => {
    const count = classLevelTalentRollCount(cls, race, raceTalent);
    const results = [];
    while (results.length < count) {
      const result = window.app.randomClassLevelTalent?.(cls, results);
      if (result) results.push(result);
    }
    return results;
  };
  window.app.randomClassLevelTalent = (cls, previousResults = []) => {
    const config = classLevelTalentConfig(cls);
    if (!config) return null;
    let roll = randInt(1, 6) + randInt(1, 6);
    while (cls === "Bardo" && roll === 2 && previousResults.some(item => item?.roll === 2)) roll = randInt(1, 6) + randInt(1, 6);
    const entry = config.entries.find(item => roll >= item.min && roll <= item.max);
    const randomChoice = (entry, chosen, rolled12 = false) => {
      if (entry.choice === "assassinBlackLotus") {
        chosen.blackLotusResults = rollAssassinLotusResults();
        chosen.displayDesc = chosen.blackLotusResults.length === 2
          ? "Lótus Negra (1: dois talentos): " + chosen.blackLotusResults.map(item => "d12 " + item.roll + " — " + item.displayDesc).join("; ")
          : "Lótus Negra (d12 " + chosen.blackLotusResults[0].roll + "): " + chosen.blackLotusResults[0].displayDesc;
      } else if (entry.choice === "barbarianStatOrMelee") {
        const choice = randInt(0, 2);
        if (choice === 2) {
          chosen.id = "BarbarianMeleeAttackBonus";
          chosen.talentRolledName = "+1 para Ataques Corpo a Corpo";
          chosen.talentRolledDesc = "+1 to melee attacks";
          chosen.bonusName = "Plus1ToHit";
          chosen.bonusTo = "Melee attacks";
          chosen.displayDesc = "+1 em ataques corpo a corpo";
        } else {
          const code = choice === 0 ? "STR" : "CON";
          const stat = code === "STR" ? "Força" : "Constituição";
          chosen.id = "StatBonus";
          chosen.talentRolledName = "+2 de " + stat;
          chosen.talentRolledDesc = "+2 " + (code === "STR" ? "Strength" : "Constitution");
          chosen.bonusName = "StatBonus";
          chosen.bonusTo = code + ":+2";
          chosen.displayDesc = "+2 em " + stat;
        }
      } else if (entry.choice === "bardAttackOrFascinate") {
        if (randInt(0, 1) === 0) {
          chosen.id = "Plus1ToHit";
          chosen.talentRolledName = "+1 para Ataques Corpo a Corpo e à Distância";
          chosen.talentRolledDesc = "+1 to melee and ranged attacks";
          chosen.bonusName = "Plus1ToHit";
          chosen.bonusTo = "Melee and ranged attacks";
          chosen.displayDesc = "+1 em ataques corpo a corpo e à distância";
        } else {
          chosen.id = "BardFascinateBonus";
          chosen.talentRolledName = "+1 em Testes de Fascinar";
          chosen.talentRolledDesc = "+1 to Fascinate checks";
          chosen.bonusName = "";
          chosen.bonusTo = "";
          chosen.exportAsBonus = false;
          chosen.displayDesc = "+1 em testes de Fascinar";
        }
      } else if (entry.choice === "assassinStatOrMelee") {
        const choice = randInt(0, 2);
        if (choice === 2) {
          chosen.id = "AssassinMeleeAttackBonus"; chosen.talentRolledName = "+1 para Ataques Corpo a Corpo";
          chosen.talentRolledDesc = "+1 to melee attacks"; chosen.bonusName = "Plus1ToHit";
          chosen.bonusTo = "Melee attacks"; chosen.displayDesc = "+1 em ataques corpo a corpo";
        } else {
          const code = choice === 0 ? "STR" : "DEX", stat = code === "STR" ? "Força" : "Destreza";
          chosen.id = "StatBonus"; chosen.talentRolledName = "+2 de " + stat;
          chosen.talentRolledDesc = "+2 " + (code === "STR" ? "Strength" : "Dexterity");
          chosen.bonusName = "StatBonus"; chosen.bonusTo = code + ":+2"; chosen.displayDesc = "+2 em " + stat;
        }
      } else if (entry.choice === "rangerWeaponDamage") {
        const weapon = FIGHTER_WEAPON_TYPES[randInt(0, FIGHTER_WEAPON_TYPES.length - 1)];
        chosen.talentRolledName = "Dado de Dano de Arma Aumentado";
        chosen.bonusName = "SetWeaponTypeDamage";
        chosen.bonusTo = weapon.value;
        chosen.displayDesc = `Dado de dano aumentado: ${weapon.label}`;
      } else if (entry.choice === "rangerAttackBonus") {
        const melee = entry.rangerAttackType ? entry.rangerAttackType === "melee" : randInt(0, 1) === 0;
        chosen.id = melee ? "RangerMeleeAttackDamage" : "RangerRangedAttackDamage";
        chosen.talentRolledName = melee ? "+1 para Ataques Corpo a Corpo e Dano" : "+1 para Ataques à Distância e Dano";
        chosen.bonusName = "Plus1ToHitAndDamage";
        chosen.bonusTo = melee ? "Melee attacks" : "Ranged attacks";
        chosen.displayDesc = melee ? "+1 para ataques corpo a corpo e dano" : "+1 para ataques à distância e dano";
      } else if (entry.choice === "rangerHerbalism") {
        const remedy = RANGER_REMEDIES[randInt(0, RANGER_REMEDIES.length - 1)];
        chosen.talentRolledName = "Vantagem em Teste de Herbalismo";
        chosen.bonusName = "ReduceHerbalismDC";
        chosen.bonusTo = remedy.value;
        chosen.displayDesc = `Vantagem em Herbalismo para preparar: ${remedy.label.replace(/ \(CD \d+\)$/, "")}`;
      } else if (entry.choice === "stat") {
        const options = entry.statOptions || ["STR", "DEX", "CHA"];
        const code = options[randInt(0, options.length - 1)];
        const stat = STAT_LABELS.find(name => STAT_CODES[name] === code);
        const english = {STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"}[code];
        chosen.bonusTo = `${code}:+2`;
        chosen.talentRolledName = `+2 de ${stat}`;
        chosen.talentRolledDesc = `+2 ${english}`;
        chosen.displayDesc = `+2 em ${stat}`;
      } else if (entry.choice === "distributeStats") {
        const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
        const first = stats[randInt(0, stats.length - 1)];
        const second = stats[randInt(0, stats.length - 1)];
        const counts = [first, second].reduce((acc, code) => ({...acc,[code]:(acc[code]||0)+1}), {});
        const labels = [first, second].map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
        chosen.id = "TwoStatPoints";
        chosen.talentRolledName = "Distribuir entre Atributos";
        chosen.talentRolledDesc = "+2 to ability scores";
        chosen.bonusName = "StatBonus";
        chosen.bonusTo = Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", ");
        chosen.displayDesc = `+2 pontos nos atributos: ${labels.join(" e ")}`;
      } else if (entry.choice === "weaponMastery") {
        const weapon = FIGHTER_WEAPON_TYPES[randInt(0, FIGHTER_WEAPON_TYPES.length - 1)];
        chosen.bonusTo = weapon.value;
        chosen.talentRolledName = entry.name || "WeaponMastery";
        chosen.displayDesc = `Maestria em Armas adicional: ${weapon.label}`;
      } else if (entry.choice === "armorMastery") {
        const armor = FIGHTER_ARMOR_TYPES[randInt(0, FIGHTER_ARMOR_TYPES.length - 1)];
        chosen.bonusTo = armor.value;
        chosen.talentRolledName = entry.name || "ArmorMastery";
        chosen.displayDesc = `+1 na CA usando ${armor.label}`;
      } else if (entry.choice === "magicItem") {
        const item = MAGE_ITEM_TYPES[randInt(0, MAGE_ITEM_TYPES.length - 1)];
        chosen.talentRolledName = "Criar um Item Mágico Aleatório";
        chosen.bonusName = "MakeRandomMagicItem";
        chosen.bonusTo = item.value;
        chosen.displayDesc = `Crie 1 item mágico aleatório: ${item.label}`;
      } else if (entry.choice === "mageStatOrCasting" || entry.choice === "witchStatOrCasting") {
        const isWitch = entry.choice === "witchStatOrCasting";
        if (randInt(0, 1) === 0) {
          chosen.id = "StatBonus";
          chosen.talentRolledName = isWitch ? "+2 de Carisma" : "+2 de Inteligência";
          chosen.bonusName = "StatBonus";
          chosen.bonusTo = isWitch ? "CHA:+2" : "INT:+2";
          chosen.talentRolledDesc = isWitch ? "+2 Charisma" : "+2 Intelligence";
          chosen.displayDesc = isWitch ? "+2 para Carisma" : "+2 em Inteligência";
        } else {
          chosen.id = "Plus1ToCastingSpells";
          chosen.talentRolledName = "+1 em Testes de Conjuração de Magia";
          chosen.bonusName = "Plus1ToCastingSpells";
          chosen.bonusTo = "Casting spells";
          chosen.talentRolledDesc = isWitch ? "+1 to casting checks" : "+1 to casting checks for mage spells";
          chosen.displayDesc = isWitch ? "+1 para testes de conjuração" : "+1 em testes de conjuração de magias de mago";
        }
      } else if (["mageKnownSpell", "mageExtraSpell", "witchKnownSpell", "witchExtraSpell"].includes(entry.choice)) {
        const spellChoices = classSpells(cls);
        const previousExtras = (Array.isArray(previousResults) ? previousResults : [])
          .filter(talent => talent?.bonusName === "PickExtraSpell")
          .map(talent => talent.bonusTo);
        const known = [...(state.classFeatures?.[spellListKey(cls)] || []), ...previousExtras];
        const choosesKnown = entry.choice === "mageKnownSpell" || entry.choice === "witchKnownSpell";
        const options = choosesKnown
          ? spellChoices.filter(spell => known.includes(spell.value))
          : spellChoices.filter(spell => !known.includes(spell.value));
        const spell = options[randInt(0, options.length - 1)];
        if (spell) {
          chosen.bonusTo = entry.choice === "witchKnownSpell" ? spell.label : spell.value;
          chosen.talentRolledName = entry.name;
          chosen.displayDesc = choosesKnown
            ? `Vantagem ao conjurar: ${spell.label}`
            : `Magia adicional aprendida: ${spell.label}`;
        }
      }
      if (rolled12) {
        chosen.rolled12TalentOrTwoStatPoints = "Talent";
        chosen.rolled12ChosenTalentName = chosen.talentRolledName;
        chosen.rolled12ChosenTalentDesc = chosen.talentRolledDesc;
      }
      return chosen;
    };
    let result = resultForEntry(entry, roll);
    if (entry.choice === "rangerTwelve") {
      const options = config.entries.filter(item => ["rangerWeaponDamage", "rangerAttackBonus", "rangerHerbalism"].includes(item.choice)).flatMap(item => item.choice === "rangerAttackBonus" ? [
        { ...item, id: "RangerMeleeAttackDamage", rangerAttackType: "melee" },
        { ...item, id: "RangerRangedAttackDamage", rangerAttackType: "ranged" }
      ] : [item]).concat({ choice: "rangerDistributeStats" });
      const selected = options[randInt(0, options.length - 1)];
      if (selected.choice === "rangerDistributeStats") {
        const first = ["STR", "DEX", "CON", "INT", "WIS", "CHA"][randInt(0, 5)];
        const second = ["STR", "DEX", "CON", "INT", "WIS", "CHA"][randInt(0, 5)];
        const counts = [first, second].reduce((acc, code) => ({ ...acc, [code]: (acc[code] || 0) + 1 }), {});
        const labels = [first, second].map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
        return { roll, id: "TwoStatPoints", talentRolledName: "Distribuir entre Atributos", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", "), rolled12Mode: "twoStatPoints", rolled12TalentOrTwoStatPoints: "TwoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}` };
      }
      result = randomChoice(selected, resultForEntry(selected, roll), true);
      result.rolled12Mode = "talent";
      result.rolled12TalentOrTwoStatPoints = "Talent";
      result.rolled12ChosenTalentName = result.talentRolledName;
      result.rolled12ChosenTalentDesc = result.talentRolledDesc;
      result.displayDesc = `Escolheu talento: ${result.displayDesc || selected.desc}`;
      return result;
    }
    if (entry.choice === "twelve") {
      if (randInt(0, 1) === 0) {
        const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
        const first = stats[randInt(0, stats.length - 1)];
        const second = stats[randInt(0, stats.length - 1)];
        const counts = [first, second].reduce((acc, code) => ({ ...acc, [code]: (acc[code] || 0) + 1 }), {});
        const labels = [first, second].map(code => STAT_LABELS.find(stat => STAT_CODES[stat] === code));
        return { roll, id: "TwoStatPoints", talentRolledName: "Distribuir entre Atributos", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", "), rolled12Mode: "twoStatPoints", rolled12TalentOrTwoStatPoints: "TwoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}` };
      }
      const choices = config.entries.filter(item => item.choice !== "twelve");
      const chosenEntry = choices[randInt(0, choices.length - 1)];
      result = randomChoice(chosenEntry, resultForEntry(chosenEntry, roll), true);
      result.rolled12Mode = "talent";
      result.displayDesc = `Escolheu talento: ${result.displayDesc || chosenEntry.desc}`;
      return result;
    }
    return entry.choice ? randomChoice(entry, result) : result;
  };

  window.app.getClassContent = cls => ({
    name: cls,
    description: window.CUSTOM_CLASS_DATA?.[cls]?.description ?? CLASS_DESCRIPTIONS[cls] ?? "",
    hp: CLASS_DICE[cls] || 6,
    talents: talentOptions(cls).map(item => ({ ...item })),
    languages: window.langs?.getClassBonusSpec(cls) || {},
    origins: window.getOriginsForClass?.(cls) || (window.CUSTOM_ORIGENS?.[cls] || []).map(item => ({ ...item }))
  });
  window.app.getClassChoiceMetadata = (cls, talentId) => {
    const options = talentOptions(cls);
    const selected = options.find(item => item.id === talentId);
    if (!hasClassTalentChoice(cls) || options.length < 2 || !selected?.originalName || options.some(item => !item.originalName)) return [];
    return [{ sourceType: "Class", sourceName: window.CUSTOM_CLASS_DATA?.[cls]?.foundryName || cls, selected: selected.originalName, options: options.map(item => item.originalName) }];
  };

  // Sorteia uma classe aleatória
  if (btnRandClass) {
    btnRandClass.addEventListener("click", () => {
      const c = CLASSES[randInt(0, CLASSES.length - 1)];
      if (classSel) {
        classSel.value = c;
        if (classSel.options.length > 0) classSel.options[0].disabled = true;
      }
      pending.cls = c;
      pending.classLevelTalents = [];
      pending.classLevelTalentDraft = null;
      pending.classFeatureChoices = window.app.randomClassFeatureChoices?.(c) || null;
      pending.classTalent = hasClassTalentChoice(c) ? null : (talentOptions(c).length === 1 ? talentOptions(c)[0].id : null);
      updateClassInfo(c);
      updateConfirmButton();
    });
  }
  // Seleção manual da classe
  if (classSel) {
    classSel.addEventListener("change", e => {
      const val = e.target.value;
      pending.cls = val || null;
      pending.classLevelTalents = [];
      pending.classLevelTalentDraft = null;
      pending.classFeatureChoices = null;
      const talents = talentOptions(pending.cls);
      pending.classTalent = hasClassTalentChoice(pending.cls) ? null : (talents.length === 1 ? talents[0].id : null);
      updateClassInfo(pending.cls);
      updateConfirmButton();
    });
  }
  // Confirma a classe e prepara as etapas seguintes
  if (btnConfirmClass) {
    btnConfirmClass.addEventListener("click", () => {
      if (!pending.cls || (hasClassTalentChoice(pending.cls) && !talentOptions(pending.cls).some(t => t.id === pending.classTalent))) return;
      state.cls = pending.cls;
      state.classTalent = pending.classTalent;
      state.classFeatures = pending.classFeatureChoices ? { ...pending.classFeatureChoices } : null;
      state.classLevelTalent = null;
      state.origem = null;
      if (classSel) classSel.disabled = true;
      if (btnRandClass) btnRandClass.disabled = true;
      btnConfirmClass.disabled = true;
      // Feedback visual
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirmClass); } catch {}
      // Reseta visibilidade das seções subsequentes
      const stepMastery = $("#stepMastery");
      const stepOrigin = $("#stepOrigin");
      const stepClassTalent = $("#stepClassTalent");
      const stepHP    = $("#stepHP");
      const stepGold  = $("#stepGold");
      const stepAlign = $("#stepAlign");
      const stepFinal = $("#stepFinal");
      if (stepMastery) stepMastery.style.display = "none";
      if (stepOrigin) stepOrigin.style.display = "none";
      if (stepClassTalent) stepClassTalent.style.display = "none";
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



