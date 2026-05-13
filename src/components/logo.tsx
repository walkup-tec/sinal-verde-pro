export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-soft">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c4 4 6 7 6 11a6 6 0 0 1-12 0c0-4 2-7 6-11Z" fill="currentColor" opacity="0.18" />
          <path d="M8 13l3 3 5-6" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-700 font-semibold tracking-tight">Sinal Verde</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">CRM Financeiro</div>
        </div>
      )}
    </div>
  );
}
