# Contrato de integração com o Foundry

Referência: código do repositório após o merge `6216f3137793ea75c28a11e740463ecd9310b610` e módulo TerraOeste 0.8.8. O importador foi inspecionado na instalação de Shadowdark do usuário. As APIs e os UUIDs precisam ser conferidos novamente após atualização do sistema.

## 1. Fluxo de dados

```text
class.js / dados de criação
  → estado do personagem
  → final.js
  → JSON Shadowdarkling + campos TerraOeste
  → ShadowdarklingImporterSD._importActor
  → mapa de identificadores / documentos de compêndio
  → módulo TerraOeste: escolhas e efeitos específicos
  → criação do ator no Foundry
```

O site e o módulo têm responsabilidades complementares. `class.js` define opções e identificadores; `final.js` exporta o estado. O módulo usa a API do sistema e adapta a cópia do talento importado. Uma escolha precisa sobreviver a todo o percurso.

As tabelas exibidas no site ficam em `class.js`, incluindo as duas tabelas do Assassino. As tabelas reais de avanço de nível no Foundry são documentos RollTable de compêndios. Atualizar o JavaScript do site não altera essas RollTables.

## 2. Campos que não devem ser confundidos

| Campo/conceito | Papel | Exemplo |
| --- | --- | --- |
| `id` | Identificador interno do site | `AssassinLotusMoral` |
| `talentRolledName`, `name`, `displayDesc` | Texto exibido/exportado | `Testes de Moral com CD 18` |
| `bonusName` | Chave técnica para resolução do bônus | `Morale18` |
| `bonusTo` | Alvo, escolha ou parte da chave de resolução | `Longbow`, `Ranged attacks`, `Curative` |
| UUID | Referência ao documento real | `Compendium.shadowdark.talents.Item.Ahy2OiGL4B51Y4vQ` |
| Slug | Sufixo usado para casar um efeito com o item rolado | `arco-longo`, `curativa` |
| `flags.babele.originalName` | Nome original preservado pela tradução, quando disponível | `Curative` |

O UUID acima foi observado no mapa examinado. Ele deve ser resolvido com `fromUuid` antes de ser usado em outra versão.

## 3. Como o importador encontra talentos

Arquivos do sistema examinados:

- `systems/shadowdark/src/apps/ShadowdarklingImporterSD.mjs`.
- `systems/shadowdark/shadowdark-compiled.mjs`, usado na distribuição compilada.
- `systems/shadowdark/assets/mappings/map-shadowdarkling.json`.

Na versão examinada, `_findTalent(bonus)` procura as seguintes chaves em `itemMapping.bonus`, nesta ordem:

1. `bonusName_bonusTo`.
2. `bonusName`.
3. `bonusTo_bonusName`.
4. `bonusTo`.

Depois, resolve o UUID com `fromUuid`. O comentário de busca adicional no código não contém uma implementação de busca de talentos por nome. Se não encontrar o documento, registra `bonus.name` na lista **Itens não encontrados**.

Por isso, a mensagem mostra um nome legível, mas a causa pode estar no identificador técnico. Alterar `bonus.name` ou `talentRolledName` sozinho não substitui uma chave desconhecida.

`_findItem`, usado para outros tipos de item, tem uma lógica diferente: consulta seu mapa e tenta correspondência de nome/tipo nos índices de compêndio. Não presuma que `_findTalent` tenha o mesmo fallback.

### Fontes

Na implementação examinada, `activeSources` participa da verificação de fontes requeridas ausentes. `_findTalent` não usa esse campo para filtrar talentos. `coreRulesOnly` não participa desse método de resolução. O diagnóstico anterior de que `activeSources: ["SD"]` causava a falha de `AssassinLotusMoral` foi descartado após leitura do código.

### Localização dos dados no JSON

| Campo | Uso no projeto |
| --- | --- |
| `bonuses` | Lista consumida pelo importador para talentos e outros bônus |
| `levels` | Dados de nível no formato Shadowdarkling; não deve ser duplicado para cada talento do mesmo nível |
| `terraOesteClassTalents` | Registros do site para reconstruir/exportar talentos escolhidos |
| `terraOesteClassOptions` | Escolhas de habilidades de classe, como `weaponMastery` e `grit` |
| `terraOesteChoices` | Escolhas entre talentos/habilidades fixos, usadas para manter apenas as opções escolhidas |
| `rolledStats`, `stats` | Valores de atributos; confira o consumidor antes de reaplicar aumentos |

