import { createFileRoute } from "@tanstack/react-router";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Loader from "@/components/Loader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { getExchangeRequests } from "@/api/exchange";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "Wholesale Exchange | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Dealer exchange requests: used-device valuation, approvals and remaining balance to new purchase.",
      },
      { property: "og:title", content: "Wholesale Exchange | NovaCell Mobile ERP" },
      { property: "og:description", content: "Track exchange approvals, received used stock and balance settlement." },
    ],
  }),
  component: ExchangePage,
});

const STAGES = [
  "Dealer",
  "Exchange Request",
  "Exchange Approval",
  "Used Mobile Received",
  "Remaining Balance",
  "New Mobile Purchase",
];

function ExchangePage() {
  const { data, loading } = useFetch(() => getExchangeRequests(), []);

  return (
    <ErpLayout>
      <PageHeader
        title="Wholesale Exchange"
        subtitle="Used handsets traded in by dealers against new stock."
        actions={<Button>New exchange request</Button>}
      />
      <FlowSteps title="Exchange flow" steps={STAGES} activeIndex={5} />

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {(data ?? []).map((x) => {
            const idx = STAGES.findIndex((s) => s.toLowerCase().startsWith(x.status.toLowerCase().slice(0, 6)));
            return (
              <article key={x.name} className="erp-panel p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{x.dealer}</h3>
                    <p className="truncate font-mono text-xs text-muted-foreground">{x.name}</p>
                  </div>
                  <StatusBadge status={x.status} />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="erp-label">Used devices in</p>
                    <p className="mt-1 text-sm font-medium">{x.used_model}</p>
                  </div>
                  <div>
                    <p className="erp-label">New devices out</p>
                    <p className="mt-1 text-sm font-medium">{x.new_model}</p>
                  </div>
                  <div>
                    <p className="erp-label">Exchange valuation</p>
                    <p className="mt-1 text-sm font-medium">{formatCurrency(x.valuation)}</p>
                  </div>
                  <div>
                    <p className="erp-label">Remaining balance</p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(x.balance)}</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <FlowSteps title="Progress" steps={STAGES} activeIndex={idx < 0 ? 1 : idx} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ErpLayout>
  );
}