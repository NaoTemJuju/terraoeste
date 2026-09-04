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
const KV_KEY = "classes";
export async function onRequestGet({ env, request }){
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const data = raw ? JSON.parse(raw) : { classes: [] };
    return corsify(json(data), request);
  } catch (e){
    return corsify(json({ error: "KV_GET_ERROR" }, { status: 500 }), request);
  }
}
export async function onRequestPost({ env, request }){
  const code = request.headers.get("X-GM-Code") || "";
  if (code !== "123"){
    return corsify(json({ error:"UNAUTHORIZED" }, { status: 401 }), request);
  }
  let incoming;
  try {
    incoming = await request.json();
    if (!incoming || !Array.isArray(incoming.classes)) throw new Error("bad");
  } catch {
    return corsify(json({ error:"BAD_JSON" }, { status: 400 }), request);
  }
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const current = raw ? JSON.parse(raw) : { classes: [] };
    const byName = new Map(current.classes.map(c => [c.name, c]));
    for (const c of incoming.classes){
      if (!c || !c.name) continue;
      byName.set(c.name, c);
    }
    const merged = { classes: Array.from(byName.values()) };
    await env.AVAIL.put(KV_KEY, JSON.stringify(merged));
    return corsify(json({ ok:true, classes: merged.classes }), request);
  } catch {
    return corsify(json({ error:"KV_PUT_ERROR" }, { status: 500 }), request);
  }
}
export async function onRequestDelete({ env, request }){
  const code = request.headers.get("X-GM-Code") || "";
  if (code !== "123"){
    return corsify(json({ error:"UNAUTHORIZED" }, { status: 401 }), request);
  }
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) return corsify(json({ error:"NAME_REQUIRED" }, { status: 400 }), request);
  try {
    const raw = await env.AVAIL.get(KV_KEY);
    const current = raw ? JSON.parse(raw) : { classes: [] };
    const filtered = current.classes.filter(c => c.name !== name);
    await env.AVAIL.put(KV_KEY, JSON.stringify({ classes: filtered }));
    return corsify(json({ ok:true }), request);
  } catch {
    return corsify(json({ error:"KV_PUT_ERROR" }, { status: 500 }), request);
  }
}