O importador inspecionado usa `rolledStats` como base das habilidades do ator. Um ajuste de atributos exige verificar se os bônus serão aplicados como efeitos para evitar duplicação.

## 4. Identificadores oficiais e compatibilidade do Assassino

O site exportava identificadores locais como `AssassinLotusMoral` em `bonusName`. A versão 0.8.8 usa as chaves oficiais e oferece compatibilidade com os JSONs antigos.

| Identificador antigo do site | `bonusName` oficial | Nome PT-BR de referência |
| --- | --- | --- |
| `AssassinPoisonTraining` | `UsePoisons` | Treinamento em Venenos |
| `AssassinSmokeStepExtraUse` | `ImpSmokeStep` | Uso Adicional de Passo de Fumaça |
| `AssassinLotusParalysis` | `ParalyseOnWeaponHit` | Paralisar um Alvo |
| `AssassinLotusDexterityAdvantage` | `ADVonDEXToAvoidEntrapment` | Evitar Aprisionamento/Ferimentos |
| `AssassinLotusDualWieldAC` | `Plus1ACWhenDualWield` | +1 CA com Duas Armas |
| `AssassinLotusExtraHitDie` | `PlusOneHitDie` | PV Adicional |
| `AssassinLotusTripleDamage` | `TripleDamageAssassinate` | Dano Triplo de Assassino |
| `AssassinLotusMoral` | `Morale18` | Testes de Moral com CD 18 |
| `AssassinLotusWaterWalking` | `WalkOnWater` | Andar sobre a Água |
| `AssassinLotusSleep` | `MakeAsleep` | Adormecer Criatura |
| `AssassinLotusWallWalking` | `WalkOnWalls` | Andar em Superfícies Íngremes |
| `AssassinLotusMeleeDamage` | `Plus1ToMeleeDamage` | +1 para Dano Corpo a Corpo |
| `AssassinLotusUnseen` | `Invisible` | Esconder-se de Criatura |

Implementação:

- `class.js`: `ASSASSIN_BONUS_ALIASES`, geração da Lótus Negra e `normalizedTalentRecord`.
- `main.mjs`: `ASSASSIN_BONUS_ALIASES`, `normalizeAssassinBonus` e wrapper de `_findTalent`.

O wrapper normaliza uma cópia do bônus antes de chamar o método original. O JSON colado não precisa ser alterado. O item e seus efeitos continuam vindo do compêndio original.

Exemplo atual de bônus:

```json
{
  "sourceType": "Class",
  "sourceName": "Assassino",
  "sourceCategory": "Talent",
  "name": "Testes de Moral com CD 18",
  "bonusName": "Morale18",
  "bonusTo": "Morale18",
  "gainedAtLevel": 1
}
```

Um talento narrativo como moral não necessariamente tem um Active Effect que automatiza toda a regra. Corrigir sua importação garante a presença do documento correto; confira a implementação real do sistema antes de prometer automação de testes de criaturas.

## 5. Outros identificadores relevantes

| Talento/escolha | `bonusName` | `bonusTo` de referência |
| --- | --- | --- |
| +1 para ataques à distância e dano | `Plus1ToHitAndDamage` | `Ranged attacks` |
| +1 para ataques corpo a corpo e dano | `Plus1ToHitAndDamage` | `Melee attacks` |
| +1 para ataques corpo a corpo | `Plus1ToHit` | `Melee attacks` |
| Maestria em Armas do Guerreiro | `Plus1AttackAndDamagePlusHalfLevel` | Nome original da arma, como `Dagger` |
| Dado d12 de arma do Patrulheiro | `SetWeaponTypeDamage` | Nome original da arma, como `Longbow` |
| Maestria em Armaduras | `ArmorMastery` | Nome original da armadura |
| Vantagem em Conjuração | `AdvOnCastOneSpell` | Magia escolhida |
| Vantagem em Herbalismo | `Herbalism Check Advantage` | Remédio escolhido; o módulo também reconhece `HerbalismCheckAdvantage` |
| Vantagem na Iniciativa | `AdvOnInitiative` | `Initiative` |
| Dado adicional de Apunhalada pelas Costas | `BackstabIncrease` | `Backstab` |
| Criar item mágico | `MakeRandomMagicItem` | Categoria escolhida |
| Aprender magia adicional | `PickExtraSpell` | Conforme a escolha e o consumidor de magias |
| Bônus de conjuração | `Plus1ToCastingSpells` | Conforme o mapa instalado |

