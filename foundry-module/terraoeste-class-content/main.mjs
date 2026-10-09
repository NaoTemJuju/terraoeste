const MODULE_ID = "terraoeste-class-content";
let registry;
const pending = new Map();
const clone = value => foundry.utils.deepClone(value);
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function classUuid(name) {
  return Object.entries(registry.classes).find(([alias]) => normalize(alias) === normalize(name))?.[1];
}

function bonusUuid(bonus) {
  const source = classUuid(bonus?.sourceName);
  const scoped = source && Object.entries(registry.classBonuses ?? {})
    .find(([name]) => classUuid(name) === source)?.[1];
  for (const key of [
    `${bonus?.bonusName}_${bonus?.bonusTo}`, bonus?.bonusName,
    `${bonus?.bonusTo}_${bonus?.bonusName}`, bonus?.bonusTo
  ]) {
    if (scoped?.[key]) return scoped[key];
  }
  return registry.bonuses[bonus?.bonusName] ?? registry.bonuses[bonus?.bonusTo];
}

// JSON antigo guardava estes talentos apenas em terraOesteClassTalents.
// Conte ocorrências: uma segunda aquisição deve gerar um segundo item.
export function upgradeLegacyTalents(json, mappings) {
  const data = clone(json);
  data.bonuses ??= [];
  const counts = new Map();
  for (const bonus of data.bonuses) {
    const uuid = mappings.bonuses[bonus.bonusName] ?? mappings.bonuses[bonus.bonusTo];
    if (uuid) counts.set(uuid, (counts.get(uuid) ?? 0) + 1);
  }
  const seen = new Map();
  for (const talent of data.terraOesteClassTalents ?? []) {
    const key = mappings.legacyTalents[talent.id];
    if (!key) continue;
    const uuid = mappings.bonuses[key];
    const count = (seen.get(uuid) ?? 0) + 1;
    seen.set(uuid, count);
    if (count <= (counts.get(uuid) ?? 0)) continue;
    data.bonuses.push({
      sourceType: "Class", sourceName: data.class, sourceCategory: "Talent",
      name: talent.talentRolledName || talent.displayDesc || talent.id,
      bonusName: key, bonusTo: key,
      gainedAtLevel: talent.gainedAtLevel ?? talent.level ?? data.level ?? 1
    });
  }
  return data;
}

function installImporter() {
  const prototype = globalThis.shadowdark?.apps?.ShadowdarklingImporterSD?.prototype;
  if (!prototype?._findItem || !prototype._findTalent || !prototype._importActor) {
    ui.notifications.warn("TerraOeste: conteúdo disponível, mas o importador desta versão do Shadowdark não foi encontrado.");
    return;
  }
  if (prototype.__terraOesteClassContent) return;
  const findItem = prototype._findItem;
  prototype._findItem = async function(name, type) {
    const uuid = type === "Class" ? classUuid(name) :
      Object.entries(registry.items?.[type] ?? {}).find(([alias]) => normalize(alias) === normalize(name))?.[1];
    if (uuid) {
      const document = await resolve(uuid);
      if (document?.type === type) return document;
    }
    return findItem.call(this, name, type);
  };
  const findTalent = prototype._findTalent;
  prototype._findTalent = async function(bonus) {
    const uuid = bonusUuid(bonus);
    if (!uuid) return findTalent.call(this, bonus);
    const document = await resolve(uuid);
    if (!document || document.type !== "Talent") {
      this.errors.push({type: "Talent", name: bonus.name || bonus.bonusName});
      return;
    }
    const item = document.toObject();
    if (item.system.talentClass === "level") item.system.level = bonus.gainedAtLevel ?? 1;
    return item;
  };
  const importActor = prototype._importActor;
  prototype._importActor = function(json) {
    return importActor.call(this, upgradeLegacyTalents(json, registry));
  };
  prototype.__terraOesteClassContent = true;
}

// Opcional: aponte UUIDs do módulo para cópias em compêndios do mundo.
// As cópias podem ser editadas sem uma atualização do módulo sobrescrevê-las.
async function resolve(uuid) {
  const overrides = game.settings.get(MODULE_ID, "documentOverrides");
  const target = overrides[uuid] || uuid;
  const document = await fromUuid(target);
  if (!document) console.error(`${MODULE_ID}: documento ausente: ${target}`);
  return document;
}

