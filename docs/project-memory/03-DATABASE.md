# Banco de dados

Schema: `crm` no Postgres (Supabase). Sem `DATABASE_URL`, a aplicação cai para JSON em `data/`.

## Tabelas centrais

| Tabela | Função |
|---|---|
| `crm.users` | Usuários (hash PBKDF2, categoria, role) |
| `crm.user_categories` | Tipos de usuário + `home_menu_id` |
| `crm.user_category_menus` | Menus liberados por categoria |
| `crm.products` / `crm.product_fields` | Catálogo comercial |
| `crm.clients` | Leads (campos dinâmicos em JSON/colunas) |
| `crm.client_products` | N:N cliente–produto |
| `crm.client_assignments` | Carteira por usuário |
| `crm.client_attendances` | Histórico de atendimento |
| `crm.client_attachments` | Metadados de arquivos |
| `crm.client_schedules` | 1 agenda por cliente (`contact_date`) |
| `crm.attendance_statuses` | Status (label, color, kind, auto_return_days) |
| `crm.banks` / `crm.operations` | Catálogos de select |
| `crm.client_field_catalog` | Seções/campos editáveis (JSON) |
| `crm.import_jobs` / `crm.import_uploads` | Jobs de planilha |
| `crm.supabase_keepalive` | Ping periódico (plano Free) |

## Índices relevantes

- `idx_clients_created_at` — listagem paginada
- `idx_client_assignments_user_client` — escopo por atendente
- `idx_client_schedules_contact_date` — agenda/remarketing
- `idx_client_attendances_client_created` / `idx_client_attachments_client_created`

DDL auxiliar corre na subida do pool (`ensure-client-indexes.ts`, `settings.repository.ts`). Seed inicial: categorias Master/Atendente/Gerente, produtos CLT/FGTS, usuário `master-mozart`.

## Fallback JSON

Arquivos gitignored em `data/`: `users.json`, `master-user.json`, `system-settings.json`, `clients.json`. Usar só em ambiente isolado — nunca apontar o `.env.local` de teste destrutivo para o pool de produção.
