import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import ErpLayout from "@/layouts/ErpLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { getSalesOrder } from "@/api/order";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>): {
    so?: string;
    dn?: string;
    si?: string;
    pe?: string;
    exc?: string;
    mode?: string;
  } => ({
    so: typeof search["so"] === "string" ? search["so"] : undefined,
    dn: typeof search["dn"] === "string" ? search["dn"] : undefined,
    si: typeof search["si"] === "string" ? search["si"] : undefined,
    pe: typeof search["pe"] === "string" ? search["pe"] : undefined,
    exc: typeof search["exc"] === "string" ? search["exc"] : undefined,
    mode: typeof search["mode"] === "string" ? search["mode"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Your sales order and associated fulfillment documents have been created in ERPNext.",
      },
      { property: "og:title", content: "Order Confirmed | NovaCell Mobile ERP" },
      { property: "og:description", content: "Reference numbers and next steps for your order." },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { so, mode } = Route.useSearch();
  const { clear } = useCart();
  const { reset } = useExchangeDraft();
  const [soDoc, setSoDoc] = useState<any>(null);

  useEffect(() => {
    clear();
    reset();
    if (so) {
      getSalesOrder(so).then((res) => {
        if (res) setSoDoc(res);
      });
    }
  }, [so]);

  return (
    <ErpLayout>
      <section className="mx-auto w-full max-w-xl space-y-6 py-6">
        <div className="erp-panel space-y-4 p-8 text-center rounded-xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Order Confirmed!</h1>
            <p className="text-sm text-muted-foreground">
              Thank you for your order. We have received your request and are processing it.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-900/60 p-4 text-left space-y-2.5">
            {so ? (
              <div className="flex justify-between items-center text-sm border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Order Reference</span>
                <span className="font-mono font-semibold text-primary">{so}</span>
              </div>
            ) : null}

            {soDoc?.subtotal && soDoc?.exchange_discount ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Original Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(soDoc.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">Exchange Discount</span>
                  <span className="font-bold">− {formatCurrency(soDoc.exchange_discount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border/60 pt-2 font-bold">
                  <span className="text-foreground">Net Paid Amount</span>
                  <span className="text-primary text-base">{formatCurrency(soDoc.net_paid || soDoc.grand_total)}</span>
                </div>
              </>
            ) : null}

            <div className="flex justify-between items-center text-sm border-t border-border/60 pt-2">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold text-foreground">{mode || "Cash in Hand"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1 h-11 text-sm font-semibold">
            <Link to="/orders">Track order</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-11 text-sm font-semibold">
            <Link to="/products">Continue shopping</Link>
          </Button>
        </div>
      </section>
    </ErpLayout>
  );
}

