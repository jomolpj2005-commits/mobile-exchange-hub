import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import Loader from "@/components/Loader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { getDealers } from "@/api/dealer";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/dealers")({
  head: () => ({
    meta: [
      { title: "Dealers | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Wholesale dealer master with territory, credit limit and outstanding balance from ERPNext.",
      },
      { property: "og:title", content: "Dealers | NovaCell Mobile ERP" },
      { property: "og:description", content: "Manage dealer tiers, credit exposure and exchange eligibility." },
    ],
  }),
  component: DealersPage,
});

function DealersPage() {
  const { data, loading } = useFetch(() => getDealers(), []);
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      (data ?? []).filter((d) =>
        `${d.name} ${d.dealer_name} ${d.territory}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [data, query],
  );

  return (
    <ErpLayout>
      <PageHeader
        title="Dealers"
        subtitle="Customer master filtered to the Wholesale Dealer customer group."
        actions={<Button>New dealer</Button>}
      />
      <FlowSteps
        title="Buying flow (dealer supply side)"
        steps={["Supplier", "Purchase Order", "Purchase Receipt", "Purchase Invoice", "Payment Entry"]}
        activeIndex={1}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Search dealer or territory…" />

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <article key={d.name} className="erp-panel space-y-3 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{d.dealer_name}</h3>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {d.name} · {d.territory}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd className="font-medium">{d.tier}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Credit limit</dt>
                  <dd>{formatCurrency(d.credit_limit)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Outstanding</dt>
                  <dd className="font-medium">{formatCurrency(d.outstanding)}</dd>
                </div>
              </dl>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (d.outstanding / d.credit_limit) * 100)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </ErpLayout>
  );
}