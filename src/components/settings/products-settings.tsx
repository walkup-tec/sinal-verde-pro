import { useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  allocateUniqueFieldId,
  fieldIdsFromGroups,
  type ClientFieldGroup,
  type ClientFieldId,
} from "@/lib/config/client-fields";
import { createEmptyProduct, normalizeProductFields } from "@/lib/config/settings-defaults";
import type { ProductConfig, SystemSettings } from "@/lib/config/settings-types";

const appRoute = getRouteApi("/app");

type Props = {
  settings: SystemSettings;
  onChange: (settings: SystemSettings) => Promise<SystemSettings>;
};

type PendingFieldDelete = {
  groupId: string;
  fieldId: ClientFieldId;
  label: string;
};

/** Persistência já chega filtrada pela seção "products" em Configurações. */
export function ProductsSettings({ settings, onChange }: Props) {
  const { auth } = appRoute.useRouteContext();
  const isMaster = auth.role === "master";

  const [products, setProducts] = useState<ProductConfig[]>(settings.products);
  const [fieldGroups, setFieldGroups] = useState<ClientFieldGroup[]>(settings.fieldGroups);
  const [selectedId, setSelectedId] = useState(settings.products[0]?.id ?? "");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [pendingFieldDelete, setPendingFieldDelete] = useState<PendingFieldDelete | null>(null);
  const [addingFieldGroupId, setAddingFieldGroupId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const productsRef = useRef(products);
  const fieldGroupsRef = useRef(fieldGroups);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  productsRef.current = products;
  fieldGroupsRef.current = fieldGroups;

  useEffect(() => {
    setProducts(settings.products);
    productsRef.current = settings.products;
    setFieldGroups(settings.fieldGroups);
    fieldGroupsRef.current = settings.fieldGroups;
    setSelectedId((current) => {
      if (current && settings.products.some((product) => product.id === current)) return current;
      return settings.products[0]?.id ?? "";
    });
    setCheckedIds((current) => current.filter((id) => settings.products.some((p) => p.id === id)));
  }, [settings.products, settings.fieldGroups]);

  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const catalogIds = useMemo(() => fieldIdsFromGroups(fieldGroups), [fieldGroups]);

  const persistState = (
    nextProducts: ProductConfig[],
    nextFieldGroups: ClientFieldGroup[],
    options?: { successMessage?: string; quiet?: boolean },
  ) => {
    setProducts(nextProducts);
    productsRef.current = nextProducts;
    setFieldGroups(nextFieldGroups);
    fieldGroupsRef.current = nextFieldGroups;
    if (!options?.quiet) setSaving(true);

    const run = async () => {
      try {
        const saved = await onChange({
          ...settings,
          products: productsRef.current,
          fieldGroups: fieldGroupsRef.current,
        });
        if (saved?.products) {
          setProducts(saved.products);
          productsRef.current = saved.products;
          setSelectedId((current) => {
            if (current && saved.products.some((product) => product.id === current)) return current;
            return saved.products[0]?.id ?? "";
          });
          setCheckedIds((current) =>
            current.filter((id) => saved.products.some((product) => product.id === id)),
          );
        }
        if (saved?.fieldGroups) {
          setFieldGroups(saved.fieldGroups);
          fieldGroupsRef.current = saved.fieldGroups;
        }
        if (!options?.quiet) {
          toast.success(options?.successMessage ?? "Produtos salvos.");
        }
      } catch (error) {
        setProducts(settings.products);
        productsRef.current = settings.products;
        setFieldGroups(settings.fieldGroups);
        fieldGroupsRef.current = settings.fieldGroups;
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar os produtos.");
        throw error;
      } finally {
        if (!options?.quiet) setSaving(false);
      }
    };

    const queued = saveChainRef.current.then(run, run);
    saveChainRef.current = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  };

  const renormProducts = (list: ProductConfig[], groups: ClientFieldGroup[]) => {
    const ids = fieldIdsFromGroups(groups);
    return list.map((product) => normalizeProductFields(product, ids));
  };

  const updateSelected = (patch: Partial<ProductConfig>) => {
    if (!selected) return;
    const next = normalizeProductFields({ ...selected, ...patch }, catalogIds);
    const nextProducts = products.map((product) => (product.id === selected.id ? next : product));
    void persistState(nextProducts, fieldGroups, { quiet: true });
  };

  const setFieldRequired = (fieldId: ClientFieldId, required: boolean) => {
    if (!selected) return;

    const requiredFieldIds = required
      ? [...new Set([...selected.requiredFieldIds, fieldId])]
      : selected.requiredFieldIds.filter((id) => id !== fieldId);

    updateSelected({ requiredFieldIds });
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    if (!isMaster) return;
    const nextGroups = fieldGroups.map((group) =>
      group.id === groupId ? { ...group, title } : group,
    );
    setFieldGroups(nextGroups);
  };

  const persistGroupTitle = () => {
    if (!isMaster) return;
    void persistState(products, fieldGroups, { quiet: true });
  };

  const confirmAddField = () => {
    if (!isMaster || !addingFieldGroupId) return;
    const label = newFieldLabel.trim();
    if (!label) {
      toast.error("Informe o nome do campo.");
      return;
    }

    const nextId = allocateUniqueFieldId(label, catalogIds);
    const nextGroups = fieldGroups.map((group) =>
      group.id === addingFieldGroupId
        ? { ...group, fields: [...group.fields, { id: nextId, label }] }
        : group,
    );
    const nextProducts = renormProducts(products, nextGroups);
    setAddingFieldGroupId(null);
    setNewFieldLabel("");
    void persistState(nextProducts, nextGroups, { successMessage: "Campo adicionado." });
  };

  const confirmDeleteField = async () => {
    if (!isMaster || !pendingFieldDelete) return;
    const { groupId, fieldId } = pendingFieldDelete;
    const totalFields = catalogIds.length;
    if (totalFields <= 1) {
      toast.error("Mantenha ao menos um campo no catálogo.");
      setPendingFieldDelete(null);
      return;
    }

    const nextGroups = fieldGroups.map((group) =>
      group.id === groupId
        ? { ...group, fields: group.fields.filter((field) => field.id !== fieldId) }
        : group,
    );
    const nextProducts = renormProducts(products, nextGroups);
    setPendingFieldDelete(null);
    try {
      await persistState(nextProducts, nextGroups, { successMessage: "Campo excluído." });
    } catch {
      // toast already shown
    }
  };

  const addProduct = () => {
    const product = createEmptyProduct(catalogIds);
    product.name = "Novo produto";
    const nextProducts = [...products, product];
    setProducts(nextProducts);
    setSelectedId(product.id);
    void persistState(nextProducts, fieldGroups, { successMessage: "Produto criado." });
  };

  const toggleChecked = (id: string, checked: boolean) => {
    setCheckedIds((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((item) => item !== id);
    });
  };

  const requestDeleteIds = (ids: string[]) => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;

    if (products.length - uniqueIds.length < 1) {
      toast.error("Mantenha ao menos um produto.");
      return;
    }

    setPendingDeleteIds(uniqueIds);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds?.length) return;
    const idsToRemove = [...pendingDeleteIds];
    const removeSet = new Set(idsToRemove);
    const nextProducts = products.filter((product) => !removeSet.has(product.id));

    if (nextProducts.length < 1) {
      toast.error("Mantenha ao menos um produto.");
      setPendingDeleteIds(null);
      return;
    }

    setPendingDeleteIds(null);
    if (selectedId && removeSet.has(selectedId)) {
      setSelectedId(nextProducts[0]?.id ?? "");
    }
    setCheckedIds((current) => current.filter((id) => !removeSet.has(id)));

    try {
      await persistState(nextProducts, fieldGroups, {
        successMessage:
          idsToRemove.length > 1 ? `${idsToRemove.length} produtos excluídos.` : "Produto excluído.",
      });
    } catch {
      // toast already shown
    }
  };

  const deleteDialogCount = pendingDeleteIds?.length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="border-border/60 shadow-soft h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Produtos</CardTitle>
          <CardDescription>
            Marque um ou mais para excluir em lote. Clique no nome para editar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {products.map((product) => {
            const isSelected = selected?.id === product.id;
            const isChecked = checkedIds.includes(product.id);

            return (
              <div
                key={product.id}
                className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  className="mt-1.5"
                  checked={isChecked}
                  disabled={saving}
                  onCheckedChange={(value) => toggleChecked(product.id, Boolean(value))}
                  aria-label={`Selecionar ${product.name || "produto"}`}
                />
                <button
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className="min-w-0 flex-1 rounded-md px-1 py-1 text-left text-sm"
                >
                  <span className={`block truncate ${isSelected ? "font-medium" : ""}`}>
                    {product.name || "Sem nome"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {product.requiredFieldIds.length} obrigatório(s) · {product.availableFieldIds.length}{" "}
                    disponível(is)
                  </span>
                </button>
              </div>
            );
          })}

          <div className="flex flex-col gap-2 pt-2">
            {checkedIds.length > 0 ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={saving}
                onClick={() => requestDeleteIds(checkedIds)}
              >
                <Trash2 className="size-4" />
                Excluir selecionados ({checkedIds.length})
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="w-full" onClick={addProduct} disabled={saving}>
              <Plus className="size-4" /> Novo produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected ? (
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-display text-base">Editar produto</CardTitle>
              <CardDescription>
                Campos disponíveis e obrigatórios ao cadastrar cliente neste produto.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => requestDeleteIds([selected.id])}
              disabled={saving}
              title="Excluir produto"
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="product-name">Nome do produto</Label>
              <Input
                id="product-name"
                value={selected.name}
                onChange={(e) => {
                  const nextProducts = products.map((product) =>
                    product.id === selected.id ? { ...product, name: e.target.value } : product,
                  );
                  setProducts(nextProducts);
                }}
                onBlur={() => {
                  if (!selected) return;
                  void persistState(products, fieldGroups, { quiet: true });
                }}
                placeholder="Ex.: Empréstimo CLT, FGTS, Cartão consignado"
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Todos os campos começam como <strong className="text-foreground">Disponível</strong> (opcional). Ao marcar{" "}
              <strong className="text-foreground">Obrigatório</strong>, o campo passa a ser exigido no cadastro. Ao
              desmarcar, volta a ser disponível.
              {isMaster ? (
                <>
                  {" "}
                  Como <strong className="text-foreground">Master</strong>, você também pode editar o título das seções
                  e acrescentar ou excluir campos.
                </>
              ) : null}
            </div>

            <div className="space-y-6">
              {fieldGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  {isMaster ? (
                    <Input
                      value={group.title}
                      onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                      onBlur={persistGroupTitle}
                      disabled={saving}
                      className="h-9 max-w-md text-sm font-semibold"
                      aria-label={`Título da seção ${group.id}`}
                    />
                  ) : (
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-medium">Campo</th>
                          <th className="px-4 py-2 font-medium w-28 text-center">Disponível</th>
                          <th className="px-4 py-2 font-medium w-28 text-center">Obrigatório</th>
                          {isMaster ? <th className="px-2 py-2 font-medium w-12 text-center" /> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {group.fields.length === 0 ? (
                          <tr className="border-t border-border/60">
                            <td
                              colSpan={isMaster ? 4 : 3}
                              className="px-4 py-6 text-center text-xs text-muted-foreground"
                            >
                              Nenhum campo nesta seção.
                            </td>
                          </tr>
                        ) : (
                          group.fields.map((field) => {
                            const required = selected.requiredFieldIds.includes(field.id);
                            const available = !required;
                            return (
                              <tr key={field.id} className="border-t border-border/60">
                                <td className="px-4 py-3">
                                  <div className="font-medium">{field.label}</div>
                                  {field.hint ? (
                                    <div className="text-xs text-muted-foreground">{field.hint}</div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Checkbox
                                    checked={available}
                                    disabled={available}
                                    onCheckedChange={() => setFieldRequired(field.id, false)}
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Checkbox
                                    checked={required}
                                    onCheckedChange={(value) => setFieldRequired(field.id, value === true)}
                                  />
                                </td>
                                {isMaster ? (
                                  <td className="px-2 py-3 text-center">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 text-destructive hover:text-destructive"
                                      disabled={saving}
                                      title="Excluir campo"
                                      onClick={() =>
                                        setPendingFieldDelete({
                                          groupId: group.id,
                                          fieldId: field.id,
                                          label: field.label,
                                        })
                                      }
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </td>
                                ) : null}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {isMaster ? (
                    addingFieldGroupId === group.id ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Label htmlFor={`new-field-${group.id}`}>Nome do novo campo</Label>
                          <Input
                            id={`new-field-${group.id}`}
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="Ex.: Nome da mãe"
                            disabled={saving}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                confirmAddField();
                              }
                            }}
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saving}
                            onClick={() => {
                              setAddingFieldGroupId(null);
                              setNewFieldLabel("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="button" disabled={saving} onClick={confirmAddField}>
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => {
                          setAddingFieldGroupId(group.id);
                          setNewFieldLabel("");
                        }}
                      >
                        <Plus className="size-4" /> Novo campo
                      </Button>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog
        open={pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteIds(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogCount > 1 ? `Excluir ${deleteDialogCount} produtos?` : "Excluir produto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogCount > 1
                ? "Os produtos selecionados serão removidos. Clientes já cadastrados não são apagados."
                : "Este produto será removido. Clientes já cadastrados não são apagados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingFieldDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFieldDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campo?</AlertDialogTitle>
            <AlertDialogDescription>
              O campo <strong>{pendingFieldDelete?.label}</strong> será removido do catálogo e de todos os
              produtos. Dados já preenchidos em clientes não são apagados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteField();
              }}
            >
              Excluir campo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
