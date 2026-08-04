import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import Loader from "@/components/Loader";
import FlowSteps from "@/components/FlowSteps";
import StatCard from "@/components/StatCard";
import { Boxes, PackageCheck, Warehouse } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { getStockBalance } from "@/api/inventory";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Warehouse-wise stock balance for handsets, spares and refurbished units from ERPNext Bin.",
      },
      { property: "og:title", content: "Inventory | NovaCell Mobile ERP" },
      { property: "og:description", content: "Actual qty, reserved qty and valuation across plant warehouses." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data, loading } = useFetch(() => getStockBalance(), []);
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      (data ?? []).filter((r) =>
        `${r.item_code} ${r.item_name} ${r.warehouse}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [data, query],
  );

  const totalUnits = rows.reduce((s, r) => s + r.actual_qty, 0);
  const totalValue = rows.reduce((s, r) => s + r.actual_qty * r.valuation_rate, 0);
  const warehouses = new Set(rows.map((r) => r.warehouse)).size;

  return (
    <ErpLayout>
      <PageHeader title="Inventory" subtitle="Stock balance read from the ERPNext Bin doctype." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Units on hand" value={formatNumber(totalUnits)} icon={Boxes} />
        <StatCard label="Stock value" value={formatCurrency(totalValue)} icon={PackageCheck} />
        <StatCard label="Warehouses" value={String(warehouses)} icon={Warehouse} />
      </div>

      <FlowSteps
        title="Manufacturing flow"
        steps={["BOM", "Work Order", "Job Card", "Material Transfer for Manufacture", "Manufacture"]}
        activeIndex={4}
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Search item or warehouse…" />

      <section className="erp-panel overflow-hidden">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left">
                  <th className="erp-label px-4 py-2.5">Item</th>
                  <th className="erp-label px-4 py-2.5">Warehouse</th>
                  <th className="erp-label px-4 py-2.5 text-right">Actual</th>
                  <th className="erp-label px-4 py-2.5 text-right">Reserved</th>
                  <th className="erp-label px-4 py-2.5 text-right">Valuation</th>
                  <th className="erp-label px-4 py-2.5 text-right">Stock value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.item_code}-${r.warehouse}`} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.item_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.item_code}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.warehouse}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatNumber(r.actual_qty)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(r.reserved_qty)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(r.valuation_rate)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(r.actual_qty * r.valuation_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ErpLayout>
  );
}