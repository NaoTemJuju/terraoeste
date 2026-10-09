# TerraOeste

Gerador de personagens de Shadowdark em português, com exportação de JSON para o importador Shadowdarkling do Foundry VTT. Inclui um módulo de compatibilidade para preservar escolhas de talentos e lidar com itens traduzidos pelo Babele.

## Comece por aqui

- [Contrato entre o site, o JSON e o Foundry](docs/foundry-integration.md): identificadores, efeitos, escolhas e tabelas.
- [Diagnóstico e soluções dos problemas conhecidos](docs/troubleshooting.md): causas confirmadas, investigação e limitações atuais.
- [Roteiro de prevenção e regressão](docs/regression-checklist.md): verificações antes de publicar uma correção.
- [Instalação e atualização do módulo](foundry-module/terraoeste-foundry-choice-guard/README.md).
- [Módulo de conteúdo: classes, talentos, habilidades e tabelas editáveis](foundry-module/terraoeste-class-content/README.md).
- [Instruções para agentes e colaboradores](AGENTS.md).

Esses documentos registram o módulo de escolhas **0.8.8** e, em 9 de outubro de 2026, o módulo de conteúdo **0.1.0**, preparado contra o código local do Shadowdark 4.0.6. O novo conteúdo ainda requer validação na interface real. Ao atualizar o Shadowdark ou o Babele, confira novamente os caminhos de efeitos, os UUIDs e as APIs descritas.

## O que o projeto faz

O site reúne a criação do personagem em etapas: atributos, ancestralidade, classe e talentos, pontos de vida, moedas, equipamento e identificação. `final.js` monta a ficha e o JSON para importação. Também existem páginas de administração e funções de API para conteúdo e personagens compartilhados.

O módulo `terraoeste-foundry-choice-guard` adapta a importação e os seletores de escolhas do Shadowdark. Ele usa cópias dos itens originais do compêndio para manter seus efeitos. A versão 0.8.8 também aceita os identificadores antigos do Assassino.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `index.html`, `style.css` | Fluxo de criação e apresentação |
| `base.js` | Estado compartilhado, utilitários e carregamento/conversão de dados |
| `class.js` | Classes, descrições, tabelas de talentos, escolhas, aliases e bônus de classe |
| `final.js` | Ficha final e exportação/reconstrução do JSON |
| `race.js`, `mastery.js`, `origens.js`, `deities.js`, `languages.js` | Ancestralidades e dados associados |
| `attributes.js`, `vida.js`, `ouro.js`, `shop.js` | Atributos, PV, moedas e equipamento |
| `gm.html`, `gm.js`, `gm-content.js` | Administração de conteúdo |
| `functions/api/` | Cloudflare Pages Functions |
| `config/availability.json` | Configuração de disponibilidade |
| `foundry-module/terraoeste-foundry-choice-guard/` | Módulo de compatibilidade do Foundry |
| `foundry-module/terraoeste-class-content/` | Conteúdo nativo próprio, registro de importação e build de compêndios |
| `docs/` | Contratos, histórico de incidentes e verificações |

**As tabelas do site estão dentro de `class.js`.** As RollTables e os itens usados no Foundry pertencem aos compêndios instalados no Foundry. Um ZIP de RollTables exportado pelo usuário serve como referência; ele não contém necessariamente todos os documentos de Talent ou seus efeitos.

## Desenvolvimento local

O frontend usa HTML, CSS e JavaScript sem etapa de compilação. Preserve a ordem dos scripts em `index.html`: os módulos dependem de dados globais e de `window.app` preparados pelos scripts anteriores.

Para visualizar a parte estática, use um servidor HTTP local. Se Python estiver instalado:

```powershell
python -m http.server 8080
```

Abra `http://localhost:8080`. Esse servidor serve os arquivos estáticos; as rotas de `functions/api/` precisam de um ambiente Cloudflare Pages Functions. Não há configuração de Wrangler ou gerenciador de pacotes versionada que permita presumir um comando único de desenvolvimento das APIs.

Para conferir a sintaxe de arquivos JavaScript com Node instalado:

```powershell
node --check class.js
node --check final.js
node --check foundry-module/terraoeste-foundry-choice-guard/main.mjs
```

Essa verificação detecta erros de sintaxe. Ela não confirma funcionamento da interface, existência de compêndios ou aplicação dos efeitos no Foundry.

## Cloudflare Pages

O repositório contém as funções em `functions/api/`. A configuração de implantação é externa ao repositório. Antes de mudar a publicação, confira as configurações reais do projeto no Cloudflare.

As funções existentes usam:

- Binding KV **`AVAIL`**, compartilhado pelas APIs de disponibilidade, classes, equipamento, conteúdo e personagens.
- Segredo **`GM_CODE`**, usado na autenticação das operações administrativas.
- Cabeçalho **`X-GM-Code`**, enviado pelas operações administrativas.

Configure esses valores no ambiente correspondente. Não coloque o valor de `GM_CODE`, tokens ou credenciais em arquivos, exemplos, logs ou documentação.

## Exportar e importar personagens

1. Gere o personagem e conclua todas as escolhas de classe e talentos.
2. Exporte o JSON da ficha final.
3. No mundo Shadowdark do Foundry, habilite o módulo TerraOeste.
4. Abra o importador Shadowdarkling e cole o JSON.
5. Confira os itens não encontrados, conclua a importação e confira os efeitos da ficha criada.

Um talento ser exibido com o nome correto não prova que seu efeito foi aplicado. Confira a chave do efeito, a opção selecionada e uma rolagem da arma, magia ou remédio correspondente.

## Exemplos para diagnóstico

- [Assassino com Testes de Moral com CD 18](docs/examples/assassino-moral18.json): usa a chave oficial `Morale18`.
- [O mesmo personagem no formato antigo](docs/examples/assassino-moral18-legacy.json): usa `AssassinLotusMoral` para verificar a compatibilidade do módulo.

Os exemplos deixam histórico e divindade vazios para concentrar a investigação no talento. O importador pode tratar campos vazios como itens ausentes; confira o comportamento da versão instalada. Um histórico personalizado precisa de correspondência própria no Foundry.

## Correções registradas

- [PR #2](https://github.com/NaoTemJuju/terraoeste/pull/2): implementação do Assassino e da Lótus Negra no site.
- [PR #3](https://github.com/NaoTemJuju/terraoeste/pull/3): nomes dos talentos, identificadores oficiais do Assassino, compatibilidade com JSONs antigos e correção do índice da tabela d12.
- [Merge do PR #3](https://github.com/NaoTemJuju/terraoeste/commit/6216f3137793ea75c28a11e740463ecd9310b610).

A instalação local do módulo e a publicação do site são processos separados. Fazer um merge no GitHub não atualiza automaticamente os arquivos em `Data/modules` do Foundry.
