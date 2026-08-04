import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, Recycle, Repeat2, Truck } from "lucide-react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import FlowSteps from "@/components/FlowSteps";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { getSalesOrders } from "@/api/order";
import { getRefurbJobs } from "@/api/refurbishment";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | NovaCell Mobile ERP" },
      {
        name: "description",
        content:
          "Operations dashboard for mobile manufacturing, refurbishment and wholesale exchange, powered by ERPNext.",
      },
      { property: "og:title", content: "Dashboard | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Track orders, refurbishment jobs and dealer exchanges in one console.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const orders = useFetch(() => getSalesOrders(), []);
  const refurb = useFetch(() => getRefurbJobs(), []);

  return (
    <ErpLayout>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live snapshot of manufacturing, selling, refurbishment and dealer exchange."
        actions={
          <Button asChild>
            <Link to="/products">Browse catalogue</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Open Sales Value" value={formatCurrency(3644775)} hint="12 open sales orders" icon={IndianRupee} />
        <StatCard label="Refurb In Progress" value="311 units" hint="42 awaiting quality check" icon={Recycle} />
        <StatCard label="Exchange Requests" value="18 active" hint="4 pending approval" icon={Repeat2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FlowSteps
          title="Buying"
          steps={["Supplier", "Purchase Order", "Purchase Receipt", "Purchase Invoice", "Payment Entry"]}
          activeIndex={2}
        />
        <FlowSteps
          title="Manufacturing"
          steps={["BOM", "Work Order", "Job Card", "Material Transfer", "Manufacture"]}
          activeIndex={3}
        />
        <FlowSteps
          title="Selling"
          steps={["Customer", "Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Payment Entry"]}
          activeIndex={2}
        />
        <FlowSteps
          title="Wholesale Exchange"
          steps={[
            "Dealer",
            "Exchange Request",
            "Approval",
            "Used Mobile Received",
            "Balance",
            "New Mobile Purchase",
          ]}
          activeIndex={3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="erp-panel lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent Sales Orders</h2>
            <Link to="/orders" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {orders.loading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="erp-label px-4 py-2">Document</th>
                    <th className="erp-label px-4 py-2">Dealer</th>
                    <th className="erp-label px-4 py-2">Date</th>
                    <th className="erp-label px-4 py-2 text-right">Total</th>
                    <th className="erp-label px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders.data ?? []).slice(0, 5).map((o) => (
                    <tr key={o.name} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">{o.name}</td>
                      <td className="px-4 py-2.5">{o.customer}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(o.transaction_date)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(o.grand_total)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="erp-panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Refurbishment Queue</h2>
            <Link to="/refurbishment" className="text-xs font-medium text-primary hover:underline">
              Open
            </Link>
          </div>
          {refurb.loading ? (
            <Loader />
          ) : (
            <ul className="divide-y divide-border">
              {(refurb.data ?? []).map((job) => (
                <li key={job.name} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.item}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {job.serial_no}
                    </p>
                  </div>
                  <StatusBadge status={job.stage} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ErpLayout>
  );
}
