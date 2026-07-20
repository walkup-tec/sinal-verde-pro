import * as XLSX from "xlsx";
import type { ClientFieldId } from "@/lib/config/client-fields";
import { ALL_CLIENT_FIELD_IDS, clientFieldLabel } from "@/lib/config/client-fields";
import { normalizeEvoWhatsAppNumber } from "@/lib/masks/br-phone";

export type BulkExportClientRow = {
  id: string;
  productId: string;
  status: string;
  createdAt: string;
  produtos: string;
  data: Partial<Record<ClientFieldId, string>>;
};

const META_COLUMNS = [
  { key: "id", label: "id" },
  { key: "status", label: "status" },
  { key: "product_id", label: "product_id" },
  { key: "produtos", label: "produtos" },
  { key: "created_at", label: "created_at" },
] as const;

/** Campos de telefone exportados no formato EVO (DDI 55 + dígitos). */
const EVO_PHONE_FIELDS = new Set<ClientFieldId>(["telefone", "whatsapp"]);

function cellValue(fieldId: ClientFieldId, raw: string | undefined): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  if (EVO_PHONE_FIELDS.has(fieldId)) return normalizeEvoWhatsAppNumber(value);
  return value;
}

export function buildBulkClientsExportWorkbook(rows: BulkExportClientRow[]): {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
} {
  const headers = [
    ...META_COLUMNS.map((col) => col.label),
    ...ALL_CLIENT_FIELD_IDS.map((id) => clientFieldLabel(id)),
  ];

  const aoa: string[][] = [headers];
  for (const row of rows) {
    const line: string[] = [
      row.id,
      row.status,
      row.productId,
      row.produtos,
      row.createdAt,
      ...ALL_CLIENT_FIELD_IDS.map((fieldId) => cellValue(fieldId, row.data[fieldId])),
    ];
    aoa.push(line);
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  // Força colunas de telefone/whatsapp como texto (evita notação científica no Excel).
  const telefoneCol = META_COLUMNS.length + ALL_CLIENT_FIELD_IDS.indexOf("telefone");
  const whatsappCol = META_COLUMNS.length + ALL_CLIENT_FIELD_IDS.indexOf("whatsapp");
  for (let r = 1; r < aoa.length; r += 1) {
    for (const c of [telefoneCol, whatsappCol]) {
      if (c < 0) continue;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell && cell.v != null && cell.v !== "") {
        sheet[addr] = { t: "s", v: String(cell.v) };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "leads");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return {
    buffer,
    fileName: `sinal-verde-leads-${stamp}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
