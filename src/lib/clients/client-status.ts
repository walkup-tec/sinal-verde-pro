import type { SystemSettings, StatusKind } from "@/lib/config/settings-types";
import { DEFAULT_ATTENDANCE_STATUSES } from "@/lib/config/settings-defaults";
import { DEFAULT_STATUS_COLOR, normalizeStatusColor } from "@/lib/config/status-colors";

export type { StatusKind };

export function attendanceStatuses(settings: SystemSettings) {
  return settings.attendanceStatuses.length > 0
    ? settings.attendanceStatuses
    : DEFAULT_ATTENDANCE_STATUSES;
}

export function statusesOfKind(settings: SystemSettings, kind: StatusKind) {
  return attendanceStatuses(settings).filter((status) => status.kind === kind);
}

/** Status usados em listas, kanban, filtros e bulk (fluxo de atendimento). */
export function attendanceKindStatuses(settings: SystemSettings) {
  const ofKind = statusesOfKind(settings, "atendimento");
  return ofKind.length > 0 ? ofKind : DEFAULT_ATTENDANCE_STATUSES;
}

export function resolveAttendanceStatusLabel(statusId: string, settings: SystemSettings): string {
  if (!statusId) return "—";
  const found = attendanceStatuses(settings).find((status) => status.id === statusId);
  if (found) return found.label;
  if (statusId === "novo") return "Novo";
  return statusId;
}

export function resolveAttendanceStatusColor(statusId: string, settings: SystemSettings): string {
  const found = attendanceStatuses(settings).find((status) => status.id === statusId);
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
  const found = attendanceStatuses(settings).find((status) => status.id === statusId);
  if (!found) return false;
  const label = normalizeStatusLabel(found.label);
  return label === "concluido" || label === "pago";
}

/** IDs de status tratados como atendimento concluído (inclui "Pago" por rótulo). */
export function concludedAttendanceStatusIds(settings: SystemSettings): string[] {
  const ids = new Set<string>(["concluido", "pago"]);
  for (const status of attendanceStatuses(settings)) {
    if (isConcludedAttendanceStatus(status.id, settings)) ids.add(status.id);
  }
  return [...ids];
}
