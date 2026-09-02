# Sinal Verde CRM

CRM comercial da operação Sinal Verde: captura, distribuição e atendimento de leads de crédito consignado e produtos correlatos.

Site institucional (produto B2C/B2B de trânsito): https://sinalverde.net/  
CRM de produção: https://acesso-sinalverde.com  
Git: `walkup-tec/sinal-verde-pro`  
Workspace oficial no PC: `E:\01A-Drax-Servidor\CRM-SinalVerde`

## Objetivo

Dar à equipe comercial um fluxo único para:

- importar e cadastrar clientes/leads
- distribuir carteira por categoria ou usuário
- atender, agendar retorno e registrar histórico
- acompanhar pipeline no Kanban, Agenda e Remarketing
- configurar produtos, status, bancos, operação e permissões

## Stack

- TanStack Start (React 19, file-based routes)
- TypeScript, Vite 7, Tailwind v4, shadcn/ui
- Postgres via `postgres.js` (schema `crm` no Supabase)
- Fallback JSON em `data/` quando `DATABASE_URL` está ausente
- Auth por sessão criptografada (cookie `sinal-verde-session`)
- E-mail transacional com Nodemailer (Gmail SMTP)
- Deploy: Docker + Nitro `node-server` no Easypanel (porta 3000)

## Estrutura

| Pasta | Função |
|---|---|
| `src/routes` | Rotas TanStack (login + `/app/*`) |
| `src/components` | UI de clientes, agenda, kanban, settings, shadcn |
| `src/lib/auth` | Sessão, senha PBKDF2, menus por categoria |
| `src/lib/clients` | Repositórios, importação Excel, bulk, anexos |
| `src/lib/config` | Settings, produtos, campos, menus |
| `src/lib/db` | Pool Postgres, seed, índices, keepalive |
| `src/lib/users` | CRUD de usuários |
| `src/lib/mail` | SMTP e templates |
| `doc/` | Logs cronológicos de mudança (`LOG-*.md`, `memoria.md`) |
| `docs/project-memory/` | Memória permanente estruturada |
| `scripts/` | Manutenção (keepalive, purge, testes de DB) |

Logs detalhados de cada correção ficam só em `doc/`. Esta pasta não replica histórico.
