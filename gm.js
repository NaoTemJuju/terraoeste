(async function(){
  // Autorização real: o código digitado é validado pelo servidor
  // (env.GM_CODE), nunca comparado localmente. Guardamos o código em
  // sessionStorage só para reenviá-lo nas próximas chamadas desta aba.
  async function verifyGmCode(code){
    try {
      const r = await fetch('/api/gm-auth', {
        method: 'POST',
        headers: { 'X-GM-Code': code || '' }
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  let gmCode = sessionStorage.getItem('gmCode');
  let authorized = gmCode ? await verifyGmCode(gmCode) : false;

  while (!authorized){
    gmCode = prompt('Código do GM:');
    if (gmCode === null){
      location.href = 'index.html';
      return;
    }
    authorized = await verifyGmCode(gmCode);
    if (!authorized) alert('Código incorreto.');
  }
  sessionStorage.setItem('gmCode', gmCode);

  // Só agora, com o código confirmado pelo servidor, o conteúdo aparece.
  const gmRoot = document.getElementById('gmRoot');
  if (gmRoot) gmRoot.style.visibility = '';

  // Se o código guardado nesta aba deixar de ser válido (ex.: foi trocado
  // no ambiente), limpa e força um novo prompt na próxima ação.
  function handleAuthFailure(resp){
    if (resp && resp.status === 401){
      sessionStorage.removeItem('gmCode');
      alert('Código de GM inválido ou expirado. Recarregue a página para tentar de novo.');
      return true;
    }
    return false;
  }

  const app = window.app;
  const $ = (sel)=>document.querySelector(sel);

  // ------- Checklist de disponibilidade -------
  const classesList = $("#classesList");
  const racesList = $("#racesList");
  const btnSave = $("#btnSave");
  const btnReload = $("#btnReload");
  const btnEnableAll = $("#btnEnableAll");
  const btnDisableAll = $("#btnDisableAll");
  const btnTabCR = $("#btnTabCR");

  function makeCheck(name, kind, checked){
    const label = document.createElement('label');
    label.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.dataset.kind = kind;
    input.dataset.name = name;
    const span = document.createElement('span');
    span.textContent = name;
    label.append(input, ' ', span);
    return label;
  }

  function readAvailabilityUI(){
    const av = { classes:{}, races:{} };
    classesList.querySelectorAll('input[type=checkbox]').forEach(ch => av.classes[ch.dataset.name] = ch.checked);
    racesList.querySelectorAll('input[type=checkbox]').forEach(ch => av.races[ch.dataset.name] = ch.checked);
    return av;
  }

  async function fetchAvailability(){
    const r = await fetch('/api/availability', { headers:{'cache-control':'no-store'} });
    if (r.ok) return await r.json();
    return {classes:{}, races:{}};
  }

  function renderAvailability(av){
    classesList.innerHTML = '';
    racesList.innerHTML = '';
    const allC = app.ALL_CLASSES || app.CLASSES;
    const allR = app.ALL_RACES || app.RACES;
    allC.forEach(c => classesList.appendChild(makeCheck(c,'class', av.classes[c] !== false)));
    allR.forEach(r => racesList.appendChild(makeCheck(r,'race', av.races[r] !== false)));
  }

  btnSave?.addEventListener('click', async () => {
    const av = readAvailabilityUI();
    const r = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GM-Code': gmCode },
      body: JSON.stringify(av)
    });
    if (r.ok){
      alert('Salvo globalmente!');
      app.applyAvailability && app.applyAvailability(av);
    } else if (!handleAuthFailure(r)) {
      alert('Falha ao salvar.');
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

  // ------- Adicionar/Editar classes personalizadas -------
  const clsName = document.getElementById('clsName');
  const clsHP = document.getElementById('clsHP');
  const originsWrap = document.getElementById('originsWrap');
  const langGrant = document.getElementById('langGrant');
  const langBonusCommon = document.getElementById('langBonusCommon');
  const langBonusRare = document.getElementById('langBonusRare');
  const btnAddClass = document.getElementById('btnAddClass');
  const btnListClasses = document.getElementById('btnListClasses');
  const customClassList = document.getElementById('customClassList');
  const editBanner = document.getElementById('editBanner');
  const editingNameEl = document.getElementById('editingName');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  let __editingName = null;

  function clearForm(){
    clsName.value = '';
    clsHP.value = '6';
    makeOriginInputs();
    makeLangGrant();
    langBonusCommon.value = 0;
    langBonusRare.value = 0;
    __editingName = null;
    if (editBanner) editBanner.style.display = 'none';
    if (editingNameEl) editingNameEl.textContent = '';
  }

  function loadClassIntoForm(c){
    clsName.value = c.name || '';
    clsHP.value = String(c.hp || '6');
    makeOriginInputs();
    const boxes = originsWrap.querySelectorAll('.field');
    (c.origins||[]).forEach((o,i)=>{
      const b = boxes[i]; if (!b) return;
      b.querySelector('input').value = o.titulo || o.title || '';
      b.querySelector('textarea').value = o.d || o.desc || '';
    });
    makeLangGrant();
    const gset = new Set((c.languages?.grant)||[]);
    langGrant.querySelectorAll('input[type=checkbox]').forEach(ch => ch.checked = gset.has(ch.value));
    langBonusCommon.value = (c.languages?.bonus?.common)||0;
    langBonusRare.value = (c.languages?.bonus?.rare)||0;
    __editingName = c.name;
    if (editBanner) editBanner.style.display = '';
    if (editingNameEl) editingNameEl.textContent = c.name;
  }

  btnCancelEdit?.addEventListener('click', clearForm);

  function makeOriginInputs(){
    originsWrap.innerHTML = '';
    for (let i=0;i<6;i++){
      const box = document.createElement('div');
      box.className = 'field';
      const t = document.createElement('input');
      t.type = 'text';
      t.placeholder = `Título da origem #${i+1}`;
      const d = document.createElement('textarea');
      d.placeholder = 'Descrição (opcional)';
      box.appendChild(t);
      box.appendChild(d);
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
      input.type = 'checkbox'; input.value = name;
      const span = document.createElement('span'); span.textContent=name;
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
        customClassList.innerHTML = '<em class="muted">Nenhuma classe extra.</em>';
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'grid-2';
      arr.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card list';
        const h = document.createElement('div');
        h.innerHTML = `<strong>${c.name}</strong> <span class="badge">PV d${c.hp||'?'}</span>`;
        const small = document.createElement('div');
        small.className = 'muted';
        small.textContent = `${(c.origins||[]).length} origem(ns), línguas: ${((c.languages?.grant)||[]).join(', ') || '—'}`;
        const row = document.createElement('div');
        row.className = 'row'; row.style.gap = '.5rem';
        const btnE = document.createElement('button'); btnE.className='ghost'; btnE.textContent='Editar'; btnE.addEventListener('click', ()=>loadClassIntoForm(c));
        const btnD = document.createElement('button'); btnD.className='ghost'; btnD.textContent='Deletar'; btnD.addEventListener('click', async ()=>{
          if (!confirm(`Remover a classe \"${c.name}\"?`)) return;
          const r = await fetch(`/api/classes?name=${encodeURIComponent(c.name)}`, { method:'DELETE', headers:{ 'X-GM-Code': gmCode } });
          if (r.ok){ listCustomClasses(); if (__editingName===c.name) clearForm(); } else if (!handleAuthFailure(r)) alert('Falha ao remover.');
        });
        row.append(btnE, btnD);
        card.append(h, small, row);
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
    originsWrap.querySelectorAll('.field').forEach(box => {
      const t = box.querySelector('input')?.value?.trim() || '';
      const d = box.querySelector('textarea')?.value?.trim() || '';
      if (t) origins.push({ titulo: t, d });
    });
    if (origins.length !== 6){ alert('Preencha as 6 origens.'); return; }

    const grant = [];
    langGrant.querySelectorAll('input[type=checkbox]').forEach(ch => { if (ch.checked) grant.push(ch.value); });
    const bonus = { common: parseInt(langBonusCommon?.value||'0',10)||0, rare: parseInt(langBonusRare?.value||'0',10)||0 };

    const body = { classes:[{ name, hp, origins, languages:{ grant, bonus } }] };
    if (__editingName && __editingName !== name){
      await fetch(`/api/classes?name=${encodeURIComponent(__editingName)}`, { method:'DELETE', headers:{ 'X-GM-Code': gmCode } });
    }
    const r = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'X-GM-Code': gmCode },
      body: JSON.stringify(body)
    });
    if (r.ok){
      alert('Salvo globalmente!');
      clearForm();
      await listCustomClasses();
      // atualiza listas em memória para refletir imediatamente
      app.loadCustomClasses && app.loadCustomClasses();
    } else if (!handleAuthFailure(r)) {
      alert('Falha ao salvar a classe.');
    }
  });

  btnListClasses?.addEventListener('click', listCustomClasses);

  // Init
  (async function init(){
    renderAvailability(await fetchAvailability());
    makeOriginInputs();
    makeLangGrant();
    listCustomClasses();
  })();
})();