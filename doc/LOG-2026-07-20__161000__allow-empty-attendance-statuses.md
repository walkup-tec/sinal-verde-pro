# LOG — Permitir zero status de atendimento

**Data:** 2026-07-20 ~16:10
**Pedido:** excluir o unico status e deixar o sistema sem status.

## Fix
- UI: lixeira do ultimo status habilitada; salvar lista vazia permitido
- `normalizeAttendanceStatuses`: nao reintroduz DEFAULT quando vazio
- Load Postgres: `[]` em vez de `undefined` (evitava defaults)

