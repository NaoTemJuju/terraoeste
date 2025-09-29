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
  const btnSaveLocal = $("#btnSaveLocal");
  const btnExport = $("#btnExport");
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
    allC.forEach(c => classesList.appendChild(makeCheck(c,'class', !!av.classes[c])));
    allR.forEach(r => racesList.appendChild(makeCheck(r,'race', !!av.races[r])));
  }

  async function init(){
    await new Promise(r => setTimeout(r, 0)); // ensure base loaded availability
    const current = app.getAvailability ? app.getAvailability() : {classes:{},races:{}};
    render(current);
  }

  btnSaveLocal?.addEventListener('click', () => {
    const av = readUI();
    localStorage.setItem('gmAvailability', JSON.stringify(av));
    if (app.applyAvailability) app.applyAvailability(av);
    alert('Salvo no navegador. Faça export e commit para global.');
  });

  btnExport?.addEventListener('click', () => {
    const av = readUI();
    const blob = new Blob([JSON.stringify(av, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'availability.json';
    a.click();
    URL.revokeObjectURL(a.href);
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