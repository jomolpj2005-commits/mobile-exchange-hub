import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Review selected handsets and parts before raising an ERPNext quotation or sales order.",
      },
      { property: "og:title", content: "Cart | NovaCell Mobile ERP" },
      { property: "og:description", content: "Draft cart lines that become ERPNext Sales Order items." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, clear, subtotal } = useCart();
  const tax = Math.round(subtotal * 0.18);

  return (
    <ErpLayout>
      <PageHeader
        title="Cart"
        subtitle="These lines become items on an ERPNext Quotation / Sales Order."
        actions={
          items.length ? (
            <Button variant="outline" onClick={clear}>
              Clear cart
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="erp-panel p-12 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button className="mt-4" asChild>
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="erp-panel divide-y divide-border lg:col-span-2">
            {items.map((i) => (
              <div key={i.item_code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.item_name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {i.item_code} · {formatCurrency(i.rate)} each
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center rounded-md border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.item_code, i.qty - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.item_code, i.qty + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="w-28 text-right font-semibold">{formatCurrency(i.rate * i.qty)}</p>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.item_code)} aria-label="Remove line">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </section>

          <aside className="erp-panel h-fit space-y-3 p-5">
            <h2 className="text-sm font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST @ 18%</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold">
              <span>Grand total</span>
              <span>{formatCurrency(subtotal + tax)}</span>
            </div>
            <Button className="w-full" asChild>
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Taxes and pricing rules are finally applied by ERPNext on document save.
            </p>
          </aside>
        </div>
      )}
    </ErpLayout>
  );
}