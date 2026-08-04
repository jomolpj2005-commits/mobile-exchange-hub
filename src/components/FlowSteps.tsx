import { cn } from "@/lib/utils";

/** Renders an ERPNext document flow, e.g. Supplier -> Purchase Order -> ... */
export function FlowSteps({
  title,
  steps,
  activeIndex = -1,
}: {
  title: string;
  steps: string[];
  activeIndex?: number;
}) {
  return (
    <section className="erp-panel p-4">
      <p className="erp-label">{title}</p>
      <ol className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium",
                i <= activeIndex
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-secondary-foreground",
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 ? (
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default FlowSteps;