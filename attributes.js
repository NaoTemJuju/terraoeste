export async function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
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

// Apenas confirma se o código enviado bate com o segredo configurado em
// env.GM_CODE (Cloudflare Pages > Settings > Environment Variables).
// Nunca retorna nem loga o valor esperado.
export async function onRequestPost({ env, request }){
  const code = request.headers.get("X-GM-Code") || "";
  const expected = env.GM_CODE || "";
  if (!expected || code !== expected){
    return corsify(json({ ok:false }, { status: 401 }), request);
  }
  return corsify(json({ ok:true }), request);
}
