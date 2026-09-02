import type { SystemSettings, StatusKind } from "@/lib/config/settings-types";
import { DEFAULT_ATTENDANCE_STATUSES } from "@/lib/config/settings-defaults";
import { DEFAULT_STATUS_COLOR, normalizeStatusColor } from "@/lib/config/status-colors";

export type { StatusKind };

/** Catálogo completo, inclusive status arquivados após exclusão. */
export function allAttendanceStatuses(settings: SystemSettings) {
  return settings.attendanceStatuses.length > 0
    ? settings.attendanceStatuses
    : DEFAULT_ATTENDANCE_STATUSES;
}

/** Status ativos para filtros, selects e Configurações. */
export function attendanceStatuses(settings: SystemSettings) {
  return allAttendanceStatuses(settings).filter((status) => !status.archived);
}

export function statusesOfKind(settings: SystemSettings, kind: StatusKind) {
  return attendanceStatuses(settings).filter((status) => status.kind === kind);
}

/** Status usados em listas, kanban, filtros e bulk (fluxo de atendimento). */
export function attendanceKindStatuses(settings: SystemSettings) {
  const ofKind = statusesOfKind(settings, "atendimento");
  return ofKind.length > 0 ? ofKind : DEFAULT_ATTENDANCE_STATUSES;
}

export function isGeneratedStatusId(value: string): boolean {
  return /^status-[0-9a-f]{6,}$/i.test(value.trim());
}

/** Extrai o nome gravado no histórico quando o status já saiu do catálogo ativo. */
export function extractStatusLabelFromNote(note: string): string | null {
  const match = note.match(
    /(?:alterado para|definido como|em lote para):\s*([^\n]+?)(?:\s*\(antes:|\s+Retorno|$)/i,
  );
  const label = match?.[1]?.trim().replace(/[.\s]+$/, "");
  if (!label || isGeneratedStatusId(label)) return null;
  return label;
}

export function resolveAttendanceStatusLabel(
  statusId: string,
  settings: SystemSettings,
  snapshotLabel?: string | null,
): string {
  if (!statusId) return "—";
  const found = allAttendanceStatuses(settings).find((status) => status.id === statusId);
  if (found?.label) return found.label;
  const snapshot = snapshotLabel?.trim();
  if (snapshot && !isGeneratedStatusId(snapshot)) return snapshot;
  if (statusId === "novo") return "Novo";
  if (isGeneratedStatusId(statusId)) return snapshot || "Status removido";
  return statusId;
}

export function resolveAttendanceStatusColor(statusId: string, settings: SystemSettings): string {
  const found = allAttendanceStatuses(settings).find((status) => status.id === statusId);
  if (found?.color) return normalizeStatusColor(found.color);
  const fallback = DEFAULT_ATTENDANCE_STATUSES.find((status) => status.id === statusId);
  return normalizeStatusColor(fallback?.color, DEFAULT_STATUS_COLOR);
}

export function isValidAttendanceStatus(statusId: string, settings: SystemSettings): boolean {
  return isValidStatusOfKind(statusId, settings, "atendimento");
}

export function isValidStatusOfKind(
  statusId: string,
  settings: SystemSettings,
  kind: StatusKind,
): boolean {
  return statusesOfKind(settings, kind).some((status) => status.id === statusId);
}

function normalizeStatusLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Status que encerram o atendimento positivamente (Concluído / Pago).
 * Afeta dashboard "Em aberto"/"Concluídos" e agenda pendente.
 */
export function isConcludedAttendanceStatus(
  statusId: string,
  settings?: SystemSettings,
): boolean {
  if (!statusId) return false;
  const id = statusId.trim().toLowerCase();
  if (id === "concluido" || id === "pago") return true;
  if (!settings) return false;
  const found = allAttendanceStatuses(settings).find((status) => status.id === statusId);
  if (!found) return false;
  const label = normalizeStatusLabel(found.label);
  return label === "concluido" || label === "pago";
}

/** IDs de status tratados como atendimento concluído (inclui "Pago" por rótulo). */
export function concludedAttendanceStatusIds(settings: SystemSettings): string[] {
  const ids = new Set<string>(["concluido", "pago"]);
  for (const status of allAttendanceStatuses(settings)) {
    if (isConcludedAttendanceStatus(status.id, settings)) ids.add(status.id);
  }
  return [...ids];
}
