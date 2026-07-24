import type { ClientFieldId, ClientFieldGroup } from "@/lib/config/client-fields";
import type { MenuItemId } from "@/lib/config/menu-items";

export type UserCategory = {
  id: string;
  name: string;
  menuIds: MenuItemId[];
  /** Primeira tela após o login — deve estar em `menuIds`. */
  homeMenuId: MenuItemId;
};

export type ProductConfig = {
  id: string;
  name: string;
  availableFieldIds: ClientFieldId[];
  requiredFieldIds: ClientFieldId[];
};

export type BankConfig = {
  id: string;
  name: string;
};

/** Opções cadastradas em Configurações → Operação (mesmo formato de bancos). */
export type OperationConfig = {
  id: string;
  name: string;
};

/** Classificação do status cadastrado em Configurações → Status. */
export type StatusKind = "atendimento" | "contrato";

export type AttendanceStatusConfig = {
  id: string;
  label: string;
  /** Hex #rrggbb — cor da tag na listagem de clientes. */
  color: string;
  /**
   * Dias até o retorno automático na Agenda (null/0 = desligado).
   * Ao aplicar o status, agenda contato para o usuário que atribuiu.
   */
  autoReturnDays: number | null;
  /** Atendimento (fluxo comercial) ou Contrato — obrigatório no cadastro. */
  kind: StatusKind;
};

export type SystemSettings = {
  categories: UserCategory[];
  products: ProductConfig[];
  banks: BankConfig[];
  operations: OperationConfig[];
  attendanceStatuses: AttendanceStatusConfig[];
  /** Catálogo de seções/campos editável pelo master (Produtos). */
  fieldGroups: ClientFieldGroup[];
};
