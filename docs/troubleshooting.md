# Diagnóstico e histórico das correções

Este documento orienta investigação e registra o que foi confirmado durante os incidentes. Ele deve ser atualizado a cada nova correção. Consulte também o [contrato de integração](foundry-integration.md) e o [roteiro de regressão](regression-checklist.md).

## Escolha o ponto de investigação pelo sintoma

| Sintoma | Primeiro lugar a conferir |
| --- | --- |
| Talento aparece em “Itens não encontrados” | `bonuses`, chaves de `itemMapping.bonus` e resolução do UUID |
| Talento importado continua com `REPLACEME` | Seleção exportada, chave/valor dos efeitos e adaptador do módulo |
| Inglês abre o seletor; português não | Nome do efeito, nome original Babele e normalização do seletor |
| Tabelas de classe não aparecem | Descoberta das RollTables, nomes traduzidos e associação da classe |
| Classe não pode ser selecionada no site | Primeiro erro do console, carregamento de scripts e dependências globais |
| Talento existe, mas não muda a rolagem | Efeito ativo/transferido, chave consumida e slug do item realmente rolado |
| Histórico/divindade não encontrados | Correspondência própria do tipo de item; não reutilizar o diagnóstico de talentos |
| Código atualizado no GitHub e comportamento antigo no Foundry | Arquivos e versão instalados, módulo ativo e cliente recarregado |
| `helper_unknown_error: setup refresh had errors` | Mensagem interna do log de sandbox e erro do Windows |

## Talento não reconhecido

### Causa confirmada do Assassino

O importador não conhecia `AssassinLotusMoral`, usado como `bonusName`. O nome mostrado na lista de erros era “Lótus Negra: Presença Aterradora”. Trocar esse nome por “Testes de Moral com CD 18” manteve a falha porque a chave técnica continuava desconhecida.

O mapa instalado usa `Morale18`. O PR #3 passou a exportar a chave oficial e o módulo 0.8.8 passou a normalizar os identificadores antigos. A mesma correção cobre 13 identificadores do Assassino, listados no [contrato](foundry-integration.md#4-identificadores-oficiais-e-compatibilidade-do-assassino).

### Procedimento

1. Preserve o JSON que falhou e anote a versão do sistema, do módulo e o idioma.
2. Confira `bonusName` e `bonusTo` em **`bonuses`**, além dos registros visuais em `terraOesteClassTalents`.
3. Consulte as quatro formas de chave usadas por `_findTalent`.
4. Resolva o UUID encontrado. Se `fromUuid` não retornar documento, investigue compêndio instalado, versão e referência inválida.
5. Se o site inventou uma chave local, mapeie-a para a chave oficial. Preserve aliases para personagens já salvos.
6. Confira o documento importado, seu nível e seus efeitos.

Exemplo de inspeção no console do navegador do Foundry, após o mundo carregar:

```javascript
const mapping = await foundry.utils.fetchJsonWithTimeout(
  "systems/shadowdark/assets/mappings/map-shadowdarkling.json"
);
const uuid = mapping.bonus.Morale18;
const talent = uuid ? await fromUuid(uuid) : null;
console.log({ uuid, name: talent?.name, originalName: talent?.flags?.babele?.originalName });
console.log(talent?.toObject()?.effects);
```

Esse trecho faz leitura de dados. Se a API tiver mudado, confira o importador instalado antes de executar uma variante.

### Ataques do Patrulheiro

Os JSONs iniciais usavam textos traduzidos/ingleses como identificadores de bônus. A correção usa `Plus1ToHitAndDamage` com `bonusTo` igual a `Ranged attacks` ou `Melee attacks`. A presença do item no compêndio e de efeitos na aba Efeitos não substitui a necessidade de uma chave reconhecida pelo importador.

### Hipótese descartada

O talento moral tem fonte Cursed Scroll Vol. 2, Red Sands, enquanto o JSON indicava `activeSources: ["SD"]`. Isso motivou uma hipótese de filtragem de fontes. A leitura do importador mostrou que essa não era a causa: a resolução do talento depende do mapa de bônus. Não adicione nomes de fontes arbitrários ao JSON como tentativa de corrigir uma chave de bônus ausente.

