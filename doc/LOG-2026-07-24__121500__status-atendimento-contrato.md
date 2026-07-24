# LOG — Status: Atendimento vs Contrato

## Contexto

Configurações → Status (antes “Status de atendimento”): master precisa classificar cada status como Atendimento ou Contrato. Na tela de atendimento do cliente, os dois status são definidos separadamente.

## Solução

1. `AttendanceStatusConfig.kind`: `"atendimento" | "contrato"` (obrigatório; legado → atendimento).
2. Coluna Postgres `crm.attendance_statuses.kind`.
3. Cliente: `contractStatus` + coluna `crm.clients.contract_status`.
4. UI Status: título “Status” + rádio Atendimento/Contrato.
5. Dialog de atendimento: dois selects (atendimento + contrato). Contrato com mesmo fluxo (histórico + retorno automático).
6. Kanban / filtros / bulk usam só status `kind=atendimento`.

## Validar (localhost)

1. Configurações → Status → cadastrar um de Contrato e salvar.
2. Abrir atendimento de um cliente → definir os dois status.
3. Conferir histórico e, se houver retorno automático, Agenda.

## Keywords

status, contrato, atendimento, kind, contractStatus, Status
