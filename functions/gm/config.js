export const onRequestGet = async ({ env }) => {
  const raw = await env.GM_CONFIG.get('disabled', 'json');
  const disabled = raw || { classes: [], races: [] };
  return new Response(JSON.stringify({ disabled }), {
    headers: { 'content-type': 'application/json', 'cache-control':'no-store' }
  });
};

const ALLOWED = {
  classes: [
    "Assassino","Bárbaro","Bardo","Bruxo","Caçador","Cavaleiro","Druida","Explorador",
    "Feiticeiro","Guerreiro","Mago","Malandro","Pactário","Paladino","Patrulheiro","Sacerdote"
  ],
  races: ["Anão","Elfo","Gnomo","Goblin","Humano","Meio-Elfo","Meio-Orc","Pequenino"]
};

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try { body = await request.json(); } catch {}
  const code = (body && body.code) || "";
  const expected = env.GM_CODE || "123";
  if (code !== expected){
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }
  const dis = (body && body.disabled) || {};
  const disClasses = Array.isArray(dis.classes) ? dis.classes.filter(x => ALLOWED.classes.includes(x)) : [];
  const disRaces   = Array.isArray(dis.races) ? dis.races.filter(x => ALLOWED.races.includes(x)) : [];
  await env.GM_CONFIG.put('disabled', JSON.stringify({ classes: disClasses, races: disRaces }));
  return new Response(JSON.stringify({ ok:true, disabled: { classes: disClasses, races: disRaces } }), {
    headers: { 'content-type': 'application/json' }
  });
};