## `REPLACEME` permanece no talento

### Causas confirmadas

- A seleção precisava ser exportada em `bonusTo` ou nas opções de classe.
- O importador original tratava placeholder em `value`, mas os efeitos envolvidos usavam placeholder em `key`.
- A tradução alterava o rótulo usado pelo sistema para escolher o diálogo apropriado.
- O alvo precisava usar o slug correspondente ao item traduzido realmente rolado.

### Procedimento

1. Determine se está olhando o **modelo de compêndio** ou a **cópia adquirida pelo personagem**. O modelo pode continuar parametrizado.
2. Confira se a regra pede arma, armadura, magia ou remédio.
3. Confira se o JSON contém a escolha e se o seletor natural também a pede.
4. Inspecione todos os efeitos e suas alterações, incluindo `effects` e variantes do formato quando presentes.
5. Resolva o parâmetro na cópia do item original e preserve os demais valores/modos.
6. Confira o nome e o slug do item que será rolado.
7. Teste a rolagem correspondente e uma rolagem que não deveria receber o efeito.

Para d12 de Arco Longo, a chave final observada no módulo é `system.roll.attack.upgrade-damage-die.arco-longo`. Para Maestria em Armas, confira tanto a alteração de ataque quanto a de dano, usando a categoria correta de arma.

### O que a solução cobre

- Maestria em Armas, incluindo remoção das cópias genéricas pertinentes e cópias específicas para as seleções.
- Maestria em Armaduras.
- Dado d12 do Patrulheiro.
- Vantagem em Conjuração para uma magia.
- Vantagem em Herbalismo para um remédio.

Não faça uma substituição global de qualquer ocorrência de `REPLACEME` sem identificar sua semântica. Cancelar um diálogo também precisa preservar um estado válido; confira esse comportamento na versão do sistema em uso.

## Babele: inglês funciona, português falha

### Seletor de arma no avanço de nível

Foi observado que “Increased Weapon Damage Die” abria a escolha de arma em inglês, mas “Dado de Dano de Arma Aumentado”/“Dado de Dano de Arma com D12” não a abriam na tradução. O módulo normaliza os nomes em `canonicalReplacementEffectName` antes de chamar o tratamento original do sistema.

Verifique tanto o nome do item quanto o nome de cada efeito. O item pode ter sido traduzido e o efeito ter mantido outro rótulo, ou o contrário.

### Tabelas de talentos de classe

A descoberta de tabelas também foi adaptada para aceitar “Talentos de Classe” e nomes originais. Não renomeie manualmente todas as RollTables para inglês como solução permanente. Confira `installLocalizedClassTalentTables` e a associação `classTalentTable` do documento da classe.

### Nomes e metadados

Prefira UUIDs e propriedades estáveis onde a API permitir. Quando a seleção depender de nomes, considere o nome atual e `flags.babele.originalName`. A ausência desse metadado é uma condição real que precisa de teste; não suponha que ele estará presente em todo item copiado ou personalizado.

## Herbalismo sem vantagem real

O talento específico estava presente, mas seu documento não tinha efeito que automatizasse a vantagem. A solução usa a mesma ideia de vantagem direcionada das magias, aplicada à habilidade de classe do remédio.

O módulo resolve o nome efetivo do remédio e adiciona `system.roll.ability.advantage.<slug>`. Para Curativa, deve conferir a habilidade **Curativa**, e não somente um texto de descrição “Curativo”.

## Antecedente não encontrado na importação

Antecedentes de campanha como **Matador de Rua** não fazem parte do compêndio padrão instalado. Trocar o rótulo ou o campo de fonte não cria um documento de tipo `Background`.

O módulo de conteúdo 0.2.0 inclui os 102 nomes e suas descrições do arquivo enviado pelo usuário em seu pack **TerraOeste — Antecedentes**. O registro do módulo resolve nomes exatos antes da busca normal do importador. Atualize/ative esse módulo e confirme que o pack está carregado. Um item pode ainda ser reportado como ausente se o JSON usar nome diferente do registrado; preserve acentos, espaços e pontuação do nome do antecedente.

