# Sinal Verde CRM

CRM comercial da Sinal Verde: leads, distribuição, atendimento, agenda, kanban e remarketing.

- Produção: https://acesso-sinalverde.com
- Institucional: https://sinalverde.net
- GitHub: [walkup-tec/sinal-verde-pro](https://github.com/walkup-tec/sinal-verde-pro)
- Workspace oficial: `E:\01A-Drax-Servidor\CRM-SinalVerde`

Memória permanente do projeto: [`docs/project-memory/`](docs/project-memory/00-PROJECT.md).

## Stack

TanStack Start, React 19, TypeScript, Tailwind v4, shadcn/ui, Postgres (Supabase). Deploy em Docker/Nitro no Easypanel.

## Rodar local

Requisitos: Node.js 20+.

```bash
cp .env.example .env.local
```

Preencha `SESSION_SECRET`. Deixe `DATABASE_URL` vazio para usar JSON em `data/` (não toca o banco de produção). Use `MAIL_MODE=off`.

```bash
npm install
npm run dev:local
```

Abra http://127.0.0.1:8080/login

Master (produção): `mozart@sinalverde.com` — senha da operação.  
Neste ambiente cloud, sem Supabase, o login local de preview é `mozart@sinalverde.com` / senha definida em `data/master-user.json` (arquivo gitignored).

**Atenção:** se o `.env.local` do PC tiver `DATABASE_URL` de produção, criar cliente, importar ou apagar dados altera o banco real. Detalhes: `doc/AMBIENTE-HOST-LOCAL.md`.

## Produção

Push em `main` publica no Easypanel (`acesso-sinalverde.com`, porta 3000). Variáveis e checklist: `docs/project-memory/08-DEPLOY.md`.
