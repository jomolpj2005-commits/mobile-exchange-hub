import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, Minus, Plus, ShieldCheck, Sparkles, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useCustomer } from "@/hooks/useCustomer";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { ExchangeAppliedBanner } from "@/components/ExchangeAppliedBanner";
import { formatCurrency } from "@/utils/format";
import { submitQuotationAndCreateSalesOrder } from "@/api/cart";
import { buyNowDirect } from "@/api/order";

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
  const navigate = useNavigate();
  const { items, setQty, remove, clear, buyNow, quotationName } = useCart();
  const { customer } = useCustomer();
  const { draft, reset: resetDraft } = useExchangeDraft();

  const [submitting, setSubmitting] = useState(false);

  const handleProceedToCheckout = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitQuotationAndCreateSalesOrder(items, customer?.name, exchangeDiscount);
      const soName = res?.sales_order_name || "";
      if (soName) {
        toast.success(`Quotation ${res?.quotation_name || quotationName} submitted & Draft Sales Order ${soName} created!`);
      } else {
        toast.success("Proceeding to checkout");
      }
      navigate({ to: "/checkout", search: { so: soName } });
    } catch (e) {
      console.error("Error submitting quotation / draft sales order:", e);
      toast.error("Error creating draft Sales Order");
      navigate({ to: "/checkout" });
    } finally {
      setSubmitting(false);
    }
  };

  const [protectionItems, setProtectionItems] = useState<Record<string, boolean>>({});

  const hasExchangeOnItem = (itemCode: string, itemName?: string) => {
    if (!draft || !draft.estimated_value || draft.estimated_value <= 0) return false;
    const matchesCode = Boolean(
      (draft.new_item_code && draft.new_item_code === itemCode) ||
      (draft.target_item && draft.target_item === itemCode)
    );
    const matchesName = Boolean(
      draft.new_item_name && itemName && draft.new_item_name.trim().toLowerCase() === itemName.trim().toLowerCase()
    );
    if (matchesCode || matchesName) return true;
    if (!draft.new_item_code && !draft.target_item && !draft.new_item_name) return true;

    const hasExactMatch = (items || []).some((i) => {
      const mc = Boolean(
        (draft.new_item_code && draft.new_item_code === i.item_code) ||
        (draft.target_item && draft.target_item === i.item_code)
      );
      const mn = Boolean(
        draft.new_item_name && i.item_name && draft.new_item_name.trim().toLowerCase() === i.item_name.trim().toLowerCase()
      );
      return mc || mn;
    });

    if (!hasExactMatch && items && items.length > 0 && items[0].item_code === itemCode) {
      return true;
    }
    return false;
  };

  const exchangeDiscount =
    draft && draft.estimated_value && draft.estimated_value > 0 && items && items.length > 0
      ? (draft.estimated_value || 0) + (draft.bonus || 0)
      : 0;

  const protectionTotal = Object.entries(protectionItems).reduce(
    (acc, [code, enabled]) => (enabled && items.some((i) => i.item_code === code) ? acc + 99 : acc),
    0
  );

  const realSubtotal = (items || []).reduce((sum, i) => {
    return sum + (i?.rate || 0) * (i?.qty || 1);
  }, 0);

  const grandTotal = Math.max(0, realSubtotal + protectionTotal - exchangeDiscount);

  return (
    <ErpLayout>
      <PageHeader
        title="Cart"
        subtitle="These lines become items on an ERPNext Quotation / Sales Order."
        actions={
          items.length ? (
            <Button
              variant="outline"
              onClick={() => {
                clear();
                resetDraft();
              }}
            >
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
            {items.map((i) => {
              const isExchangeItem = hasExchangeOnItem(i.item_code, i.item_name);
              const lineTotal = i.rate * i.qty;
              const hasProtection = Boolean(protectionItems[i.item_code]);

              return (
                <div key={i.item_code} className="p-4 space-y-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-base">{i.item_name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {i.item_code} · {formatCurrency(i.rate)} each
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(i.item_code, i.qty - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(i.item_code, i.qty + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="w-28 text-right font-bold text-base">{formatCurrency(lineTotal)}</p>
                    </div>
                  </div>

                  {/* Render Flipkart-style Exchange applied banner ONLY if offer is active */}
                  {isExchangeItem ? (
                    <ExchangeAppliedBanner
                      itemCode={i.item_code}
                      onRemove={() => {
                        resetDraft();
                      }}
                    />
                  ) : null}

                  {/* Flipkart Complete Mobile Protection Add-on */}
                  <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-900/60 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-md bg-blue-500/10 grid place-items-center text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Complete Mobile Protection</p>
                        <p className="text-[11px] text-muted-foreground">₹99 · 6 Months Screen & Damage Protection</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={hasProtection ? "secondary" : "default"}
                      className={`h-8 text-xs font-semibold px-4 ${
                        hasProtection
                          ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-300"
                          : ""
                      }`}
                      onClick={() => {
                        setProtectionItems((prev) => ({
                          ...prev,
                          [i.item_code]: !hasProtection,
                        }));
                        toast.success(
                          hasProtection ? "Mobile protection removed" : "Mobile protection added for ₹99!"
                        );
                      }}
                    >
                      {hasProtection ? "Added ✓" : "Add"}
                    </Button>
                  </div>

                  {/* Flipkart Cart Item Action Row: Remove | Save for later | Buy this now */}
                  <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground border-t border-border/40">
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium hover:text-destructive transition-colors"
                      onClick={() => {
                        remove(i.item_code);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Remove
                    </button>
                    <span className="text-border">|</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium hover:text-primary transition-colors"
                      onClick={() => toast.info(`${i.item_name} saved for later`)}
                    >
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground" /> Save for later
                    </button>
                    <span className="text-border">|</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium text-primary hover:underline transition-all"
                      onClick={async () => {
                        try {
                          toast.loading("Creating & submitting quotation...", { id: "cartbuynow" });
                          const res = await buyNowDirect(i.item_code, i.qty, i.rate, customer?.name, exchangeDiscount);
                          if (res && res.sales_order_name) {
                            toast.success("Draft Sales Order created! Redirecting to checkout...", { id: "cartbuynow" });
                            navigate({ to: "/checkout", search: { so: res.sales_order_name } });
                          } else {
                            toast.error(res?.message || "Failed to process Buy Now", { id: "cartbuynow" });
                          }
                        } catch (err: any) {
                          toast.error(err?.message || "Error processing Buy Now", { id: "cartbuynow" });
                        }
                      }}
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Buy this now
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="erp-panel h-fit space-y-4 p-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-semibold">Order summary</h2>
              {quotationName ? (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Draft Quotation: {quotationName}
                </span>
              ) : null}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(realSubtotal)}</span>
              </div>
              {protectionTotal > 0 ? (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>Mobile Protection Fee</span>
                  <span>+ {formatCurrency(protectionTotal)}</span>
                </div>
              ) : null}
              {exchangeDiscount > 0 ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Exchange discount</span>
                  <span>− {formatCurrency(exchangeDiscount)}</span>
                </div>
              ) : null}
            </div>

            <div className="flex justify-between border-t border-border pt-3 font-semibold text-base">
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            {/* Render Flipkart Green Savings Banner ONLY when an exchange discount exists */}
            {exchangeDiscount > 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>You'll save {formatCurrency(exchangeDiscount)} on this order!</span>
              </div>
            ) : null}

            <Button
              className="w-full text-sm font-semibold h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-slate-950"
              disabled={submitting || items.length === 0}
              onClick={handleProceedToCheckout}
            >
              {submitting ? "Submitting Quotation..." : "Place Order / Proceed to checkout"}
            </Button>
          </aside>
        </div>
      )}
    </ErpLayout>
  );
}