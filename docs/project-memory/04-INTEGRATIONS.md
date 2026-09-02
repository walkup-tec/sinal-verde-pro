# Integrações

## Supabase / Postgres

- Pooler na `DATABASE_URL` (porta 6543, SSL).
- Plano Free pausa ~7 dias sem query. Mitigações:
  - workflow `.github/workflows/supabase-keepalive.yml`
  - `npm run db:keepalive`
  - tabela `crm.supabase_keepalive` + heartbeat no processo (`postgres.ts`)
- Sem `DATABASE_URL`, login e CRUD usam JSON local.

## E-mail (Nodemailer)

Variáveis: `MAIL_MODE`, `MAIL_FROM`, `SMTP_*`.

- `MAIL_MODE=off` — não envia (padrão para local).
- `MAIL_MODE=smtp` — Gmail (ou outro SMTP) no create/reenvio de senha.
- Templates: boas-vindas e senha temporária. Link usa `APP_URL`.

## Easypanel / VPS

- Projeto: `sinal-verde` / serviço `acesso-sinalverde`
- Domínio: `acesso-sinalverde.com`
- Fonte: GitHub `walkup-tec/sinal-verde-pro` (`main`)
- Heal pós-deploy: `.github/workflows/heal-pos-deploy.yml` (SSH isolado; **não** patcha Traefik/WABA)
- Restart diário: `.github/workflows/sinal-verde-daily-restart.yml`
- Gateway interno histórico: porta `30310`

## Auth de sessão

Cookie httpOnly `sinal-verde-session`. `SESSION_SECRET` obrigatório em produção.

## Fora deste CRM

WhatsApp/Evolution, Cloudflare Workers e Wrangler ficaram fora do runtime atual. Export Excel usa o padrão de telefone Evolution (`55` + dígitos) para disparo externo, sem chamar a API daqui.
