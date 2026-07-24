# LOG — Catálogo editável de seções/campos (Produtos)

## Contexto

Na tela Configurações → Produtos, master precisava editar títulos das seções (ex.: “Dados pessoais”) e acrescentar/excluir campos, mantendo a UI atual.

## Solução

1. `SystemSettings.fieldGroups` — catálogo persistido (seed = `CLIENT_FIELD_GROUPS`).
2. Postgres: tabela `crm.client_field_catalog` (jsonb), criada sob demanda; salva junto da seção `products`.
3. UI `products-settings.tsx` (só `role === "master"`):
   - título da seção editável (input + blur salva)
   - “+ Novo campo” por seção
   - lixeira por linha + confirmação
4. Labels/grupos no cadastro/import/atendimento passam a usar `settings.fieldGroups`.

## Arquivos

- `src/lib/config/client-fields.ts`
- `src/lib/config/settings-types.ts`
- `src/lib/config/settings-defaults.ts`
- `src/lib/config/settings.repository.ts`
- `src/components/settings/products-settings.tsx`
- `src/lib/clients/product-fields.ts`
- `src/components/clients/client-attendance-dialog.tsx`
- `src/components/clients/client-create-manual-dialog.tsx`
- `src/components/clients/client-import-wizard.tsx`

## Validar (localhost)

1. `npm run dev:local` → http://127.0.0.1:8080
2. Login master → Configurações → Produtos
3. Renomear seção, adicionar campo, excluir campo
4. Confirmar que cadastro manual/import refletem o catálogo

## Observações

- Sem deploy nesta etapa.
- `.env.local` costuma apontar ao Postgres de produção: salvar configurações no local grava no banco compartilhado.
- Campos customizados entram como texto livre (máscaras especiais só nos IDs built-in).

## Keywords

produtos, fieldGroups, seções, master, catálogo campos, client_field_catalog
