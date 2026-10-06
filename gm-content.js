(function(){
  const $ = id => document.getElementById(id);
  const kind = $("contentKind"), entity = $("contentEntity"), freshName = $("contentNewName");
  if (!kind || !entity) return;
  const fields = {
    name: $("contentName"), foundry: $("contentFoundryName"), description: $("contentDescription"),
    hp: $("contentHP"), classFields: $("contentClassFields"), raceFields: $("contentRaceFields"),
    classLangs: $("contentClassLanguages"), common: $("contentCommonBonus"), rare: $("contentRareBonus"),
    pickOne: $("contentPickOne"), pickOneOrNone: $("contentPickOneOrNone"), alignmentLanguages: $("contentAlignmentLanguages"),
    origins: $("contentOrigins"), raceLangs: $("contentRaceLanguages"), raceCommon: $("contentRaceCommonBonus"), raceRare: $("contentRaceRareBonus"),
    talents: $("contentTalents"), talentMode: $("contentTalentMode"), status: $("contentStatus"), banner: $("contentEditBanner"), editing: $("contentEditingLabel")
  };
  const catalog = { races: [], classes: [] };
  let editing = null;
  let legacyClassNames = [];

  function setStatus(message, error){
    fields.status.textContent = message || "";
    fields.status.style.color = error ? "#8c2f2f" : "";
  }
  function listKey(){ return kind.value === "race" ? "races" : "classes"; }
  function knownNames(){
    const app = window.app;
    const arr = kind.value === "race" ? (app?.ALL_RACES || app?.RACES || []) : (app?.ALL_CLASSES || app?.CLASSES || []);
    return [...new Set([...arr, ...catalog[listKey()].map(item => item.name)])].sort((a,b) => a.localeCompare(b,"pt-BR"));
  }
  function renderEntities(selectName){
    entity.replaceChildren(new Option("Selecione…", ""));
    knownNames().forEach(name => entity.add(new Option(name, name)));
    if (selectName) entity.value = selectName;
  }
  function parseList(value){ return String(value || "").split(",").map(x => x.trim()).filter(Boolean); }
  function formatTalents(list){
    return (list || []).map(t => `${t.name || ""} | ${t.originalName || t.name || ""} | ${t.description || ""}`).join("\n");
  }
  function parseTalents(value){
    return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
      const parts = line.split("|").map(x => x.trim());
      const name = parts[0] || "";
      const originalName = parts[1] || name;
      return { id: originalName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || `talento-${index+1}`, name, originalName, description: parts.slice(2).join(" | "), sourceName: fields.foundry.value.trim() || fields.name.value.trim() };
    }).filter(t => t.name);
  }
  function formatOrigins(list){ return (list || []).map(o => `${o.titulo || o.title || ""} | ${o.d || o.desc || ""}`).join("\n"); }
  function parseOrigins(value){
    return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const parts = line.split("|").map(x => x.trim());
      return { titulo: parts[0], d: parts.slice(1).join(" | ") };
    }).filter(item => item.titulo);
  }
  function resetFields(){
    fields.name.value = ""; fields.foundry.value = ""; fields.description.value = ""; fields.talents.value = ""; fields.talentMode.value = "all";
    fields.hp.value = "6"; fields.classLangs.value = ""; fields.common.value = "0"; fields.rare.value = "0";
    fields.pickOne.value = ""; fields.pickOneOrNone.value = ""; fields.alignmentLanguages.value = "";
    fields.origins.value = ""; fields.raceLangs.value = ""; fields.raceCommon.value = "0"; fields.raceRare.value = "0";
    fields.name.readOnly = false; fields.foundry.readOnly = true;
    fields.classFields.hidden = kind.value !== "class"; fields.raceFields.hidden = kind.value !== "race";
    fields.banner.style.display = "none"; editing = null; setStatus("");
  }
  function selectEntry(name){
    resetFields();
    if (!name) return;
    const isRace = kind.value === "race";
    const app = window.app;
    const saved = catalog[listKey()].find(item => item.name === name);
    const base = isRace ? (app?.getRaceContent?.(name) || {}) : (app?.getClassContent?.(name) || {});
    const item = Object.assign({}, base, saved || {});
    item.languages = Object.assign({}, base.languages || {}, saved?.languages || {});
    fields.name.value = name; fields.name.readOnly = true;
    fields.foundry.value = item.foundryName || item.talents?.[0]?.sourceName || name;
    fields.foundry.readOnly = true;
    fields.description.value = item.description || "";
    fields.talents.value = formatTalents(item.talents || []);
    fields.talentMode.value = item.talentMode || (isRace && (item.talents || []).length > 1 ? "choice" : "all");
    if (isRace){
      fields.raceLangs.value = (item.languages?.granted || []).join(", ");
      fields.raceCommon.value = String(item.languages?.bonus?.common || 0);
      fields.raceRare.value = String(item.languages?.bonus?.rare || 0);
    } else {
      fields.hp.value = String(item.hp || app?.CLASS_DICE?.[name] || 6);
      fields.classLangs.value = (item.languages?.grant || []).join(", ");
      fields.common.value = String(item.languages?.bonus?.common || 0);
      fields.rare.value = String(item.languages?.bonus?.rare || 0);
      fields.pickOne.value = (item.languages?.pickOne || []).join(", ");
      fields.pickOneOrNone.value = (item.languages?.pickOneOrNone || []).join(", ");
      fields.alignmentLanguages.value = item.languages?.byAlignment ? JSON.stringify(item.languages.byAlignment) : "";
      fields.origins.value = formatOrigins(item.origins || []);
    }
    editing = { name, custom: Boolean(saved?.custom) };
    fields.banner.style.display = ""; fields.editing.textContent = `${isRace ? "Raça" : "Classe"}: ${name}`;
    setStatus(saved ? "Cadastro personalizado carregado." : "Dados padrão carregados. Salve para registrar suas alterações.");
  }
  function startNew(){
    const name = freshName.value.trim();
    if (!name){ setStatus("Digite o nome, igual ao que você usará no Foundry.", true); freshName.focus(); return; }
    if (knownNames().some(existing => existing.toLocaleLowerCase() === name.toLocaleLowerCase())){
      setStatus("Já existe uma entrada com esse nome. Selecione-a para editar.", true); return;
    }
    resetFields(); editing = { name, custom: true, isNew: true };
    fields.name.value = name; fields.foundry.value = name; fields.foundry.readOnly = true;
    fields.banner.style.display = ""; fields.editing.textContent = `Nova ${kind.value === "race" ? "raça" : "classe"}: ${name}`;
    freshName.value = ""; setStatus("Preencha os dados e use os mesmos nomes no Foundry.");
  }
  async function loadCatalog(){
    try {
      await window.app?.loadCustomClasses?.();
      await window.app?.loadContentCatalog?.();
      const [response, legacyResponse] = await Promise.all([
        fetch("/api/content", { headers: { "cache-control": "no-store" } }),
        fetch("/api/classes", { headers: { "cache-control": "no-store" } })
      ]);
      const data = response.ok ? await response.json() : { races: [], classes: [] };
      catalog.races = Array.isArray(data.races) ? data.races : [];
      catalog.classes = Array.isArray(data.classes) ? data.classes : [];
      const legacy = legacyResponse.ok ? await legacyResponse.json() : {};
      legacyClassNames = Array.isArray(legacy.classes) ? legacy.classes.map(x => x.name) : [];
      renderEntities();
      setStatus("Conteúdo carregado.");
    } catch { setStatus("Não foi possível carregar o catálogo. Recarregue o painel.", true); }
  }
  async function saveCatalog(){
    const name = fields.name.value.trim();
    if (!name){ setStatus("Informe o nome da raça ou classe.", true); return; }
    const isRace = kind.value === "race";
    const talents = parseTalents(fields.talents.value);
    let byAlignment = {};
    if (!isRace && fields.alignmentLanguages.value.trim()) {
      try { byAlignment = JSON.parse(fields.alignmentLanguages.value); if (!byAlignment || typeof byAlignment !== "object" || Array.isArray(byAlignment)) throw new Error(); }
      catch { setStatus("O campo de idioma por alinhamento precisa conter um objeto JSON válido.", true); return; }
    }
    if (String(fields.talents.value || "").trim() && !talents.length){ setStatus("Revise a lista de talentos.", true); return; }
    let item;
    if (isRace){
      item = { name, foundryName: fields.foundry.value.trim() || name, description: fields.description.value.trim(), languages: { granted: parseList(fields.raceLangs.value), bonus: { common: Math.max(0, Number(fields.raceCommon.value) || 0), rare: Math.max(0, Number(fields.raceRare.value) || 0) } }, talentMode: fields.talentMode.value, talents, custom: editing?.custom || false };
    } else {
      const origins = parseOrigins(fields.origins.value);
      if (origins.length && origins.length !== 6){ setStatus("A classe precisa ter seis origens, uma por linha.", true); return; }
      if (editing?.isNew && origins.length !== 6){ setStatus("Cadastre as seis origens para a classe nova.", true); return; }
      item = { name, foundryName: fields.foundry.value.trim() || name, description: fields.description.value.trim(), hp: Number(fields.hp.value) || 6, origins, languages: { grant: parseList(fields.classLangs.value), bonus: { common: Math.max(0, Number(fields.common.value) || 0), rare: Math.max(0, Number(fields.rare.value) || 0) }, pickOne: parseList(fields.pickOne.value), pickOneOrNone: parseList(fields.pickOneOrNone.value), ...(Object.keys(byAlignment).length ? { byAlignment } : {}) }, talentMode: fields.talentMode.value, talents, custom: editing?.custom || false };
    }
    const next = { races: catalog.races.slice(), classes: catalog.classes.slice() };
    const key = isRace ? "races" : "classes";
    const index = next[key].findIndex(existing => existing.name === name);
    if (index >= 0) next[key][index] = item; else next[key].push(item);
    const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json", "X-GM-Code": sessionStorage.getItem("gmCode") || "" }, body: JSON.stringify(next) });
    if (response.status === 401){ sessionStorage.removeItem("gmCode"); setStatus("Código de GM inválido ou expirado. Recarregue o painel.", true); return; }
    if (!response.ok){ setStatus("Falha ao salvar. Verifique os campos e tente novamente.", true); return; }
    catalog.races = next.races; catalog.classes = next.classes;
    await window.app?.loadContentCatalog?.();
    renderEntities(name); selectEntry(name);
    setStatus("Salvo globalmente. As próximas fichas usarão esses dados.");
  }
  async function deleteContent(){
    const name = fields.name.value.trim();
    if (!name){ setStatus("Selecione uma entrada antes de remover ou restaurar.", true); return; }
    if (!confirm(`Remover as alterações salvas para “${name}”? Se for uma entrada nova, ela deixará de aparecer no criador.`)) return;
    const key = listKey();
    const existed = catalog[key].some(item => item.name === name);
    catalog[key] = catalog[key].filter(item => item.name !== name);
    const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json", "X-GM-Code": sessionStorage.getItem("gmCode") || "" }, body: JSON.stringify(catalog) });
    if (!response.ok){ setStatus("Falha ao remover o cadastro.", true); return; }
    if (kind.value === "class" && legacyClassNames.includes(name)) await fetch(`/api/classes?name=${encodeURIComponent(name)}`, { method: "DELETE", headers: { "X-GM-Code": sessionStorage.getItem("gmCode") || "" } });
    await loadCatalog(); resetFields();
    setStatus(existed ? "Cadastro removido; os dados padrão foram restaurados." : "Entrada personalizada removida.");
  }

  kind.addEventListener("change", () => { renderEntities(); resetFields(); });
  entity.addEventListener("change", () => selectEntry(entity.value));
  $("btnStartNewContent").addEventListener("click", startNew);
  freshName.addEventListener("keydown", event => { if (event.key === "Enter") startNew(); });
  $("btnSaveContent").addEventListener("click", saveCatalog);
  $("btnDeleteContent").addEventListener("click", deleteContent);
  fields.name.addEventListener("input", () => { if (!fields.name.readOnly) fields.foundry.value = fields.name.value; });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadCatalog, { once: true });
  else loadCatalog();
})();

