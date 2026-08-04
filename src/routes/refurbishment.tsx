import { createFileRoute } from "@tanstack/react-router";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Loader from "@/components/Loader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { getRefurbJobs } from "@/api/refurbishment";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/refurbishment")({
  head: () => ({
    meta: [
      { title: "Refurbishment | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Refurbishment pipeline from inspection and repair through quality check to refurbished stock.",
      },
      { property: "og:title", content: "Refurbishment | NovaCell Mobile ERP" },
      { property: "og:description", content: "Serial-wise repair jobs, grades, technicians and refurbishment cost." },
    ],
  }),
  component: RefurbPage,
});

const STAGES = [
  "Inspection",
  "Repair",
  "Component Replacement",
  "Quality Check",
  "Ready for Sale",
  "Refurbished Product Stock",
];

function RefurbPage() {
  const { data, loading } = useFetch(() => getRefurbJobs(), []);
  const jobs = data ?? [];

  return (
    <ErpLayout>
      <PageHeader
        title="Refurbishment"
        subtitle="Serial-tracked repair pipeline feeding refurbished finished-goods stock."
        actions={<Button>New refurbishment job</Button>}
      />
      <FlowSteps title="Refurbishment flow" steps={STAGES} activeIndex={5} />

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {STAGES.slice(0, 6).map((stage) => {
            const stageJobs = jobs.filter((j) => j.stage === stage);
            return (
              <section key={stage} className="erp-panel flex flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="truncate text-sm font-semibold">{stage}</h2>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    {stageJobs.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 p-4">
                  {stageJobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No units in this stage.</p>
                  ) : (
                    stageJobs.map((j) => (
                      <article key={j.name} className="rounded-md border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{j.item}</p>
                            <p className="truncate font-mono text-xs text-muted-foreground">{j.serial_no}</p>
                          </div>
                          <StatusBadge status={`Grade ${j.grade}`} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">{j.technician}</span>
                          <span className="shrink-0 font-medium text-foreground">{formatCurrency(j.cost)}</span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </ErpLayout>
  );
}