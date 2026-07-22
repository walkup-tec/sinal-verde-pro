# LOG — Fix "Nenhum usuário elegível" ao distribuir para todos

## Contexto

Importação com **Para todos os usuários** retornava: `Nenhum usuário elegível para receber os leads.`

## Causa

`resolveAssignedUserIds` filtrava `role !== "master"`. Com perfil ligado à categoria Master, a lista de destinatários ficava vazia e a importação abortava.

## Solução

Destinatários = todos os usuários reais, excluindo só a conta sistema (`MASTER_USER_ID`). Mesma regra para categoria e para validação de IDs em "usuários específicos".

## Arquivos

- `src/lib/clients/clients.repository.ts`

## Validar

1. Importar clientes → Distribuição → **Para todos os usuários** → Importar.
2. Não deve aparecer o erro de elegíveis.
3. Usuários (não só Master) devem ver a lista atribuída.

## Keywords

Nenhum usuário elegível, Para todos os usuários, resolveAssignedUserIds, role master
