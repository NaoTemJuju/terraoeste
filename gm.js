(function(){
  // Gate simples
  if (sessionStorage.getItem('gmAuth') !== 'ok'){
    const code = prompt('Código do GM:');
    if (code === '123'){
      sessionStorage.setItem('gmAuth','ok');
    } else {
      alert('Acesso negado.');
      location.href = 'index.html';
      return;
    }
  }

  const app = window.app;
  const $ = (sel)=>document.querySelector(sel);

  const classesList = $("#classesList");
  const racesList = $("#racesList");
  const btnSave = $("#btnSave");
  const btnReload = $("#btnReload");
  const btnEnableAll = $("#btnEnableAll");
  const btnDisableAll = $("#btnDisableAll");
  const btnTabCR = $("#btnTabCR");

  function makeCheck(name, kind, checked){
    const id = `${kind}-${name}`.replace(/\s+/g,'-');
    const wrap = document.createElement('label');
    wrap.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.dataset.kind = kind;
    input.dataset.name = name;
    input.id = id;
    const span = document.createElement('span');
    span.textContent = name;
    wrap.append(input, ' ', span);
    return wrap;
  }

  function readUI(){
    const av = { classes:{}, races:{} };
    classesList.querySelectorAll('input[type=checkbox]').forEach(ch => av.classes[ch.dataset.name] = ch.checked);
    racesList.querySelectorAll('input[type=checkbox]').forEach(ch => av.races[ch.dataset.name] = ch.checked);
    return av;
  }

  function render(av){
    classesList.innerHTML = '';
    racesList.innerHTML = '';
    const allC = app.ALL_CLASSES || app.CLASSES;
    const allR = app.ALL_RACES || app.RACES;
    allC.forEach(c => classesList.appendChild(makeCheck(c,'class', av.classes[c] !== false)));
    allR.forEach(r => racesList.appendChild(makeCheck(r,'race', av.races[r] !== false)));
  }

  async function fetchAvailability(){
    const r = await fetch('/api/availability', { headers:{'cache-control':'no-store'} });
    if (r.ok) return await r.json();
    return {classes:{}, races:{}};
  }

  async function init(){
    const current = await fetchAvailability();
    render(current);
  }

  btnSave?.addEventListener('click', async () => {
    const av = readUI();
    const code = '123';
    const r = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GM-Code': code },
      body: JSON.stringify(av)
    });
    if (r.ok){
      alert('Salvo globalmente!');
    } else {
      alert('Falha ao salvar (verifique o código e permissões).');
    }
  });

  btnReload?.addEventListener('click', () => location.reload());

  btnEnableAll?.addEventListener('click', () => {
    classesList.querySelectorAll('input').forEach(ch => ch.checked = true);
    racesList.querySelectorAll('input').forEach(ch => ch.checked = true);
  });
  btnDisableAll?.addEventListener('click', () => {
    classesList.querySelectorAll('input').forEach(ch => ch.checked = false);
    racesList.querySelectorAll('input').forEach(ch => ch.checked = false);
  });

  btnTabCR?.addEventListener('click', () => {
    document.getElementById('tabCR').scrollIntoView({behavior:'smooth', block:'start'});
  });

  document.addEventListener('DOMContentLoaded', init);
})();

  // ====== Adicionar Classe ======
  const clsName = document.getElementById('clsName');
  const clsHP = document.getElementById('clsHP');
  const originsWrap = document.getElementById('originsWrap');
  const langGrant = document.getElementById('langGrant');
  const langBonusCommon = document.getElementById('langBonusCommon');
  const langBonusRare = document.getElementById('langBonusRare');
  const btnAddClass = document.getElementById('btnAddClass');
  const btnListClasses = document.getElementById('btnListClasses');
  const customClassList = document.getElementById('customClassList');

  function makeOriginInputs(){
    originsWrap.innerHTML = '';
    for (let i=0;i<6;i++){
      const box = document.createElement('div');
      box.className = 'check';
      const t = document.createElement('input');
      t.type = 'text';
      t.placeholder = `Título da origem #${i+1}`;
      t.style.width = '100%';
      const d = document.createElement('textarea');
      d.placeholder = 'Descrição (opcional)';
      d.rows = 2;
      d.style.width = '100%';
      box.append(t);
      box.append(d);
      originsWrap.appendChild(box);
    }
  }

  function makeLangGrant(){
    langGrant.innerHTML = '';
    const L = window.langs;
    const all = (L?.COMMON_LANGS||[]).concat(L?.RARE_LANGS||[]).concat(["Druídico","Silvestre"]);
    all.forEach(name => {
      const label = document.createElement('label');
      label.className = 'check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = name;
      const span = document.createElement('span');
      span.textContent = name;
      label.append(input, ' ', span);
      langGrant.appendChild(label);
    });
  }

  async function listCustomClasses(){
    customClassList.innerHTML = '<em class="muted">Carregando...</em>';
    try {
      const r = await fetch('/api/classes', { headers:{'cache-control':'no-store'} });
      const data = await r.json();
      const arr = Array.isArray(data.classes) ? data.classes : [];
      if (!arr.length){
        customClassList.innerHTML = '<em class="muted">Nenhuma classe personalizada.</em>';
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'grid-2';
      arr.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '12px';
        const h = document.createElement('div');
        h.innerHTML = `<strong>${c.name}</strong> — PV d${c.hp||'?'}`;
        const small = document.createElement('div');
        small.className = 'muted';
        small.textContent = `${(c.origins||[]).length} origem(ns), línguas: ${((c.languages?.grant)||[]).join(', ') || '—'}`;
        card.append(h, small);
        wrap.appendChild(card);
      });
      customClassList.innerHTML = '';
      customClassList.appendChild(wrap);
    } catch {
      customClassList.innerHTML = '<em class="muted">Erro ao carregar lista.</em>';
    }
  }

  btnAddClass?.addEventListener('click', async () => {
    const name = (clsName?.value||'').trim();
    const hp = parseInt(clsHP?.value||'6',10);
    if (!name){ alert('Informe o nome da classe.'); return; }
    if (![4,6,8,10,12].includes(hp)){ alert('PV inválido. Use d4, d6, d8, d10, d12.'); return; }

    const origins = [];
    originsWrap.querySelectorAll('div.check').forEach(box => {
      const t = box.querySelector('input')?.value?.trim() || '';
      const d = box.querySelector('textarea')?.value?.trim() || '';
      if (t) origins.push({ titulo: t, d });
    });
    if (origins.length !== 6){ alert('Preencha as 6 origens (título obrigatório).'); return; }

    const grant = [];
    langGrant.querySelectorAll('input[type=checkbox]').forEach(ch => { if (ch.checked) grant.push(ch.value); });
    const bonus = { common: parseInt(langBonusCommon?.value||'0',10)||0, rare: parseInt(langBonusRare?.value||'0',10)||0 };

    const body = { classes:[{ name, hp, origins, languages:{ grant, bonus } }] };
    const r = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'X-GM-Code': '123' },
      body: JSON.stringify(body)
    });
    if (r.ok){
      alert('Classe salva globalmente!');
      await listCustomClasses();
    } else {
      alert('Falha ao salvar a classe.');
    }
  });

  btnListClasses?.addEventListener('click', listCustomClasses);

  // initialize sub-form pieces
  makeOriginInputs();
  makeLangGrant();
  listCustomClasses();
