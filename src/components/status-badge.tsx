import { cn } from "@/lib/utils";
import type { StatusKey } from "@/mocks/data";
import { STATUS_META } from "@/mocks/data";

const TONE_CLASSES: Record<string, string> = {
  info: "bg-info/10 text-info border-info/20",
  warning: "bg-warning/15 text-[oklch(0.45_0.13_75)] border-warning/30",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/15 text-[oklch(0.32_0.07_140)] border-accent/30",
};

export function StatusBadge({
  status,
  className,
  size = "sm",
}: {
  status: StatusKey;
  className?: string;
  size?: "xs" | "sm";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}
