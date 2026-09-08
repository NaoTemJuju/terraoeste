export async function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-GM-Code",
      "Vary": "Origin",
    },
  });
}
function json(data, init = {}){
  const headers = new Headers(init.headers || {});
  headers.set("content-type","application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
function corsify(resp, request){
  const origin = request.headers.get("Origin") || "*";
  resp.headers.set("Access-Control-Allow-Origin", origin);
  resp.headers.set("Vary", "Origin");
  resp.headers.set("Cache-Control", "no-store");
  return resp;
}

const KV_KEY = "gear_shop";

/*
 * Catálogo padrão da lojinha, gerado a partir do compêndio de Gears
 * (Basic/Weapon/Armor/Potion) do sistema Shadowdark para Foundry VTT.
 * É usado apenas como valor inicial: assim que o GM salvar qualquer
 * alteração pela primeira vez, o conteúdo do KV passa a ser a única
 * fonte de verdade (itens removidos pelo GM não voltam a aparecer).
 */
const DEFAULT_GEAR_ITEMS = [{"id": "armor-leather-armor", "name": "Armadura de Couro", "type": "armor", "cost": 10, "currency": "gp", "slots": 1}, {"id": "armor-plate-mail", "name": "Armadura de Placas", "type": "armor", "cost": 130, "currency": "gp", "slots": 3}, {"id": "armor-mithral-plate-mail", "name": "Armadura de Placas de Mithral", "type": "armor", "cost": 520, "currency": "gp", "slots": 2}, {"id": "armor-chainmail", "name": "Cota de Malha", "type": "armor", "cost": 60, "currency": "gp", "slots": 2}, {"id": "armor-mithral-chainmail", "name": "Cota de Malha de Mithral", "type": "armor", "cost": 240, "currency": "gp", "slots": 1}, {"id": "armor-shield", "name": "Escudo", "type": "armor", "cost": 10, "currency": "gp", "slots": 1}, {"id": "armor-round-shield", "name": "Escudo Redondo", "type": "armor", "cost": 15, "currency": "gp", "slots": 1}, {"id": "potion-stimulant", "name": "Estimulante", "type": "potion", "cost": 0, "currency": "gp", "slots": 1}, {"id": "potion-salve", "name": "Pomada Curativa", "type": "potion", "cost": 0, "currency": "gp", "slots": 1}, {"id": "potion-foebane", "name": "Poção Anti-Inimigo", "type": "potion", "cost": 0, "currency": "gp", "slots": 1}, {"id": "potion-curative", "name": "Poção Curativa", "type": "potion", "cost": 0, "currency": "gp", "slots": 1}, {"id": "potion-restorative", "name": "Poção Restaurativa", "type": "potion", "cost": 0, "currency": "gp", "slots": 1}, {"id": "sundry-rope-60", "name": "Corda, 18m", "type": "sundry", "cost": 1, "currency": "gp", "slots": 1}, {"id": "sundry-mirror", "name": "Espelho", "type": "sundry", "cost": 10, "currency": "gp", "slots": 1}, {"id": "sundry-iron-spikes", "name": "Espigões de Ferro", "type": "sundry", "cost": 1, "currency": "gp", "slots": 1}, {"id": "sundry-light-spell-double-range", "name": "Feitiço de Luz (Alcance Dobrado)", "type": "sundry", "cost": 0, "currency": "gp", "slots": 1}, {"id": "sundry-light-spell-double-time", "name": "Feitiço de Luz (Duração Dobrada)", "type": "sundry", "cost": 0, "currency": "gp", "slots": 1}, {"id": "sundry-light-spell", "name": "Feitiço de Luz (item)", "type": "sundry", "cost": 0, "currency": "gp", "slots": 1}, {"id": "sundry-thieves-tools", "name": "Ferramentas de Ladrão", "type": "sundry", "cost": 0, "currency": "gp", "slots": 0}, {"id": "sundry-arrows", "name": "Flechas", "type": "sundry", "cost": 1, "currency": "gp", "slots": 1}, {"id": "sundry-frasco-de-oleo", "name": "Frasco de Óleo", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-grappling-hook", "name": "Gancho de Escalada", "type": "sundry", "cost": 1, "currency": "gp", "slots": 1}, {"id": "sundry-garrafa", "name": "Garrafa", "type": "sundry", "cost": 3, "currency": "sp", "slots": 1}, {"id": "sundry-crawling-kit", "name": "Kit de Exploração", "type": "sundry", "cost": 7, "currency": "gp", "slots": 7}, {"id": "sundry-lampiao", "name": "Lanterna", "type": "sundry", "cost": 5, "currency": "gp", "slots": 1}, {"id": "sundry-lampiao-azul", "name": "Lanterna Azul", "type": "sundry", "cost": 5, "currency": "gp", "slots": 1}, {"id": "sundry-backpack", "name": "Mochila", "type": "sundry", "cost": 2, "currency": "gp", "slots": 0}, {"id": "sundry-caltrops", "name": "Míscoras", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-basilisk-egg", "name": "Ovo de Basilisco", "type": "sundry", "cost": 0, "currency": "gp", "slots": 1}, {"id": "sundry-flint-and-steel", "name": "Pederneira e Aço", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-crowbar", "name": "Pé de Cabra", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-rations", "name": "Rações", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-holy-symbol", "name": "Símbolo Sagrado", "type": "sundry", "cost": 0, "currency": "gp", "slots": 0}, {"id": "sundry-torch", "name": "Tocha", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-pole", "name": "Vara", "type": "sundry", "cost": 5, "currency": "sp", "slots": 1}, {"id": "sundry-crossbow-bolts", "name": "Virotes de Besta", "type": "sundry", "cost": 1, "currency": "gp", "slots": 1}, {"id": "weapon-dagger", "name": "Adaga", "type": "weapon", "cost": 1, "currency": "gp", "slots": 1}, {"id": "weapon-dagger-obsidian", "name": "Adaga (Obsidiana)", "type": "weapon", "cost": 3, "currency": "gp", "slots": 1}, {"id": "weapon-shortbow", "name": "Arco Curto", "type": "weapon", "cost": 6, "currency": "gp", "slots": 1}, {"id": "weapon-longbow", "name": "Arco Longo", "type": "weapon", "cost": 8, "currency": "gp", "slots": 1}, {"id": "weapon-javelin", "name": "Azagaia", "type": "weapon", "cost": 5, "currency": "sp", "slots": 1}, {"id": "weapon-staff", "name": "Bastão", "type": "weapon", "cost": 5, "currency": "sp", "slots": 1}, {"id": "weapon-crossbow", "name": "Besta", "type": "weapon", "cost": 8, "currency": "gp", "slots": 1}, {"id": "weapon-bolas", "name": "Bolas (arma)", "type": "weapon", "cost": 2, "currency": "gp", "slots": 1}, {"id": "weapon-boomerang", "name": "Bumerangue", "type": "weapon", "cost": 3, "currency": "gp", "slots": 1}, {"id": "weapon-stave", "name": "Cajado", "type": "weapon", "cost": 2, "currency": "gp", "slots": 1}, {"id": "weapon-whip", "name": "Chicote", "type": "weapon", "cost": 10, "currency": "gp", "slots": 1}, {"id": "weapon-scimitar", "name": "Cimitarra", "type": "weapon", "cost": 8, "currency": "gp", "slots": 1}, {"id": "weapon-razor-chain", "name": "Corrente Navalha", "type": "weapon", "cost": 12, "currency": "gp", "slots": 1}, {"id": "weapon-bastard-sword", "name": "Espada Bastarda", "type": "weapon", "cost": 10, "currency": "gp", "slots": 2}, {"id": "weapon-shortsword", "name": "Espada Curta", "type": "weapon", "cost": 7, "currency": "gp", "slots": 1}, {"id": "weapon-greatsword", "name": "Espada Grande", "type": "weapon", "cost": 12, "currency": "gp", "slots": 2}, {"id": "weapon-longsword", "name": "Espada Longa", "type": "weapon", "cost": 9, "currency": "gp", "slots": 1}, {"id": "weapon-morningstar", "name": "Estrela da Manhã", "type": "weapon", "cost": 5, "currency": "gp", "slots": 1}, {"id": "weapon-sling", "name": "Funda", "type": "weapon", "cost": 5, "currency": "gp", "slots": 1}, {"id": "weapon-spear", "name": "Lança", "type": "weapon", "cost": 5, "currency": "sp", "slots": 1}, {"id": "weapon-spear-obsidian", "name": "Lança (Obsidiana)", "type": "weapon", "cost": 4, "currency": "gp", "slots": 1}, {"id": "weapon-handaxe", "name": "Machadinha", "type": "weapon", "cost": 2, "currency": "gp", "slots": 1}, {"id": "weapon-greataxe", "name": "Machado Grande", "type": "weapon", "cost": 10, "currency": "gp", "slots": 2}, {"id": "weapon-warhammer", "name": "Martelo de Guerra", "type": "weapon", "cost": 10, "currency": "gp", "slots": 1}, {"id": "weapon-mace", "name": "Maça", "type": "weapon", "cost": 5, "currency": "gp", "slots": 1}, {"id": "weapon-pike", "name": "Pique", "type": "weapon", "cost": 10, "currency": "gp", "slots": 2}, {"id": "weapon-club", "name": "Porrete", "type": "weapon", "cost": 5, "currency": "cp", "slots": 1}, {"id": "weapon-club-obsidian", "name": "Porrete (Obsidiana)", "type": "weapon", "cost": 5, "currency": "gp", "slots": 1}, {"id": "weapon-spear-thrower", "name": "Propulsor de Lança", "type": "weapon", "cost": 2, "currency": "gp", "slots": 1}, {"id": "weapon-shuriken", "name": "Shuriken", "type": "weapon", "cost": 1, "currency": "gp", "slots": 1}, {"id": "weapon-blowgun", "name": "Zarabatana", "type": "weapon", "cost": 5, "currency": "gp", "slots": 1}];

function normalizeItem(it){
  if (!it || typeof it !== "object") return null;
  const id = String(it.id || "").trim();
  const name = String(it.name || "").trim();
  if (!id || !name) return null;
  const type = ["weapon","armor","sundry","potion"].includes(it.type) ? it.type : "sundry";
  const currency = ["gp","sp","cp"].includes(it.currency) ? it.currency : "gp";
  const cost = Math.max(0, parseInt(it.cost, 10) || 0);
  const slots = Math.max(0, parseInt(it.slots, 10) || 0);
  return { id, name, type, cost, currency, slots };
}

export async function onRequestGet({ env, request }){
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const data = raw ? JSON.parse(raw) : { items: DEFAULT_GEAR_ITEMS };
    if (!Array.isArray(data.items)) data.items = DEFAULT_GEAR_ITEMS;
    return corsify(json(data), request);
  } catch (e){
    return corsify(json({ error: "KV_GET_ERROR" }, { status: 500 }), request);
  }
}

export async function onRequestPost({ env, request }){
  const code = request.headers.get("X-GM-Code") || "";
  const expected = env.GM_CODE || "";
  if (!expected || code !== expected){
    return corsify(json({ error:"UNAUTHORIZED" }, { status: 401 }), request);
  }
  let incoming;
  try {
    incoming = await request.json();
    if (!incoming || !Array.isArray(incoming.items)) throw new Error("bad");
  } catch {
    return corsify(json({ error:"BAD_JSON" }, { status: 400 }), request);
  }
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const current = raw ? JSON.parse(raw) : { items: DEFAULT_GEAR_ITEMS };
    const currentItems = Array.isArray(current.items) ? current.items : DEFAULT_GEAR_ITEMS;
    const byId = new Map(currentItems.map(it => [it.id, it]));
    for (const entry of incoming.items){
      const it = normalizeItem(entry);
      if (!it) continue;
      byId.set(it.id, it);
    }
    const merged = { items: Array.from(byId.values()) };
    await env.AVAIL.put(KV_KEY, JSON.stringify(merged));
    return corsify(json({ ok:true, items: merged.items }), request);
  } catch {
    return corsify(json({ error:"KV_PUT_ERROR" }, { status: 500 }), request);
  }
}

export async function onRequestDelete({ env, request }){
  const code = request.headers.get("X-GM-Code") || "";
  const expected = env.GM_CODE || "";
  if (!expected || code !== expected){
    return corsify(json({ error:"UNAUTHORIZED" }, { status: 401 }), request);
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return corsify(json({ error:"ID_REQUIRED" }, { status: 400 }), request);
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const current = raw ? JSON.parse(raw) : { items: DEFAULT_GEAR_ITEMS };
    const currentItems = Array.isArray(current.items) ? current.items : DEFAULT_GEAR_ITEMS;
    const filtered = currentItems.filter(it => it.id !== id);
    await env.AVAIL.put(KV_KEY, JSON.stringify({ items: filtered }));
    return corsify(json({ ok:true }), request);
  } catch {
    return corsify(json({ error:"KV_PUT_ERROR" }, { status: 500 }), request);
  }
}
