import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import AddressBook, { formatAddress } from "@/components/AddressBook";
import AddressForm from "@/components/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { useCustomer } from "@/hooks/useCustomer";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { createAddress, updateAddress } from "@/api/address";
import { createSalesOrder, getSalesOrder, saveDraftSalesOrderOnCheckout, submitSalesOrderOnCheckout } from "@/api/order";
import { createExchangeRequest } from "@/api/exchange";
import { formatCurrency } from "@/utils/format";
import type { Address } from "@/types";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { so?: string; view?: string } => ({
    so: typeof search["so"] === "string" ? search["so"] : undefined,
    view: typeof search["view"] === "string" || search["view"] === 1 || search["view"] === true ? String(search["view"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Complete your order by confirming your customer address and expected delivery date.",
      },
      { property: "og:title", content: "Checkout | NovaCell Mobile ERP" },
      { property: "og:description", content: "Finalize address selection for your ERPNext Sales Order." },
    ],
  }),
  component: CheckoutPage,
});

export function CheckoutPage() {
  const navigate = useNavigate();
  const { so: searchSo, view: searchView } = Route.useSearch();
  const isReadOnly = Boolean(searchView === "1" || searchView === "true");
  const { items: cartItems, subtotal: cartSubtotal } = useCart();
  const { customer, addresses, defaultShipping, defaultBilling, loading, reload } = useCustomer();
  const { draft, reset: resetExchange } = useExchangeDraft();

  const [selected, setSelected] = useState<Address | null>(null);
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [soDoc, setSoDoc] = useState<{
    name?: string;
    customer_name?: string;
    customer?: string;
    contact_email?: string;
    contact_mobile?: string;
    grand_total?: number;
    net_total?: number;
    items?: Array<{ item_code: string; item_name: string; qty: number; rate: number }>;
    customer_details?: {
      name: string;
      customer_name: string;
      email_id: string;
      mobile_no: string;
      alternative_mobile_no?: string;
    };
    shipping_address_doc?: Address;
  } | null>(null);

  useEffect(() => {
    if (searchSo) {
      getSalesOrder(searchSo).then((res) => {
        if (res) setSoDoc(res as any);
      });
    }
  }, [searchSo]);

  const displayItems = soDoc?.items && soDoc.items.length > 0 ? soDoc.items : cartItems;
  const displaySubtotal =
    (soDoc as any)?.subtotal ??
    (soDoc?.items && soDoc.items.length > 0
      ? soDoc.items.reduce((s, i) => s + (i.rate || 0) * (i.qty || 1), 0)
      : cartSubtotal);

  // Hardcode Expected Delivery Date to 7 days from today (YYYY-MM-DD)
  const defaultDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    if (soDoc?.shipping_address_doc) {
      setSelected(soDoc.shipping_address_doc as Address);
    } else if (!selected) {
      if (defaultShipping) setSelected(defaultShipping);
      else if (addresses && addresses.length > 0) setSelected(addresses[0]);
    }
  }, [soDoc, defaultShipping, addresses, selected]);

  const activeCust = customer || soDoc?.customer_details;

  const hasMatchingItem = displayItems.some((i) => {
    if (!draft || !draft.estimated_value || draft.estimated_value <= 0) return false;
    const matchesCode = Boolean(
      (draft.new_item_code && draft.new_item_code === i.item_code) ||
      (draft.target_item && draft.target_item === i.item_code)
    );
    const matchesName = Boolean(
      draft.new_item_name && i.item_name && draft.new_item_name.trim().toLowerCase() === i.item_name.trim().toLowerCase()
    );
    return matchesCode || matchesName;
  });
  const exchangeDiscount =
    typeof (soDoc as any)?.discount_amount === "number"
      ? (soDoc as any).discount_amount
      : typeof (soDoc as any)?.exchange_discount === "number"
      ? (soDoc as any).exchange_discount
      : (hasMatchingItem && draft && draft.estimated_value && draft.estimated_value > 0
        ? (draft.estimated_value || 0) + (draft.bonus || 0)
        : 0);
  const shipping = displaySubtotal > 0 && displaySubtotal < 25000 ? 199 : 0;
  const taxable = Math.max(0, displaySubtotal - exchangeDiscount);
  const grandTotal = taxable + shipping;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      let exchangeRef = draft?.doc_name || "";
      if (!exchangeRef && exchangeDiscount > 0) {
        try {
          const exc = (await createExchangeRequest({
            customer: activeCust?.name,
            category: draft.category,
            brand: draft.brand,
            model: draft.model,
            ram: draft.ram,
            storage: draft.storage,
            color: draft.color,
            purchase_year: draft.purchase_year,
            questionnaire_answers: JSON.stringify(draft.answers || {}),
            exchange_value: draft.estimated_value,
            original_price: cartSubtotal || 0,
            target_item: draft.target_item || draft.new_item_code,
          })) as { name?: string } | string | null;
          exchangeRef = typeof exc === "string" ? exc : (exc?.name ?? "");
        } catch (excErr) {
          console.error("Exchange creation notice:", excErr);
        }
      }

      let soName = searchSo;
      const deliveryDateVal = String(form.get("delivery_date") || defaultDeliveryDate);

      if (!soName) {
        const order = (await createSalesOrder({
          customer: activeCust?.name ?? form.get("customer"),
          delivery_date: deliveryDateVal,
          shipping_address_name: selected?.name,
          customer_address: defaultBilling?.name ?? selected?.name,
          contact_mobile: activeCust?.mobile_no,
          items: displayItems.map((i) => ({ item_code: i.item_code, qty: i.qty, rate: i.rate })),
        })) as { name?: string } | null;
        soName = order?.name ?? "";
      }

      // Save/update Draft Sales Order in ERPNext on "Continue to payment" with selected address and exchange discount
      const subRes = await saveDraftSalesOrderOnCheckout(
        soName,
        activeCust?.name,
        selected?.name,
        selected?.name,
        deliveryDateVal,
        exchangeDiscount
      );
      const finalSo = subRes?.sales_order || soName || "";

      toast.success(`Order ${finalSo || ""} details saved! Proceeding to payment…`);
      navigate({
        to: "/payment",
        search: { so: finalSo },
        state: { exchange: exchangeRef } as never,
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not process Sales Order submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ErpLayout>
        <Loader label="Loading your details…" />
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      <PageHeader
        title={isReadOnly ? "Order Details" : "Checkout & Order Details"}
        subtitle={isReadOnly ? `Viewing details for Order #${searchSo || soDoc?.name || ""}` : "Review your details, order number and items before proceeding to payment."}
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="erp-panel space-y-4 p-5">
            <h2 className="text-sm font-semibold">Order details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  name="customer"
                  key={activeCust?.customer_name || soDoc?.customer_name || "cust_input"}
                  defaultValue={activeCust?.customer_name || soDoc?.customer_name || ""}
                  placeholder="Customer Name"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-muted cursor-not-allowed text-foreground opacity-100" : ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Expected delivery date</Label>
                <Input
                  id="delivery_date"
                  name="delivery_date"
                  type="date"
                  defaultValue={defaultDeliveryDate}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-muted cursor-not-allowed text-foreground opacity-100" : ""}
                  required
                />
              </div>
            </div>
          </section>

          <section className="erp-panel space-y-3 p-5">
            <h2 className="text-sm font-semibold">Customer details</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Customer name" value={activeCust?.customer_name || soDoc?.customer_name} />
              <Field label="Email" value={activeCust?.email_id || soDoc?.contact_email} />
              <Field label="Mobile number" value={activeCust?.mobile_no || soDoc?.contact_mobile} />
              <Field label="Alternative mobile" value={activeCust?.alternative_mobile_no} />
            </dl>
          </section>

          <section className="erp-panel space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Delivery address</h2>
            </div>

            {selected ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-1">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selected.full_name ?? selected.address_title}
                </p>
                <p className="text-sm text-muted-foreground">{formatAddress(selected)}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.phone}
                  {selected.alternative_phone ? ` · ${selected.alternative_phone}` : ""}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>No delivery address selected.</span>
                {!isReadOnly ? (
                  <Button type="button" size="sm" onClick={() => setAdding(true)}>
                    Add Address
                  </Button>
                ) : null}
              </div>
            )}

            {!isReadOnly && changing ? (
              <AddressBook
                customer={customer?.name ?? null}
                addresses={addresses}
                selectable
                selectedName={selected?.name}
                onSelect={(a) => {
                  setSelected(a);
                  setChanging(false);
                  toast.success("Delivery address updated for this order!");
                }}
                onChanged={reload}
              />
            ) : null}
          </section>
        </div>

        <aside className="erp-panel h-fit space-y-3 p-5">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-semibold">Order Summary</h2>
            {searchSo ? (
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {searchSo}
              </span>
            ) : null}
          </div>

          {searchSo ? (
            <div className="text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Order Number:</span> {searchSo}</p>
              <p><span className="font-medium text-foreground">Customer:</span> {activeCust?.customer_name || activeCust?.name || "Guest"}</p>
            </div>
          ) : null}

          {displayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your cart is empty.{" "}
              <Link to="/products" className="text-primary underline">
                Browse products
              </Link>
            </p>
          ) : null}
          <ul className="space-y-2 text-sm border-t pt-2">
            {displayItems.map((i) => (
              <li key={i.item_code} className="flex justify-between gap-3">
                <div className="min-w-0 truncate">
                  <span className="text-muted-foreground">{i.item_name} × {i.qty}</span>
                  {i.serial_no && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                      S/N: {i.serial_no}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium">{formatCurrency(i.rate * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 border-t border-border pt-3">
            <Row label="Subtotal" value={formatCurrency(displaySubtotal)} />
            {exchangeDiscount > 0 ? (
              <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Exchange discount</span>
                <div className="flex items-center gap-1">
                  <span>− {formatCurrency(exchangeDiscount)}</span>
                  {!isReadOnly ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        resetExchange();
                        window.localStorage.removeItem("erp_exchange_draft");
                        window.dispatchEvent(new Event("erp-exchange-change"));
                        toast.info("Exchange offer removed");
                      }}
                      title="Remove Exchange Offer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <Row label="Shipping Charges" value={shipping ? formatCurrency(shipping) : "Free"} />
          </div>

          <div className="flex justify-between border-t border-border pt-3 font-semibold text-base">
            <span>Final Payable Amount</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>

          {isReadOnly ? (
            <Button asChild variant="outline" className="w-full h-11 text-sm font-semibold mt-2">
              <Link to="/orders">← Back to My Orders</Link>
            </Button>
          ) : (
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={submitting || displayItems.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue to payment
            </Button>
          )}
        </aside>
      </form>

      <AddressForm
        open={adding || Boolean(editing)}
        initial={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          const custId = customer?.name || activeCust?.name || (typeof window !== "undefined" ? localStorage.getItem("active_customer_name") || localStorage.getItem("active_dealer_email") : null);
          if (!custId && !editing) {
            toast.error("Connect ERPNext to save addresses.");
            return;
          }
          try {
            if (editing) {
              const updated = await updateAddress(editing.name, values);
              toast.success("Address updated");
              if (updated && typeof updated === "object" && (updated as Address).name) {
                setSelected(updated as Address);
              } else {
                setSelected({ ...editing, ...values } as Address);
              }
              setEditing(null);
            } else {
              const created = await createAddress(custId!, values);
              toast.success("New address added and selected");
              if (created && typeof created === "object" && (created as Address).name) {
                setSelected(created as Address);
              }
              setAdding(false);
            }
            await reload();
          } catch (err: any) {
            console.error("Address save failed:", err);
            toast.error(err?.message || "Could not update address. Please try again.");
          }
        }}
      />
    </ErpLayout>
  );
}

function Field({ label, value }: { label: string; value?: string | undefined }) {
  return (
    <div>
      <dt className="erp-label">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
