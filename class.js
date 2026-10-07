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
  const CLASS_DESCRIPTIONS = {
    "Malandro": THIEF_DESCRIPTION,
    "Ladrão": THIEF_DESCRIPTION,
    "Bardo": "Bardos são viajantes bem-vindos e conselheiros sábios; sua tarefa é proteger e compartilhar o conhecimento que é repassado através das eras.",
    "Guerreiro": "Gladiadores ensanguentados usando armaduras amassadas, duelistas acrobáticos com suas espadas de arremesso, ou arqueiros élficos de visão aguçada que forjam suas lendas com aço e coragem.",
    "Mago": "Adeptos tatuados com runas, sábios usando óculos, e bruxas conjuradoras de chamas que ousam manipular as terríveis forças da magia.",
    "Patrulheiro": "Rastreadores habilidosos, andarilhos furtivos e guerreiros incomparáveis que têm as terras selvagens como lar.",
    "Sacerdote": "Templários cruzados, xamãs proféticos, ou fanáticos com olhos enlouquecidos que empunham o poder de seus deuses para expurgar os impuros."
  };

  const CLASS_TALENT_TABLES = {
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
        { roll: "3–6", effect: "Escolha 1" },
        { roll: "3–6", effect: "+1 para Ataques Corpo a Corpo e Dano" },
        { roll: "3–6", effect: "+1 para Ataques à Distância e Dano" },
        { roll: "7–9", effect: "Escolha 1" },
        { roll: "7–9", effect: "+2 de Força" },
        { roll: "7–9", effect: "+2 de Destreza" },
        { roll: "7–9", effect: "+2 de Inteligência" },
        { roll: "10–11", effect: "Vantagem em Teste de Herbalismo" },
        { roll: "12", effect: "Escolha 1" },
        { roll: "12", effect: "Dado de Dano de Arma Aumentado" },
        { roll: "12", effect: "+1 para Ataques Corpo a Corpo e Dano" },
        { roll: "12", effect: "+1 para Ataques à Distância e Dano" },
        { roll: "12", effect: "Vantagem em Teste de Herbalismo" },
        { roll: "12", effect: "Distribuir entre Atributos" }
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
    "Mago": MAGE_SPECIAL_ABILITY,
    "Malandro": THIEF_SPECIAL_ABILITY,
    "Ladrão": THIEF_SPECIAL_ABILITY
  };

  const CLASS_LEVEL_TALENTS = {
    "Mago": {
      foundryName: "Mago",
      title: "Talentos de Mago",
      entries: [
        { min: 2, max: 2, id: "MakeRandomMagicItem", name: "MakeRandomMagicItem", choice: "magicItem", desc: "Crie 1 item mágico aleatório de qualquer tipo, à sua escolha", foundryDesc: "Create one random magic item of any type, your choice", bonusName: "MakeRandomMagicItem" },
        { min: 3, max: 7, id: "Plus2INTOrPlus1Casting", choice: "mageStatOrCasting", desc: "+2 em Inteligência ou +1 em testes de conjuração de magias de mago", foundryDesc: "+2 Intelligence or +1 to casting checks for mage spells" },
        { min: 8, max: 9, id: "AdvOnCastOneSpell", name: "AdvOnCastOneSpell", choice: "mageKnownSpell", desc: "Ganhe Vantagem na conjuração de uma magia que você conhece", foundryDesc: "Gain Advantage casting one spell you know", bonusName: "AdvOnCastOneSpell" },
        { min: 10, max: 11, id: "PickExtraSpell", name: "PickExtraSpell", choice: "mageExtraSpell", desc: "Aprenda outra magia de mago de qualquer grau que você conheça", foundryDesc: "Learn one additional mage spell of any tier you know", bonusName: "PickExtraSpell" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Patrulheiro": {
      foundryName: "Patrulheiro",
      title: "Talentos de Patrulheiro",
      entries: [
        { min: 2, max: 2, id: "IncreasedWeaponDamageDie", name: "Increased Weapon Damage Die", choice: "rangerWeaponDamage", desc: "Dado de Dano de Arma Aumentado", foundryDesc: "Increased Weapon Damage Die", bonusName: "Increased Weapon Damage Die" },
        { min: 3, max: 6, id: "RangerAttackBonus", choice: "rangerAttackBonus", desc: "Escolha +1 para ataques corpo a corpo e dano ou ataques à distância e dano", foundryDesc: "Choose +1 to melee attacks and damage or ranged attacks and damage" },
        { min: 7, max: 9, id: "StatBonus", choice: "stat", statOptions: ["STR", "DEX", "INT"], desc: "+2 em Força, Destreza ou Inteligência", foundryDesc: "+2 Strength, Dexterity, or Intelligence", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "HerbalismCheckAdvantage", name: "Herbalism Check Advantage", choice: "rangerHerbalism", desc: "Vantagem em Teste de Herbalismo", foundryDesc: "Herbalism Check Advantage", bonusName: "Herbalism Check Advantage" },
        { min: 12, max: 12, id: "RangerChooseTalentOrStats", choice: "rangerTwelve", desc: "Escolha um talento da tabela ou distribua +2 pontos entre os atributos", foundryDesc: "Choose a talent from the table or distribute +2 points among ability scores" }
      ]
    },
    "Guerreiro": {
      foundryName: "Guerreiro",
      title: "Talentos de Guerreiro",
      entries: [
        { min: 2, max: 2, id: "WeaponMastery", name: "WeaponMastery", choice: "weaponMastery", desc: "Ganhe Maestria em Armas em um tipo de arma adicional", foundryDesc: "Gain Weapon Mastery with one additional weapon", bonusName: "Plus1AttackAndDamagePlusHalfLevel" },
        { min: 3, max: 6, id: "Plus1ToHit", name: "+1 para Ataques Corpo a Corpo ou à Distância", desc: "+1 em ataques corpo a corpo e à distância", foundryDesc: "+1 to melee and ranged attacks", bonusTo: "Melee and ranged attacks", bonusName: "Plus1ToHit" },
        { min: 7, max: 9, id: "StatBonus", choice: "stat", statOptions: ["STR", "DEX", "CON"], desc: "+2 em Força, Destreza ou Constituição", foundryDesc: "+2 Strength, Dexterity, or Constitution", bonusName: "StatBonus" },
        { min: 10, max: 11, id: "ArmorMastery", name: "ArmorMastery", choice: "armorMastery", desc: "Escolha um tipo de armadura e receba +1 na CA ao usá-la", foundryDesc: "Choose one kind of armor. You get +1 AC from that armor", bonusName: "ArmorMastery" },
        { min: 12, max: 12, id: "ChooseTalentOrStats", choice: "twelve", desc: "Escolha um talento ou distribua +2 pontos entre os seus atributos" }
      ]
    },
    "Malandro": {
      foundryName: "Ladrão",
      title: "Talentos de Ladrão",
      entries: [
        { min: 2, max: 2, id: "InitiativeAdvantage", name: "Vantagem na Iniciativa", desc: "Vantagem nas rolagens de iniciativa (role novamente se repetir)", foundryDesc: "Advantage on initiative rolls (reroll if tied)", bonusTo: "Initiative", bonusName: "AdvOnInitiative" },
        { min: 3, max: 5, id: "BackstabIncrease", name: "BackstabIncrease", desc: "Sua Apunhalada pelas Costas causa +1 dado de dano", foundryDesc: "Your Backstab deals +1 dice of damage", bonusTo: "Backstab", bonusName: "BackstabIncrease" },
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

  function classLevelTalentConfig(cls){ return CLASS_LEVEL_TALENTS[cls] || null; }
  window.app.getFoundryClassName = cls => classLevelTalentConfig(cls)?.foundryName || window.CUSTOM_CLASS_DATA?.[cls]?.foundryName || cls || "";
  function resultForEntry(entry, roll){ return { roll, id: entry.id, talentRolledName: entry.name || "", talentRolledDesc: entry.foundryDesc || entry.desc, displayDesc: entry.desc, bonusName: entry.bonusName || entry.id, bonusTo: entry.bonusTo || "", needsChoice: entry.choice || "", statOptions: entry.statOptions || null }; }
  function makeTalentBonus(result, cls){
    if (!result || !(result.bonusName || result.id)) return [];
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
      } else if (entry.choice === "weaponMastery" || entry.choice === "armorMastery") {
        const weapon = entry.choice === "weaponMastery";
        const select = document.createElement("select");
        select.append(new Option(weapon ? "Escolha uma arma" : "Escolha uma armadura", ""));
        (weapon ? FIGHTER_WEAPON_TYPES : FIGHTER_ARMOR_TYPES).forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          chosen.bonusTo = select.value;
          chosen.talentRolledName = entry.name || (weapon ? "WeaponMastery" : "ArmorMastery");
          chosen.displayDesc = weapon ? `Maestria em Armas adicional: ${(FIGHTER_WEAPON_TYPES.find(item => item.value === select.value) || {}).label}` : `+1 na CA usando ${(FIGHTER_ARMOR_TYPES.find(item => item.value === select.value) || {}).label}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "rangerWeaponDamage") {
        const select = document.createElement("select");
        select.append(new Option("Escolha a arma", ""));
        FIGHTER_WEAPON_TYPES.forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const weapon = FIGHTER_WEAPON_TYPES.find(item => item.value === select.value);
          chosen.talentRolledName = "Increased Weapon Damage Die";
          chosen.bonusName = "Increased Weapon Damage Die";
          chosen.bonusTo = weapon.value;
          chosen.displayDesc = `Dado de dano aumentado: ${weapon.label}`;
          complete(chosen);
        });
        details.append(select);
      } else if (entry.choice === "rangerAttackBonus") {
        const applyAttackBonus = attackType => {
          const melee = attackType === "melee";
          chosen.id = melee ? "RangerMeleeAttackDamage" : "RangerRangedAttackDamage";
          chosen.talentRolledName = melee ? "+1 to Melee Attacks and Damage" : "+1 to Ranged Attacks and Damage";
          chosen.bonusName = chosen.talentRolledName;
          chosen.bonusTo = chosen.talentRolledName;
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
        const label = document.createElement("label");
        label.textContent = "Erva escolhida";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Digite o nome da erva";
        input.addEventListener("input", () => {
          if (!input.value.trim()) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          chosen.talentRolledName = "Herbalism Check Advantage";
          chosen.bonusName = "Herbalism Check Advantage";
          chosen.bonusTo = input.value.trim();
          chosen.displayDesc = `Vantagem em Herbalismo: ${input.value.trim()}`;
          complete(chosen);
        });
        label.append(input);
        details.append(label);
      } else if (entry.choice === "magicItem") {
        const select = document.createElement("select");
        select.append(new Option("Selecione uma categoria de item mágico", ""));
        MAGE_ITEM_TYPES.forEach(option => select.append(new Option(option.label, option.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const category = MAGE_ITEM_TYPES.find(item => item.value === select.value);
          chosen.talentRolledName = "MakeRandomMagicItem";
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
            chosen.talentRolledName = "Plus1ToCastingSpells";
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
      } else if (entry.choice === "mageKnownSpell" || entry.choice === "mageExtraSpell") {
        const known = state.classFeatures?.mageSpells || [];
        const options = entry.choice === "mageKnownSpell"
          ? MAGE_SPELLS.filter(spell => known.includes(spell.value))
          : MAGE_SPELLS.filter(spell => !known.includes(spell.value));
        const select = document.createElement("select");
        select.append(new Option(entry.choice === "mageKnownSpell" ? "Escolha uma magia conhecida" : "Escolha a magia adicional", ""));
        options.forEach(spell => select.append(new Option(spell.label, spell.value)));
        select.addEventListener("change", () => {
          if (!select.value) { pending.classLevelTalents[rollIndex] = null; updateTalentContinueButton(); return; }
          const spell = MAGE_SPELLS.find(item => item.value === select.value);
          chosen.bonusTo = spell.value;
          chosen.talentRolledName = entry.name;
          chosen.displayDesc = entry.choice === "mageKnownSpell"
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
    } else if (["weaponMastery", "armorMastery", "magicItem", "mageStatOrCasting", "mageKnownSpell", "mageExtraSpell", "rangerWeaponDamage", "rangerAttackBonus", "rangerHerbalism"].includes(result.needsChoice)) {
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
            finish({ roll: result.roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code,n]) => `${code}:+${n}`).join(", "), rolled12Mode: "twoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}`, rolled12TalentOrTwoStatPoints: "TwoStatPoints" });
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
              roll: result.roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores",
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
      const roll = randInt(1, 6) + randInt(1, 6);
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

    const title = document.createElement("h4");
    title.textContent = data.title;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    ["2d6", "Efeito"].forEach(label => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      headingRow.append(th);
    });
    thead.append(headingRow);
    const tbody = document.createElement("tbody");
    data.entries.forEach(entry => {
      const row = document.createElement("tr");
      const roll = document.createElement("th");
      roll.scope = "row";
      roll.textContent = entry.roll;
      const effect = document.createElement("td");
      effect.textContent = entry.effect;
      row.append(roll, effect);
      tbody.append(row);
    });
    table.append(thead, tbody);
    target.append(title, table);
  }

  function renderMageSpellTables(cls){
    if (!mageSpellTables) return;
    mageSpellTables.replaceChildren();
    mageSpellTables.hidden = cls !== "Mago";
    if (cls !== "Mago") return;
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
    const knownSpellTable = makeTable("Magias de Mago Conhecidas", ["Nível","1","2","3","4","5"], [
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
    ], "Magias Conhecidas por Grau de Magia");
    const info = document.createElement("details");
    info.className = "mage-known-spells-info";
    info.style.margin = "8px 0";
    const trigger = document.createElement("summary");
    trigger.className = "mage-known-spells-info__trigger";
    trigger.textContent = "i";
    trigger.title = "Ver tabela completa de magias de mago conhecidas";
    trigger.setAttribute("aria-label", trigger.title);
    trigger.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid currentColor;border-radius:50%;font-size:14px;font-weight:700;line-height:1;cursor:pointer;list-style:none;";
    info.append(trigger, knownSpellTable.title, knownSpellTable.table);
    mageSpellTables.append(info);
    const spellListTable = makeTable("Magias de 1º círculo", ["Magia","Duração","Alcance"], MAGE_SPELLS.map(spell => [spell.label,spell.duration,spell.range]));
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
      classInfoDescription.textContent = cls ? (window.CUSTOM_CLASS_DATA?.[cls]?.description || CLASS_DESCRIPTIONS[cls] || "Ainda não há uma descrição correspondente no compêndio consultado.") : "A descrição da classe aparecerá aqui.";
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
          const heading = line.match(/^(Apunhalada Pelas Costas|Ladroagem|Aprendendo Magias|Conjuração)[.](.*)$/);
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
      classFeatureChoices.hidden = !featureConfig && !isMage;
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
      } else if (isMage) {
        pending.classFeatureChoices = pending.classFeatureChoices || {};
        const selectedSpells = Array.isArray(pending.classFeatureChoices.mageSpells) ? pending.classFeatureChoices.mageSpells : [];
        pending.classFeatureChoices.mageSpells = selectedSpells.slice(0, 3);
        const heading = document.createElement("strong");
        heading.textContent = "Magias conhecidas de 1º círculo (escolha 3)";
        classFeatureChoices.append(heading);
        const selects = [];
        const refreshSpellOptions = () => {
          const selected = pending.classFeatureChoices.mageSpells.filter(Boolean);
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
          MAGE_SPELLS.forEach(spell => select.append(new Option(spell.label, spell.value)));
          select.value = pending.classFeatureChoices.mageSpells[index] || "";
          select.addEventListener("change", () => {
            pending.classFeatureChoices.mageSpells[index] = select.value;
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
    const mageSpells = Array.isArray(featureChoices.mageSpells) ? featureChoices.mageSpells.filter(Boolean) : [];
    const missingMageSpells = pending.cls === "Mago" && (mageSpells.length !== 3 || new Set(mageSpells).size !== 3);
    btnConfirmClass.disabled = !pending.cls || missingTalentChoice || missingCoreFeatureChoice || missingMageSpells;
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
    const results = (Array.isArray(result) ? result : [result]).filter(Boolean).map(item => {
      const isInitiativeAdvantage = item.id === "InitiativeAdvantage" || item.bonusName === "InitiativeAdvantage" || item.bonusName === "AdvOnInitiative" || item.talentRolledName === "Vantagem na Iniciativa" || item.talentRolledName === "Initiative Advantage";
      return isInitiativeAdvantage ? { ...item, bonusName: "AdvOnInitiative" } : item;
    });
    if (!results.length) return empty;
    const first = results[0];
    return { level: 1, talents: results, bonuses: results.flatMap(item => makeTalentBonus(item, cls)), fields: {
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
    return Array.from({ length: count }, () => window.app.randomClassLevelTalent?.(cls)).filter(Boolean);
  };
  window.app.randomClassLevelTalent = cls => {
    const config = classLevelTalentConfig(cls);
    if (!config) return null;
    const roll = randInt(1, 6) + randInt(1, 6);
    const entry = config.entries.find(item => roll >= item.min && roll <= item.max);
    const randomChoice = (entry, chosen, rolled12 = false) => {
      if (entry.choice === "rangerWeaponDamage") {
        const weapon = FIGHTER_WEAPON_TYPES[randInt(0, FIGHTER_WEAPON_TYPES.length - 1)];
        chosen.talentRolledName = "Increased Weapon Damage Die";
        chosen.bonusName = "Increased Weapon Damage Die";
        chosen.bonusTo = weapon.value;
        chosen.displayDesc = `Dado de dano aumentado: ${weapon.label}`;
      } else if (entry.choice === "rangerAttackBonus") {
        const melee = entry.rangerAttackType ? entry.rangerAttackType === "melee" : randInt(0, 1) === 0;
        chosen.id = melee ? "RangerMeleeAttackDamage" : "RangerRangedAttackDamage";
        chosen.talentRolledName = melee ? "+1 to Melee Attacks and Damage" : "+1 to Ranged Attacks and Damage";
        chosen.bonusName = chosen.talentRolledName;
        chosen.bonusTo = chosen.talentRolledName;
        chosen.displayDesc = melee ? "+1 para ataques corpo a corpo e dano" : "+1 para ataques à distância e dano";
      } else if (entry.choice === "rangerHerbalism") {
        chosen.talentRolledName = "Herbalism Check Advantage";
        chosen.bonusName = "Herbalism Check Advantage";
        chosen.bonusTo = "herb";
        chosen.displayDesc = "Vantagem em Teste de Herbalismo";
      } else if (entry.choice === "stat") {
        const options = entry.statOptions || ["STR", "DEX", "CHA"];
        const code = options[randInt(0, options.length - 1)];
        const stat = STAT_LABELS.find(name => STAT_CODES[name] === code);
        const english = {STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"}[code];
        chosen.bonusTo = `${code}:+2`;
        chosen.talentRolledName = `+2 de ${stat}`;
        chosen.talentRolledDesc = `+2 ${english}`;
        chosen.displayDesc = `+2 em ${stat}`;
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
        chosen.talentRolledName = "MakeRandomMagicItem";
        chosen.bonusName = "MakeRandomMagicItem";
        chosen.bonusTo = item.value;
        chosen.displayDesc = `Crie 1 item mágico aleatório: ${item.label}`;
      } else if (entry.choice === "mageStatOrCasting") {
        if (randInt(0, 1) === 0) {
          chosen.id = "StatBonus";
          chosen.talentRolledName = "+2 de Inteligência";
          chosen.bonusName = "StatBonus";
          chosen.bonusTo = "INT:+2";
          chosen.talentRolledDesc = "+2 Intelligence";
          chosen.displayDesc = "+2 em Inteligência";
        } else {
          chosen.id = "Plus1ToCastingSpells";
          chosen.talentRolledName = "Plus1ToCastingSpells";
          chosen.bonusName = "Plus1ToCastingSpells";
          chosen.bonusTo = "Casting spells";
          chosen.talentRolledDesc = "+1 to casting checks for mage spells";
          chosen.displayDesc = "+1 em testes de conjuração de magias de mago";
        }
      } else if (entry.choice === "mageKnownSpell" || entry.choice === "mageExtraSpell") {
        const known = state.classFeatures?.mageSpells || [];
        const options = entry.choice === "mageKnownSpell"
          ? MAGE_SPELLS.filter(spell => known.includes(spell.value))
          : MAGE_SPELLS.filter(spell => !known.includes(spell.value));
        const spell = options[randInt(0, options.length - 1)];
        if (spell) {
          chosen.bonusTo = spell.value;
          chosen.talentRolledName = entry.name;
          chosen.displayDesc = entry.choice === "mageKnownSpell"
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
        return { roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", "), rolled12Mode: "twoStatPoints", rolled12TalentOrTwoStatPoints: "TwoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}` };
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
        return { roll, id: "TwoStatPoints", talentRolledName: "", talentRolledDesc: "+2 to ability scores", bonusName: "StatBonus", bonusTo: Object.entries(counts).map(([code, amount]) => `${code}:+${amount}`).join(", "), rolled12Mode: "twoStatPoints", rolled12TalentOrTwoStatPoints: "TwoStatPoints", displayDesc: `+2 pontos nos atributos: ${labels.join(" e ")}` };
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

