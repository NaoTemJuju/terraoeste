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
  const btnTabAvail = $("#btnTabAvail");
  const btnTabClasses = $("#btnTabClasses");
  const btnTabContent = $("#btnTabContent");
  const btnTabShop = $("#btnTabShop");

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
  // ------- Abas -------
  function showTab(tabId){
    document.querySelectorAll('.gm-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
    document.querySelectorAll('.gm-tab').forEach(btn => {
      const isActive = btn.getAttribute('aria-controls') === tabId;
      btn.setAttribute('aria-selected', String(isActive));
    });
  }
  btnTabAvail?.addEventListener('click', () => showTab('panelAvail'));
  btnTabClasses?.addEventListener('click', () => showTab('panelClasses'));
  btnTabContent?.addEventListener('click', () => showTab('panelContent'));
  btnTabShop?.addEventListener('click', () => showTab('panelShop'));

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
    const boxes = originsWrap.querySelectorAll('.gm-origin');
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
    if (editBanner) { editBanner.style.display = ''; editBanner.scrollIntoView({behavior:'smooth', block:'center'}); }
    if (editingNameEl) editingNameEl.textContent = c.name;
  }

  btnCancelEdit?.addEventListener('click', clearForm);

  function makeOriginInputs(){
    originsWrap.innerHTML = '';
    for (let i=0;i<6;i++){
      const box = document.createElement('div');
      box.className = 'gm-origin';
      const head = document.createElement('div');
      head.className = 'gm-origin-head';
      const num = document.createElement('span');
      num.className = 'gm-origin-num';
      num.textContent = String(i+1);
      head.append(num, `Origem ${i+1}`);
      const t = document.createElement('input');
      t.type = 'text';
      t.placeholder = `Título da origem #${i+1}`;
      const d = document.createElement('textarea');
      d.placeholder = 'Descrição (opcional)';
      box.append(head, t, d);
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
    customClassList.innerHTML = '<p class="gm-empty">Carregando...</p>';
    try {
      const r = await fetch('/api/classes', { headers:{'cache-control':'no-store'} });
      const data = await r.json();
      const arr = Array.isArray(data.classes) ? data.classes : [];
      if (!arr.length){
        customClassList.innerHTML = '<p class="gm-empty">Nenhuma classe extra cadastrada ainda.</p>';
        return;
      }
      const table = document.createElement('table');
      table.className = 'gm-table';
      table.innerHTML = '<thead><tr><th>Classe</th><th>PV</th><th>Origens</th><th>Línguas concedidas</th><th></th></tr></thead>';
      const tbody = document.createElement('tbody');
      arr.forEach(c => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.innerHTML = `<strong>${c.name}</strong>`;

        const tdHP = document.createElement('td');
        tdHP.innerHTML = `<span class="badge">d${c.hp||'?'}</span>`;

        const tdOrigins = document.createElement('td');
        tdOrigins.textContent = `${(c.origins||[]).length} de 6`;

        const tdLangs = document.createElement('td');
        tdLangs.textContent = ((c.languages?.grant)||[]).join(', ') || '—';

        const tdActions = document.createElement('td');
        tdActions.className = 'actions';
        const btnE = document.createElement('button'); btnE.className='ghost'; btnE.textContent='Editar';
        btnE.addEventListener('click', ()=>loadClassIntoForm(c));
        const btnD = document.createElement('button'); btnD.className='ghost'; btnD.textContent='Excluir';
        btnD.addEventListener('click', async ()=>{
          if (!confirm(`Remover a classe "${c.name}"?`)) return;
          const r = await fetch(`/api/classes?name=${encodeURIComponent(c.name)}`, { method:'DELETE', headers:{ 'X-GM-Code': gmCode } });
          if (r.ok){ listCustomClasses(); if (__editingName===c.name) clearForm(); } else if (!handleAuthFailure(r)) alert('Falha ao remover.');
        });
        tdActions.append(btnE, btnD);

        tr.append(tdName, tdHP, tdOrigins, tdLangs, tdActions);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      customClassList.innerHTML = '';
      customClassList.appendChild(table);
    } catch {
      customClassList.innerHTML = '<p class="gm-empty">Erro ao carregar a lista.</p>';
    }
  }

  btnAddClass?.addEventListener('click', async () => {
    const name = (clsName?.value||'').trim();
    const hp = parseInt(clsHP?.value||'6',10);
    if (!name){ alert('Informe o nome da classe.'); return; }
    if (![4,6,8,10,12].includes(hp)){ alert('PV inválido. Use d4, d6, d8, d10, d12.'); return; }

    const origins = [];
    originsWrap.querySelectorAll('.gm-origin').forEach(box => {
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

  // ------- Aba: Loja -------
  const TYPE_LABELS_GM = { weapon: "Arma", armor: "Armadura", sundry: "Diversos", potion: "Poção" };
  const CURRENCY_LABEL_GM = { gp: "PO", sp: "PP", cp: "PC" };

  const shopItemList = document.getElementById('shopItemList');
  const shopItemName = document.getElementById('shopItemName');
  const shopItemType = document.getElementById('shopItemType');
  const shopItemCost = document.getElementById('shopItemCost');
  const shopItemCurrency = document.getElementById('shopItemCurrency');
  const shopItemSlots = document.getElementById('shopItemSlots');
  const btnAddShopItem = document.getElementById('btnAddShopItem');
  const btnListShop = document.getElementById('btnListShop');
  const editShopBanner = document.getElementById('editShopBanner');
  const editingShopNameEl = document.getElementById('editingShopName');
  const btnCancelShopEdit = document.getElementById('btnCancelShopEdit');

  let __editingShopId = null;

  function clearShopForm(){
    shopItemName.value = '';
    shopItemType.value = 'sundry';
    shopItemCost.value = '0';
    shopItemCurrency.value = 'gp';
    shopItemSlots.value = '1';
    __editingShopId = null;
    if (editShopBanner) editShopBanner.style.display = 'none';
    if (editingShopNameEl) editingShopNameEl.textContent = '';
  }

  function slugifyShopId(name){
    return String(name || '')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || ('item-' + Date.now());
  }

  function loadShopItemIntoForm(it){
    shopItemName.value = it.name || '';
    shopItemType.value = it.type || 'sundry';
    shopItemCost.value = String(it.cost ?? 0);
    shopItemCurrency.value = it.currency || 'gp';
    shopItemSlots.value = String(it.slots ?? 1);
    __editingShopId = it.id;
    if (editShopBanner) { editShopBanner.style.display = ''; editShopBanner.scrollIntoView({ behavior:'smooth', block:'center' }); }
    if (editingShopNameEl) editingShopNameEl.textContent = it.name;
  }

  btnCancelShopEdit?.addEventListener('click', clearShopForm);

  async function fetchShopItems(){
    const r = await fetch('/api/gear', { headers: { 'cache-control': 'no-store' } });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.items) ? data.items : [];
  }

  async function listShopItems(){
    shopItemList.innerHTML = '<p class="gm-empty">Carregando...</p>';
    try {
      const items = await fetchShopItems();
      if (!items.length){
        shopItemList.innerHTML = '<p class="gm-empty">Nenhum item cadastrado na loja ainda.</p>';
        return;
      }
      const table = document.createElement('table');
      table.className = 'gm-table';
      table.innerHTML = '<thead><tr><th>Item</th><th>Tipo</th><th>Custo</th><th>Espaços</th><th></th></tr></thead>';
      const tbody = document.createElement('tbody');

      items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .forEach(it => {
          const tr = document.createElement('tr');

          const tdName = document.createElement('td');
          tdName.innerHTML = `<strong>${it.name}</strong>`;

          const tdType = document.createElement('td');
          tdType.innerHTML = `<span class="badge">${TYPE_LABELS_GM[it.type] || it.type}</span>`;

          const tdCost = document.createElement('td');
          tdCost.textContent = `${it.cost} ${CURRENCY_LABEL_GM[it.currency] || 'PO'}`;

          const tdSlots = document.createElement('td');
          tdSlots.textContent = it.slots === 0 ? 'sem peso' : String(it.slots);

          const tdActions = document.createElement('td');
          tdActions.className = 'actions';
          const btnE = document.createElement('button'); btnE.className = 'ghost'; btnE.textContent = 'Editar';
          btnE.addEventListener('click', () => loadShopItemIntoForm(it));
          const btnD = document.createElement('button'); btnD.className = 'ghost'; btnD.textContent = 'Excluir';
          btnD.addEventListener('click', async () => {
            if (!confirm(`Remover "${it.name}" da loja?`)) return;
            const r = await fetch(`/api/gear?id=${encodeURIComponent(it.id)}`, { method: 'DELETE', headers: { 'X-GM-Code': gmCode } });
            if (r.ok){ listShopItems(); if (__editingShopId === it.id) clearShopForm(); }
            else if (!handleAuthFailure(r)) alert('Falha ao remover.');
          });
          tdActions.append(btnE, btnD);

          tr.append(tdName, tdType, tdCost, tdSlots, tdActions);
          tbody.appendChild(tr);
        });

      table.appendChild(tbody);
      shopItemList.innerHTML = '';
      shopItemList.appendChild(table);
    } catch {
      shopItemList.innerHTML = '<p class="gm-empty">Erro ao carregar a lista.</p>';
    }
  }

  btnAddShopItem?.addEventListener('click', async () => {
    const name = (shopItemName?.value || '').trim();
    if (!name){ alert('Informe o nome do item.'); return; }
    const type = shopItemType?.value || 'sundry';
    const cost = Math.max(0, parseInt(shopItemCost?.value || '0', 10) || 0);
    const currency = shopItemCurrency?.value || 'gp';
    const slots = Math.max(0, parseInt(shopItemSlots?.value || '0', 10) || 0);
    const id = __editingShopId || `${type}-${slugifyShopId(name)}`;

    // Se o nome mudou o suficiente para gerar um id diferente do item
    // original em edição, remove o item antigo pra não deixar duplicado.
    if (__editingShopId && __editingShopId !== id){
      await fetch(`/api/gear?id=${encodeURIComponent(__editingShopId)}`, { method: 'DELETE', headers: { 'X-GM-Code': gmCode } });
    }

    const body = { items: [{ id, name, type, cost, currency, slots }] };
    const r = await fetch('/api/gear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GM-Code': gmCode },
      body: JSON.stringify(body)
    });
    if (r.ok){
      alert('Salvo globalmente!');
      clearShopForm();
      await listShopItems();
    } else if (!handleAuthFailure(r)) {
      alert('Falha ao salvar o item.');
    }
  });

  btnListShop?.addEventListener('click', listShopItems);

  // Init
  (async function init(){
    renderAvailability(await fetchAvailability());
    makeOriginInputs();
    makeLangGrant();
    listCustomClasses();
    listShopItems();
  })();
})();

