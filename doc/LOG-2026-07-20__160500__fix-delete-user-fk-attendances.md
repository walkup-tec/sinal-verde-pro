# LOG — Excluir usuário com atendimentos (FK)

**Data:** 2026-07-20 ~16:05  
**Erro:** `client_attendances_user_id_fkey` ao excluir usuário

## Fix

`deleteUserById` em transação:
1. `client_attendances.user_id` → master (mantém `user_name` histórico)
2. `client_attachments.user_id` → master
3. remove `client_schedules` e `client_assignments` do usuário
4. delete `crm.users`

## Keywords

excluir usuário, foreign key, client_attendances
