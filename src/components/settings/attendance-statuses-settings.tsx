import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge } from "@/components/clients/status-badge";
import {
  createEmptyAttendanceStatus,
  normalizeAutoReturnDays,
} from "@/lib/config/settings-defaults";
import { DEFAULT_STATUS_COLOR, normalizeStatusColor } from "@/lib/config/status-colors";
import type { AttendanceStatusConfig, StatusKind, SystemSettings } from "@/lib/config/settings-types";

type Props = {
  settings: SystemSettings;
  onChange: (settings: SystemSettings) => void | Promise<unknown>;
};

function prepareStatuses(list: AttendanceStatusConfig[]): AttendanceStatusConfig[] {
  return list
    .filter((status) => status.label.trim())
    .map((status) => ({
      ...status,
      label: status.label.trim(),
      color: normalizeStatusColor(status.color, DEFAULT_STATUS_COLOR),
      autoReturnDays: normalizeAutoReturnDays(status.autoReturnDays),
      kind: (status.kind === "contrato" ? "contrato" : "atendimento") as StatusKind,
    }));
}

export function AttendanceStatusesSettings({ settings, onChange }: Props) {
  const [statuses, setStatuses] = useState<AttendanceStatusConfig[]>(
    settings.attendanceStatuses ?? [],
  );
  const [saving, setSaving] = useState(false);
  const statusesRef = useRef(statuses);
  const settingsRef = useRef(settings);
  const dirtyRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  statusesRef.current = statuses;
  settingsRef.current = settings;

  useEffect(() => {
    if (saving || dirtyRef.current) return;
    setStatuses(settings.attendanceStatuses ?? []);
  }, [settings.attendanceStatuses, saving]);

  useEffect(() => {
    return () => {
      if (!dirtyRef.current) return;
      const filled = prepareStatuses(statusesRef.current);
      void onChange({ ...settingsRef.current, attendanceStatuses: filled }).catch(() => {
        /* unmount flush — toast já não ajuda */
      });
    };
  }, [onChange]);

  const persistStatuses = (
    next: AttendanceStatusConfig[],
    options?: { successMessage?: string; quiet?: boolean },
  ) => {
    const filled = prepareStatuses(next);
    const drafts = next.filter((status) => !status.label.trim());
    setStatuses(next);
    statusesRef.current = next;
    dirtyRef.current = true;
    if (!options?.quiet) setSaving(true);

    const run = async () => {
      try {
        const missingKind = filled.some(
          (status) => status.kind !== "atendimento" && status.kind !== "contrato",
        );
        if (missingKind) {
          toast.error("Informe se cada status é de Atendimento ou de Contrato.");
          return;
        }

        const saved = await onChange({ ...settingsRef.current, attendanceStatuses: filled });
        if (saved && typeof saved === "object" && "attendanceStatuses" in saved) {
          settingsRef.current = saved as SystemSettings;
        }

        const liveDrafts = statusesRef.current.filter((status) => !status.label.trim());
        const keepDrafts = liveDrafts.length > 0 ? liveDrafts : drafts;
        const uiNext = options?.quiet ? [...filled, ...keepDrafts] : filled;
        statusesRef.current = uiNext;
        setStatuses(uiNext);
        dirtyRef.current = keepDrafts.length > 0 && Boolean(options?.quiet);

        if (!options?.quiet) {
          toast.success(
            options?.successMessage ??
              (filled.length === 0
                ? "Nenhum status cadastrado. Lista salva vazia."
                : "Status salvos."),
          );
        }
      } catch (error) {
        setStatuses(settingsRef.current.attendanceStatuses ?? []);
        statusesRef.current = settingsRef.current.attendanceStatuses ?? [];
        dirtyRef.current = false;
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar os status.");
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

  const updateStatus = (id: string, patch: Partial<AttendanceStatusConfig>) => {
    dirtyRef.current = true;
    setStatuses((prev) => {
      const next = prev.map((status) => (status.id === id ? { ...status, ...patch } : status));
      statusesRef.current = next;
      return next;
    });
  };

  const addStatus = () => {
    // Card novo na hora; gravação dos preenchidos em segundo plano.
    const current = statusesRef.current;
    const filled = prepareStatuses(current);
    const drafts = current.filter((status) => !status.label.trim());
    const created = createEmptyAttendanceStatus();
    const next = [...filled, ...drafts, created];
    dirtyRef.current = true;
    statusesRef.current = next;
    setStatuses(next);

    if (filled.length > 0) {
      void persistStatuses(next, { quiet: true }).catch(() => undefined);
    }
  };

  const removeStatus = (id: string) => {
    const next = statuses.filter((status) => status.id !== id);
    void persistStatuses(next, {
      successMessage:
        prepareStatuses(next).length === 0
          ? "Status removido. Lista vazia."
          : "Status removido.",
    });
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-base">Status</CardTitle>
        <CardDescription>
          Defina os status de atendimento e de contrato, cores e o retorno automático na Agenda ao
          atribuir o status. Ao clicar em &quot;Adicionar status&quot;, os já preenchidos são gravados
          automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum status cadastrado. Clique em &quot;Adicionar status&quot;.
            </p>
          ) : (
            statuses.map((status, index) => (
              <div
                key={status.id}
                className="flex flex-col gap-3 rounded-lg border border-border/50 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-start">
                  <div className="w-full max-w-[13.5rem] space-y-2 sm:w-[13.5rem]">
                    <Label htmlFor={`status-${status.id}`} className="flex flex-col gap-0.5">
                      <span>Status {index + 1}</span>
                      <span className="truncate text-[11px] font-normal text-muted-foreground">
                        ID: {status.id}
                      </span>
                    </Label>
                    <Input
                      id={`status-${status.id}`}
                      value={status.label}
                      disabled={saving}
                      onChange={(event) => updateStatus(status.id, { label: event.target.value })}
                      onBlur={() => {
                        const current = statusesRef.current.find((item) => item.id === status.id);
                        if (!current?.label.trim()) return;
                        void persistStatuses(statusesRef.current, { quiet: true });
                      }}
                      placeholder="Nome do status"
                    />
                  </div>

                  <input
                    id={`status-color-${status.id}`}
                    type="color"
                    value={normalizeStatusColor(status.color)}
                    disabled={saving}
                    onChange={(event) => updateStatus(status.id, { color: event.target.value })}
                    onBlur={() => {
                      const current = statusesRef.current.find((item) => item.id === status.id);
                      if (!current?.label.trim()) return;
                      void persistStatuses(statusesRef.current, { quiet: true });
                    }}
                    className="mb-0.5 h-9 w-9 shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                    aria-label={`Cor do status ${status.label || index + 1}`}
                    title="Cor do status"
                  />

                  <div className="w-full max-w-[11rem] space-y-2 sm:w-[11rem]">
                    <Label htmlFor={`status-auto-return-${status.id}`}>Retorno Automático</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`status-auto-return-${status.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={90}
                        step={1}
                        placeholder="0"
                        disabled={saving}
                        value={status.autoReturnDays ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") {
                            updateStatus(status.id, { autoReturnDays: null });
                            return;
                          }
                          updateStatus(status.id, {
                            autoReturnDays: normalizeAutoReturnDays(raw),
                          });
                        }}
                        onBlur={() => {
                          const current = statusesRef.current.find((item) => item.id === status.id);
                          if (!current?.label.trim()) return;
                          void persistStatuses(statusesRef.current, { quiet: true });
                        }}
                        className="w-20"
                      />
                      <span className="shrink-0 text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-start gap-2 sm:mb-0.5 sm:w-auto">
                    <StatusBadge label={status.label.trim() || "Prévia"} color={status.color} />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeStatus(status.id)}
                      aria-label="Remover status"
                      disabled={saving}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tipo (obrigatório)</Label>
                  <RadioGroup
                    value={status.kind}
                    onValueChange={(value) => {
                      const kind = value === "contrato" ? "contrato" : "atendimento";
                      const next = statusesRef.current.map((item) =>
                        item.id === status.id ? { ...item, kind } : item,
                      );
                      dirtyRef.current = true;
                      setStatuses(next);
                      statusesRef.current = next;
                      const current = next.find((item) => item.id === status.id);
                      if (current?.label.trim()) {
                        void persistStatuses(next, { quiet: true });
                      }
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    <label
                      htmlFor={`status-kind-atendimento-${status.id}`}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <RadioGroupItem
                        value="atendimento"
                        id={`status-kind-atendimento-${status.id}`}
                        disabled={saving}
                      />
                      Atendimento
                    </label>
                    <label
                      htmlFor={`status-kind-contrato-${status.id}`}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <RadioGroupItem
                        value="contrato"
                        id={`status-kind-contrato-${status.id}`}
                        disabled={saving}
                      />
                      Contrato
                    </label>
                  </RadioGroup>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={addStatus} disabled={saving}>
            <Plus className="size-4" /> Adicionar status
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void persistStatuses(statusesRef.current)}
          >
            Salvar status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
