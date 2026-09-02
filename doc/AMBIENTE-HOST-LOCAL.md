# Ambiente host local — Sinal Verde CRM

Use este ambiente no **PC** para testar mudanças **sem publicar** no Easypanel.

## URL

- App: **http://127.0.0.1:8080/**
- Login: **http://127.0.0.1:8080/login**

## Pré-requisitos

1. Node.js 20+ (ou Bun, se preferir)
2. Dependências: `npm install` (já feito se existe `node_modules`)
3. Arquivo **`.env.local`** na raiz (não versionar)

Copie o modelo:

```bash
copy .env.example .env.local
```

Preencha Supabase/`DATABASE_URL`/`SESSION_SECRET`.  
`APP_URL=http://localhost:8080`

### E-mail no local (recomendado)

Para não disparar SMTP real durante testes:

```env
MAIL_MODE=off
```

## Subir

```bash
cd E:\01A-Drax-Servidor\CRM-SinalVerde
npm run dev:local
```

Equivalente: `vite` em `127.0.0.1:8080` com `--strictPort` (falha se a porta estiver ocupada).

Pare com `Ctrl+C`.

## O que este ambiente NÃO isola

Hoje o `.env.local` tipicamente usa o **mesmo Supabase/Postgres da produção**.

Isso significa:

| Ação no localhost | Impacto |
|-------------------|---------|
| Criar/editar usuário, cliente, importar leads | **Dados reais** no banco de produção |
| Só UI/layout sem gravar | Baixo risco |

Para testar coisas destrutivas (importação em massa, purge, migrations), peça um **projeto Supabase de staging** e aponte `DATABASE_URL` / `SUPABASE_*` do `.env.local` para ele.

## Produção (não misturar)

| Ambiente | Como sobe |
|----------|-----------|
| Local | `npm run dev:local` → PC |
| Produção | push `main` → Easypanel / Docker (`acesso-sinalverde.com`) |

Nunca rode scripts de purge/migração no local sem confirmar qual `DATABASE_URL` está no `.env.local`.

## Login master (local)

Use um destes e-mails (mesmo usuário master):

- `mozart@sinalverde.com` *(preferencial)*
- `mozart.pmo@gmail.com`
- `mozart.sinalverde.com` (legado)
- `walkup@walkuptec.com.br` (legado)

A senha é a **mesma do master em produção** (CRM Sinal Verde).

Se aparecer “E-mail ou senha incorretos”, confira o e-mail acima — não use conta de outro sistema/usuário comum.

## Checklist rápido

1. `npm run dev:local`
2. Abrir http://127.0.0.1:8080/login
3. Validar a feature
4. Commit/push só quando for para produção
