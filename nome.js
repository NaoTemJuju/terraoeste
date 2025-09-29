/*
 * Módulo de Nome
 *
 * Este módulo controla a etapa de definição de nome que ocorre após a
 * etapa de Ouro. Ele permite ao jogador gerar um nome aleatório
 * apropriado para a raça escolhida ou inserir um nome manualmente. Ao
 * Continuar o nome, a ficha final é gerada. A função `goToName`
 * exposta neste arquivo é utilizada por outras etapas (como a
 * etapa de Ouro) para avançar para a tela de nome.
 */
(function(){
  // Garante que o namespace app exista
  if (!window.app) window.app = {};

  const { state, showCheck } = window.app;

  // ====================== Geração de nomes por raça e gênero ======================
  const NAME_BY_RACE = {
    "Anão":      { masculino:  ["Adrik", "Baern", "Berend", "Darrak", "Eberk", "Fargrim", "Gardain", "Harbek", "Kildrak", "Morgran", "Orsik", "Rangrim", "Thoradin", "Thorfin", "Tordek", "Travok", "Vondal", "Rurik", "Ulfgar", "Veit"],
                  feminino: ["Artin", "Bardryn", "Diesa", "Eklcth", "Falkrunn", "Gurdis", "Helja", "Kathra", "Kristryd", "Mardred", "Riswynn", "Torbera", "Vistra", "Audhild", "Dagnal", "Gunnloda", "Hlin", "Ilde", "Liftrasa", "Sannl"] },
    "Elfo":      { masculino: ["Aelar", "Adran", "Arannis", "Aramil", "Aust", "Beiro", "Berrian", "Carric", "Erdan", "Erevan", "Galinndan", "Hadarai", "Heian", "Himo", "Immeral", "Ivellios", "Laucian", "Mindartis", "Paelias", "Peren"],
                  feminino: ["Adrie", "Althaea", "Anastrianna", "Andraste", "Antinua", "Bethrynna", "Birel", "Caelynn", "Drusilia", "Enna", "Felosial", "Ielenia", "Jelenneth", "Keyleth", "Leshanna", "Lia", "Meriele", "Mialee", "Naivara", "Quelenna"] },
    "Gnomo":     { masculino: ["Alvyn", "Boddynock", "Carlin", "Erky", "Frug", "Jebeddo", "Seebo", "Zook", "Bramblecheer", "Ivorin", "Coppisk", "Dewdroble", "Burr", "Eldon", "Nackle", "Finpip", "Fizzlefond", "Glim", "Fonkin", "Tinkertop"],
                  feminino:  ["Bimpnottin", "Breena", "Carlin", "Donella", "Duvamil", "Lilli", "Mardnab", "Nyx", "Oda", "Zanna", "Thistlewood", "Isolde", "Eldrin", "Nyx", "Zephyros", "Valora", "Riven", "Seraphine", "Tiberius", "Elaria"] },
    "Goblin":    { masculino: ["Grukk", "Zgrak", "Thok", "Krik", "Brog", "Rukk", "Drog", "Skurr", "Krogg", "Thog", "Murk", "Snik", "Grimk", "Lurk", "Ruk", "Vorr", "Gash", "Zurk", "Zab", "Drogar"],
                  feminino:  ["Kresh", "Vrikka", "Naggra", "Skraza", "Zarkra", "Grubba", "Rukkka", "Thukka", "Murkka", "Grukkra", "Zgrisa", "Drakka", "Skrikka", "Niksa", "Zabira", "Thurra", "Vikka", "Grasha", "Rukkra", "Trisha"] },
    "Humano":    { masculino: ["Alaric", "Darius", "Edgar", "Felix", "Garrick", "Lucian", "Roland", "Victor", "Thaddeus", "Elias", "Hugo", "Caius", "Malcolm", "Benedict", "Sebastian", "Cassius", "Roderick", "Dorian", "Viktor", "Crispin"],
                  feminino: ["Adelaide", "Isolde", "Elara", "Celia", "Amelia", "Seraphina", "Evelyn", "Aria", "Luciana", "Vivienne", "Selene", "Rosalie", "Valeria", "Mariana", "Juliana", "Cordelia", "Ophelia", "Leandra", "Aurora", "Florence"] },
    "Meio-Elfo": { masculino: ["Althar", "Daeron", "Eryndor", "Thalion", "Lorien", "Aleron", "Ronan", "Valandor", "Beryndor", "Galathil", "Kaelen", "Eldrin", "Oberon", "Faelan", "Lennar", "Tharion", "Ithilien", "Eryon", "Nerath", "Cyrion", "Ariel", "Darian", "Kael", "Tavian", "Rowan", "Lorian", "Orin"],
                  feminino: ["Aeliana", "Eledra", "Lyrian", "Thalassa", "Calista", "Isolde", "Elira", "Althaea", "Maelis", "Selene", "Rhiannon", "Arielle", "Seraphine", "Elenia", "Shara", "Lirael", "Faelina", "Nerissa", "Amaranth", "Ysolde", "Selene", "Lira", "Arianna", "Caela", "Eryndil", "Elena", "Thalia", "Anastasia", "Mara"] },
    "Meio-Orc":  { masculino: ["Brug", "Dom", "Druuk", "Gnarsh", "Grumbar", "Rogar", "Karash", "Korgul", "Krusk", "Lubash", "Mord", "Ohr", "Rendar", "Sark", "Scrag", "Tanglar", "Tarak", "Thar", "Ugarth", "Yurk", "Gorak", "Brakka", "Thokk", "Urzul", "Morg", "Ruk", "Graxx", "Zura", "Korg", "Garn"],
                  feminino: ["Augh", "Bree", "Ekk", "Gaaki", "Grai", "Grigri", "Gynk", "Ruru", "Lagazi", "Murook", "Nogu", "Ootah", "Puyet", "Tawar", "Tomph", "Ubada", "Vanchu", "Vola", "Volen", "Yevelda", "Grasha", "Ruksha", "Vera", "Shona", "Gorla", "Lura", "Ruka", "Braka", "Tura", "Zora"] },
    "Pequenino": { masculino: ["Alton", "Bramble", "Dodd", "Fenwick", "Garrick", "Hob", "Kip", "Milo", "Perrin", "Roscoe", "Tobin", "Flicker", "Merric", "Osborn", "Tansy", "Wendel", "Gimble", "Pip", "Samwise", "Thistle", "Pipin", "Frodo", "Meriadoc", "Tobold", "Filibert", "Dobby", "Toby", "Rory", "Bram"],
                  feminino: ["Adaldrida", "Berylla", "Camellia", "Daisy", "Eglantine", "Felice", "Hilde", "Lily", "Mira", "Penny", "Tansy", "Zinnia", "Fiora", "Diana", "Carissa", "Elira", "Lorna", "Verna", "Rosie", "Esmeralda", "Lily", "Cora", "Fiona", "Tansy", "Gilda", "Mimi", "Ruby"] },
    "default":   { masculino: ["Aventureiro(a)"],
                  feminino: ["Aventureira"] }
  };

  function randomNameByRace(race, gender){
    const list = NAME_BY_RACE[race] && NAME_BY_RACE[race][gender] || NAME_BY_RACE.default.masculino;
    const rand = (typeof window.app?.randInt === 'function')
      ? window.app.randInt(0, list.length - 1)
      : Math.floor(Math.random() * list.length);
    return list[rand];
  }
  window.app.randomNameByRace = randomNameByRace;

  /**
   * Aplica o estado "travado" na etapa NOME.
   */
  function lockNameUI(){
    const input  = document.getElementById('nameInput');
    const genBtn = document.getElementById('btnNameGenerate');
    const confBtn= document.getElementById('btnConfirmName');

    if (input)  { input.disabled = true; input.readOnly = true; }
    if (genBtn) { genBtn.disabled = true; genBtn.classList.add('disabled'); }
    if (confBtn){ confBtn.disabled = true; confBtn.classList.add('disabled'); }
    window.app.nameLocked = true;
  }

  /**
   * Exibe a etapa de nome e respeita o estado salvo/lock.
   */
  function showNameStep(){
    const sec = document.getElementById('stepNameEntry');
    if (sec) {
      sec.style.display = '';
      try { sec.scrollIntoView({ behavior:'smooth', block:'start' }); } catch {}
    }
    const input = document.getElementById('nameInput');
    if (input) input.value = (state && state.name) ? state.name : '';

    // Se já estava travado, mantém travado ao reabrir
    if (window.app.nameLocked) lockNameUI();

    const hint = document.getElementById('nameHint');
    if (hint) hint.style.display = '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const genBtnM  = document.getElementById('btnNameGenerateM');
    const genBtnF  = document.getElementById('btnNameGenerateF');
    const confBtn = document.getElementById('btnConfirmName');
    const input   = document.getElementById('nameInput');

    // Geração para Masculino
    if (genBtnM) {
      genBtnM.addEventListener('click', () => {
        if (window.app.nameLocked) return; // não permite alterar quando travado
        try {
          const race = state?.race;
          const name = typeof randomNameByRace === 'function' ? randomNameByRace(race, 'masculino') : '';
          if (input && name) input.value = name;
        } catch {}
      });
    }

    // Geração para Feminino
    if (genBtnF) {
      genBtnF.addEventListener('click', () => {
        if (window.app.nameLocked) return; // não permite alterar quando travado
        try {
          const race = state?.race;
          const name = typeof randomNameByRace === 'function' ? randomNameByRace(race, 'feminino') : '';
          if (input && name) input.value = name;
        } catch {}
      });
    }

    if (confBtn) {
      confBtn.addEventListener('click', async () => {
        if (!input) return;
        const val = (input.value || '').trim();
        if (state) state.name = val;

        // Feedback visual (🗸 ao lado do Continuar)
        try { if (typeof showCheck === 'function') showCheck(confBtn); } catch {}

        // TRAVA a etapa NOME após Continuar
        lockNameUI();

        // Gera a ficha final após o nome ser definido
        try {
          if (window.app && typeof window.app.finalizeCharacter === 'function'){
            await window.app.finalizeCharacter();
          }
        } catch {}
      });
    }
  });

  // Expõe a função para navegação a partir de outras etapas
  window.app.goToName = showNameStep;
})();
