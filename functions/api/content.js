export async function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin") || "*";
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-GM-Code",
    "Vary": "Origin",
  }});
}

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(JSON.stringify(data), { ...init, headers });
}

const KV_KEY = "content";

export async function onRequestGet({ env }) {
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const data = raw ? JSON.parse(raw) : { races: [], classes: [] };
    return json({ races: Array.isArray(data.races) ? data.races : [], classes: Array.isArray(data.classes) ? data.classes : [] });
  } catch {
    return json({ error: "KV_GET_ERROR" }, { status: 500 });
  }
}

export async function onRequestPost({ env, request }) {
  const code = request.headers.get("X-GM-Code") || "";
  if (!env.GM_CODE || code !== env.GM_CODE) return json({ error: "UNAUTHORIZED" }, { status: 401 });
  let data;
  try {
    data = await request.json();
    if (!data || !Array.isArray(data.races) || !Array.isArray(data.classes)) throw new Error("bad payload");
    for (const kind of ["races", "classes"]) {
      const names = new Set();
      for (const entry of data[kind]) {
        if (!entry || typeof entry.name !== "string" || !entry.name.trim() || names.has(entry.name.trim().toLocaleLowerCase())) throw new Error("invalid entry");
        names.add(entry.name.trim().toLocaleLowerCase());
        if (entry.talents !== undefined && !Array.isArray(entry.talents)) throw new Error("invalid talents");
      }
    }
  } catch {
    return json({ error: "BAD_JSON" }, { status: 400 });
  }
  try {
    const clean = {
      races: data.races.map(x => ({ ...x, name: x.name.trim(), talents: (x.talents || []).filter(t => t && t.name).map(t => ({ ...t, name: String(t.name).trim(), originalName: String(t.originalName || t.name).trim() })) })),
      classes: data.classes.map(x => ({ ...x, name: x.name.trim(), talents: (x.talents || []).filter(t => t && t.name).map(t => ({ ...t, name: String(t.name).trim(), originalName: String(t.originalName || t.name).trim() })) })),
    };
    await env.AVAIL.put(KV_KEY, JSON.stringify(clean));
    return json({ ok: true, races: clean.races, classes: clean.classes });
  } catch {
    return json({ error: "KV_PUT_ERROR" }, { status: 500 });
  }
}

