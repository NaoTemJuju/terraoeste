# TerraOeste: escolhas de talentos no Foundry

Módulo de compatibilidade com o sistema Shadowdark. Versão documentada: **0.8.8**. O manifesto declara Foundry mínimo 13 e verificado 14; isso não garante compatibilidade com todas as versões do sistema e de módulos de tradução.

## Instalação manual

1. Localize a pasta de dados usada pelo seu Foundry, pelo próprio aplicativo/configuração.
2. Guarde uma cópia da instalação anterior do módulo.
3. Feche o Foundry para a instalação inicial ou para atualização completa do pacote.
4. Copie a pasta `terraoeste-foundry-choice-guard` para `Data/modules/` da pasta de dados. Evite uma pasta duplicada aninhada.
5. Confira a presença de `module.json` e `main.mjs` diretamente dentro da pasta do módulo.
6. Abra o Foundry, entre no mundo Shadowdark e habilite **TerraOeste: escolhas de talentos**.
7. Recarregue os clientes conectados e confira a versão e os efeitos no personagem de teste.

Em uma instalação Windows comum, a pasta pode estar em `%LOCALAPPDATA%\FoundryVTT\Data\modules`, mas o caminho real pode ter sido personalizado. Confira-o antes de copiar arquivos.

O manifesto atual não declara `manifest`/`download`. A URL raw de `module.json` não constitui, por si só, um mecanismo completo de instalação/atualização automática.

## Atualização de uma instalação ativa

Atualizar somente `main.mjs` de um módulo já ativo normalmente exige recarregar o cliente para carregar o script novo. Alterações de manifesto, instalação inicial e descoberta de módulos podem exigir reiniciar o processo do Foundry. Fazer merge no GitHub não atualiza a pasta local.

A correção não retroage automaticamente sobre todos os personagens já existentes. Reimporte um personagem de teste ou readquira/reconfigure o talento conforme o caso. Preserve personagens de campanha antes de substituir dados.

## O que o módulo adapta

- Escolhas de talentos/habilidades declaradas em `terraOesteChoices`.
- Maestria em Armas e Maestria em Armaduras.
- Dado d12 do Patrulheiro para a arma selecionada.
- Vantagem em Conjuração para uma magia.
- Vantagem em Herbalismo para um remédio, na importação e no ganho natural.
- Descoberta de tabelas e seletores de efeitos com nomes traduzidos pelo Babele.
- Os 13 identificadores antigos do Assassino, normalizados para o mapa oficial do importador na versão 0.8.8.

O módulo adapta cópias dos itens originais de compêndio e envolve pontos da API do Shadowdark em `Hooks.once("ready")`. Não exige edição dos arquivos do sistema Shadowdark.

## Diagnóstico

- [Contrato completo de identificadores, JSON e efeitos](../../docs/foundry-integration.md).
- [Soluções e limitações atuais](../../docs/troubleshooting.md).
- [Roteiro de regressão](../../docs/regression-checklist.md).
- [Exemplo oficial do Assassino com Morale18](../../docs/examples/assassino-moral18.json).
- [Exemplo antigo para testar compatibilidade](../../docs/examples/assassino-moral18-legacy.json).

`REPLACEME` no modelo de compêndio é esperado quando existe um parâmetro a escolher. Na cópia adquirida com escolha confirmada, confira se a chave foi resolvida para o item correto. Não confunda o nome do talento com a chave que efetivamente altera a rolagem.

## Estado de validação

A correção 0.8.8 teve verificação de sintaxe, reprodução da falha com o código do importador instalado, comparação das 13 chaves com o mapa oficial e verificações da tabela d12. A resolução de documentos foi simulada nesses testes. A lista de cenários que precisam de conferência visual/rolagem está no roteiro de regressão.

Problemas de slugs em outros idiomas, armas sem índice e remédios sem metadados Babele estão registrados como limitações, sem garantia de resolução na versão 0.8.8.
