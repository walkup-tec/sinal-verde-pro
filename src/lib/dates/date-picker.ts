import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte YYYY-MM-DD para Date local (meio-dia evita shift de fuso). */
export function parseIsoDateLocal(value: string | undefined | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

/** Formata Date local para YYYY-MM-DD. */
export function formatIsoDateLocal(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

/** Rótulo pt-BR dd/mm/aaaa. */
export function formatDateLabelBr(value: string | undefined | null): string {
  const date = parseIsoDateLocal(value ?? undefined);
  if (!date) return "";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateRangeLabelBr(from?: string, to?: string): string {
  if (from && to) {
    if (from === to) return formatDateLabelBr(from);
    return `${formatDateLabelBr(from)} – ${formatDateLabelBr(to)}`;
  }
  if (from) return `A partir de ${formatDateLabelBr(from)}`;
  if (to) return `Até ${formatDateLabelBr(to)}`;
  return "";
}

/** Anos futuros no dropdown de agendamento (ano atual incluso). */
export const SCHEDULE_CALENDAR_FUTURE_YEARS = 10;

/**
 * Limite inferior do calendário de agendamento: janeiro do ano atual
 * (todos os meses do ano ficam disponíveis). Se já houver data salva no passado,
 * inclui o mês dessa data para não esconder o valor.
 */
export function scheduleCalendarStartMonth(selected?: Date): Date {
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  if (selected && isValid(selected) && selected < currentYearStart) {
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  }
  return currentYearStart;
}

/** Limite superior: dezembro do ano atual + N anos futuros. */
export function scheduleCalendarEndMonth(
  futureYears: number = SCHEDULE_CALENDAR_FUTURE_YEARS,
): Date {
  const year = new Date().getFullYear() + Math.max(0, futureYears);
  return new Date(year, 11, 31);
}
