# Decisões técnicas

## 2026-07-16 — Runtime Node no Easypanel, não Bun

- Motivo: `bun run build` emitia `Bun.serve`; o container Node caía com “Bun is not defined”.
- Impacto: Dockerfile usa `node ./node_modules/vite/bin/vite.js build` + Nitro preset `node-server`. Porta interna 3000. Healthcheck Docker desativado (Easypanel/Swarm na porta errada gerava SIGTERM).

## 2026-07-16 — Deploy via Easypanel, não Cloudflare Workers

- Motivo: o alvo operacional passou a ser VPS/Easypanel (`acesso-sinalverde.com`).
- Impacto: `DEPLOY_TARGET=node`; Wrangler permanece só como resquício de scaffold.

## 2026-07-21 — Heal pós-deploy isolado

- Motivo: script antigo patchava `main.yaml`/WABA no Traefik e derrubava outros serviços.
- Impacto: workflow só publica o gateway do Sinal Verde e faz strip seguro de chaves SV.

## 2026-07-21 — Role segue a categoria

- Motivo: `role=master` gravado separado da categoria quebrava distribuição e menu Usuários.
- Impacto: `withDerivedRole` / `roleForCategory`; Master de categoria é master; menu Usuários vem de `menuIds`.

## 2026-07-22 — Distribuição inclui usuários Master de categoria

- Motivo: “Para todos” excluía `role=master` e resultava em “Nenhum usuário elegível”.
- Impacto: destinatários = todos menos a conta sistema `MASTER_USER_ID`.

## 2026-07-14 — Importação por streaming XML

- Motivo: `XLSX.read` em planilhas ~540k linhas estourava memória.
- Impacto: parser `xlsx-zip-stream`, bulk insert em lotes de 5000, barra de progresso no job.

## 2026-06-11 — Postgres primeiro, JSON como fallback

- Motivo: persistir operação real no Supabase sem impedir desenvolvimento offline.
- Impacto: repositories bifurcam em `isDatabaseEnabled()`.

## 2026-07-24 — Keepalive do Supabase Free

- Motivo: pausa por inatividade derrubava o login.
- Impacto: GitHub Action + heartbeat no pool + `crm.supabase_keepalive`.
