export async function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
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

// Reaproveita o mesmo namespace KV (binding "AVAIL") já usado por
// availability.js e classes.js, com um prefixo próprio para não colidir
// com as outras chaves ("availability", "classes").
const KEY_PREFIX = "char_";

export async function onRequestGet({ env, request }){
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return corsify(json({ error: "ID_REQUIRED" }, { status: 400 }), request);
  try {
    const raw = await env.AVAIL.get(KEY_PREFIX + id);
    if (!raw) return corsify(json({ error: "NOT_FOUND" }, { status: 404 }), request);
    return corsify(new Response(raw, { headers: { "content-type": "application/json; charset=utf-8" } }), request);
  } catch (e){
    return corsify(json({ error: "KV_GET_ERROR" }, { status: 500 }), request);
  }
}

export async function onRequestPost({ env, request }){
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error("bad");
  } catch {
    return corsify(json({ error: "BAD_JSON" }, { status: 400 }), request);
  }
  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
  try {
    await env.AVAIL.put(KEY_PREFIX + id, JSON.stringify(body));
    return corsify(json({ ok: true, id }), request);
  } catch (e){
    return corsify(json({ error: "KV_PUT_ERROR" }, { status: 500 }), request);
  }
}
