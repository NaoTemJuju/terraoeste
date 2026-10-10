# TerraOeste: Classes e Talentos

Módulo independente de conteúdo para Shadowdark 4.0.6 e Foundry 13+. Usa a organização de compêndios do [Unnatural Selection](https://foundryvtt.com/packages/unnatural-selection) como referência. Não exige esse módulo nem copia suas classes. As regras do Bárbaro foram fornecidas pelo usuário.

## Conteúdo inicial

Seis compêndios nativos: **Classes**, **Talentos**, **Habilidades**, **Tabelas**, **Equipamento** e **Antecedentes**. O conjunto inclui Bárbaro, Caçador e Cavaleiro; suas habilidades, talentos e tabelas; Machado de Batalha, Água Benta, Estaca, Mangual e Lança Longa editáveis; e 102 antecedentes editáveis agrupados por classe nos metadados do módulo.

O módulo não cria classes a partir de texto arbitrário do personagem. Novas classes entram por documentos revisáveis e um registro explícito de identificadores; isso evita efeitos inventados e talentos silenciosamente ausentes.

| Regra | Implementação |
| --- | --- |
| PV d8; armas e armadura | Documento Class com referências ao equipamento do Shadowdark |
| Antecedentes de TerraOeste | Documentos `Background` no compêndio TerraOeste — Antecedentes, resolvidos por nome exato no JSON |
| Crítico corpo a corpo ampliado | ADD -1 em `system.roll.melee.critical-success` por aquisição; 19, depois 18 etc. |
| +1 dano / ataque corpo a corpo | Efeitos nativos em `system.roll.melee.damage.all` / `system.roll.melee.bonus.all` |
| +2 FOR / CON | Efeitos nativos nos atributos base, sem somar novamente ao JSON |
| Fúria | Habilidade nativa com 1/1 uso, sem teste na ativação |
| Uso adicional de Fúria | Ajusta máximo e usos disponíveis; respeita usos já gastos e o máximo base editado pelo mestre |
| Vantagem da Fúria / Instinto Primitivo | Efeitos **situacionais**: selecionar na janela de rolagem quando a condição se aplicar |
| Demais termos da Fúria / Devastar | Descrição completa; aplicação manual pelo mestre |

O efeito de Fúria **não** liga vantagem permanente nem encerra sozinho após 3 rodadas. Não automatiza imunidades, dano recebido, testes de moral ou perda/recuperação de Constituição.

O mapa instalado não possui Machado de Batalha. A pedido do usuário, o módulo inclui uma versão provisória **1d12**, já vinculada à classe. Carga 1, uma mão, alcance próximo, preço não definido (0) e ausência de propriedades adicionais são valores provisórios editáveis; não representam regras oficiais confirmadas.

O mapa verificado também não possui Água Benta nem Estaca. O módulo inclui ambos no compêndio de equipamento como itens básicos editáveis, sem inventar dano, preço ou propriedades; ajuste esses campos conforme as regras da mesa. O Caçador é um documento de classe completo, com três habilidades editáveis, talentos registrados, tabela 2d6 e tabela d10 de Presas. `system.talents` fica vazio, pois a classe não concede essas opções como talentos fixos; os dez talentos de Presa ficam em `system.talentChoices` para a escolha inicial, e só a presa escolhida é adquirida. Nas subidas de nível, os resultados de escolha da tabela 2d6 agora incluem referências nativas clicáveis aos documentos disponíveis; o jogador ainda deve arrastar apenas a opção escolhida para o campo **Talentos**.

O Cavaleiro tem documento de classe completo, PV d8, referências às armaduras/escudos e armas do mapa Shadowdark, habilidades Égide, Fardo Leve e Montarias, uma tabela 2d6 com escolhas vinculadas e o talento próprio Ataque Crítico (1/dia). Os resultados 2 repetidos concedem usos adicionais; o controle de usos e o crítico são manuais. Os bônus de ataque corpo a corpo/à distância e de atributos usam talentos reais do módulo. A escolha de armadura usa o talento nativo do Shadowdark e inclui couro, cota de malha, placas e variantes de mithral. A etapa antiga de Maestria do site não é usada pelo Cavaleiro.

O mapa instalado não possui Mangual nem Lança Longa. Para completar a lista de equipamento do Cavaleiro, o módulo inclui ambos como armas editáveis provisórias sem dano, propriedades, preço ou carga presumidos. Preencha esses campos no compêndio antes de usar esses itens. Égide, Fardo Leve e Montarias preservam a regra completa nas descrições; efeitos temporários, carga e progressão da montaria são aplicados manualmente.

## Instalar

1. Feche o servidor Foundry antes de copiar compêndios.
2. Extraia o ZIP mantendo a pasta `terraoeste-class-content` em `Data/modules`.
3. Abra o Foundry e ative **TerraOeste: Classes e Talentos** em Gerenciar Módulos.
4. Recarregue o cliente. Se usar filtros de fontes do sistema, inclua **TerraOeste**.

O módulo de escolhas `terraoeste-foundry-choice-guard` pode continuar ativo. Ambos compõem os métodos do importador, preservando o comportamento anterior. Esta compatibilidade foi revisada no código; precisa de confirmação na interface real.

Ainda não existe URL de download automático publicada. O manifesto da pasta de fontes não instala sozinho: é necessário gerar/obter o ZIP com os bancos compilados.

O ZIP compilado da versão atual fica em `release/terraoeste-class-content-0.3.3.zip`. Após modificar fontes, reconstrua-o antes de publicar uma nova versão. O manifesto não depende da presença de Node/npm no PC do jogador.

## Editar no Foundry

No compêndio, use o menu de contexto para desbloqueá-lo, abra o item e edite descrição, efeitos ou referências da classe. Faça backup antes de atualizar o módulo: uma atualização pode substituir compêndios do pacote.

Para guardar as alterações como JSON, execute no console do Foundry, como mestre:

```js
await game.modules.get("terraoeste-class-content").api.exportSources();
```

O download contém todos os documentos completos. No repositório, importe esse arquivo e reconstrua o módulo:

```powershell
cd foundry-module/terraoeste-class-content
npm ci
npm run import-sources -- "C:/caminho/terraoeste-content-sources.json"
npm run build
```

O importador de fontes verifica IDs e faz backup de `src` em `dist`. Novos documentos sem registro ainda exigem adicionar o JSON e as referências manualmente.

Alternativa para personalização local duradoura: copie os itens para um compêndio do mundo. Preserve `flags.terraoeste-class-content.contentId`; na cópia da classe, ajuste os UUIDs dos talentos, habilidade e tabela para as cópias. Ajuste também os resultados da tabela. Registre os UUIDs das cópias no console:

```js
await game.modules.get("terraoeste-class-content").api.setDocumentOverrides({
  "Compendium.terraoeste-class-content.classes.Item.TO00000000000001":
    "Compendium.world.minhas-classes.Item.ID_DA_COPIA"
});
```

O objeto define o mapa completo de substituições. Inclua também talentos personalizados importados via bônus. As substituições afetam a importação; documentos já presentes nas fichas e tabelas só mudam se forem editados explicitamente.

## Adicionar uma classe

1. Adicione JSONs completos na pasta do compêndio apropriado dentro de `src` (incluindo `src/backgrounds` para antecedentes).
2. Preserve IDs de 16 caracteres alfanuméricos e `contentId` estáveis. Nunca reutilize um ID para outra regra.
3. Classe: ligue talentos fixos, habilidades, equipamento e `classTalentTable` por UUID. Para descoberta nativa, use o prefixo **Class Talents:** no nome da tabela.
4. Talentos: use as chaves de efeito consumidas pela versão instalada. Talentos com escolhas exigem implementação explícita; não deixe `REPLACEME` em um item adquirido.
5. Registre aliases de classe e chaves de bônus em `registry.json`. Novas chaves devem usar o prefixo `TerraOeste.`.
6. Atualize a tabela e exportação do site em `class.js`. A chave do bônus deve resolver um documento real.
7. Compile; siga o roteiro de regressão em `docs/regression-checklist.md`.

O registro inicial aceita aliases antigos `BarbarianCriticalRange` e `BarbarianExtraFuryUse`. JSONs anteriores que tinham esses talentos apenas em `terraOesteClassTalents` são convertidos em bônus em uma cópia do payload. Ocorrências repetidas são preservadas; bônus já presentes não são duplicados.

Os bônus comuns de ataque, dano e atributos do Bárbaro também resolvem os itens deste módulo por `classBonuses`, para que suas edições sejam usadas na importação. Há modelos +1 e +2 para todos os atributos, cobrindo pontos separados ou concentrados do resultado 12. O registro do Caçador associa cada tipo de presa e treinamento a documentos reais do compêndio. A presa inicial concede o idioma correspondente, quando houver; Constructos e Golens e Mortos-Vivos não concedem idioma adicional.

## Compilar e empacotar

Na pasta deste módulo:

```powershell
npm ci
npm run build
Compress-Archive -LiteralPath "./dist/terraoeste-class-content" -DestinationPath "./release/terraoeste-class-content-0.3.3.zip" -Force
```

O build valida IDs, referências internas e registro, rejeita placeholders, gera LevelDB somente nesta pasta e prepara `dist/terraoeste-class-content`. Não acessa bancos do Foundry. `src` e `registry.json` são as fontes versionadas; `packs` e `dist` são artefatos gerados.

## Evidência e limites

Esquemas, importador e consumidores de efeitos foram lidos na instalação Shadowdark **4.0.6**. O formato moderno de TableResult foi conferido na API Foundry **13.350**. A estrutura de bancos segue o padrão documentado pelo código de empacotamento da referência. Compilação/sintaxe não confirmam rolagens nem interface: validar importação, Babele, avanços, críticos repetidos, contador de Fúria, descanso e escolhas 7–9/12 em um mundo de teste antes de uso regular.
