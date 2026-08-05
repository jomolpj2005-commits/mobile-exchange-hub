import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import FlowSteps from "@/components/FlowSteps";
import Loader from "@/components/Loader";
import AddressBook, { formatAddress } from "@/components/AddressBook";
import AddressForm from "@/components/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useCustomer } from "@/hooks/useCustomer";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { createAddress } from "@/api/address";
import { createSalesOrder } from "@/api/order";
import { createExchangeRequest } from "@/api/exchange";
import { applyCoupon } from "@/api/cart";
import { formatCurrency } from "@/utils/format";
import type { Address } from "@/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Confirm your details, delivery address and order summary before creating an ERPNext Sales Order.",
      },
      { property: "og:title", content: "Checkout | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Auto-filled customer details, saved addresses and a transparent order summary.",
      },
    ],
  }),
  component: CheckoutPage,
});

const SELLING_FLOW = [
  "Customer",
  "Quotation",
  "Sales Order",
  "Delivery Note",
  "Sales Invoice",
  "Payment Entry",
];

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const { customer, addresses, defaultShipping, defaultBilling, loading, reload } = useCustomer();
  const { draft } = useExchangeDraft();

  const [selected, setSelected] = useState<Address | null>(null);
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selected && defaultShipping) setSelected(defaultShipping);
  }, [defaultShipping, selected]);

  const exchangeDiscount = draft.estimated_value + draft.bonus;
  const shipping = subtotal > 0 && subtotal < 25000 ? 199 : 0;
  const taxable = Math.max(0, subtotal - exchangeDiscount - couponDiscount);
  const gst = Math.round(taxable * 0.18);
  const grandTotal = Math.max(0, taxable + gst + shipping);

  async function redeem() {
    if (!coupon.trim()) return;
    const res = await applyCoupon(coupon.trim());
    setCouponDiscount(res.discount ?? 0);
    if (res.discount) toast.success(`Coupon applied — ${formatCurrency(res.discount)} off`);
    else toast.error("Coupon could not be applied.");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      let exchangeRef = "";
      if (exchangeDiscount > 0) {
        const exc = (await createExchangeRequest({
          customer: customer?.name,
          category: draft.category,
          brand: draft.brand,
          model: draft.model,
          ram: draft.ram,
          storage: draft.storage,
          color: draft.color,
          purchase_year: draft.purchase_year,
          condition_answers: draft.answers,
          estimated_value: draft.estimated_value,
          bonus_value: draft.bonus,
        })) as { name?: string } | null;
        exchangeRef = exc?.name ?? "";
      }

      const order = (await createSalesOrder({
        customer: customer?.name ?? form.get("customer"),
        po_no: form.get("po_no"),
        delivery_date: form.get("delivery_date"),
        set_warehouse: form.get("warehouse"),
        terms: form.get("notes"),
        shipping_address_name: selected?.name,
        customer_address: defaultBilling?.name ?? selected?.name,
        contact_mobile: customer?.mobile_no,
        items: items.map((i) => ({ item_code: i.item_code, qty: i.qty, rate: i.rate })),
      })) as { name?: string } | null;

      toast.success("Sales Order created in ERPNext");
      navigate({
        to: "/payment",
        search: { so: order?.name ?? "" },
        state: { exchange: exchangeRef } as never,
      });
    } catch {
      toast.error("Could not reach ERPNext. Check VITE_ERP_URL and try again.");
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
      <PageHeader title="Checkout" subtitle="Review your details and place the order." />
      <FlowSteps title="ERPNext selling flow" steps={SELLING_FLOW} activeIndex={2} />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="erp-panel space-y-4 p-5">
            <h2 className="text-sm font-semibold">Order details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  name="customer"
                  defaultValue={customer?.customer_name ?? ""}
                  placeholder="Fetched from ERPNext"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po_no">Dealer PO number (optional)</Label>
                <Input id="po_no" name="po_no" placeholder="PO/2026/0091" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Expected delivery date</Label>
                <Input id="delivery_date" name="delivery_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Source warehouse</Label>
                <Input id="warehouse" name="warehouse" placeholder="Finished Goods - MFG" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Terms &amp; notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Freight, warranty and payment terms…" />
            </div>
          </section>

          <section className="erp-panel space-y-3 p-5">
            <h2 className="text-sm font-semibold">Customer details</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Customer name" value={customer?.customer_name} />
              <Field label="Email" value={customer?.email_id} />
              <Field label="Mobile number" value={customer?.mobile_no} />
              <Field label="Alternative mobile" value={customer?.alternative_mobile_no} />
            </dl>
            <p className="text-xs text-muted-foreground">
              Fetched automatically from the ERPNext Customer record — no retyping needed.
            </p>
          </section>

          <section className="erp-panel space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Delivery address</h2>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setChanging((v) => !v)}>
                  Change address
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                  Add new address
                </Button>
              </div>
            </div>

            {selected ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selected.full_name ?? selected.address_title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{formatAddress(selected)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.phone}
                  {selected.alternative_phone ? ` · ${selected.alternative_phone}` : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved address. Add one — it is stored on your ERPNext Customer.
              </p>
            )}

            {changing ? (
              <AddressBook
                customer={customer?.name ?? null}
                addresses={addresses}
                selectable
                selectedName={selected?.name}
                onSelect={(a) => {
                  setSelected(a);
                  setChanging(false);
                  toast.success("Address selected for this order");
                }}
                onChanged={reload}
              />
            ) : null}
          </section>
        </div>

        <aside className="erp-panel h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold">Order summary</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your cart is empty.{" "}
              <Link to="/products" className="text-primary underline">
                Browse products
              </Link>
            </p>
          ) : null}
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

          <div className="flex gap-2">
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" />
            <Button type="button" variant="outline" onClick={redeem}>
              Apply
            </Button>
          </div>

          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          {exchangeDiscount > 0 ? (
            <Row label="Exchange discount" value={`− ${formatCurrency(exchangeDiscount)}`} />
          ) : null}
          {couponDiscount > 0 ? (
            <Row label="Coupon discount" value={`− ${formatCurrency(couponDiscount)}`} />
          ) : null}
          <Row label="GST @ 18%" value={formatCurrency(gst)} />
          <Row label="Shipping" value={shipping ? formatCurrency(shipping) : "Free"} />
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Grand total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || items.length === 0}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue to payment
          </Button>
        </aside>
      </form>

      <AddressForm
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={async (values) => {
          if (!customer) {
            toast.error("Connect ERPNext to save addresses.");
            return;
          }
          await createAddress(customer.name, values);
          toast.success("Address added");
          reload();
        }}
      />
    </ErpLayout>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
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
