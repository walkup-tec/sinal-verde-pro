/** Dígitos de telefone BR (DDD + número), máx. 11. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/**
 * Número no formato Evolution API / WABA (somente dígitos, com DDI 55 quando BR).
 * Ex.: `(51) 99966-6841` → `5551999666841`
 */
export function normalizeEvoWhatsAppNumber(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length >= 12 && digits.startsWith("55")) return digits;
  if (digits.length >= 10 && digits.length <= 11 && /^[1-9]\d/.test(digits)) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Máscara de telefone com DDD:
 * (11) 3456-7890  |  (11) 91234-5678
 */
export function maskPhoneBr(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isCompletePhoneBr(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}
