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

/** Status que encerra o agendamento para alertas de agenda. */
export function isConcludedAttendanceStatus(statusId: string): boolean {
  return statusId === "concluido";
}
