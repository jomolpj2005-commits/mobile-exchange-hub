import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { createSalesOrder } from "@/api/order";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Submit a dealer order that is created as an ERPNext Sales Order document.",
      },
      { property: "og:title", content: "Checkout | NovaCell Mobile ERP" },
      { property: "og:description", content: "Confirm dealer, delivery date and warehouse, then post to ERPNext." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const tax = Math.round(subtotal * 0.18);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await createSalesOrder({
        customer: form.get("customer"),
        delivery_date: form.get("delivery_date"),
        set_warehouse: form.get("warehouse"),
        po_no: form.get("po_no"),
        terms: form.get("notes"),
        items: items.map((i) => ({ item_code: i.item_code, qty: i.qty, rate: i.rate })),
      });
      toast.success("Sales Order submitted to ERPNext");
      clear();
      navigate({ to: "/orders" });
    } catch {
      toast.error("Could not reach ERPNext. Check VITE_ERP_URL and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ErpLayout>
      <PageHeader title="Checkout" subtitle="Creates a Sales Order via POST /api/resource/Sales Order." />
      <FlowSteps
        title="Selling flow"
        steps={["Customer", "Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Payment Entry"]}
        activeIndex={2}
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <section className="erp-panel space-y-4 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Order details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer">Dealer / Customer</Label>
              <Input id="customer" name="customer" defaultValue="Meridian Telecom Pvt Ltd" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_no">Dealer PO No.</Label>
              <Input id="po_no" name="po_no" placeholder="PO/2026/0091" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery date</Label>
              <Input id="delivery_date" name="delivery_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse">Source warehouse</Label>
              <Input id="warehouse" name="warehouse" defaultValue="Finished Goods - MFG" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Terms / notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Freight, warranty and payment terms…" />
          </div>
        </section>

        <aside className="erp-panel h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold">{items.length} line item(s)</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.item_code} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {i.item_name} × {i.qty}
                </span>
                <span className="shrink-0">{formatCurrency(i.rate * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">GST @ 18%</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Grand total</span>
            <span>{formatCurrency(subtotal + tax)}</span>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || items.length === 0}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Sales Order
          </Button>
        </aside>
      </form>
    </ErpLayout>
  );
}