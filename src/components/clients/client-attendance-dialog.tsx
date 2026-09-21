import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSystemSettings } from "@/hooks/use-system-settings";
import {
  attendanceKindStatuses,
  statusesOfKind,
  type StatusKind,
} from "@/lib/clients/client-status";
import {
  createClientAttendanceFn,
  deleteClientAttendanceFn,
  getClientDetailFn,
  listClientAttendancesFn,
  updateClientDataFn,
  updateClientStatusFn,
} from "@/lib/clients/clients.server";
import type {
  ClientActivityFlags,
  ClientAttendanceRecord,
  ClientListItem,
  ClientRecord,
} from "@/lib/clients/client.types";
import { ClientAttachmentsPanel } from "@/components/clients/client-attachments-panel";
import { ClientFieldInput } from "@/components/clients/client-field-input";
import { productFieldsForImport } from "@/lib/clients/product-fields";
import {
  CLIENT_FIELD_GROUPS,
  clientFieldLabel,
  type ClientFieldGroup,
  type ClientFieldId,
} from "@/lib/config/client-fields";

type Props = {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityChange?: (clientId: string, flags: Partial<ClientActivityFlags>) => void;
  onStatusChange?: (clientId: string, status: string) => void;
  onClientFieldsChange?: (clientId: string, patch: Partial<ClientListItem>) => void;
};

/** Contatos mapeados na importação — ficam na coluna Contato (não nos dados indexados). */
const CONTACT_FIELD_IDS: ClientFieldId[] = ["email", "telefone", "whatsapp"];
const CONTACT_FIELD_SET = new Set<ClientFieldId>(CONTACT_FIELD_IDS);

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

function formatAttendanceDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function clientTitle(client: ClientRecord): string {
  return client.data.nome ?? client.data.cpf ?? client.data.telefone ?? client.id;
}

/** Seções editáveis do produto (exceto contato, exibido à direita). */
function editableProductFieldGroups(
  productFieldIds: Set<ClientFieldId>,
  groups: ClientFieldGroup[] = CLIENT_FIELD_GROUPS,
) {
  return groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter(
        (field) => productFieldIds.has(field.id) && !CONTACT_FIELD_SET.has(field.id),
      ),
    }))
    .filter((group) => group.fields.length > 0);
}

function contactFieldsForProduct(
  productFieldIds: Set<ClientFieldId>,
  groups: ClientFieldGroup[] = CLIENT_FIELD_GROUPS,
) {
  return CONTACT_FIELD_IDS.filter((fieldId) => productFieldIds.has(fieldId)).map((fieldId) => ({
    fieldId,
    label: clientFieldLabel(fieldId, groups),
  }));
}