Confira combinações específicas no mapa do sistema. O caso `Plus1ToHitAndDamage_Ranged attacks`, por exemplo, é uma chave composta.

O PR #3 também padronizou nomes visíveis de Mago, Guerreiro e Ladrão. Esses nomes melhoram a apresentação e a consistência, enquanto os identificadores oficiais continuam necessários para resolução técnica.

## Bardo no gerador

O site exporta a classe localizada como `Bardo`, conforme o nome usado pelo compêndio do Foundry na instalação em português. Evite converter esse valor para `Bard` ou `Bard (Legacy)`, pois esses identificadores não são reconhecidos pela instalação reportada pelo usuário.

O site apresenta Línguas, Artes Bárdicas, Fascinar, Inspirar e Mago Diletante, além do equipamento informado. A tabela 2d6 tem rerrolagem de resultado 2 repetido. No talento 3–6, o bônus de ataques usa a combinação mapeada `Plus1ToHit_Melee and ranged attacks`. As opções narrativas de Fascinar, tempo livre e Farra ficam registradas em `terraOesteClassTalents`, sem `bonusName` inventado: o mapa local não oferece chaves confirmadas para esses três efeitos, então o JSON não deve produzir um talento “não encontrado” por identificador fabricado. O talento 7–9 usa os bônus oficiais `StatBonus` por atributo.

## Bruxo no gerador

O usuário confirmou que renomeou no Foundry a classe correspondente para `Bruxo`; preserve esse nome em `class` e `sourceName` do JSON. As regras e a progressão fornecidas correspondem ao documento Witch do Shadowdark, com o nome localizado alterado na instalação do usuário. Não crie uma segunda classe no módulo TerraOeste nem traduza o nome exportado para `Bruxa` sem nova confirmação.

O site mantém as escolhas iniciais de três magias de 1º nível em `terraOesteClassOptions.witchSpells`, incluindo o fluxo aleatório. A lista de opções deve ser obtida da lista de Witch do compêndio instalado e os valores internos preservam os nomes originais: `Cauldron`, `Oak, Ash, Thorn`, `Shadowdance`, `Charm Person`, `Puppet`, `Hypnotize`, `Willowman`, `Witchlight`, `Eyebite` e `Fog`. Os rótulos exibidos são `Caldeirão`, `Carvalho, Freixo e Espinheiro`, `Dança das Sombras`, `Encantar Pessoa`, `Fantoche`, `Hipnotizar`, `Homem-Salgueiro`, `Luz de Bruxa`, `Mau Olhado` e `Névoa`. `final.js` deriva `spellsKnown` e os bônus de magia das escolhas e dos talentos, tanto no personagem recém-gerado quanto no reconstruído.

O arquivo `babele-directory-export.zip` enviado pelo usuário fornece os nomes localizados e as descrições das dez magias. A ficha do site mostra cada magia com duração e alcance; passar o mouse sobre o nome ou focá-lo pelo teclado revela a descrição. Como o export do Babele não contém campos de duração e alcance, esses valores foram conferidos separadamente na lista de magias de Bruxo de Shadowdark Extra Classes; não inferir esses campos somente do texto da descrição.

Os talentos 2d6 reutilizam identificadores confirmados no mapa instalado: `TeleportToFamiliar`, `StatBonus`, `Plus1ToCastingSpells`, `AdvOnCastOneSpell` e `PickExtraSpell`. Para `AdvOnCastOneSpell`, `bonusTo` deve ser o rótulo PT-BR escolhido, pois o módulo de escolhas converte o nome à chave de efeito individual da magia. Resultado 2 duplicado não é rerrolado; cada resultado concede um uso diário adicional conforme a tabela. A progressão de magias conhecidas por nível é apresentada no site conforme a tabela enviada.

