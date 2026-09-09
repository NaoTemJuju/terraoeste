/*! Maestria em Arma por Classe – Shadowdark
 *
 * Define, por classe, quais armas podem ser escolhidas como "Maestria".
 * Isso é puramente informativo: a escolha é salva no personagem e
 * exibida na ficha final do site, mas NÃO é exportada para o .json
 * do Foundry (nenhum bônus/efeito é gerado a partir dela).
 *
 * Para adicionar mais opções no futuro, basta incluir novos nomes na
 * lista da classe desejada, ou cadastrar novas classes.
 */
(function () {
  // ====== Dados ======
  const ARMAS_MAESTRIA = [
    "Adaga",
    "Adaga (obsidiana)",
    "Arco curto",
    "Arco longo",
    "Azagaia",
    "Bastão",
    "Besta",
    "Boleadeira",
    "Bumerangue",
    "Cajado",
    "Chicote",
    "Chicote de laminas",
    "Cimitarra",
    "Clava",
    "Clava (obsidiana)",
    "Espada bastarda",
    "Espada curta",
    "Espada grande",
    "Espada longa",
    "Funda",
    "Lança",
    "Lança (obsidiana)",
    "Maça",
    "Maça estrela",
    "Machadinha",
    "Machado grande",
    "Martelo de guerra",
    "Pique",
    "Propulsor",
    "Shuriken",
    "Zarabatana"
  ];

  const MAESTRIA_POR_CLASSE = {
    "Cavaleiro": ARMAS_MAESTRIA.map(nome => ({ nome }))
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
      // Apenas o nome é guardado — informativo, sem impacto no .json exportado.
      state.maestria = { nome: o.nome };
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
})();
