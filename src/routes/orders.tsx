import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import FlowSteps from "@/components/FlowSteps";
import { useFetch } from "@/hooks/useFetch";
import { getSalesOrders } from "@/api/order";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Sales Orders | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Track dealer sales orders through delivery note, sales invoice and payment entry.",
      },
      { property: "og:title", content: "Sales Orders | NovaCell Mobile ERP" },
      { property: "og:description", content: "Order register synced from the ERPNext Sales Order doctype." },
    ],
  }),
  component: OrdersPage,
});

const PAGE_SIZE = 4;

function OrdersPage() {
  const { data, loading } = useFetch(() => getSalesOrders(), []);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      (data ?? []).filter((o) =>
        `${o.name} ${o.customer} ${o.status}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [data, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <ErpLayout>
      <PageHeader title="Orders" subtitle="Sales Order register with linked document stage." />
      <FlowSteps
        title="Selling flow"
        steps={["Customer", "Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Payment Entry"]}
        activeIndex={5}
      />
      <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search order, dealer or status…" />

      <section className="erp-panel overflow-hidden">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left">
                  <th className="erp-label px-4 py-2.5">Order</th>
                  <th className="erp-label px-4 py-2.5">Dealer</th>
                  <th className="erp-label px-4 py-2.5">Date</th>
                  <th className="erp-label px-4 py-2.5">Latest stage</th>
                  <th className="erp-label px-4 py-2.5 text-right">Grand total</th>
                  <th className="erp-label px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.name} className="border-t border-border/60">
                    <td className="px-4 py-3 font-mono text-xs">{o.name}</td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.transaction_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.stage}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.grand_total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} total={filtered.length} />
      </section>
    </ErpLayout>
  );
}