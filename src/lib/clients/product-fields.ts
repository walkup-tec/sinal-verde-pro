import { clientFieldLabel, type ClientFieldGroup, type ClientFieldId } from "@/lib/config/client-fields";
import type { ProductConfig } from "@/lib/config/settings-types";

export type ProductFieldOption = {
  id: ClientFieldId;
  label: string;
  required: boolean;
};

export function productFieldsForImport(
  product: ProductConfig,
  fieldGroups?: ClientFieldGroup[],
): {
  required: ProductFieldOption[];
  optional: ProductFieldOption[];
} {
  const toOption = (id: ClientFieldId, required: boolean): ProductFieldOption => ({
    id,
    label: clientFieldLabel(id, fieldGroups),
    required,
  });

  const sortByLabel = (a: ProductFieldOption, b: ProductFieldOption) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });

  return {
    required: product.requiredFieldIds.map((id) => toOption(id, true)).sort(sortByLabel),
    optional: product.availableFieldIds.map((id) => toOption(id, false)).sort(sortByLabel),
  };
}
