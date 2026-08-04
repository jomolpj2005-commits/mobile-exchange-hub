import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import FlowSteps from "@/components/FlowSteps";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useCart } from "@/hooks/useCart";
import { getProduct } from "@/api/product";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Item Details | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Item specification, stock position and document flow for a single ERPNext item.",
      },
      { property: "og:title", content: "Item Details | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Pricing, condition grade, warehouse stock and linked ERPNext documents.",
      },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { id } = useParams({ from: "/products/$id" });
  const { data, loading } = useFetch(() => getProduct(id), [id]);
  const { add } = useCart();

  if (loading || !data) {
    return (
      <ErpLayout>
        <Loader label="Loading item…" />
      </ErpLayout>
    );
  }

  const specs = [
    ["Item Code", data.name],
    ["Item Group", data.item_group],
    ["Brand", data.brand],
    ["Storage", data.storage],
    ["Colour", data.color],
    ["Condition", data.condition],
  ];

  return (
    <ErpLayout>
      <PageHeader
        title={data.item_name}
        subtitle={`${data.item_group} · ${data.brand}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/products">Back</Link>
            </Button>
            <Button
              onClick={() => {
                add({
                  item_code: data.name,
                  item_name: data.item_name,
                  rate: data.standard_rate,
                  qty: 1,
                  condition: data.condition,
                });
                toast.success("Added to cart");
              }}
            >
              Add to cart
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="erp-panel grid h-64 place-items-center bg-secondary">
          <Smartphone className="h-24 w-24 text-primary/40" />
        </div>

        <section className="erp-panel space-y-4 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="erp-label">Standard Selling Rate</p>
              <p className="text-3xl font-bold">{formatCurrency(data.standard_rate)}</p>
            </div>
            <StatusBadge status={data.condition} />
          </div>
          <p className="text-sm text-muted-foreground">{data.description}</p>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="truncate text-sm font-medium">{String(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-b border-border/60 pb-2">
              <dt className="text-sm text-muted-foreground">Available Qty</dt>
              <dd className="text-sm font-medium">{formatNumber(data.stock_qty)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <FlowSteps
        title="Selling flow for this item"
        steps={["Customer", "Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Payment Entry"]}
        activeIndex={0}
      />
      <FlowSteps
        title="Manufacturing flow"
        steps={["BOM", "Work Order", "Job Card", "Material Transfer", "Manufacture"]}
        activeIndex={4}
      />
    </ErpLayout>
  );
}