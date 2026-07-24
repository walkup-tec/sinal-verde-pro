# LOG — Ambiente host local formalizado

## Pedido
Ambiente host local no Sinal Verde para testar coisas novas sem publicar.

## Feito
- Script `npm run dev:local` → `127.0.0.1:8080` (strictPort)
- Script `npm run preview:local`
- Guia `doc/AMBIENTE-HOST-LOCAL.md`
- `.env.example` atualizado (APP_URL local + MAIL_MODE=off sugerido)

## Como usar
```bash
cd D:\CRM-SinalVerde
npm run dev:local
```
Abrir http://127.0.0.1:8080/login

## Atenção
`.env.local` atual pode apontar ao mesmo Postgres/Supabase de produção — testes que gravam dados afetam produção até existir staging.

## Keywords
host local, localhost, dev:local, 8080, ambiente teste