export function ClientAttendanceDialog({
  clientId,
  open,
  onOpenChange,
  onActivityChange,
  onStatusChange,
  onClientFieldsChange,
}: Props) {
  const { settings } = useSystemSettings();
  const getClientDetail = useServerFn(getClientDetailFn);
  const listAttendances = useServerFn(listClientAttendancesFn);
  const createAttendance = useServerFn(createClientAttendanceFn);
  const deleteAttendance = useServerFn(deleteClientAttendanceFn);
  const updateStatus = useServerFn(updateClientStatusFn);
  const updateClientData = useServerFn(updateClientDataFn);

  const [client, setClient] = useState<ClientRecord | null>(null);
  const [draftFields, setDraftFields] = useState<Partial<Record<ClientFieldId, string>>>({});
  const [attendances, setAttendances] = useState<ClientAttendanceRecord[]>([]);
  const [note, setNote] = useState("");
  const [statusValue, setStatusValue] = useState("novo");
  const [contractStatusValue, setContractStatusValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingContractStatus, setSavingContractStatus] = useState(false);

  const getClientDetailRef = useRef(getClientDetail);
  const listAttendancesRef = useRef(listAttendances);
  const onOpenChangeRef = useRef(onOpenChange);
  getClientDetailRef.current = getClientDetail;
  listAttendancesRef.current = listAttendances;
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (open) return;
    setClient(null);
    setDraftFields({});
    setAttendances([]);
    setNote("");
    setStatusValue("novo");
    setContractStatusValue("");
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open || !clientId) return;

    let cancelled = false;
    setLoading(true);

    void Promise.all([
      getClientDetailRef.current({ data: { clientId } }),
      listAttendancesRef.current({ data: { clientId } }),
    ])
      .then(([detail, history]) => {
        if (cancelled) return;
        setClient(detail);
        setDraftFields({ ...detail.data });
        setStatusValue(detail.status);
        setContractStatusValue(detail.contractStatus ?? "");
        setAttendances(history);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar o cliente.");
        onOpenChangeRef.current(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  const catalogGroups = settings.fieldGroups ?? CLIENT_FIELD_GROUPS;
  const product = useMemo(
    () => settings.products.find((item) => item.id === client?.productId) ?? null,
    [client?.productId, settings.products],
  );
  const productFieldMeta = useMemo(() => {
    if (!product) return null;
    return productFieldsForImport(product, catalogGroups);
  }, [product, catalogGroups]);
  const productFieldIds = useMemo(() => {
    if (!productFieldMeta) return new Set<ClientFieldId>();
    return new Set([
      ...productFieldMeta.required.map((field) => field.id),
      ...productFieldMeta.optional.map((field) => field.id),
    ]);
  }, [productFieldMeta]);
  const requiredFieldIds = useMemo(
    () => new Set(productFieldMeta?.required.map((field) => field.id) ?? []),
    [productFieldMeta],
  );
  const groups = useMemo(
    () => editableProductFieldGroups(productFieldIds, catalogGroups),
    [productFieldIds, catalogGroups],
  );
  const contactFields = useMemo(
    () => contactFieldsForProduct(productFieldIds, catalogGroups),
    [productFieldIds, catalogGroups],
  );

  const attendanceStatusOptions = useMemo(
    () => attendanceKindStatuses(settings),
    [settings],
  );
  const contractStatusOptions = useMemo(
    () => statusesOfKind(settings, "contrato"),
    [settings],
  );

  const setFieldValue = (fieldId: ClientFieldId, value: string) => {
    setDraftFields((current) => ({ ...current, [fieldId]: value }));
  };

  const handleCopyContact = (label: string, value: string) => {
    void copyText(value, `${label} copiado.`);
  };

  const handleCopyAllContacts = () => {
    const filled = contactFields
      .map((item) => {
        const value = draftFields[item.fieldId]?.trim();
        if (!value) return null;
        return `${item.label}: ${value}`;
      })
      .filter((item): item is string => Boolean(item));
    if (filled.length === 0) return;
    void copyText(filled.join("\n"), "Dados de contato copiados.");
  };

  const handleSaveFields = async () => {
    if (!clientId || !client) return;
    setSavingFields(true);
    try {
      const fields: Partial<Record<ClientFieldId, string>> = {};
      for (const fieldId of productFieldIds) {
        fields[fieldId] = draftFields[fieldId] ?? "";
      }
      const updated = await updateClientData({ data: { clientId, fields } });
      setClient(updated);
      setDraftFields({ ...updated.data });
      onClientFieldsChange?.(clientId, {
        nome: updated.data.nome ?? null,
        cpf: updated.data.cpf ?? null,
        telefone: updated.data.telefone ?? null,
        valorLiberado: updated.data.valor_liberado ?? null,
      });
      toast.success("Dados do cliente atualizados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os dados.");
    } finally {
      setSavingFields(false);
    }
  };

  const applyStatusChange = async (
    nextStatus: string,
    kind: StatusKind,
    currentValue: string,
    setValue: (value: string) => void,
    setSavingFlag: (value: boolean) => void,
  ) => {
    if (!clientId || nextStatus === currentValue) return;

    setSavingFlag(true);
    try {
      const result = await updateStatus({
        data: { clientId, status: nextStatus, kind },
      });
      const nextClientValue =
        kind === "contrato" ? result.client.contractStatus : result.client.status;
      setValue(nextClientValue);
      setClient((current) =>
        current
          ? kind === "contrato"
            ? { ...current, contractStatus: result.client.contractStatus }
            : { ...current, status: result.client.status }
          : current,
      );
      setAttendances((current) => [result.attendance, ...current]);
      if (kind === "atendimento") {
        onStatusChange?.(clientId, result.client.status);
      }
      onActivityChange?.(clientId, {
        hasAttendance: true,
        ...(result.scheduleContactDate ? { hasSchedule: true } : {}),
      });
      const kindLabel = kind === "contrato" ? "Status de contrato" : "Status de atendimento";
      if (result.scheduleContactDate) {
        const [, month, day] = result.scheduleContactDate.split("-");
        toast.success(
          `${kindLabel} atualizado. Retorno automático na Agenda em ${day}/${month}.`,
        );
      } else {
        toast.success(`${kindLabel} atualizado e registrado no histórico.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setSavingFlag(false);
    }
  };

  const handleStatusChange = (nextStatus: string) =>
    applyStatusChange(nextStatus, "atendimento", statusValue, setStatusValue, setSavingStatus);

  const handleContractStatusChange = (nextStatus: string) =>
    applyStatusChange(
      nextStatus,
      "contrato",
      contractStatusValue,
      setContractStatusValue,
      setSavingContractStatus,
    );

  const handleSubmit = async () => {
    if (!clientId || !note.trim()) {
      toast.error("Descreva o atendimento antes de registrar.");
      return;
    }

    setSaving(true);
    try {
      const created = await createAttendance({ data: { clientId, note: note.trim() } });
      setAttendances((current) => [created, ...current]);
      if (clientId) onActivityChange?.(clientId, { hasAttendance: true });
      setNote("");
      toast.success("Atendimento registrado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o atendimento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,900px)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <MessageSquare className="size-5 text-primary" />
            Registrar atendimento
          </DialogTitle>
          <DialogDescription>
            {client ? (
              <>
                Cliente: <span className="font-medium text-foreground">{clientTitle(client)}</span>
              </>
            ) : (
              "Carregando dados do cliente…"
            )}
          </DialogDescription>
        </DialogHeader>

        {loading && !client ? (
          <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando informações…
          </div>
        ) : client ? (
          <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="min-h-0 min-w-0 border-b border-border/60 lg:border-b-0 lg:border-r">
              <div className="border-b border-border/60 px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Dados do cadastro</h3>
                    <p className="text-xs text-muted-foreground">
                      Campos do produto — editáveis após a criação ou importação.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingFields || loading || !product}
                    onClick={() => void handleSaveFields()}
                  >
                    {savingFields ? <Loader2 className="size-4 animate-spin" /> : null}
                    Salvar dados
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[min(58vh,620px)]">
                <div className="space-y-5 p-5">
                  {!product ? (
                    <p className="text-sm text-muted-foreground">
                      Produto do cliente não encontrado nas configurações.
                    </p>
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum campo de produto além dos contatos.
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.id} className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.title}
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.fields.map((field) => {
                            const required = requiredFieldIds.has(field.id);
                            return (
                              <div key={field.id} className="space-y-1.5">
                                <Label htmlFor={`client-field-${field.id}`}>
                                  {clientFieldLabel(field.id, catalogGroups)}
                                  {required ? (
                                    <span className="text-destructive"> *</span>
                                  ) : null}
                                </Label>
                                <ClientFieldInput
                                  id={`client-field-${field.id}`}
                                  fieldId={field.id}
                                  value={draftFields[field.id] ?? ""}
                                  onChange={(value) => setFieldValue(field.id, value)}
                                  banks={settings.banks}
                                  operations={settings.operations}
                                  required={required}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}

                  {clientId ? (
                    <>
                      <Separator />
                      <ClientAttachmentsPanel
                        clientId={clientId}
                        enabled={open}
                        onAttachmentsChange={(hasAttachments) =>
                          onActivityChange?.(clientId, { hasAttachments })
                        }
                      />
                    </>
                  ) : null}
                </div>
              </ScrollArea>
            </section>

            <section className="flex min-h-0 min-w-0 flex-col">
              <ScrollArea className="h-[min(58vh,620px)]">
                <div className="min-w-0 space-y-5 p-5">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Contato</h3>
                      {contactFields.some((item) => draftFields[item.fieldId]?.trim()) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={handleCopyAllContacts}
                        >
                          <Copy className="size-3.5" />
                          Copiar todos
                        </Button>
                      ) : null}
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-3">
                      {contactFields.length > 0 ? (
                        contactFields.map((item) => {
                          const value = draftFields[item.fieldId] ?? "";
                          const required = requiredFieldIds.has(item.fieldId);
                          return (
                            <div
                              key={item.fieldId}
                              className="min-w-0 space-y-1.5 overflow-hidden rounded-lg border border-border/60 bg-muted/20 px-3 py-3"
                            >
                              <Label htmlFor={`client-contact-${item.fieldId}`}>
                                {item.label}
                                {required ? <span className="text-destructive"> *</span> : null}
                              </Label>
                              <ClientFieldInput
                                id={`client-contact-${item.fieldId}`}
                                fieldId={item.fieldId}
                                value={value}
                                onChange={(next) => setFieldValue(item.fieldId, next)}
                                banks={settings.banks}
                                operations={settings.operations}
                                required={required}
                              />
                              {value.trim() ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="mt-1 h-8"
                                  onClick={() => handleCopyContact(item.label, value)}
                                >
                                  <Copy className="size-3.5" />
                                  Copiar
                                </Button>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          E-mail, telefone e WhatsApp não estão disponíveis neste produto.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-status">Status de atendimento</Label>
                    <Select
                      value={statusValue}
                      onValueChange={(value) => void handleStatusChange(value)}
                      disabled={savingStatus || !clientId}
                    >
                      <SelectTrigger id="attendance-status" className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {attendanceStatusOptions.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract-status">Status de contrato</Label>
                    {contractStatusOptions.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        Nenhum status de contrato cadastrado. Cadastre em Configurações → Status
                        (tipo Contrato).
                      </p>
                    ) : (
                      <Select
                        value={contractStatusValue || undefined}
                        onValueChange={(value) => void handleContractStatusChange(value)}
                        disabled={savingContractStatus || !clientId}
                      >
                        <SelectTrigger id="contract-status" className="w-full">
                          <SelectValue placeholder="Selecione o status de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractStatusOptions.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="attendance-note">Registrar atendimento</Label>
                    <Textarea
                      id="attendance-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Descreva o que foi tratado com o cliente…"
                      rows={4}
                      className="min-h-28 resize-none"
                    />
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={saving || !note.trim()}
                      onClick={() => void handleSubmit()}
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Registrar atendimento
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Histórico</h3>
                      <span className="text-xs text-muted-foreground">
                        {attendances.length} registro(s)
                      </span>
                    </div>
                    {attendances.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                        Nenhum atendimento registrado ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {attendances.map((attendance) => (
                          <article
                            key={attendance.id}
                            className="rounded-lg border border-border/60 bg-background px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <time className="font-medium text-foreground">
                                  {formatAttendanceDate(attendance.createdAt)}
                                </time>
                                <span>·</span>
                                <span>Registrado por {attendance.userName}</span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-destructive hover:text-destructive"
                                title="Excluir atendimento"
                                onClick={() => {
                                  void (async () => {
                                    try {
                                      await deleteAttendance({
                                        data: { attendanceId: attendance.id },
                                      });
                                      setAttendances((current) =>
                                        current.filter((item) => item.id !== attendance.id),
                                      );
                                      toast.success("Atendimento excluído.");
                                    } catch (error) {
                                      toast.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Não foi possível excluir o atendimento.",
                                      );
                                    }
                                  })();
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                              {attendance.note}
                            </p>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
