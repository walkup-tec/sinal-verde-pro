import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@tanstack/react-start/server";
import { sessionCanAccessMenu } from "@/lib/auth/menu-access";
import { sessionConfig } from "@/lib/auth/session-config";
import { buildBulkClientsExportWorkbook } from "@/lib/clients/client-bulk-export";
import { listClientsForBulkExport } from "@/lib/clients/client-bulk.repository";
import { listRemarketingClientsForUser } from "@/lib/clients/clients.repository";
import type { ClientFieldId } from "@/lib/config/client-fields";
import type { RemarketingFilter, RemarketingListQuery } from "@/lib/clients/client.types";

function requireRemarketingAccess() {
  return getSession(sessionConfig).then((session) => {
    const user = session.data;
    if (!user?.userId) throw new Error("Não autenticado.");
    if (!sessionCanAccessMenu(user, "remarketing")) {
      throw new Error("Sem permissão para acessar o Remarketing.");
    }
    return user;
  });
}

const remarketingListSchema = (data: unknown): RemarketingListQuery => {
  if (!data || typeof data !== "object") return { filter: "today" };
  const payload = data as { filter?: string };
  const filter: RemarketingFilter | undefined =
    payload.filter === "week" ||
    payload.filter === "next15" ||
    payload.filter === "next30" ||
    payload.filter === "today"
      ? payload.filter
      : undefined;
  return { filter };
};

export const listRemarketingFn = createServerFn({ method: "POST" })
  .inputValidator(remarketingListSchema)
  .handler(async ({ data }) => {
    const user = await requireRemarketingAccess();
    return listRemarketingClientsForUser(user.userId, user.role === "master", data);
  });

/** Exporta os leads exibidos no filtro atual (mesmo Excel da ação em massa de Clientes). */
export const exportRemarketingFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Dados inválidos.");
    const payload = data as { clientIds?: unknown };
    if (!Array.isArray(payload.clientIds) || payload.clientIds.length === 0) {
      throw new Error("Nenhum cliente para exportar.");
    }
    const clientIds = [
      ...new Set(
        payload.clientIds
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim()),
      ),
    ];
    if (clientIds.length === 0) throw new Error("Nenhum cliente para exportar.");
    return { clientIds };
  })
  .handler(async ({ data }) => {
    const user = await requireRemarketingAccess();
    const rows = await listClientsForBulkExport({
      scope: { mode: "ids", clientIds: data.clientIds },
      actorUserId: user.userId,
      isMaster: user.role === "master",
    });
    const workbook = buildBulkClientsExportWorkbook(
      rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        status: row.status,
        createdAt: row.createdAt,
        produtos: row.produtos,
        data: row.data as Partial<Record<ClientFieldId, string>>,
      })),
    );
    return {
      affected: rows.length,
      fileName: workbook.fileName,
      mimeType: workbook.mimeType,
      base64: workbook.buffer.toString("base64"),
    };
  });
