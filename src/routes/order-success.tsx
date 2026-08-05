import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, Repeat2 } from "lucide-react";
import ErpLayout from "@/layouts/ErpLayout";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    so: typeof search["so"] === "string" ? search["so"] : "",
    pe: typeof search["pe"] === "string" ? search["pe"] : "",
    exc: typeof search["exc"] === "string" ? search["exc"] : "",
    mode: typeof search["mode"] === "string" ? search["mode"] : "Online",
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Your sales order and exchange request have been created in ERPNext.",
      },
      { property: "og:title", content: "Order Confirmed | NovaCell Mobile ERP" },
      { property: "og:description", content: "Reference numbers and next steps for your order." },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { so, pe, exc, mode } = Route.useSearch();

  const refs = [
    { label: "Sales Order", value: so, icon: Package },
    { label: "Exchange Request", value: exc, icon: Repeat2 },
    { label: "Payment Entry", value: pe, icon: CheckCircle2 },
  ].filter((r) => r.value);

  return (
    <ErpLayout>
      <section className="mx-auto w-full max-w-2xl space-y-4">
        <div className="erp-panel space-y-3 p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="text-2xl font-bold">Order confirmed</h1>
          <p className="text-sm text-muted-foreground">
            {exc ? "Exchange request created. " : ""}Sales Order created in ERPNext. Payment mode: {mode}.
          </p>
        </div>

        {refs.length ? (
          <div className="erp-panel divide-y divide-border p-2">
            {refs.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 p-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <r.icon className="h-4 w-4 text-primary" />
                  {r.label}
                </span>
                <span className="font-mono text-sm font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        <FlowSteps
          title="What happens next"
          steps={["Sales Order", "Payment", "Delivery Note", "Sales Invoice", "Payment Entry"]}
          activeIndex={mode === "Cash on Delivery" ? 0 : 1}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link to="/orders">Track order</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/products">Continue shopping</Link>
          </Button>
        </div>
      </section>
    </ErpLayout>
  );
}
