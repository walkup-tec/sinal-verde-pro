# Campo Data do contrato

## Pedido
Em Configurações → Produtos → Dados financeiros: adicionar campo **Data do contrato**.

## Feito
- `client-fields.ts`: id `data_contrato` no grupo financeiros
- `client-field-input.tsx`: máscara dd/mm/aaaa (mesmo padrão das outras datas)
- Campo entra automaticamente em Produtos via `ALL_CLIENT_FIELD_IDS` / `normalizeProductFields`

## Validação
1. Configurações → Produtos → Dados financeiros → listar **Data do contrato**
2. Marcar como disponível/obrigatório no produto
3. Cadastro/importação/atendimento exibe input com placeholder dd/mm/aaaa

## Keywords
data_contrato, Data do contrato, campos financeiros, produtos
