/*! Maestria em Arma por Classe – Shadowdark
 *
 * Define, por classe, quais armas podem ser escolhidas como "Maestria"
 * (WeaponMastery no formato do shadowdarklings). Cada opção guarda o
 * nome exibido ao jogador; o identificador usado no bônus exportado
 * (bonusTo) é o "slug" desse nome (minúsculo, sem acento, espaços
 * viram hífen) — é esse slug que o Foundry usa para substituir o
 * placeholder REPLACEME nas chaves de efeito do talento:
 *
 *   system.roll.melee.bonus.REPLACEME  -> system.roll.melee.bonus.adaga
 *   system.roll.melee.damage.REPLACEME -> system.roll.melee.damage.adaga
 *
 * (é o mesmo valor que o Foundry preenche sozinho quando o jogador
 * escolhe a maestria "na unha", subindo de nível pelo sistema).
 *
 * O bônus final fica assim:
 * {
 *   "sourceType": "Class",
 *   "sourceName": "Cavaleiro",
 *   "sourceCategory": "Ability",
 *   "name": "WeaponMastery",
 *   "bonusName": "Plus1AttackAndDamagePlusHalfLevel",
 *   "bonusTo": "adaga",
 *   "gainedAtLevel": 1
 * }
 *
 * Para adicionar mais opções no futuro, basta incluir novos objetos
 * { nome } na lista da classe desejada (ou novas classes). Se o slug
 * automático não bater com o nome usado no seu mundo do Foundry,
 * informe manualmente um "bonusTo" para sobrescrever o cálculo.
 */
(function () {
  // ====== Utilitário ======
  // Gera o slug (ex.: "Adaga" -> "adaga", "Espada Longa" -> "espada-longa")
  function slugify(str) {
    return String(str || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ====== Dados ======
  const MAESTRIA_POR_CLASSE = {
    "Cavaleiro": [
      { nome: "Adaga" }
    ]
  };

  // ====== UI da etapa Maestria ======
  // state: objeto de estado global (window.app.state)
  // onDone: callback chamado ao confirmar a escolha (ou quando a
  //         classe não possui opções de maestria, nesse caso a etapa
  //         é pulada e onDone é chamado imediatamente).
  function attachMasteryStep(state, onDone) {
    const section = document.getElementById("stepMastery");
    const area = document.getElementById("masteryArea");

    const custom = (window.CUSTOM_MAESTRIAS && window.CUSTOM_MAESTRIAS[state.cls]) || [];
    const lista = (custom && custom.length) ? custom : (MAESTRIA_POR_CLASSE[state.cls] || []);

    // Classe sem opções de maestria cadastradas: pula a etapa.
    if (!lista.length) {
      state.maestria = null;
      if (section) section.style.display = "none";
      if (typeof onDone === "function") onDone();
      return;
    }

    if (!section || !area) {
      if (typeof onDone === "function") onDone();
      return;
    }

    area.innerHTML = "";
    section.style.display = "";

    const select = document.createElement("select");
    select.id = "masterySelect";
    select.setAttribute("aria-label", "Escolher maestria em arma");

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Selecionar...";
    select.appendChild(opt0);

    lista.forEach((o, i) => {
      const op = document.createElement("option");
      op.value = String(i);
      op.textContent = o.nome;
      select.appendChild(op);
    });

    const btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Continuar";
    btnConfirm.disabled = true;

    function setEmpty() {
      state.maestria = null;
      btnConfirm.disabled = true;
      select.value = "";
    }

    function aplicarSelecao(idx) {
      if (idx === "" || idx == null || Number.isNaN(Number(idx))) {
        setEmpty();
        return;
      }
      const o = lista[Number(idx)];
      if (!o) {
        setEmpty();
        return;
      }
      // bonusTo = slug manual (se informado) ou derivado do nome
      state.maestria = { nome: o.nome, bonusTo: o.bonusTo || slugify(o.nome) };
      btnConfirm.disabled = false;
      select.value = String(idx);
    }

    select.addEventListener("change", () => {
      if (select.selectedIndex === 0) {
        setEmpty();
      } else {
        aplicarSelecao(select.value);
      }
    });

    btnConfirm.addEventListener("click", () => {
      if (!state.maestria) return;
      // Trava a etapa após confirmar
      select.disabled = true;
      btnConfirm.disabled = true;
      try { window.app && window.app.showCheck && window.app.showCheck(btnConfirm); } catch {}
      if (typeof onDone === "function") onDone();
    });

    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(select);
    row.appendChild(btnConfirm);

    area.appendChild(row);
    area.appendChild((() => {
      const d = document.createElement("div");
      d.className = "hint";
      d.textContent = "Escolha a arma na qual seu personagem possui maestria.";
      return d;
    })());

    setEmpty();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  window.MAESTRIA_POR_CLASSE = MAESTRIA_POR_CLASSE;
  window.attachMasteryStep = attachMasteryStep;
  window.slugifyMaestria = slugify;
})();
