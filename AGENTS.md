# Instruções para manutenção do TerraOeste

## Leitura necessária

Antes de alterar classes, tabelas, exportação de personagens, importação ou efeitos do Foundry, leia:

1. `docs/foundry-integration.md`.
2. `docs/troubleshooting.md`.
3. `docs/regression-checklist.md`.

Para instalar ou atualizar o módulo, leia também `foundry-module/terraoeste-foundry-choice-guard/README.md`.

## Regras de implementação

- Confira o código e o mapa da versão realmente instalada do Shadowdark. Os nomes traduzidos e os UUIDs de referências históricas são evidências, não garantias de compatibilidade futura.
- Distinga `id`, nome exibido, `bonusName`, `bonusTo`, UUID e slug. A resolução de talentos do importador verificado usa `bonusName`/`bonusTo`.
- Não conclua que trocar `name` corrige um talento ausente. Reproduza a resolução com o mapa e confira `fromUuid`.
- Não atribua erros de talentos a `coreRulesOnly` ou `activeSources` sem verificar o consumidor desses campos. No importador examinado, `activeSources` verifica fontes ausentes e não filtra `_findTalent`.
- Ao criar novos talentos, use chaves oficiais do mapa ou chaves TerraOeste explicitamente registradas em `foundry-module/terraoeste-class-content/registry.json` apontando para documentos reais. Nunca exporte IDs sem resolução. Quando já existirem JSONs antigos, mantenha aliases compatíveis no site e no módulo.
- Preserve os valores escolhidos em geração manual, geração aleatória, personagem salvo/compartilhado, exportação e importação.
- Ao tratar `REPLACEME`, copie o item original do compêndio e substitua os parâmetros necessários na cópia. Preserve valores e modos dos efeitos conforme a semântica do sistema.
- Confira todas as alterações de um efeito, não apenas `effects[0].changes[0]`. Há diferenças entre placeholder em `key` e em `value`.
- Considere inglês, português e `flags.babele.originalName`. O slug precisa corresponder ao item efetivamente rolado.
- Separe importação de JSON e ganho natural de talento por avanço de nível/arrastar e soltar: ambos precisam conservar a escolha.
- Para tabelas, confira cada limite e índice. Na Lótus Negra, o índice 0 é inutilizado e o resultado 1 tem tratamento próprio; os talentos diretos começam em 2.
- Não acrescente uma segunda entrada de nível apenas para representar um talento extra do mesmo nível. O consumidor principal de talentos é `bonuses`; preserve o contrato de `levels`.
- Não some aumentos de atributos duas vezes. Confira a relação entre `rolledStats`, `stats` e os efeitos de `StatBonus` na versão instalada.
- Preserve a ordem de scripts e as dependências globais do frontend.

## Foundry local e publicação

- Preserve uma cópia do módulo instalado antes de substituí-lo. Compare sua versão e seu conteúdo com o GitHub; uma cópia local pode conter correções mais novas.
- Faça ajustes de compatibilidade no módulo TerraOeste. Evite editar diretamente o sistema Shadowdark ou os compêndios originais.
- Não edite bancos LevelDB de mundos/compêndios enquanto o Foundry estiver aberto. Use as APIs do Foundry ou exportações de documentos.
- Não confunda atualização do site, atualização dos arquivos do módulo e recarregamento do cliente.
- Para publicação no GitHub, siga a autorização vigente do usuário e preserve trabalho já existente. Confirme o commit final e informe se está em PR ou em `main`.

## Evidências e documentação

Execute as verificações proporcionais à alteração conforme `docs/regression-checklist.md`. Declare quando os testes usaram mocks e quando houve verificação real da interface/rolagem. Não chame teste de sintaxe de teste de integração.

Ao corrigir um novo incidente, atualize a documentação com sintoma, causa confirmada, alteração, arquivos, versões, evidências, limitações e exemplo de regressão. Separe hipóteses, problemas pendentes e correções concluídas. Não apresente uma limitação documentada como resolvida.
