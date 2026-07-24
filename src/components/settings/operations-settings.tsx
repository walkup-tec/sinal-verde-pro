import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmptyOperation } from "@/lib/config/settings-defaults";
import type { OperationConfig, SystemSettings } from "@/lib/config/settings-types";

type Props = {
  settings: SystemSettings;
  onChange: (settings: SystemSettings) => void | Promise<unknown>;
};

function prepareOperations(list: OperationConfig[]): OperationConfig[] {
  return list
    .filter((operation) => operation.name.trim())
    .map((operation) => ({
      ...operation,
      name: operation.name.trim(),
    }));
}

export function OperationsSettings({ settings, onChange }: Props) {
  const [operations, setOperations] = useState<OperationConfig[]>(settings.operations ?? []);
  const [saving, setSaving] = useState(false);
  const operationsRef = useRef(operations);
  const settingsRef = useRef(settings);
  const dirtyRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  operationsRef.current = operations;
  settingsRef.current = settings;

  useEffect(() => {
    if (saving || dirtyRef.current) return;
    setOperations(settings.operations ?? []);
  }, [settings.operations, saving]);

  useEffect(() => {
    return () => {
      if (!dirtyRef.current) return;
      const filled = prepareOperations(operationsRef.current);
      void onChange({ ...settingsRef.current, operations: filled }).catch(() => {
        /* unmount flush */
      });
    };
  }, [onChange]);

  const persistOperations = (
    next: OperationConfig[],
    options?: { successMessage?: string; quiet?: boolean },
  ) => {
    const filled = prepareOperations(next);
    const drafts = next.filter((operation) => !operation.name.trim());
    setOperations(next);
    operationsRef.current = next;
    dirtyRef.current = true;
    if (!options?.quiet) setSaving(true);

    const run = async () => {
      try {
        const saved = await onChange({ ...settingsRef.current, operations: filled });
        if (saved && typeof saved === "object" && "operations" in saved) {
          settingsRef.current = saved as SystemSettings;
        }

        // Mantém linhas em branco que o usuário acabou de adicionar.
        const liveDrafts = operationsRef.current.filter((operation) => !operation.name.trim());
        const keepDrafts = liveDrafts.length > 0 ? liveDrafts : drafts;
        const uiNext = options?.quiet ? [...filled, ...keepDrafts] : filled;
        operationsRef.current = uiNext;
        setOperations(uiNext);
        dirtyRef.current = keepDrafts.length > 0 && Boolean(options?.quiet);

        if (!options?.quiet) {
          toast.success(
            options?.successMessage ??
              (filled.length === 0
                ? "Nenhuma operação cadastrada. Lista salva vazia."
                : "Operações salvas."),
          );
        }
      } catch (error) {
        setOperations(settingsRef.current.operations ?? []);
        operationsRef.current = settingsRef.current.operations ?? [];
        dirtyRef.current = false;
        toast.error(
          error instanceof Error ? error.message : "Não foi possível salvar as operações.",
        );
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

  const updateOperation = (id: string, name: string) => {
    dirtyRef.current = true;
    setOperations((prev) => {
      const next = prev.map((operation) =>
        operation.id === id ? { ...operation, name } : operation,
      );
      operationsRef.current = next;
      return next;
    });
  };

  const addOperation = () => {
    // Linha nova na hora; gravação das preenchidas em segundo plano.
    const current = operationsRef.current;
    const filled = prepareOperations(current);
    const drafts = current.filter((operation) => !operation.name.trim());
    const next = [...filled, ...drafts, createEmptyOperation()];
    dirtyRef.current = true;
    operationsRef.current = next;
    setOperations(next);

    if (filled.length > 0) {
      void persistOperations([...filled, ...drafts, next[next.length - 1]!], {
        quiet: true,
      }).catch(() => undefined);
    }
  };

  const removeOperation = (id: string) => {
    const next = operations.filter((operation) => operation.id !== id);
    void persistOperations(next, {
      successMessage:
        prepareOperations(next).length === 0
          ? "Operação removida. Lista de operações vazia."
          : "Operação removida.",
    });
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-base">Operação</CardTitle>
        <CardDescription>
          Cadastre as operações disponíveis no campo <strong>Operação</strong> dos clientes
          (opcional em todos os produtos). Ao clicar em &quot;Adicionar operação&quot;, as já
          preenchidas são gravadas automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma operação cadastrada. Clique em &quot;Adicionar operação&quot;.
            </p>
          ) : (
            operations.map((operation, index) => (
              <div key={operation.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`operation-${operation.id}`}>Operação {index + 1}</Label>
                  <Input
                    id={`operation-${operation.id}`}
                    value={operation.name}
                    onChange={(event) => updateOperation(operation.id, event.target.value)}
                    onBlur={() => {
                      const current = operationsRef.current.find((item) => item.id === operation.id);
                      if (!current?.name.trim()) return;
                      void persistOperations(operationsRef.current, { quiet: true });
                    }}
                    placeholder="Nome da operação"
                    disabled={saving}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeOperation(operation.id)}
                  aria-label="Remover operação"
                  disabled={saving}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={addOperation} disabled={saving}>
            <Plus className="size-4" /> Adicionar operação
          </Button>
          <Button
            type="button"
            onClick={() => void persistOperations(operationsRef.current)}
            disabled={saving}
          >
            Salvar operações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
