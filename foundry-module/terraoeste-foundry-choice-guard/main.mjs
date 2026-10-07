const MODULE_ID = "terraoeste-foundry-choice-guard";
const WEAPON_MASTERY_BONUS = "Plus1AttackAndDamagePlusHalfLevel";

function key(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en");
}

function slug(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function knownChoicesFromBonuses(bonuses) {
  const choices = [];
  for (const bonus of Array.isArray(bonuses) ? bonuses : []) {
    if (bonus.name === "FarSight") {
      const selected = bonus.bonusName === "AttackBonus"
        ? "Farsight (Ranged)"
        : bonus.bonusName === "Plus1ToCastingSpells"
          ? "Farsight (Spell)" : null;
      if (selected) choices.push({
        sourceType: "Ancestry", selected,
        options: ["Farsight (Ranged)", "Farsight (Spell)"]
      });
    }
    if (bonus.name === "Knack") {
      const selected = bonus.bonusName === "LuckTokenAtStartOfSession"
        ? "Knack (Luck)"
        : bonus.bonusName === "Plus1ToCastingSpells"
          ? "Knack (Spellcasting)" : null;
      if (selected) choices.push({
        sourceType: "Ancestry", selected,
        options: ["Knack (Spellcasting)", "Knack (Luck)"]
      });
    }
  }
  return choices;
}

function readChoices(json) {
  const declared = Array.isArray(json?.terraOesteChoices) ? json.terraOesteChoices : [];
  const choices = declared.length ? declared : knownChoicesFromBonuses(json?.bonuses);
  return choices.filter(choice =>
    ["Ancestry", "Class"].includes(choice?.sourceType) &&
    typeof choice.selected === "string" &&
    Array.isArray(choice.options) &&
    choice.options.length > 1 &&
    choice.options.every(option => typeof option === "string") &&
    choice.options.some(option => key(option) === key(choice.selected))
  );
}

async function sourceItemIds(importer, sourceType) {
  const sourceUuid = sourceType === "Ancestry"
    ? importer.importedActor?.system?.ancestry
    : importer.importedActor?.system?.class;
  if (!sourceUuid) return null;
  const source = await fromUuid(sourceUuid);
  if (!source) return null;
  const refs = [
    ...(source.system?.talents ?? []),
    ...(source.system?.classAbilities ?? [])
  ];
  return new Set(refs.map(ref => String(ref).split(".").pop()));
}

function keepSelected(items, choice, sourceIds) {
  if (!Array.isArray(items)) return items;
  const options = new Set(choice.options.map(key));
  const selected = key(choice.selected);
  return items.filter(item => {
    if (sourceIds && !sourceIds.has(item._id)) return true;
    const originalName = item.flags?.babele?.originalName ?? item.name;
    const originalKey = key(originalName);
    return !options.has(originalKey) || originalKey === selected;
  });
}

function weaponDisplayName(value) {
  const names = {
    "dagger": "Adaga", "shortbow": "Arco curto", "longbow": "Arco longo",
    "javelin": "Azagaia", "crossbow": "Besta", "bolas": "Boleadeira",
    "staff": "Cajado", "whip": "Chicote", "scimitar": "Cimitarra",
    "club": "Clava", "razor chain": "Corrente laminada",
    "bastard sword": "Espada bastarda", "shortsword": "Espada curta",
    "greatsword": "Espada grande", "longsword": "Espada longa", "sling": "Funda",
    "spear": "Lança", "mace": "Maça", "morning star": "Maça estrela",
    "handaxe": "Machadinha", "greataxe": "Machado grande",
    "warhammer": "Martelo de guerra", "pike": "Pique",
    "spear-thrower": "Propulsor", "shuriken": "Shuriken", "blowgun": "Zarabatana",
    "stave": "Bastão"
  };
  return names[key(value)] || String(value ?? "").trim();
}

async function weaponAttackType(weaponName) {
  const wanted = key(weaponName);
  for (const pack of game.packs) {
    if (pack.metadata.type !== "Item") continue;
    const entry = pack.index.find(item =>
      item.type === "Weapon" && key(item.name) === wanted
    );
    if (!entry) continue;
    const weapon = await pack.getDocument(entry._id);
    if (["melee", "ranged"].includes(weapon?.system?.type)) return weapon.system.type;
  }

  // Fallback for custom/unindexed weapons. This mirrors the weapon categories
  // used by the Shadowdark core gear compendium.
  const ranged = new Set(["shortbow", "longbow", "crossbow", "sling", "blowgun", "shuriken"]);
  return ranged.has(wanted) ? "ranged" : "melee";
}

function setWeaponMasteryEffect(item, weaponName, attackType) {
  const weaponSlug = slug(weaponName);
  let replaced = 0;
  for (const effect of item.effects ?? []) {
    const changes = Array.isArray(effect.changes)
      ? effect.changes
      : Array.isArray(effect.system?.changes) ? effect.system.changes : [];
    for (const change of changes) {
      const match = String(change.key ?? "").match(/^system\.roll\.(?:attack|melee|ranged)\.(bonus|damage)\.REPLACEME$/i);
      if (!match) continue;
      change.key = `system.roll.${attackType}.${match[1].toLowerCase()}.${weaponSlug}`;
      replaced += 1;
    }
  }
  return replaced > 0;
}

async function applyWeaponMasteryChoice(importer, json) {
  const bonus = (Array.isArray(json?.bonuses) ? json.bonuses : []).find(item =>
    item?.bonusName === WEAPON_MASTERY_BONUS && typeof item.bonusTo === "string" && item.bonusTo.trim()
  );
  const selectedWeapon = bonus?.bonusTo || json?.terraOesteClassOptions?.weaponMastery;
  if (!selectedWeapon) return false;

  const talentUuid = importer.itemMapping?.bonus?.[WEAPON_MASTERY_BONUS];
  if (!talentUuid) return false;
  const sourceTalent = await fromUuid(talentUuid);
  if (!sourceTalent) return false;

  const mappedId = String(talentUuid).split(".").pop();
  const currentCopies = (importer.talents ?? []).filter(item =>
    item._id === mappedId || ["weapon mastery", "maestria em armas"].includes(
      key(item.flags?.babele?.originalName ?? item.name)
    )
  );
  const talent = sourceTalent.toObject();
  const attackType = await weaponAttackType(selectedWeapon);
  if (!setWeaponMasteryEffect(talent, selectedWeapon, attackType)) {
    console.warn(`${MODULE_ID}: não foi possível adaptar os efeitos de Maestria em Armas.`);
    return false;
  }

  const displayedBaseName = currentCopies[0]?.name || talent.name;
  talent.name = `${displayedBaseName} (${weaponDisplayName(selectedWeapon)})`;
  if (bonus?.gainedAtLevel && talent.system?.talentClass === "level") {
    talent.system.level = bonus.gainedAtLevel;
  }

  importer.talents = (importer.talents ?? []).filter(item =>
    item._id !== mappedId && !["weapon mastery", "maestria em armas"].includes(
      key(item.flags?.babele?.originalName ?? item.name)
    )
  );
  importer.talents.push(talent);
  return true;
}

function isClassTalentTable(document) {
  const names = [
    document?.name,
    document?.flags?.babele?.originalName,
    document?._source?.name,
    document?._source?.flags?.babele?.originalName
  ].filter(value => typeof value === "string");
  return names.some(name =>
    /class\\s+talents/i.test(name) || /talentos?\\s+de\\s+classe/i.test(name)
  );
}

function installLocalizedClassTalentTables() {
  const compendiums = globalThis.shadowdark?.compendiums;
  if (!compendiums?.classTalentTables || !compendiums?._documents || !compendiums?._collectionFromArray) {
    console.warn(`${MODULE_ID}: seletor de tabelas do Shadowdark não encontrado.`);
    return;
  }
  if (compendiums.__terraOesteLocalizedClassTalentTables) return;

  const original = compendiums.classTalentTables;
  compendiums.classTalentTables = async function(filterSources = true) {
    const [current, allRollTables] = await Promise.all([
      original.call(this, filterSources),
      this._documents("RollTable", null, filterSources)
    ]);
    const tables = new Map();
    for (const table of current ?? []) tables.set(table._id, table);
    for (const table of allRollTables ?? []) {
      if (isClassTalentTable(table)) tables.set(table._id, table);
    }
    return this._collectionFromArray([...tables.values()]);
  };
  compendiums.__terraOesteLocalizedClassTalentTables = true;
}

Hooks.once("ready", () => {
  if (game.system.id !== "shadowdark") return;
  installLocalizedClassTalentTables();

  const Importer = globalThis.shadowdark?.apps?.ShadowdarklingImporterSD;
  if (!Importer?.prototype?._importActor) {
    console.warn(`${MODULE_ID}: importador Shadowdark não encontrado.`);
    return;
  }
  const prototype = Importer.prototype;
  if (prototype.__terraOesteChoiceGuard) return;
  const originalImport = prototype._importActor;
  prototype._importActor = async function(json) {
    const result = await originalImport.call(this, json);
    let changed = false;
    try {
      changed = await applyWeaponMasteryChoice(this, json);
    } catch (error) {
      console.error(`${MODULE_ID}: não foi possível aplicar a arma escolhida na Maestria em Armas.`, error);
    }
    for (const choice of readChoices(json)) {
      try {
        const ids = await sourceItemIds(this, choice.sourceType);
        this.talents = keepSelected(this.talents, choice, ids);
        if (choice.sourceType === "Class") {
          this.classAbilities = keepSelected(this.classAbilities, choice, ids);
        }
        changed = true;
      } catch (error) {
        console.error(`${MODULE_ID}: não foi possível aplicar a escolha de talento.`, error);
      }
    }
    if (changed) this.render(false);
    return result;
  };
  prototype.__terraOesteChoiceGuard = true;
});
