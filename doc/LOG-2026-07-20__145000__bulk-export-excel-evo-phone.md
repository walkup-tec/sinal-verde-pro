# LOG — Exportar Excel em ação em massa (telefone EVO)

**Data:** 2026-07-20 ~14:50  
**Repo:** `E:\01A-Drax-Servidor\CRM-SinalVerde` (`sinal-verde-pro`)

## Pedido

No modal **Ações da seleção**, antes de **Exclusão**, adicionar **Exportar**: gerar/baixar Excel com todos os campos dos leads; coluna telefone (e WhatsApp) no formato Evolution API (`55` + DDD + número, só dígitos).

## Solução

1. `normalizeEvoWhatsAppNumber` em `src/lib/masks/br-phone.ts`
2. `listClientsForBulkExport` em `client-bulk.repository.ts` (mesmo escopo ids/filtro, máx. 5000)
3. `buildBulkClientsExportWorkbook` em `client-bulk-export.ts` (xlsx + colunas meta + todos `ALL_CLIENT_FIELD_IDS`)
4. `bulkExportClientsFn` em `clients.server.ts` → base64 + download no browser
5. Modal: aba **Exportar** + botão **Baixar Excel**

## Arquivos

- `src/lib/masks/br-phone.ts`
- `src/lib/clients/client-bulk-export.ts` (novo)
- `src/lib/clients/client-bulk.repository.ts`
- `src/lib/clients/clients.server.ts`
- `src/components/clients/client-bulk-actions-modal.tsx`

## Validar

1. Clientes → selecionar leads → Ações → **Exportar** → Baixar Excel
2. Abrir xlsx: Telefone/WhatsApp como `5551…` (texto)
3. Demais colunas de cadastro presentes; ações Agendar/Produto/Status/Exclusão intactas

## Keywords

exportar, excel, bulk, evo, telefone 55, ações da seleção
