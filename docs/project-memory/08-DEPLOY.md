# Deploy

## Produção

| Item | Valor |
|---|---|
| Domínio | `acesso-sinalverde.com` |
| Git | `walkup-tec/sinal-verde-pro` branch `main` |
| Painel | Easypanel, projeto `sinal-verde`, serviço `acesso-sinalverde` |
| Runtime | Docker (`Dockerfile`) → Node 22 + Nitro `node-server` |
| Porta | 3000 (`HOST=0.0.0.0`) |
| DNS histórico | `2.57.91.91` (confirmar no painel se mudar) |

Push em `main` dispara o build no Easypanel e o workflow `heal-pos-deploy.yml` (SSH isolado). Não usar o heal antigo que alterava Traefik/WABA.

## Variáveis obrigatórias (produção)

- `DATABASE_URL`
- `SESSION_SECRET` (≥ 32 caracteres)
- `APP_URL=https://acesso-sinalverde.com`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (se anexos/storage dependerem)
- `MAIL_MODE=smtp` + `SMTP_*` + `MAIL_FROM`

Modelo: `.env.example`. Valores reais não vão para o Git.

## Checklist

1. Confirmar que a mudança não precisa de staging (o `.env.local` do PC costuma apontar para o **mesmo** Supabase de produção).
2. `npm run build` / `node vite build` com `DEPLOY_TARGET=node` se for validar imagem.
3. Commit só do objetivo da tarefa; push `main` = publicação.
4. Conferir `acesso-sinalverde.com/login` e um fluxo (login + listagem).
5. Se o container cair com “Server closed”, healthcheck do Easypanel deve ser a porta **3000**, não 80.

## Local (não é deploy)

```bash
cp .env.example .env.local
# MAIL_MODE=off
# sem DATABASE_URL = fallback JSON (não toca produção)
npm install
npm run dev:local
```

Guia completo: `doc/AMBIENTE-HOST-LOCAL.md`.
