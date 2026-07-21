# HSTS no app Sinal Verde (só CRM)

## Contexto

Chrome mostrava "Não seguro" em `acesso-sinalverde.com`. Diagnóstico no VPS confirmou certificado **Let's Encrypt válido**. O selo do Chrome em muitos casos era página em **HTTP** ou falta de HSTS para forçar HTTPS no navegador.

## Solução

Em `src/server.ts` (entry do fetch):

- Header `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Só quando `X-Forwarded-Proto=https` (ou URL https) — atrás do Traefik
- Sem `preload` (não registrar no Chromium)
- Escopo: só o CRM Sinal Verde; não altera Traefik/WABA/Soma

## Validar após redeploy

```bash
curl -sSI -H "X-Forwarded-Proto: https" https://acesso-sinalverde.com/login | grep -i strict
# esperado: Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Palavras-chave

HSTS, Strict-Transport-Security, Não seguro, X-Forwarded-Proto
