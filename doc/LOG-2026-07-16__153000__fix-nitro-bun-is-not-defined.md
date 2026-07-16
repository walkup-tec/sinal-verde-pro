# LOG — Fix `Bun is not defined` no Easypanel

**Data:** 2026-07-16  
**Sintoma:** serviço amarelo; crash `ReferenceError: Bun is not defined` em `srvx.mjs` → `Bun.serve`.

## Causa

Build Docker com `bun run build` fez o Nitro/srvx emitir `BunServer`. Runtime é `node:22` → Bun inexistente.

## Correção

- `nitro({ preset: "node-server" })` + `NITRO_PRESET=node-server`
- Dockerfile: `node ./node_modules/vite/bin/vite.js build` (não `bun run`)

## Validação local

`.output/server/_libs/srvx.mjs` → `serve()` instancia `NodeServer` (não `BunServer`).
