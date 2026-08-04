import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  completed: "bg-success/12 text-success border-success/30",
  approved: "bg-success/12 text-success border-success/30",
  active: "bg-success/12 text-success border-success/30",
  paid: "bg-success/12 text-success border-success/30",
  "ready for sale": "bg-success/12 text-success border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  "pending approval": "bg-warning/15 text-warning-foreground border-warning/40",
  "on hold": "bg-warning/15 text-warning-foreground border-warning/40",
  "to bill": "bg-warning/15 text-warning-foreground border-warning/40",
  draft: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = MAP[status?.toLowerCase()] ?? "bg-info/12 text-info border-info/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default StatusBadge;