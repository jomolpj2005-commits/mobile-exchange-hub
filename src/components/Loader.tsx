import { Loader2 } from "lucide-react";

export function Loader({ label = "Loading records…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {label}
    </div>
  );
}

export default Loader;