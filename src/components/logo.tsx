import logoHorizontal from "@/assets/logo-sinal-verde.png";
import logoStacked from "@/assets/logo-sinal-verde-stacked.png";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  variant = "horizontal",
}: {
  className?: string;
  compact?: boolean;
  variant?: "horizontal" | "stacked";
}) {
  const src = variant === "stacked" ? logoStacked : logoHorizontal;

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={src}
        alt="Sinal Verde — Sinal aberto para você o tempo inteiro"
        width={447}
        height={447}
        className={cn(
          "object-contain object-left",
          compact
            ? "h-9 w-9 max-w-9 overflow-hidden rounded-md"
            : variant === "stacked"
              ? "h-28 w-auto max-w-[200px]"
              : "h-14 w-auto max-w-[min(100%,320px)]",
        )}
        draggable={false}
      />
    </div>
  );
}
