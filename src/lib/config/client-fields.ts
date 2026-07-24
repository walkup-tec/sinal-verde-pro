/** ID de campo do cliente — built-ins + custom criados pelo master. */
export type ClientFieldId = string;

export type ClientFieldGroupId = string;

export type ClientFieldDefinition = {
  id: ClientFieldId;
  label: string;
  hint?: string;
};

export type ClientFieldGroup = {
  id: ClientFieldGroupId;
  title: string;
  fields: ClientFieldDefinition[];
};

/** Catálogo padrão (seed). Em runtime use `settings.fieldGroups` quando existir. */
export const CLIENT_FIELD_GROUPS: ClientFieldGroup[] = [
  {
    id: "pessoais",
    title: "Dados pessoais",
    fields: [
      { id: "nome", label: "Nome" },
      { id: "cpf", label: "CPF" },
      { id: "rg", label: "RG" },
      { id: "data_nascimento", label: "Data de nascimento" },
      { id: "sexo", label: "Sexo" },
      { id: "estado_civil", label: "Estado civil" },
      { id: "telefone", label: "Telefone" },
      { id: "whatsapp", label: "WhatsApp" },
      { id: "email", label: "Email" },
      { id: "tipo_logradouro", label: "Tipo logradouro" },
      { id: "logradouro", label: "Logradouro" },
      { id: "numero_logradouro", label: "Número (no logradouro)" },
      { id: "complemento", label: "Complemento" },
      { id: "bairro", label: "Bairro" },
      { id: "cidade", label: "Cidade" },
      { id: "uf", label: "UF" },
    ],
  },
  {
    id: "profissionais",
    title: "Dados profissionais",
    fields: [
      {
        id: "tipo_cliente",
        label: "Tipo de cliente",
        hint: "CLT, Autônomo, Aposentado, Pensionista, Profissional liberal",
      },
      { id: "empresa", label: "Empresa" },
      { id: "tempo_empresa", label: "Tempo de Empresa" },
      { id: "renda_mensal", label: "Renda mensal" },
      { id: "possui_mei", label: "Possui MEI" },
      { id: "possui_carteira_assinada", label: "Possui carteira assinada" },
    ],
  },
  {
    id: "financeiros",
    title: "Dados financeiros",
    fields: [
      { id: "score", label: "Score" },
      { id: "restricao_spc_serasa", label: "Restrição SPC/SERASA" },
      { id: "margem_disponivel", label: "Margem disponível" },
      { id: "parcelas_atraso", label: "Parcelas em atraso" },
      { id: "contratos_ativos", label: "Contratos ativos" },
      { id: "valor_desejado", label: "Valor desejado" },
      { id: "valor_liberado", label: "Valor liberado" },
      { id: "data_contrato", label: "Data do contrato", hint: "Formato dd/mm/aaaa" },
      { id: "data_ultima_parcela", label: "Data última parcela", hint: "Formato dd/mm/aaaa" },
      {
        id: "banco",
        label: "Banco",
        hint: "Opcional em todos os produtos; opções em Configurações → Bancos",
      },
    ],
  },
];

export const ALL_CLIENT_FIELD_IDS = CLIENT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.id));

/** IDs removidos ou renomeados — usado na migração de produtos salvos. */
export const LEGACY_CLIENT_FIELD_IDS: Record<string, ClientFieldId | null> = {
  endereco_completo: null,
  tempo_trabalho: "tempo_empresa",
};

export function cloneDefaultFieldGroups(): ClientFieldGroup[] {
  return CLIENT_FIELD_GROUPS.map((group) => ({
    ...group,
    fields: group.fields.map((field) => ({ ...field })),
  }));
}

export function fieldIdsFromGroups(groups: ClientFieldGroup[]): ClientFieldId[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const group of groups) {
    for (const field of group.fields) {
      if (!field.id || seen.has(field.id)) continue;
      seen.add(field.id);
      ids.push(field.id);
    }
  }
  return ids;
}

export function clientFieldLabel(
  id: ClientFieldId,
  groups: ClientFieldGroup[] = CLIENT_FIELD_GROUPS,
): string {
  for (const group of groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field.label;
  }
  return id;
}

export function slugifyClientFieldId(label: string): string {
  const base = String(label || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || `campo_${Date.now().toString(36)}`;
}

export function allocateUniqueFieldId(label: string, existingIds: Iterable<string>): string {
  const taken = new Set(existingIds);
  let candidate = slugifyClientFieldId(label);
  if (!taken.has(candidate)) return candidate;
  let n = 2;
  while (taken.has(`${candidate}_${n}`)) n += 1;
  return `${candidate}_${n}`;
}
