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