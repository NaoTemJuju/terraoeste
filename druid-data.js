window.TERRAOESTE_DRUID_DATA = {
  "spells": [
    {
      "value": "Breath",
      "label": "Fôlego",
      "tier": 1,
      "duration": "10 rodadas",
      "durationType": "rounds",
      "durationValue": "10",
      "range": "Você",
      "rangeKey": "self",
      "description": "Você pode prender a respiração pela duração da magia."
    },
    {
      "value": "Instill",
      "label": "Imbuir",
      "tier": 1,
      "duration": "5 rodadas",
      "durationType": "rounds",
      "durationValue": "5",
      "range": "Você",
      "rangeKey": "self",
      "description": "Uma arma que você empunha é imbuída de força vital e se torna uma arma +1 pela duração da magia. Se a arma for um cajado, ela causa d6 de dano em vez de d4."
    },
    {
      "value": "Oxidize",
      "label": "Oxidar",
      "tier": 1,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Um objeto inanimado que você toca, do tamanho de uma porta ou menor, envelhece d100 anos."
    },
    {
      "value": "Whisperwind",
      "label": "Vento Sussurrante",
      "tier": 1,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Longe",
      "rangeKey": "far",
      "description": "Você envia uma breve mensagem sussurrada que alcança qualquer criatura dentro do alcance."
    },
    {
      "value": "Barkskin",
      "label": "Pele de Árvore",
      "tier": 2,
      "duration": "1 dia",
      "durationType": "days",
      "durationValue": "1",
      "range": "Você",
      "rangeKey": "self",
      "description": "Sua pele endurece como uma casca de árvore resistente. Sua CA se torna 15 (18 em um teste crítico de conjuração) pela duração da magia. Você sofre dano dobrado de fogo enquanto estiver sob seus efeitos."
    },
    {
      "value": "Befriend",
      "label": "Amizade",
      "tier": 2,
      "duration": "5 rodadas",
      "durationType": "rounds",
      "durationValue": "5",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Uma pequena criatura natural que você toca, como um camundongo ou uma mariposa, considera você um amigo pela duração da magia. Você pode dar um comando à criatura, que tenta cumpri-lo da melhor forma possível conforme sua capacidade e inteligência, mesmo depois que a magia termina. Se o comando causar dano direto à criatura, ela abandona a tarefa."
    },
    {
      "value": "Magnetize",
      "label": "Magnetizar",
      "tier": 2,
      "duration": "5 rodadas",
      "durationType": "rounds",
      "durationValue": "5",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Um objeto que você toca, de até o tamanho de um cavalo, fica fortemente magnetizado. Ele atrai todos os objetos magnéticos menores dentro de Perto. Se puder se mover, é puxado em direção a objetos magnéticos maiores dentro de Perto. Uma criatura de metal deve passar em um teste de FOR igual ao seu teste de conjuração para resistir."
    },
    {
      "value": "Truespeech",
      "label": "Fala Verdadeira",
      "tier": 2,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Uma criatura natural que você toca entende você e pode se comunicar com você na língua verdadeira de todos os animais. Você pode fazer uma pergunta de sim ou não; o mestre responde verdadeiramente sim ou não. Se conjurar esta magia mais de uma vez na mesma criatura em 24 horas, trate um teste de conjuração fracassado como falha crítica."
    },
    {
      "value": "Alchemy",
      "label": "Alquimia",
      "tier": 3,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Um objeto inanimado que você toca, do tamanho de um humano ou menor, se transforma em outro material de valor igual ou inferior."
    },
    {
      "value": "Anima",
      "label": "Ânima",
      "tier": 3,
      "duration": "Foco",
      "durationType": "focus",
      "durationValue": "",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Você anima a força vital de um objeto natural que toca, do tamanho de um cavalo ou menor. O objeto se torna uma criatura leal pela duração da magia, com nível igual ao seu. Ela age no seu turno. Você pode usar sua ação para comandá-la, e ela obedece; caso contrário, não age. CA 10 + NV, PV 4,5 × NV, ATQ 2 pancadas +7 (1d12), MOV perto, FOR +4, DES +0, CON +0, INT −4, SAB +0, CAR +0, AL N, NV igual ao seu."
    },
    {
      "value": "Locusts",
      "label": "Gafanhotos",
      "tier": 3,
      "duration": "Foco",
      "durationType": "focus",
      "durationValue": "",
      "range": "Perto",
      "rangeKey": "near",
      "description": "Uma nuvem desorientadora de gafanhotos furiosos e mordedores preenche uma área ao seu redor até Perto. A nuvem acompanha seus movimentos; você não é afetado por ela. Criaturas na área sofrem 1d10 de dano por rodada no início de seus turnos. Elas devem passar em um teste de CON igual ao seu último teste de conjuração ou não poderão se mover naquele turno."
    },
    {
      "value": "Treeshape",
      "label": "Forma de Árvore",
      "tier": 3,
      "duration": "10 rodadas",
      "durationType": "rounds",
      "durationValue": "10",
      "range": "Você",
      "rangeKey": "self",
      "description": "Você e seu equipamento se transformam em um ente pela duração da magia, sem o talento Animar Árvore. Não pode conjurar enquanto transformado. Mantém INT, SAB e CAR. Se chegar a 0 PV nesta forma, retorna à forma verdadeira com 0 PV. CA 14, PV 38, ATQ 2 pancadas +8 (1d12) ou 1 rocha (longe) +8 (2d6), MOV perto, FOR +4, DES −1, CON +2, INT/SAB/CAR seus, AL N, NV 8."
    },
    {
      "value": "Mycelium",
      "label": "Micélio",
      "tier": 4,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Você",
      "rangeKey": "self",
      "description": "Você conecta sua mente à vasta rede de fungos da terra. Faça ao mestre uma pergunta de até 15 palavras; ele responde verdadeiramente usando até 15 palavras. Se conjurar esta magia mais de uma vez em 24 horas, trate um teste de conjuração fracassado como falha crítica."
    },
    {
      "value": "Summon Storm",
      "label": "Invocar Tempestade",
      "tier": 4,
      "duration": "10 rodadas",
      "durationType": "rounds",
      "durationValue": "10",
      "range": "1 milha",
      "rangeKey": "oneMile",
      "description": "Você invoca uma tempestade violenta que afeta uma área de até uma milha ao seu redor pela duração da magia. Ela traz céus escurecidos, ventos severos e chuva intensa. Enquanto a magia durar, você pode conjurar Controlar Água (Shadowdark RPG, pág. 57) e Relâmpago (pág. 64), mesmo que não conheça essas magias."
    },
    {
      "value": "Earthquake",
      "label": "Terremoto",
      "tier": 5,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Dobro de Perto",
      "rangeKey": "doubleNear",
      "description": "A terra treme violentamente e se abre, engolindo criaturas para sua perdição. Todas as criaturas sobre o chão dentro do dobro de Perto de você sofrem 4d6 de dano. Cada criatura afetada de NV 9 ou inferior deve passar em um teste de DES igual ao dano que sofreu ou será engolida pela terra, para nunca mais ser vista."
    },
    {
      "value": "Naming",
      "label": "Nomear",
      "tier": 5,
      "duration": "Instantâneo",
      "durationType": "instant",
      "durationValue": "",
      "range": "Adjacente",
      "rangeKey": "close",
      "description": "Você aprende o Nome Verdadeiro de uma criatura que toca (Shadowdark RPG, pág. 319). Se ela consentir, você pode lhe dar um novo Nome Verdadeiro. Uma criatura só pode mudar seu Nome Verdadeiro uma vez na vida. Se o fizer, seu alinhamento muda para o seu."
    }
  ],
  "mishaps": [
    {
      "tiers": [
        1,
        2
      ],
      "label": "Desastre Selvagem — graus 1–2",
      "rows": [
        "Fúria da Natureza! Role duas vezes e combine os efeitos; role novamente quaisquer outros resultados 1.",
        "Enredado! Vinhas brotam do chão e prendem você por 1d8 rodadas. Teste de FOR CD 12 para se libertar.",
        "Transformação Selvagem! Você se transforma parcialmente em um animal por 1 hora, recebendo desvantagem em testes de CAR.",
        "Crescimento Indomável! Uma planta aleatória cresce explosivamente, bloqueando o movimento em uma área Perto por 10 rodadas.",
        "Silêncio da Natureza! Você não pode conjurar esta magia novamente por uma semana.",
        "Oferenda à Natureza! Uma peça aleatória do seu equipamento se transforma em flores e desaparece para sempre.",
        "Instinto Primitivo! Você age como se estivesse sob Confusão por 1d4 rodadas. Teste de SAB CD 12 para resistir a cada rodada.",
        "Mente Feral! Você esquece uma magia aleatória até completar um descanso.",
        "Explosão de Espinhos! Espinheiros afiados irrompem da sua pele, causando 1d6 de dano perfurante em você e nas criaturas ao alcance do braço.",
        "Chamado da Natureza! Você uiva incontrolavelmente por 3 rodadas em Druídico e na fala dos animais, alertando todas as criaturas próximas.",
        "Brilho da Natureza! Você emite uma aura verde bioluminescente por 10 rodadas, concedendo vantagem aos ataques dos inimigos contra você.",
        "Espíritos Inconstantes! Você tem desvantagem ao conjurar magias do mesmo grau por 10 rodadas."
      ]
    },
    {
      "tiers": [
        3,
        4
      ],
      "label": "Desastre Selvagem — graus 3–4",
      "rows": [
        "Fúria da Natureza! Role duas vezes e combine os efeitos; role novamente quaisquer outros resultados 1.",
        "Surto Selvagem! Você e todas as criaturas Perto sofrem 2d6 de dano de uma violenta explosão de energia natural.",
        "Espíritos Gêmeos! Você conjura acidentalmente duas cópias idênticas da magia: uma em você e outra em um aliado próximo aleatório.",
        "Crescimento Caótico! Você canaliza a magia incorretamente e uma magia aleatória da sua lista conhecida é conjurada no lugar dela, mesmo que isso normalmente não fosse possível.",
        "Sacrifício à Natureza! Duas peças aleatórias do seu equipamento viram pó e são reclamadas pela natureza.",
        "Distorção Primitiva! Faça um teste de CON CD 12. Se falhar, um atributo aleatório cai para 3 (−4) até completar um descanso.",
        "Fome da Terra! Uma cratera de 9 m (30 pés) se abre sob você. Todas as criaturas Perto devem passar em um teste de DES CD 15 ou cair nela.",
        "Carne Enraizada! 1d4 dos seus membros viram madeira retorcida e ficam inutilizáveis por 24 horas.",
        "Desconexão da Natureza! Você perde a capacidade de conjurar todas as magias do mesmo grau até completar um descanso.",
        "Visões do Abismo Verdejante! Faça um teste de SAB CD 12. Se falhar, delira enlouquecidamente por 1d10 rodadas.",
        "Julgamento da Natureza! Você irradia uma energia primitiva esmagadora, atraindo a hostilidade de todas as criaturas que podem ver você por 1d4 rodadas.",
        "Magia Selvagem Instável! Você tem desvantagem ao conjurar magias desse grau e inferiores pelos próximos 10 turnos."
      ]
    },
    {
      "tiers": [
        5
      ],
      "label": "Desastre Selvagem — grau 5",
      "rows": [
        "Fúria da Natureza! Role duas vezes e combine os efeitos; role novamente quaisquer outros resultados 1.",
        "Reação Primitiva! Você e todas as criaturas Perto sofrem 3d8 de dano quando a fúria da natureza explode violentamente.",
        "Memória da Natureza! Um surto de energia ancestral apaga permanentemente uma magia aleatória que você conhece.",
        "Espírito da Caçada Selvagem! Você invoca acidentalmente um espírito de fera hostil em um espaço Perto. Ele permanece por 2d4 rodadas antes de desaparecer.",
        "Aura de Espinhos! Um campo violento de espinheiros envolve você. Ataques contra você causam dano dobrado pelas próximas 2d6 rodadas.",
        "Rasgo no Véu! Um portal se abre para um reino primitivo aleatório. Algo terrível sairá em 1d4 rodadas, a menos que você o feche com um teste de SAB CD 18.",
        "Surto Selvagem Caótico! Sua magia atinge uma criatura aleatória que você vê, mesmo que normalmente isso não fosse possível. A cada turno, passe em um teste de conjuração ou conjure a magia novamente em outra criatura aleatória; termina com um sucesso.",
        "Espírito Cortado! Você perde a capacidade de conjurar todas as magias de um grau aleatório até completar um descanso.",
        "Visões do Abismo Verdejante! Faça um teste de SAB CD 15. Se falhar, delira enlouquecidamente por 1d4 horas.",
        "Preço da Natureza! Você deve sacrificar permanentemente um item mágico ou perder a capacidade de conjurar uma magia conhecida de grau 3 ou superior.",
        "Essência Instável! Você tem desvantagem em todos os testes de conjuração pelas próximas 10 rodadas.",
        "Ruptura! Você rasga uma enorme fissura na realidade Perto. Ela cresce a cada rodada enquanto energia primitiva escapa por ela."
      ]
    }
  ]
};
