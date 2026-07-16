# LOG — Fix Deploy Easypanel: Nitro Node (sem Wrangler/Bun)

**Data:** 2026-07-16  
**Causa:** `wrangler dev` no container Bun falhou — Wrangler não suporta Bun; `workerd-linux-64` ENOENT.

## Correção

- `DEPLOY_TARGET=node` desliga Cloudflare no Lovable config e ativa `nitro/vite`
- Dockerfile: build bun + `DEPLOY_TARGET=node` → runtime `node:22` com `node .output/server/index.mjs`
- Validação local: `vite build` → `.output/server/index.mjs` OK

## Doc

https://tanstack.com/start/latest/docs/framework/react/guide/hosting (Nitro / Node.js Docker)

## Easypanel

Redeploy do serviço `acesso-sinalverde` após push.
