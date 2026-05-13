import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "accent" | "warning" | "danger" | "success";
  hint?: string;
}) {
  const toneRing: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-[oklch(0.32_0.07_140)]",
    warning: "bg-warning/15 text-[oklch(0.45_0.13_75)]",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden border-border/60 shadow-soft hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("grid size-10 place-items-center rounded-xl shrink-0", toneRing[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
        {typeof delta === "number" && (
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(delta)}%
            </span>
            <span className="text-muted-foreground">vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