## Antecedentes TerraOeste

O módulo de conteúdo 0.2.0 adiciona um compêndio de documentos nativos do tipo `Background` com os 102 antecedentes do documento fornecido, seis para cada uma das 17 classes. `registry.items.Background` associa os nomes exatos aos UUIDs do compêndio `terraoeste-class-content.backgrounds`. O wrapper do importador consulta esse registro antes da busca normal por nome, permitindo importar, por exemplo, **Matador de Rua**, sem editar o compêndio original do Shadowdark.

As descrições são texto narrativo e não aplicam bônus mecânicos. Nomes podem se sobrepor aos de backgrounds nativos; a associação direta do registro garante que os nomes incluídos apontem para o conteúdo TerraOeste. A classe associada fica em `flags.terraoeste-class-content.class` para edição/exportação posterior. Depois de atualizar o módulo, confira o pack de Antecedentes e importe um personagem com cada nome que havia falhado.

## 6. `REPLACEME`: modelos e escolhas concretas

`REPLACEME` no item genérico de compêndio pode ser um parâmetro legítimo. No item adquirido pelo personagem, ele precisa ser resolvido quando a regra exige uma escolha.

O importador original examinado trata um caso de placeholder no **valor** do primeiro efeito. Os efeitos de arma mostrados nos incidentes usavam placeholder na **chave**. Esse tratamento original não resolve todos os casos.

O módulo percorre as alterações relevantes na cópia do item e aplica a seleção. As funções `setWeaponMasteryEffect`, `setWeaponDamageDieEffect`, `setArmorMasteryEffect`, `setSpellcastingAdvantageEffect` e `applyHerbalismAdvantageChoice` implementam as adaptações.

| Caso | Chave genérica de referência | Exemplo após escolha |
| --- | --- | --- |
| Maestria: ataque | `system.roll.attack.bonus.REPLACEME` ou variante melee/ranged | `system.roll.ranged.bonus.arco-longo` |
| Maestria: dano | `system.roll.attack.damage.REPLACEME` ou variante melee/ranged | `system.roll.ranged.damage.arco-longo` |
| Arma com d12 | `system.roll.attack.upgrade-damage-die.REPLACEME` | `system.roll.attack.upgrade-damage-die.arco-longo` |
| Maestria em armadura | `system.attributes.ac.REPLACEME` | `system.attributes.ac.cota-de-malha` |
| Vantagem em magia | Chave de vantagem terminada em `REPLACEME` no item original | No sistema mostrado: `system.roll.spell.advantage.arma-sagrada` |
| Vantagem em Herbalismo | Criada/adaptada pelo módulo | `system.roll.ability.advantage.curativa`, se o item rolado se chama Curativa |

Não troque o prefixo de uma chave de magia apenas para seguir um exemplo de documentação: a função preserva o prefixo do efeito original e substitui o parâmetro final. Inspecione o consumidor da versão instalada.

O efeito de d12 observado tinha valor `5`. Esse valor pertence à representação usada pelo sistema; preserve o valor original ao resolver a arma. Não substitua automaticamente por `12` ou pela string `d12` sem conferir a interpretação do sistema.

### Exemplo de seleção de Arco Longo para d12

```json
{
  "sourceType": "Class",
  "sourceName": "Patrulheiro",
  "sourceCategory": "Talent",
  "name": "Dado de Dano de Arma Aumentado",
  "bonusName": "SetWeaponTypeDamage",
  "bonusTo": "Longbow",
  "gainedAtLevel": 1
}
```

O nome visual do talento não aplica a arma. O módulo precisa receber `Longbow`, localizar/copiar o talento e resolver a chave do efeito para a arma efetiva.

### Slugs e localização

Um slug é produzido normalizando acentos, convertendo para minúsculas e separando palavras por hífen. Exemplos: `Espada Longa` → `espada-longa`; `Curativa` → `curativa`.

