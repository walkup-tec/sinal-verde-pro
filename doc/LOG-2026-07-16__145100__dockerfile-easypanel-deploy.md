# LOG — Dockerfile para Deploy Easypanel

**Data:** 2026-07-16  
**Repo:** walkup-tec/sinal-verde-pro  
**Serviço Easypanel:** sinal-verde / acesso-sinalverde

## Contexto

Publicação do CRM em VPS Easypanel (`acesso-sinalverde.com` → `2.57.91.91`).  
Stack: TanStack Start + Cloudflare vite plugin → runtime via Wrangler local no container.

## Arquivos

- `Dockerfile` — multi-stage bun build + runner
- `docker-entrypoint.sh` — gera `.dev.vars`/`.env.local` e sobe Wrangler `--local` na porta 3000
- `.dockerignore`
- `package.json` — script `start`
- `.gitignore` — `.env.easypanel`

## Easypanel (checklist)

- Fonte: Github `sinal-verde-pro` / `main`
- Construção: Dockerfile
- Porta: 3000
- Domínios: acesso-sinalverde.com + www
- Env: copiar de `.env.easypanel` local
- Ação do usuário: Deploy / Redeploy