As descrições são narrativas: não contêm bônus, perícias ou equipamentos que não foram especificados no documento. Foi corrigido o “ocê” evidente para “Você” em Saltimbanco da Mata e a separação perdida entre Patrulheiro e Peão na extração do documento. A lista não foi renderizada visualmente: o renderer de DOCX desta estação parou porque LibreOffice não está instalado.

Confira:

- Se o remédio escolhido chegou ao JSON em `bonusTo`.
- Se a habilidade de classe existe e está disponível.
- Se o item traduzido preserva o nome original Babele.
- Se o efeito está ativo, transferido e com valor/modo corretos.
- Se o teste é da habilidade do remédio, em vez de um teste genérico de INT.
- Se outro remédio continua sem vantagem quando não foi escolhido.

Habilidade base Herbalismo e talento de vantagem em um remédio são conceitos distintos. A regra 10–11 permite escolher entre os cinco remédios. A solução não deve pedir uma erva genérica nem conceder vantagem indiscriminada em INT.

## Assassino: tabela deslocada e expansão de talentos

O array inicial da Lótus Negra reservava somente um índice. Isso associava resultados aos talentos seguintes e deixava o resultado 12 sem documento. Foram reservados os índices 0 e 1; os talentos diretos começam no índice 2.

Confira os extremos 2 e 12 e o caso especial 1. O resultado 1 gera dois talentos; novos resultados 1 são rerrolados. Duplicados entre os talentos podem ser mantidos conforme a regra apresentada pelo usuário.

Não use apenas o exemplo moral para validar a tabela: ele pode importar pelo identificador correto e ainda carregar o número de rolagem errado. “Testes de Moral com CD 18” corresponde ao d12 **7**; “Adormecer Criatura”, ao **9**.

Confira também se a ação “rolar talento adicional” foi expandida em bônus reais. Ela não deve ser enviada ao importador como um identificador de talento inventado.

## Classes indisponíveis no site

