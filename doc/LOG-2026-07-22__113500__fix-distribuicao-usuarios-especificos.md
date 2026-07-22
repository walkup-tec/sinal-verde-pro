# LOG — Fix distribuição de leads (usuários específicos vazios)

## Contexto do pedido

Na importação de clientes (Passo 4 — Distribuição), ao marcar **Para usuário(s) específico(s)**, o campo de escolha múltipla aparecia vazio. O usuário Thiago Souza (categoria Master) não conseguia selecionar destinatários.

## Causa

1. `listUsersForImportFn` filtrava `role !== "master"`. Após o perfil seguir a categoria Master, usuários Master sumiam da lista (e a caixa ficava vazia).
2. Em `mapUserRow`, `category_id` nulo era defaultado para `cat-master`, promovendo indevidamente usuários a Master e agravando o filtro acima.
3. A UI usava checklist sem select de múltipla escolha explícito.

## Solução

1. Listar todos os usuários reais para distribuição, excluindo só a conta sistema (`MASTER_USER_ID`).
2. Não defaultar `category_id` nulo para Master; `withDerivedRole` não promove sem categoria.
3. Trocar checklists por `MultiSelectFilter` (select multi) para categorias e usuários.
4. Exibir toast se a carga de usuários falhar (antes falhava em silêncio).

## Arquivos alterados

- `src/lib/clients/clients.server.ts`
- `src/lib/users/user.repository.ts`
- `src/components/clients/lead-distribution-form.tsx`
- `src/components/clients/client-import-wizard.tsx`
- `src/components/clients/client-create-manual-dialog.tsx`

## Como validar

1. Login como Thiago (ou Master) → Clientes → Importar.
2. Passo 4 → marcar **Para usuário(s) específico(s)**.
3. Abrir o select e marcar um ou mais usuários.
4. Importar e confirmar que só os escolhidos (não-Master) veem a lista; Masters continuam vendo tudo pela regra de acesso.

## Segurança

Sem exposição de segredos. Apenas Sinal Verde.

## Palavras-chave

importar clientes, distribuição leads, usuários específicos, multi-select, listUsersForImportFn, Thiago Souza, role master, category_id null
