# Prevenção e roteiro de regressão

Use este roteiro antes de publicar mudanças em classes, exportação ou módulo. Selecione os cenários afetados pela alteração; amplie a verificação quando houver mudança compartilhada de identificadores, localização ou resolução de efeitos.

## Antes de implementar

- [ ] Identificar o commit/branch do site e as versões realmente instaladas do sistema, Babele e módulo.
- [ ] Guardar o JSON original e uma cópia do módulo local quando for substituí-lo.
- [ ] Identificar separadamente nome visual, `bonusName`, `bonusTo`, UUID e slug.
- [ ] Confirmar no mapa e com `fromUuid` o documento que deve ser importado.
- [ ] Determinar se a correção afeta importação, ganho natural de talento ou ambos.
- [ ] Conferir os problemas pendentes em [Diagnóstico](troubleshooting.md#limitações-confirmadas-ou-a-verificar).

## Site e exportação

| Cenário | Resultado esperado |
| --- | --- |
| Seleção manual de cada classe disponível | Classe pode ser escolhida; nenhum erro inicial interrompe o fluxo |
| Geração aleatória | Respeita opções e termina com escolhas concretas |
| Personagem salvo/compartilhado | Reconstrução conserva talentos, escolhas e idiomas |
| Exportação pela ficha recém-gerada e pela ficha reconstruída | Mesmos identificadores e escolhas para o mesmo personagem |
| Aumentos de atributos | `stats`, `rolledStats` e bônus não causam aplicação dupla |
| Escolha de arma/armadura/remédio/magia | Alvo persiste em `bonusTo` ou no campo de opções previsto |
| Talento secundário da Lótus Negra | Exporta bônus do talento adquirido, sem bônus vazio da ação de rolar tabela |
| Formatação das descrições | Rótulo e valor na mesma linha; espaço vertical entre blocos |

Confira ambas as funções de exportação em `final.js`, além de `normalizedTalentRecord` e dos caminhos manual/aleatório em `class.js`.

## Importação e efeitos

| Caso | Resultado esperado |
| --- | --- |
| Assassino: `Morale18` | Documento Testes de Moral com CD 18 encontrado |
| Assassino antigo: `AssassinLotusMoral` | Mesmo documento após normalização pelo módulo |
| Demais 12 aliases do Assassino | Chave oficial correta; nível e efeitos originais preservados |
| Bônus já oficial | Continua funcionando sem alteração indevida |
| Patrulheiro à distância | `Plus1ToHitAndDamage_Ranged attacks` resolvido; ataque/dano recebem os bônus previstos |
| Patrulheiro corpo a corpo | Chave correspondente resolvida; bônus não vai para ataques indevidos |
| Maestria em Armas | Efeitos de ataque e dano apontam à arma escolhida |
| Duas seleções de Maestria | Uma cópia correta por seleção; seleção anterior não é perdida |
| Patrulheiro com Longbow d12 | Efeito de upgrade aponta à arma real e a rolagem usa d12 conforme a regra |
| Maestria em Armaduras | +1 CA apenas com a armadura escolhida |
| Vantagem em Conjuração | Vantagem na magia escolhida; outra magia não a recebe |
| Magias conhecidas do Mago | Itens de magia realmente criados, além de textos na ficha |
| Herbalismo: Curative/Curativa | Efeito aponta ao slug da habilidade real Curativa |
| Herbalismo: Stimulant/Estimulante | Efeito aponta a Estimulante; Curativa permanece sem bônus adicional |
| Herbalismo: Salve/Foebane traduzidos | Seleção funciona com os nomes originais preservados; registrar comportamento sem esses metadados |
| Escolha entre talentos fixos | Mantém o selecionado e remove somente as alternativas pertinentes |
| Modelo de compêndio | Permanece reutilizável, sem gravar a escolha de um personagem no original |
| Novo ator | Nível do talento, ativação, transferência e valores de efeitos coerentes |

## Lótus Negra: conferir o índice, além da importação

- [ ] d12 2 → `ParalyseOnWeaponHit`.
- [ ] d12 3 → `ADVonDEXToAvoidEntrapment`.
- [ ] d12 4 → `Plus1ACWhenDualWield`.
- [ ] d12 5 → `PlusOneHitDie`.
- [ ] d12 6 → `TripleDamageAssassinate`.
- [ ] d12 7 → `Morale18`.
- [ ] d12 8 → `WalkOnWater`.
- [ ] d12 9 → `MakeAsleep`.
- [ ] d12 10 → `WalkOnWalls`.
- [ ] d12 11 → `Plus1ToMeleeDamage`.
- [ ] d12 12 → `Invisible`, sem acesso a item indefinido.
- [ ] d12 1 → dois talentos; quaisquer novos resultados 1 são rerrolados.
- [ ] A política de manter/rerrolar duplicados respeita a regra apresentada.
- [ ] Ras-Godai 3–6 e a escolha 12 preservam os resultados secundários na exportação.

## Ganho natural e idioma

Execute o cenário afetado em português com Babele e em inglês:

- [ ] Tabela de talentos aparece no seletor da classe.
- [ ] A classe aponta para a RollTable correta.
- [ ] Avanço de nível/arrastar talento abre a escolha exigida pela regra.
- [ ] Nome do item e nome do efeito podem ser traduzidos sem quebrar o diálogo.
- [ ] Confirmação aplica a escolha à cópia adquirida.
- [ ] Cancelamento não concede uma escolha incorreta ou efeito funcional genérico por engano.
- [ ] Uma aquisição posterior com outra opção não sobrescreve a primeira.
- [ ] Slug final corresponde ao item realmente rolado naquele idioma.

Testar somente o JSON importado não cobre esses caminhos.

## Verificações técnicas proporcionais

Com Node instalado:

```powershell
node --check class.js
node --check final.js
node --check foundry-module/terraoeste-foundry-choice-guard/main.mjs
```

Para os exemplos versionados:

```powershell
node -e "const fs=require('node:fs'); for(const f of fs.readdirSync('docs/examples')) { if(f.endsWith('.json')) JSON.parse(fs.readFileSync('docs/examples/'+f,'utf8')); } console.log('JSONs válidos');"
```

Esses comandos verificam sintaxe e estrutura JSON. Testes adicionais devem usar entradas que reproduzam o defeito e o comportamento esperado. O mapa e a resolução de documentos precisam refletir a instalação alvo; um mock de `fromUuid` não comprova existência de item.

## Antes e depois de publicar

- [ ] Os links da documentação e os arquivos dos exemplos existem.
- [ ] A versão do módulo foi alterada quando seu código foi alterado.
- [ ] O pacote distribui os arquivos certos na pasta de módulo correta.
- [ ] O commit foi publicado na branch esperada; informar se houve merge em `main`.
- [ ] O estado da implantação do site foi conferido quando necessário; merge não é confirmação automática de deploy concluído.
- [ ] O módulo local foi atualizado quando autorizado; comparar arquivos e guardar backup.
- [ ] O cliente do Foundry recarregou; conferir versão após reiniciar o processo quando o manifesto mudou.
- [ ] A importação de um exemplo foi conferida na interface quando disponível.
- [ ] O relato final separa verificações executadas, verificações não executadas e limitações.
- [ ] Atualizar contrato, diagnóstico e este roteiro quando houver uma nova causa ou novo identificador.

Este roteiro não garante ausência de falhas futuras. Ele registra os pontos que produziram erros reais e ajuda a detectar regressões antes da publicação.
