import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmptyBank } from "@/lib/config/settings-defaults";
import type { BankConfig, SystemSettings } from "@/lib/config/settings-types";

type Props = {
  settings: SystemSettings;
  onChange: (settings: SystemSettings) => void | Promise<unknown>;
};

export function BanksSettings({ settings, onChange }: Props) {
  const [banks, setBanks] = useState<BankConfig[]>(settings.banks ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBanks(settings.banks ?? []);
  }, [settings.banks]);

  const persistBanks = async (next: BankConfig[], successMessage: string) => {
    const filled = next.filter((bank) => bank.name.trim()).map((bank) => ({
      ...bank,
      name: bank.name.trim(),
    }));
    setSaving(true);
    try {
      await onChange({ ...settings, banks: filled });
      setBanks(filled);
      toast.success(successMessage);
    } catch (error) {
      setBanks(settings.banks ?? []);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os bancos.");
    } finally {
      setSaving(false);
    }
  };

  const updateBank = (id: string, name: string) => {
    setBanks((prev) => prev.map((bank) => (bank.id === id ? { ...bank, name } : bank)));
  };

  const addBank = () => {
    setBanks((prev) => [...prev, createEmptyBank()]);
  };

  const removeBank = (id: string) => {
    const next = banks.filter((bank) => bank.id !== id);
    setBanks(next);
    // Persiste na hora — senão a exclusão some ao recarregar / trocar de aba
    void persistBanks(
      next,
      next.filter((b) => b.name.trim()).length === 0
        ? "Banco removido. Lista de bancos vazia."
        : "Banco removido.",
    );
  };

  const saveBanks = () => {
    void persistBanks(
      banks,
      banks.filter((b) => b.name.trim()).length === 0
        ? "Nenhum banco cadastrado. Lista salva vazia."
        : "Bancos salvos.",
    );
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-base">Bancos</CardTitle>
        <CardDescription>
          Cadastre os bancos disponíveis no campo <strong>Banco</strong> dos clientes (opcional em
          todos os produtos).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Cada banco é um texto livre (ex.: Itaú, Bradesco, Caixa). A lixeira remove e salva na hora.
          Nomes vazios são ignorados ao salvar.
        </div>

        <div className="space-y-3">
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum banco cadastrado. Clique em &quot;Adicionar banco&quot;.
            </p>
          ) : (
            banks.map((bank, index) => (
              <div key={bank.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`bank-${bank.id}`}>Banco {index + 1}</Label>
                  <Input
                    id={`bank-${bank.id}`}
                    value={bank.name}
                    onChange={(event) => updateBank(bank.id, event.target.value)}
                    placeholder="Nome do banco"
                    disabled={saving}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeBank(bank.id)}
                  aria-label="Remover banco"
                  disabled={saving}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={addBank} disabled={saving}>
            <Plus className="size-4" /> Adicionar banco
          </Button>
          <Button type="button" onClick={saveBanks} disabled={saving}>
            Salvar bancos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