export function usageUpdate(ability, talents) {
  const flag = ability.flags?.[MODULE_ID] ?? {};
  const grant = talents.reduce((sum, item) => {
    const data = item.flags?.[MODULE_ID];
    return sum + (data?.usageTarget === flag.contentId
      ? Math.max(0, Number(data.usageBonus) || 0) : 0);
  }, 0);
  const max = Number(ability.system.uses.max) || 0;
  const available = Math.min(max, Math.max(0, Number(ability.system.uses.available) || 0));
  const base = Math.max(0, max - (Number(flag.grantedUses) || 0));
  const newMax = base + grant;
  const newAvailable = Math.max(0, newMax - (max - available));
  if (grant === (Number(flag.grantedUses) || 0) && max === newMax && available === newAvailable) return null;
  return {
    _id: ability.id,
    "system.uses.max": newMax,
    "system.uses.available": newAvailable,
    [`flags.${MODULE_ID}.grantedUses`]: grant
  };
}

function isAuthority(actor) {
  const gm = game.users.activeGM ?? game.users.find(user => user.active && user.isGM);
  if (gm) return gm.id === game.user.id;
  const owner = game.users.find(user => user.active && actor.testUserPermission(user, "OWNER"));
  return owner?.id === game.user.id;
}

async function syncUses(actor) {
  if (!actor?.isOwner || !isAuthority(actor)) return;
  const talents = actor.items.filter(item => item.type === "Talent");
  const updates = actor.items
    .filter(item => item.type === "Class Ability" && item.flags?.[MODULE_ID]?.contentId && item.system.limitedUses)
    .map(item => usageUpdate(item, talents)).filter(Boolean);
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates, {terraOesteUsageSync: true});
}

function enqueue(actor) {
  if (!actor?.uuid) return;
  const previous = pending.get(actor.uuid) ?? Promise.resolve();
  const next = previous.then(() => syncUses(actor)).catch(error => {
    console.error(`${MODULE_ID}: falha ao ajustar usos de ${actor.name}`, error);
    ui.notifications.error("TerraOeste: não foi possível ajustar os usos. Consulte o console.");
  });
  pending.set(actor.uuid, next);
  void next.finally(() => { if (pending.get(actor.uuid) === next) pending.delete(actor.uuid); });
}

async function exportSources() {
  if (!game.user.isGM) throw new Error("Somente o mestre pode exportar os compêndios.");
  const sources = {};
  for (const name of ["classes", "talents", "class-abilities", "rollable-tables", "gear", "backgrounds"]) {
    const pack = game.packs.get(`${MODULE_ID}.${name}`);
    if (!pack) throw new Error(`Compêndio ausente: ${name}`);
    sources[name] = (await pack.getDocuments()).map(document => document.toObject());
  }
  saveDataToFile(JSON.stringify(sources, null, 2), "application/json", "terraoeste-content-sources.json");
  return sources;
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "documentOverrides", {scope: "world", config: false, type: Object, default: {}});
});

Hooks.once("ready", async () => {
  if (game.system.id !== "shadowdark") return;
  try {
    const response = await fetch(`modules/${MODULE_ID}/registry.json`);
    if (!response.ok) throw new Error(`Registro HTTP ${response.status}`);
    registry = await response.json();
    installImporter();
    game.modules.get(MODULE_ID).api = {
      registry: clone(registry), exportSources, resolve, syncUses,
      setDocumentOverrides: async overrides => {
        if (!game.user.isGM) throw new Error("Somente o mestre pode alterar referências.");
        for (const [source, target] of Object.entries(overrides)) {
          const original = await fromUuid(source);
          const replacement = await fromUuid(target);
          if (!source.startsWith(`Compendium.${MODULE_ID}.`) || !original || !replacement ||
              replacement.documentName !== original.documentName || replacement.type !== original.type) {
            throw new Error(`Referência incompatível: ${source} → ${target}`);
          }
        }
        await game.settings.set(MODULE_ID, "documentOverrides", overrides);
      }
    };
    for (const event of ["createItem", "deleteItem", "updateItem"]) {
      Hooks.on(event, (item, changesOrOptions, options) => {
        // create/delete recebem options no segundo argumento; update, no terceiro.
        if ((options?.terraOesteUsageSync || changesOrOptions?.terraOesteUsageSync)) return;
        if (["Talent", "Class Ability"].includes(item.type)) enqueue(item.actor);
      });
    }
    for (const actor of game.actors) enqueue(actor);
    Hooks.on("canvasReady", () => {
      for (const token of canvas.tokens?.placeables ?? []) enqueue(token.actor);
    });
  } catch (error) {
    console.error(`${MODULE_ID}: inicialização falhou`, error);
    ui.notifications.error("TerraOeste: falha ao carregar o módulo de conteúdo. Consulte o console.");
  }
});
