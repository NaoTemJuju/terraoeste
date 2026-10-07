const MODULE_ID = "terraoeste-character-creator";

function asArray(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.contents)) return collection.contents;
  try { return [...collection]; } catch { return []; }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function options(items, selected = "") {
  return items.map(item => {
    const value = item.uuid ?? item.id ?? "";
    const isSelected = value === selected ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${isSelected}>${escapeHtml(item.name)}</option>`;
  }).join("");
}

function formMarkup({ ancestries, classes, backgrounds, deities }) {
  const stats = [
    ["str", "Força"], ["dex", "Destreza"], ["con", "Constituição"],
    ["int", "Inteligência"], ["wis", "Sabedoria"], ["cha", "Carisma"]
  ];
  return `
    <form class="to-creator-form">
      <p class="hint">Protótipo: cria uma ficha de nível 1 diretamente no mundo Shadowdark.</p>
      <label>Nome <input name="name" type="text" required maxlength="80" autofocus></label>
      <div class="to-creator-grid">
        <label>Ancestralidade
          <select name="ancestry" required><option value="">Escolher…</option>${options(ancestries)}</select>
        </label>
        <label>Classe
          <select name="class" required><option value="">Escolher…</option>${options(classes)}</select>
        </label>
        <label>Origem
          <select name="background"><option value="">Escolher…</option>${options(backgrounds)}</select>
        </label>
        <label>Divindade
          <select name="deity"><option value="">Nenhuma</option>${options(deities)}</select>
        </label>
        <label>Alinhamento
          <select name="alignment">
            <option value="lawful">Ordeiro</option>
            <option value="neutral" selected>Neutro</option>
            <option value="chaotic">Caótico</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend>Atributos</legend>
        <div class="to-creator-stats">
          ${stats.map(([key, label]) => `<label>${label}<input name="stat-${key}" type="number" min="3" max="18" value="10" required></label>`).join("")}
        </div>
      </fieldset>
      <p class="hint">Este primeiro teste cobre os dados básicos da ficha. Talentos, magias, equipamento e escolhas especiais ainda serão migrados.</p>
    </form>`;
}

async function loadChoices() {
  const compendiums = globalThis.shadowdark?.compendiums;
  if (!compendiums) throw new Error("O sistema Shadowdark não expôs os compêndios.");

  const [ancestries, classes, backgrounds, deities] = await Promise.all([
    compendiums.ancestries(),
    compendiums.classes(),
    compendiums.backgrounds(),
    compendiums.deities()
  ]);

  return {
    ancestries: asArray(ancestries),
    classes: asArray(classes).filter(item => !/level\s*0|nível\s*0/i.test(item.name)),
    backgrounds: asArray(backgrounds),
    deities: asArray(deities)
  };
}

async function openCreator() {
  if (game.system.id !== "shadowdark") {
    return ui.notifications.warn("Este criador funciona apenas com o sistema Shadowdark.");
  }

  let choices;
  try {
    choices = await loadChoices();
  } catch (error) {
    console.error(`${MODULE_ID}: erro ao carregar opções.`, error);
    return ui.notifications.error("Não consegui carregar as opções do Shadowdark. Confira o console.");
  }

  const Dialog = foundry.applications.api.DialogV2;
  const formData = await Dialog.input({
    window: { title: "Criador Terra Oeste — teste interno" },
    content: formMarkup(choices),
    ok: { label: "Criar personagem" },
    rejectClose: false,
    modal: true
  });
  if (!formData) return;

  const data = Object.fromEntries(formData.entries());
  const name = String(data.name ?? "").trim();
  const ancestry = await fromUuid(data.ancestry);
  const characterClass = await fromUuid(data.class);
  const background = data.background ? await fromUuid(data.background) : null;
  const deity = data.deity ? await fromUuid(data.deity) : null;

  if (!name || !ancestry || !characterClass) {
    return ui.notifications.error("Preencha o nome, a ancestralidade e a classe.");
  }

  if (!shadowdark.utils.canCreateCharacter()) {
    return ui.notifications.error("O sistema Shadowdark não permite criar personagem para este usuário.");
  }

  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
  const abilities = Object.fromEntries(abilityKeys.map(key => {
    const value = Number(data[`stat-${key}`]);
    if (!Number.isInteger(value) || value < 3 || value > 18) {
      throw new Error(`Valor inválido para ${key.toUpperCase()}.`);
    }
    return [key, { value }];
  }));

  let hitPoints = 1;
  try {
    const formula = String(characterClass.system?.hitPoints ?? "1d6");
    const roll = await (new Roll(formula)).evaluate();
    const conMod = Math.floor((abilities.con.value - 10) / 2);
    hitPoints = Math.max(1, Number(roll.total) + conMod);
  } catch (error) {
    console.warn(`${MODULE_ID}: fórmula de PV inválida, usando 1 PV.`, error);
  }

  const actorData = {
    name,
    type: "Player",
    system: {
      attributes: { hp: { max: hitPoints, value: hitPoints } },
      level: { value: 1, xp: 0 },
      abilities,
      ancestry: ancestry.uuid,
      background: background?.uuid ?? "",
      alignment: data.alignment || "neutral",
      deity: deity?.uuid ?? "",
      class: characterClass.uuid,
      languages: [],
      patron: "",
      coins: { gp: 0, sp: 0, cp: 0 }
    }
  };

  try {
    const actor = await Actor.create(actorData);
    if (!actor) throw new Error("O Foundry não criou o personagem.");
    actor.sheet.render(true);
    ui.notifications.info(`Personagem ${name} criado pelo protótipo Terra Oeste.`);
  } catch (error) {
    console.error(`${MODULE_ID}: erro ao criar personagem.`, error);
    ui.notifications.error(`Não foi possível criar a ficha: ${error.message}`);
  }
}

function addDirectoryButton(app, html) {
  if (!game.modules.get(MODULE_ID)?.active || game.system.id !== "shadowdark") return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector("[data-terraoeste-create]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.terraoesteCreate = "true";
  button.className = "terraoeste-create-character";
  button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Criar personagem (teste)';
  button.addEventListener("click", openCreator);

  const target = root.querySelector(".header-actions") || root.querySelector(".directory-header");
  if (target) target.append(button);
  else root.prepend(button);
}

Hooks.once("ready", () => {
  if (game.system.id !== "shadowdark") return;
  Hooks.on("renderActorDirectory", addDirectoryButton);
});