O nome técnico exportado pode ser inglês, enquanto o item rolado é português. Para efeitos por item, o sufixo deve corresponder ao nome usado pela rolagem. O módulo 0.8.8 tem mapas PT-BR de armas/armaduras/magias e resolve remédios pelo documento de habilidade quando disponível. Veja as limitações de idiomas em [Diagnóstico](troubleshooting.md#limitações-confirmadas-ou-a-verificar).

## 7. Babele e ganho natural de talento

O ganho natural de talento por avanço de nível/arrastar e soltar tem um caminho diferente da importação de JSON. Corrigir somente a importação deixa o seletor natural vulnerável.

No incidente do Patrulheiro, o inglês abria a seleção de arma e a tradução não. O módulo normaliza rótulos antes de encaminhar a `shadowdark.effects.handlePredefinedEffect`:

- `Increased Weapon Damage Die`, `D12 Weapon Damage Die`, `Dado de Dano de Arma Aumentado` e `Dado de Dano de Arma com D12`.
- `Weapon Mastery` e variantes PT-BR.
- `Armor Mastery` e variantes PT-BR.
- `Spellcasting Advantage on Spell` e variantes PT-BR.
- Herbalismo, com o seletor específico de remédio.

Funções: `canonicalReplacementEffectName` e `installLocalizedReplacementEffectChoices`.

O seletor de tabelas de classe também considerava rótulos ingleses. `installLocalizedClassTalentTables` complementa a coleção com tabelas reconhecidas por `class talents` ou `talentos de classe`, usando nome original quando disponível. Essa correção cobre descoberta de tabelas; confira separadamente a associação da classe à RollTable correta.

## 8. Herbalismo do Patrulheiro

A habilidade base Herbalismo permite preparar um dos cinco remédios por teste de INT. O talento da faixa 10–11 concede vantagem na preparação de **um remédio escolhido**, não em todo teste de INT e não na criação de qualquer erva.

| Remédio original | Nome encontrado na instalação PT-BR | CD |
| --- | --- | --- |
| Salve | Bálsamo, dependendo da tradução | 11 |
| Stimulant | Estimulante | 12 |
| Foebane | Inimigo Favorito, dependendo da tradução | 13 |
| Restorative | Restauradora/Restaurador | 14 |
| Curative | Curativa/Curativo | 15 |

Os nomes encontrados podem variar com o pacote de tradução. O módulo compara o nome visível e `flags.babele.originalName`. Os aliases explícitos atuais incluem Estimulante, Restauradora/Restaurador e Curativa/Curativo. Bálsamo e Inimigo Favorito dependem do nome original para serem reconhecidos pelos seletores atuais.

O item genérico de vantagem em Herbalismo não tinha o efeito necessário no cenário reportado. O módulo:

1. Oferece a escolha de remédio no ganho natural do talento.
2. Usa o remédio indicado no JSON durante a importação.
3. Resolve o nome real da habilidade de classe.
4. Cria a alteração `system.roll.ability.advantage.<slug-do-remédio>` com valor `1` e modo ADD.
5. Nomeia a cópia do talento com o remédio escolhido.

Para `Curative`, se o documento real se chama **Curativa**, o alvo precisa ser `curativa`. Apenas traduzir para `Curativo` sem conferir o documento pode produzir uma chave que não casa com a habilidade rolada.

A criação desse efeito automatiza a vantagem na rolagem correspondente; não presume automação de expiração de remédios, bloqueio após falha ou todos os efeitos narrativos de cada remédio.

## 9. Duas tabelas do Assassino

### Ras-Godai: 2d6

| Resultado | Tratamento |
| --- | --- |
| 2 | Treinamento em Venenos; a regra determina rolar novamente se duplicado |
| 3–6 | Rolar um talento adicional na Lótus Negra |
| 7–9 | Escolher +2 FOR, +2 DES ou +1 em ataques corpo a corpo |
| 10–11 | Uso adicional de Passo de Fumaça |
| 12 | Escolher talento ou distribuir +2 pontos entre atributos |

### Lótus Negra: d12

| Resultado | Talento/regra |
| --- | --- |
| 1 | Ganhar dois talentos; rerrolar quaisquer novos resultados 1 |
| 2 | Paralisar um Alvo |
| 3 | Evitar Aprisionamento/Ferimentos |
| 4 | +1 CA com Duas Armas |
| 5 | PV Adicional |
| 6 | Dano Triplo de Assassino |
| 7 | Testes de Moral com CD 18 |
| 8 | Andar sobre a Água |
| 9 | Adormecer Criatura |
| 10 | Andar em Superfícies Íngremes |
| 11 | +1 para Dano Corpo a Corpo |
| 12 | Esconder-se de Criatura |

O array tem índices 0 e 1 reservados. A implementação antiga tinha somente um `null`, deslocando os resultados e deixando o 12 sem item. O PR #3 corrigiu isso. O Victor antigo tinha moral registrado com `roll: 6`; a tabela correta associa moral a **7**.

A regra permite manter ou rerrolar talentos duplicados da Lótus Negra. A implementação atual pode retornar duplicados; não descreva os dois talentos do resultado 1 como obrigatoriamente distintos. A rerrolagem de novos resultados 1 é obrigatória.

Ao expandir `AssassinBlackLotusRoll`, `getClassLevelTalent` usa os resultados secundários para formar os bônus. A entrada de ação da tabela não deve virar um bônus técnico desconhecido no importador.

## 10. Formatação das descrições

As informações de equipamento e PV foram levadas para a descrição das classes, mantendo rótulos em negrito e rótulo/valor na mesma linha. Houve duas etapas de ajuste: unir rótulos com seus valores e acrescentar espaço vertical entre o texto introdutório e cada bloco de equipamento/PV.

Formato de referência:

```html
<p><em>Texto introdutório da classe.</em></p>
<p><em><strong>Armas:</strong> lista de armas.</em></p>
<p><em><strong>Armaduras:</strong> lista de armaduras.</em></p>
<p><em><strong>Pontos de Vida:</strong> 1d8 por nível.</em></p>
```

Confira também margens CSS. Não insira um salto de linha entre `Armas:` e o primeiro nome da lista. Um `\n` em uma string HTML não garante espaço vertical visível.


## 11. Bárbaro

O gerador já tinha Bárbaro em `CLASS_DICE` com d8 de PV; a inclusão em `class.js` acrescenta descrição, equipamento, habilidades e a tabela 2d6 enviada pelo usuário. A habilidade Fúria fica descrita com duração, redução de dano, Vantagem, imunidades, moral, obrigação de atacar e teste de Constituição ao fim. A descrição de Devastar preserva a condição de CA do alvo.

Na tabela de talentos, o resultado 7–9 pede uma escolha explícita entre +2 FOR, +2 CON e +1 em ataques corpo a corpo. A escolha manual e o sorteio automático usam `StatBonus` com `STR:+2`/`CON:+2` ou `Plus1ToHit` com `Melee attacks`, identificadores já usados pelo projeto e cobertos pelo mapa oficial consultado. O resultado 3–6 usa `Plus1ToMeleeDamage`, chave já utilizada para o talento de dano da Lótus Negra.

O módulo independente `terraoeste-class-content` fornece documentos nativos para o conteúdo ausente. Crítico e usos adicionais de Fúria agora exportam `TerraOeste.BarbarianCriticalRange` e `TerraOeste.BarbarianExtraFuryUse`, registrados com UUIDs reais em `registry.json`. O efeito de crítico soma -1 em `system.roll.melee.critical-success` por aquisição. A habilidade Fúria usa contador nativo; o módulo ajusta seu máximo conforme os talentos adicionais, mantendo usos gastos. Instinto Primitivo e vantagem da Fúria usam efeitos situacionais selecionáveis. Devastar, duração, redução de dano, imunidades, moral, obrigação de atacar e perda/recuperação de Constituição permanecem manuais.

A opção 12 reutiliza o seletor comum de “talento ou +2 atributos”. A seleção manual e o sorteio aleatório da faixa 7–9 devem resultar no mesmo benefício exportável. A lógica foi revisada no código, mas a interface real do Foundry, o ganho natural em nível e o importador ainda precisam de validação na instalação alvo.

O módulo preserva aliases antigos e recupera talentos descritivos de JSONs anteriores por contagem de ocorrências, sem acrescentar linhas de nível nem duplicar bônus já exportados. As fontes dos compêndios são JSONs editáveis versionados. Ver [documentação do módulo de conteúdo](../foundry-module/terraoeste-class-content/README.md) para expansão, build, instalação e limites de automação.

