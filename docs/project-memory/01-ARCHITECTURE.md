# Arquitetura

Aplicação monolítica TanStack Start: o mesmo processo serve UI (SSR) e server functions.

## Fluxos principais

1. **Login** → `loginFn` valida e-mail/senha → cookie de sessão → redireciona para `homeMenuId` da categoria.
2. **Importação** → wizard (produto, Excel, indexação de colunas, distribuição) → job no servidor com parse XML em stream → bulk insert (lotes de 5000) → assignments e agenda opcional.
3. **Cadastro manual** → modal 3 passos (produto, campos, distribuição).
4. **Atendimento** → modal largo: dados do lead + histórico + anexos + troca de status (gera nota no histórico). Status com `autoReturnDays` cria/atualiza agenda.
5. **Listagens** → Clientes, Agenda e Remarketing reutilizam a mesma tabela (`ClientsDataTable`) com queries paginadas (LIMIT/OFFSET).
6. **Kanban** → colunas por status, semanal ou mensal; card abre o modal de atendimento.
7. **Configurações** → persistidas no schema `crm` (ou `data/system-settings.json` no fallback). Save incremental por seção.

## Módulos de menu

Fonte única: `src/lib/config/menu-items.ts`.

- Operação: Dashboard, Clientes
- Comercial: Kanban, Remarketing, Agenda
- Gestão: Usuários, Configurações

Sidebar e rotas filtram por `menuIds` da categoria. Categoria Master recebe todos os menus.

## Persistência

- Com `DATABASE_URL`: Postgres (Supabase pooler). Repositories em `src/lib/*/*.repository.ts`.
- Sem `DATABASE_URL`: arquivos em `data/` (`users.json`, `master-user.json`, `system-settings.json`, `clients.json`).
- Anexos: upload chunked (1 MB) em disco + metadados em `crm.client_attachments`.

## Auth

- Hash PBKDF2 (100k iterações, SHA-256).
- Conta sistema `master-mozart` / `mozart@sinalverde.com` (aliases: `mozart.pmo@gmail.com`, `mozart.sinalverde.com`, `walkup@walkuptec.com.br`).
- `role` deriva da categoria: `cat-master` ⇒ `master`. Menu Usuários é liberado pela categoria, não por role fixo.
- Sessão reenriquecida a cada request (`getAuthSessionFn`) com cache curto (10s).

## Importação Excel

Planilhas grandes não passam por `XLSX.read` completo. O parser usa streaming XML (`xlsx-zip-stream`) para evitar OOM. A prévia lê só as primeiras linhas.
