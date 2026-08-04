import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="erp-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="erp-label">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default StatCard;