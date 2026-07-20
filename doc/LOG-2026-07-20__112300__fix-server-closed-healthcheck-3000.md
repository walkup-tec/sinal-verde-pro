# LOG — Server closed / 502 Sinal Verde

**Data:** 2026-07-20  
**Sintoma:** Listening 3000 → `Server closed successfully` → HTTPS 502

## Causa provável

`Server closed successfully` vem do graceful shutdown do srvx (SIGTERM/SIGINT).  
Easypanel costuma healthcheck na porta **80** enquanto o app escuta **3000** → mata o processo.

## Correção

1. Easypanel → Healthcheck / Porta do app = **3000**
2. Dockerfile: `NITRO_HOST=0.0.0.0` + HEALTHCHECK em `:3000`
