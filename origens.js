/*! Origens por Classe – Shadowdark (3d6 Down the Line) */
(function () {
  // ====== Dados ======
  const ORIGENS_POR_CLASSE = {
    "Assassino": [
      { titulo: "Fugitivo", d: "Você é procurado pela lei após um homicídio testemunhado." },
      { titulo: "Matador de Rua", d: "Você matou por vingança ou sobrevivência pelas vielas." },
      { titulo: "Sacrificador", d: "Você ceifava vidas num altar à serviço de um culto macabro." },
      { titulo: "Sicário", d: "Você executava alvos por ordens de líderes criminosos locais." },
      { titulo: "Infiltrador", d: "Você sabia como enganar e ganhar a confiança de seus alvos." },
      { titulo: "Executor Real", d: "Você executava ordens secretas de nobres ou realeza." }
    ],
    "Bárbaro": [
      { titulo: "Exilado", d: "Você foi expulso de sua tribo após uma grande desonra." },
      { titulo: "Cativo", d: "Você lutava por sua vida em fossos sujos para entreter espectadores." },
      { titulo: "Guarda Tribal", d: "Você protegia sua tribo, sempre pronto contra ataques." },
      { titulo: "Aprendiz de Guerra", d: "Você treinou para forjar seu corpo e alma na batalha." },
      { titulo: "Caçador de Presas", d: "Você caçava feras gigantes, provando coragem e habilidade." },
      { titulo: "Filho de Ancião", d: "Você cresceu como herdeiro, treinado para liderar guerreiros." }
    ],
    "Bardo": [
      { titulo: "Cantor de Rua", d: "Você cantava por moedas em ruas movimentadas." },
      { titulo: "Ajudante de Taverna", d: "Você trabalhava em uma taberna, em palco e mesas." },
      { titulo: "Poeta de Vila", d: "Você era a voz amada de sua vila." },
      { titulo: "Aprendiz de Menestrel", d: "Você estudava com um mestre, aperfeiçoando sua arte." },
      { titulo: "Trovador Errante", d: "Você vagava por civilizações, mas a música era seu lar." },
      { titulo: "Músico da Corte", d: "Você era o contratado exclusivo de um lorde poderoso." }
    ],
    "Bruxo": [
      { titulo: "Sinaleira de Lareiras", d: "Você selava portas e celeiros contra azar e pragas" },
      { titulo: "Tecedor Vil", d: "Você costurava mal-olhado em bonecos e fitilhos" },
      { titulo: "Mediador", d: "Você negociava passagem segura com espíritos locais" },
      { titulo: "Leitor de Presságios", d: "Você guiava viagens e colheitas pelos sinais do céu" },
      { titulo: "Quebra-Agouros", d: "Você desfez olho-gordo, espantou pesadelos e vínculos ruins" },
      { titulo: "Tecedor de Amuletos", d: "Você fez talismãs de ossos, ervas e fio para o povo" }
    ],
    "Caçador": [
      { titulo: "Sobrevivente de Massacre", d: "Você jurou caçar o monstro da sua vila" },
      { titulo: "Discípulo da Ordem", d: "Você foi treinado por caçadores veteranos" },
      { titulo: "Erudito de Bestiários", d: "Você estudou fraquezas e hábitos de monstros" },
      { titulo: "Caçador de Recompensas", d: "Você seguiu pistas e capturou monstros visados" },
      { titulo: "Purificador de Criptas", d: "Você descia com água benta e estacas" },
      { titulo: "Quebra-Cultos", d: "Você infiltrou seitas e frustrou rituais profanos" }
    ],
    "Cavaleiro": [
      { titulo: "Escudeiro de Aldeia", d: "Você cuidava de armas e ajudava cavaleiros viajantes." },
      { titulo: "Filho de Ferreiro", d: "Você treinava montaria enquanto ajudava na forja local." },
      { titulo: "Soldado Recruta", d: "Você serviu como guarda em patrulhas e escoltas simples." },
      { titulo: "Mensageiro Montado", d: "Você levava recados e escoltava pequenos comboios." },
      { titulo: "Campeão de Torneio", d: "Você venceu lutas locais e ganhou fama entre nobres." },
      { titulo: "Escudeiro de Lorde", d: "Você recebeu treino e ouro servindo a um cavaleiro real." }
    ],
    "Druida": [
      { titulo: "Guardião das Florestas", d: "Você protegia matas antigas de ameaças externas" },
      { titulo: "Curandeiro Tribal", d: "Você usava ervas e rituais para curar seu povo" },
      { titulo: "Viajante das Estrelas", d: "Você lê os céus para guiar migrações sazonais" },
      { titulo: "Eremita", d: "Você vagava pelos ermos e curava febres dos viajantes" },
      { titulo: "Saltimbanco da Mata", d: "ocê exibia dons selvagens para encantar plateias" },
      { titulo: "Sábio de Vila", d: "Você guiava ciclos de colheita e aconselhava aldeões" }
    ],
    "Explorador": [
      { titulo: "Filho da Trilha", d: "Você cresceu seguindo caçadores por matas e colinas remotas." },
      { titulo: "Coletor de Relíquias", d: "Você procurava artefatos antigos em ruínas esquecidas." },
      { titulo: "Mensageiro Rápido", d: "Você cruzava estradas perigosas levando cartas e recados." },
      { titulo: "Batedor de Caravana", d: "Você abria caminho e mantinha rotas livres de perigos." },
      { titulo: "Explorador de Ruínas", d: "Você mapeava corredores e salas de lugares perdidos." },
      { titulo: "Guia de Rota Selvagem", d: "Você conduzia grupos seguros por terras não mapeadas." }
    ],
    "Feiticeiro": [
      { titulo: "Banido", d: "Você foi expulso de seu plano original e forçado a viver como mortal." },
      { titulo: "Experimento", d: "Você foi vítima de experimentos contra sua vontade ou não." },
      { titulo: "Infundido", d: "Você foi exposto à essência de um plano elementar." },
      { titulo: "Ferida Mágica", d: "Você ganhou os poderes de um animal mágico que lhe feriu." },
      { titulo: "Presenteado", d: "Você pediu poderes para uma entidade que lhe devia um favor." },
      { titulo: "Herdeiro Arcano", d: "Você tem a magia em seu sangue derivado de seus ancestrais." }
    ],
    "Guerreiro": [
      { titulo: "Trabalhador", d: "Você labutou em campos ou edificações com trabalho árduo." },
      { titulo: "Desertor", d: "Você fugiu do serviço, carregando cicatrizes e habilidades." },
      { titulo: "Vigia", d: "Você protegia vilas, sempre alerta contra ameaças e desordens." },
      { titulo: "Soldado", d: "Você serviu em fileiras, treinado para lutar e obedecer." },
      { titulo: "Líder de Milícia", d: "Você liderou a milícia de sua vila contra invasores." },
      { titulo: "Mercenário", d: "Você lutava por ouro, servindo quem pagasse mais." }
    ],
    "Mago": [
      { titulo: "Aluno Expulso", d: "Você foi expulso de uma academia por usar magia proibida." },
      { titulo: "Bibliotecário", d: "Você escondia seus livros de magia arcana entre os comuns." },
      { titulo: "Escriba", d: "Você copiava pergaminhos e se deparou com a magia oculta." },
      { titulo: "Aprendiz de Mago", d: "Você aprendeu magia arcana com um sábio mentor." },
      { titulo: "Comerciante Arcano", d: "Você lidava com artefatos mágicos frequentemente." },
      { titulo: "Conselheiro", d: "Você aconselhava um nobre em segredos arcanos por bom ouro." }
    ],
    "Malandro": [
      { titulo: "Pivete", d: "Você cresceu roubando bolsos e fugindo nas vielas da cidade." },
      { titulo: "Ladrão de Túmulos", d: "Você aprendeu a saquear coisas de valor dos mortos." },
      { titulo: "Arrombador", d: "Você abria fechaduras e invadia casas sob o véu da noite." },
      { titulo: "Charlatão", d: "Você enganava com charme e promessas em mercados lotados." },
      { titulo: "Contrabandista", d: "Você traficava bens ilícitos, sempre um passo à frente da lei." },
      { titulo: "Falsário", d: "Você forjava documentos para clientes ricos e discretos." }
    ],
    "Pactário": [
      { titulo: "Arauto da Dissolução", d: "Você pregava o fim e convoca vigílias sombrias" },
      { titulo: "Guardião da Marca", d: "Você vigiou sinais de Calmira em santuários ocultos" },
      { titulo: "Cobrador de Promessas", d: "Você exigia juramentos e cobrava dívidas velhas" },
      { titulo: "Vigia do Limiar", d: "Você rondava portões e ouvia presságios no vento" },
      { titulo: "Juiz de Juramentos", d: "Você testemunhou pactos e marcava os signatários" },
      { titulo: "Buscador do Oculto", d: "Você recolhia lendas, confissões e boatos" }
    ],
    "Paladino": [
      { titulo: "Excomungado", d: "Você transgrediu as doutrinas de sua ordem e foi expulso." },
      { titulo: "Peregrino", d: "Você peregrinava por fé, buscando redenção e justiça." },
      { titulo: "Guarda de Capela", d: "Você protegia um templo pequeno, jurado à sua divindade." },
      { titulo: "Capelão", d: "Você era o responsável pelo bem-estar espiritual e moral dos soldados." },
      { titulo: "Templário", d: "Você servia uma ordem sagrada, com treino e recursos." },
      { titulo: "Escolhido", d: "Você acredita por um sinal divino para liderar com justiça." }
    ],
    "Patrulheiro": [
      { titulo: "Lenhador", d: "Você sobrevivia coletando madeira na floresta selvagem." },
      { titulo: "Rastreador", d: "Você seguia trilhas de animais e intrusos na mata densa." },
      { titulo: "Caçador", d: "Você caçava sozinho, vivendo da terra com habilidade." },
      { titulo: "Guia de Floresta", d: "Você guiava viajantes por trilhas perigosas na floresta." },
      { titulo: "Mercante de Peles", d: "Você caçava e vendia peles valiosas em mercados distantes." },
      { titulo: "Protetor do Ermo", d: "Você defendia terras de um nobre contra ameaças externas." }
    ],
    "Sacerdote": [
      { titulo: "Pregador de Rua", d: "Você pregava a fé nas ruas, vivendo de doações humildes." },
      { titulo: "Curandeiro", d: "Você tratava dos enfermos de sua vila, vivendo humildemente." },
      { titulo: "Missionário", d: "Você levava a palavra divina a terras distantes e selvagens." },
      { titulo: "Escriba Sagrado", d: "Você copiava textos sagrados, protegido por seu templo." },
      { titulo: "Líder Religioso", d: "Você servia em um templo, cuidando de altares e pessoas." },
      { titulo: "Guardião de Relíquias", d: "Você protegia relíquias sagradas com devoção." }
    ]
  };

  function randIndex(max) { return Math.floor(Math.random() * max); }

	// ====== UI da etapa Origem ======
	function attachOriginStep(state, onDone) {
	  const section = document.getElementById("stepOrigin");
	  const area = document.getElementById("originArea");
	  if (!section || !area) return;

	  area.innerHTML = "";
	  section.style.display = "";

	  const custom = (window.CUSTOM_ORIGENS && window.CUSTOM_ORIGENS[state.cls]) || [];
	  const lista = (custom && custom.length) ? custom : (ORIGENS_POR_CLASSE[state.cls] || []);

	  const select = document.createElement("select");
	  select.id = "originSelect";
	  select.setAttribute("aria-label", "Escolher origem");

	  const opt0 = document.createElement("option");
	  opt0.value = "";
	  opt0.textContent = "Selecionar...";
	  select.appendChild(opt0);

	  lista.forEach((o, i) => {
		const op = document.createElement("option");
		op.value = String(i);
		op.textContent = o.titulo;
		select.appendChild(op);
	  });

	  const btnRand = document.createElement("button");
	  btnRand.className = "ghost";
	  btnRand.textContent = "Aleatório";

	  const btnConfirm = document.createElement("button");
	  btnConfirm.textContent = "Continuar";
	  btnConfirm.disabled = true;

	  const descBox = document.createElement("div");
	  descBox.className = "final";
	  descBox.style.display = "none";
	  const emptyDescHTML = "<em class='muted'>Selecione uma origem para ver a descrição.</em>";

	  function setEmpty() {
		state.origem = null;
		descBox.style.display = "none";
		descBox.innerHTML = emptyDescHTML;
		btnConfirm.disabled = true;
		select.value = "";
	  }

	  function aplicarSelecao(idx) {
		// Placeholder / inválido → limpa tudo e desabilita
		if (idx === "" || idx == null || Number.isNaN(Number(idx))) {
		  setEmpty();
		  return;
		}
		const o = lista[Number(idx)];
		if (!o) {
		  setEmpty();
		  return;
		}
		// Seleção válida
		state.origem = { titulo: o.titulo, descricao: o.d };
		descBox.style.display = "";
		descBox.innerHTML = `<strong>${o.titulo}</strong><br>${o.d}`;
		btnConfirm.disabled = false;
		select.value = String(idx);
	  }

	  // handlers
	  select.addEventListener("change", () => {
		// se voltar ao placeholder, desabilita
		if (select.selectedIndex === 0) {
		  setEmpty();
		} else {
		  aplicarSelecao(select.value);
		}
	  });

	  btnRand.addEventListener("click", () => {
		if (lista.length === 0) return;
		const idx = Math.floor(Math.random() * lista.length); // 0..n-1
		aplicarSelecao(idx);
	  });

    btnConfirm.addEventListener("click", () => {
    if (!state.origem) return;
    // TRAVA PERMANENTEMENTE após Continuar
    select.disabled = true;
    btnRand.disabled = true;
    btnConfirm.disabled = true;
    // Feedback visual
    try { window.app && window.app.showCheck && window.app.showCheck(btnConfirm); } catch {}

    if (typeof onDone === "function") onDone();
  });

	  // layout
	  const row = document.createElement("div");
	  row.className = "row";
	  row.appendChild(select);
	  row.appendChild(btnRand);
	  row.appendChild(btnConfirm);

	  area.appendChild(row);
	  area.appendChild(descBox);
	  area.appendChild((()=>{ const d=document.createElement("div"); d.className="hint"; d.textContent="A origem é narrativa e ajuda a descrever passado e conhecimentos."; return d; })());

	  // inicia no placeholder, com botão desabilitado
	  setEmpty();

	  section.scrollIntoView({ behavior: "smooth", block: "start" });
	}


  window.ORIGENS_POR_CLASSE = ORIGENS_POR_CLASSE;
  window.getOriginsForClass = name => (window.CUSTOM_ORIGENS?.[name] || ORIGENS_POR_CLASSE[name] || []).map(item => ({ ...item }));
  window.attachOriginStep = attachOriginStep;
})();

