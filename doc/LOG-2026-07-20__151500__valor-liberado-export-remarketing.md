# LOG — Valor liberado na lista + Export Remarketing + copy modal

**Data:** 2026-07-20 ~15:15  
**Repo:** CRM-SinalVerde (`sinal-verde-pro`)

## Pedidos

1. Remover do modal Exportar a frase sobre Evolution API / `5551…`
2. Coluna **Valor liberado** na lista (antes de Status), `---` ou máscara `R$`
3. Remarketing: botão **Exportar** com o mesmo Excel da ação em massa de Clientes

## Solução

- Modal: só texto genérico do Excel
- `formatCurrencyBrlDisplay` + `ClientListItem.valorLiberado` + SQL `data->>'valor_liberado'`
- `ClientsDataTable` coluna antes de Status
- `exportRemarketingFn` + botão na fila de remarketing (IDs da lista filtrada)

## Keywords

valor liberado, export remarketing, bulk excel, modal
