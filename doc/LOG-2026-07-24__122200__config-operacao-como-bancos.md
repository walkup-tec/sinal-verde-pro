# LOG — Configurações: Operação

## Contexto

Novo menu em Configurações, no mesmo estilo de Bancos: cadastrar opções de **Operação** que aparecem como campo nos produtos/clientes.

## Solução

- `SystemSettings.operations` + tabela `crm.operations`
- UI `operations-settings.tsx` e aba **Operação**
- Campo built-in `operacao` em Dados financeiros (select via `ClientFieldInput`)
- `mergeBuiltinFieldsIntoGroups` injeta o campo em catálogos já salvos

## Validar (localhost)

1. Configurações → Operação → cadastrar e salvar
2. Produtos → campo Operação disponível
3. Cadastro manual: select com as opções

## Keywords

operacao, operations, bancos, configurações
