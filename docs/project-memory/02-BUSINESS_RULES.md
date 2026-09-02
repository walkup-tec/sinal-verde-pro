# Regras de negócio

## Clientes e produtos

- Todo lead pertence a um ou mais produtos (`crm.client_products` + `product_id` legado).
- Produtos padrão de seed: Empréstimo CLT e Antecipação FGTS. O master cria, edita e exclui produtos.
- Campos obrigatórios/disponíveis são por produto. O master pode editar títulos de seção e criar/excluir campos (`settings.fieldGroups` + `crm.client_field_catalog`).
- Banco e Operação são campos opcionais em todos os produtos; as opções vêm de Configurações.

## Distribuição de leads

- Modos: todos os usuários, categorias, ou usuários específicos.
- Destinatários = todos os usuários **exceto** a conta sistema `master-mozart`. Usuários com categoria Master (role master) entram na lista.
- Na importação, o agendamento de contato usa o atendente da distribuição, não o usuário logado.

## Status

- Cada status tem `kind`: **atendimento** ou **contrato**.
- Status `Pago` conta como atendimento concluído no dashboard e na agenda.
- Troca de status gera registro no histórico de atendimento.
- `autoReturnDays` (1–90) cria agenda automática no usuário que atribuiu.

## Permissões

- Categoria define menus visíveis e a tela inicial (`homeMenuId`).
- Quem tem menu Clientes ganha Kanban automaticamente (`ensureKanbanMenuForClientCategories`).
- Master vê todos os clientes; demais usuários veem só a carteira atribuída (`client_assignments`).
- Menu Usuários segue a categoria, não um role hardcoded.

## Importação

- Sem teto de quantidade (`CLIENT_DATABASE_LIMIT = null`).
- Primeira linha do Excel pode ser cabeçalho ou não.
- Telefone exportado no padrão Evolution: `55` + dígitos.

## Escopo das listagens

- **Agenda:** clientes com `client_schedules` no escopo do usuário.
- **Remarketing:** mesma base de agenda, filtros Hoje / Semana / Próximos 15 / Próximos 30 (semana e 15/30 começam em amanhã).
- **Kanban Status:** default “Todos”; limite alto (5000) para não esconder colunas.