Houve relato de quebra da seleção de todas as classes após o commit [`3684336`](https://github.com/NaoTemJuju/terraoeste/commit/3684336795b647220913af01cb355afbd5f6ab4f), com `b0df02e` citado pelo usuário como versão funcional. O histórico disponível nesta documentação não comprova a causa exata desse incidente. Não atribua automaticamente a um erro específico sem consultar o diff e reproduzir.

Para investigar uma nova ocorrência:

1. Abra o console e localize o **primeiro** erro de carregamento/execução.
2. Confira os arquivos recebidos pelo navegador e seus códigos HTTP.
3. Confira a sintaxe de `class.js`, `base.js` e demais scripts alterados.
4. Preserve a ordem de scripts em `index.html`.
5. Confira `window.app`, estado compartilhado e eventos dos seletores.
6. Confira conteúdo dinâmico das APIs e configurações do mestre.
7. Compare com um commit funcional confirmado e reproduza o fluxo manual e o aleatório.

Não publique um rollback amplo que descarte correções posteriores sem identificar quais arquivos e mudanças precisam ser recuperados.

## Histórico e divindade não encontrados

“Matador de Rua” continuou aparecendo como Background não encontrado no exemplo do Victor. Isso é um aviso independente do talento. Não foi implementada uma equivalência de histórico ou criação automática de documento para esse caso.

“Nenhuma” em divindade também apareceu como item não encontrado em exemplos anteriores. A ausência de divindade precisa ser representada conforme o comportamento do importador; uma palavra visual não implica um documento real com esse nome.

Para corrigir esses casos, confirme o documento e seu tipo no compêndio/índice apropriado. Se o histórico for personalizado, preserve seu conteúdo e planeje uma forma explícita de representá-lo. Não troque por outro histórico apenas para esconder o aviso. O campo de histórico do ator examinado é uma referência UUID.

## Atualização, cache e instalação

Há três estados diferentes a conferir: commit do site, versão/arquivos locais do módulo e JavaScript carregado pelo cliente do Foundry.

| Alteração | Ação normalmente necessária |
| --- | --- |
| Apenas conteúdo do JSON colado | Reabrir o importador e colar o novo JSON |
| Scripts do site | Confirmar implantação correta e recarregar a página do site |
| `main.mjs` de módulo já ativo | Recarregar os clientes do Foundry para carregar o código novo |
| Instalação inicial ou manifesto do módulo | Fechar/abrir o Foundry ou reiniciar seu processo, conferir descoberta e ativação |
| Mudança de mundo/compêndio | Conferir carga do mundo, documento e índices; avaliar recarregamento conforme o caso |

F5 costuma recarregar o cliente. A atualização de `module.json` pode exigir reinicialização do processo para a versão exibida ser atualizada. Não recomende reiniciar o PC como etapa normal de atualização de módulos.

O manifesto 0.8.8 versionado não contém URLs `manifest`/`download`. A URL raw de `module.json` não garante instalação ou atualização automática pelo Foundry. Use a instalação manual documentada enquanto não houver um fluxo de distribuição completo.

## Sandbox do Codex no Windows: erro do helper

Este incidente ocorreu durante tentativas de acessar/atualizar os arquivos locais do módulo. Ele é um problema do ambiente de execução do Codex, separado do importador do Foundry.

Os dados fornecidos pelo usuário incluíam:

```json
{"code":"helper_unknown_error","message":"setup refresh had errors"}
```

E o log detalhava:

```text
runtime read/execute validation failed
.../runtimes/cua_node/.../bin/node_repl.exe
open ACL target for root-only update:
O arquivo já está sendo usado por outro processo. (os error 32)
```

Também houve um aviso de acesso ao perfil, seguido por “continuing setup”. A falha fatal registrada era a validação do runtime. `deny_read_acl_state.json` com `{"principals":{}}` não identifica sozinho a causa.

O erro **32** observado informa arquivo em uso. Ele não prova a hipótese de ownership incorreto de `.git` ou acesso negado por ACL, frequentemente associada ao erro **5**. Não aplique `takeown`, resets recursivos de ACL ou troca de proprietário em pastas inteiras com base apenas no erro genérico do helper.

Procedimento para uma nova ocorrência:

1. Leia `setup_error.json` e o log detalhado em `%USERPROFILE%\.codex\.sandbox\` ou no caminho indicado pela instalação.
2. Identifique o arquivo e o erro do Windows concretos.
3. Feche o Codex completamente, incluindo o processo da bandeja, quando o problema apontar para runtime em uso.
4. Inspecione processos remanescentes e bloqueios do arquivo, preservando trabalhos em andamento.
5. Reabra e confira se o comando volta a funcionar. Se repetir, confirme a versão atual e consulte a documentação/suporte oficiais do Codex.

Nesta sessão houve tentativa de instalar outra versão do aplicativo via `Add-AppxPackage`. O HRESULT **0x80073D02** indicou que o aplicativo ainda estava em uso. A tentativa posterior não exibiu erro. Isso comprova a ausência de erro naquela instalação, não que o downgrade seja uma solução universal para o sandbox.

Não fixe URLs antigas de instalador como solução permanente. Confirme orientações e versões oficiais antes de recomendar alterações no aplicativo. Reiniciar o PC foi tentado durante a investigação; o histórico não permite atribuir a resolução a uma única ação.

## Limitações confirmadas ou a verificar

Estes pontos foram identificados na leitura do código 0.8.8 e **não estão corrigidos por esta documentação**:

| Ponto | Evidência/risco concreto | Próxima investigação |
| --- | --- | --- |
| Fallback de `weaponAttackType` | Retorna `ranged.has(wanted)`, mas `wanted` não foi declarado nessa função; sem correspondência no compêndio pode ocorrer `ReferenceError` | Reproduzir com arma sem índice e usar a variável normalizada correta |
| Slugs de armas/armaduras | Mapas de nomes usam PT-BR; isso pode divergir do item rolado em mundo inglês | Resolver pelo documento e pela semântica de rolagem instalada, validando ambos os idiomas |
| Aliases de remédios | Bálsamo e Inimigo Favorito não estão nos aliases explícitos; dependem de `originalName` | Reproduzir sem metadados Babele e ampliar a resolução sem confundir habilidades |
| Magias fora do mapa local | `spellDisplayName` tem um conjunto limitado de traduções | Conferir a magia real/UUID e o slug consumido, incluindo Arma Sagrada |
| Repetição de Venenos | A regra exige rerrolar 2 duplicado; não há comprovação aqui de cobertura completa entre níveis | Testar aquisição repetida e política de duplicação |
| Expansão de resultados 12 | Escolhas aninhadas e personagens antigos podem ter formatos diferentes | Testar atributos, talentos e tabelas secundárias pela exportação completa |
| Índices de compêndios | Há buscas em `pack.index`; índices incompletos podem impedir correspondências | Conferir carga de índice com a API correta da versão instalada |
| Histórico personalizado | Matador de Rua sem correspondência na importação observada | Definir representação UUID/conteúdo sem substituir o histórico por outro |

Esses itens são uma lista de trabalho baseada em leitura estática e evidências da sessão. Não os transforme em promessas de suporte já validado.

## Evidência das correções de 0.8.8

Foi reproduzida a falha do identificador antigo usando o código real do importador instalado. Depois, as 13 chaves foram resolvidas com o mapa oficial. Também foram conferidos os resultados diretos 2–12 da Lótus Negra, o caso 1 com rerrolagem e registros antigos aninhados.

Nessa verificação, `fromUuid` foi simulado com documentos de teste. Os testes confirmaram resolução e seleção de chaves, não a existência de todos os documentos em qualquer instalação nem a automação visual de todos os efeitos. Houve também verificação de sintaxe e de correspondência dos arquivos instalados com os preparados.

O usuário confirmou funcionamento em etapas anteriores de ataques à distância e de Herbalismo. Isso não equivale à aprovação de todos os talentos, idiomas e versões. Registre separadamente a versão e o cenário de cada confirmação futura.

## Como registrar o próximo incidente

Acrescente ao documento:

- Sintoma e menor JSON capaz de reproduzir.
- Versões, idioma e documentos envolvidos.
- Chave/UUID/caminho de efeito inspecionados.
- Causa confirmada e hipóteses descartadas.
- Correção e arquivos alterados.
- Evidência de testes e limites, distinguindo mocks da interface real.
- Commit/PR e versão do módulo instalada.
- Caso incluído no roteiro de regressão.


## Inclusão do Bárbaro: limites de automação

A classe já constava em `CLASS_DICE` com d8. A mudança no site inclui descrição, equipamento, habilidades e a tabela 2d6. Para o resultado 7–9, o seletor produz bônus oficiais já mapeados (`StatBonus` para Força/Constituição ou `Plus1ToHit` para ataques corpo a corpo). O resultado 3–6 usa a chave `Plus1ToMeleeDamage` também usada pelo Assassino.

**Causa:** o mapa oficial não resolve talentos próprios que ainda não existem em compêndios. Omissão em `bonuses` evitava o aviso, mas também impedia criar esses talentos na ficha.

**Correção:** módulo `terraoeste-class-content` com compêndios nativos e registro explícito para as chaves TerraOeste de crítico/Fúria. O site exporta esses bônus. JSONs antigos são adaptados em uma cópia, contando aquisições repetidas. Um talento cujo documento esteja ausente continua sendo informado como não encontrado. A escolha manual de 7–9 também foi incluída no caminho de renderização que faltava.

**Evidência:** leitura local dos esquemas, mapa, importador, ActiveEffectSD e consumidores de rolagem do Shadowdark 4.0.6; consulta ao esquema de TableResult do Foundry 13.350. Crítico é -1 no limiar somente de ataques corpo a corpo. Usos adicionais ajustam o contador da Fúria. O build valida o registro e as referências internas, mas a interface/rolagem real ainda precisa de validação. Duração e demais condições narrativas não são automatizadas. Machado de Batalha foi incluído com 1d12 autorizado pelo usuário; demais campos são provisórios e editáveis.

**Diagnóstico futuro:** conferir módulo ativo, UUID em `registry.json`, presença do documento em `src` e nos bancos compilados, compatibilidade do importador e filtros de fontes. Trocar o nome exibido não substitui um documento ausente. Nunca criar efeitos de JSON arbitrário nem editar o sistema para registrar uma classe.
