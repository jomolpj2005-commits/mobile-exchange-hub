import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Banknote, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { useCustomer } from "@/hooks/useCustomer";
import {
  createCashOnDeliveryOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/api/payment";
import { getSalesOrder } from "@/api/order";
import { markExchangeOfferUsed } from "@/api/exchange";
import { formatCurrency } from "@/utils/format";
import { RazorpayGatewayModal } from "@/components/RazorpayGatewayModal";

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>): { so?: string } => ({
    so: typeof search["so"] === "string" ? search["so"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Pay online with Razorpay or choose cash on delivery for your ERPNext sales order.",
      },
      { property: "og:title", content: "Payment | NovaCell Mobile ERP" },
      { property: "og:description", content: "Secure Razorpay checkout or cash in hand on delivery." },
    ],
  }),
  component: PaymentPage,
});

const SELLING_FLOW = [
  "Customer",
  "Quotation",
  "Sales Order",
  "Payment",
  "Delivery Note",
  "Sales Invoice",
  "Payment Entry",
];

function PaymentPage() {
  const navigate = useNavigate();
  const { so } = Route.useSearch();
  const { items: cartItems, subtotal: cartSubtotal, clear } = useCart();
  const { draft, reset } = useExchangeDraft();
  const { customer } = useCustomer();
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [soDoc, setSoDoc] = useState<{
    name?: string;
    grand_total?: number;
    net_total?: number;
    items?: Array<{ item_code: string; item_name: string; qty: number; rate: number }>;
  } | null>(null);

  useEffect(() => {
    if (so) {
      getSalesOrder(so)
        .then((res) => {
          if (res) setSoDoc(res as any);
        })
        .catch((err) => {
          console.error("Failed to load sales order details:", err);
        });
    }
  }, [so]);

  const displayItems =
    soDoc?.items && soDoc.items.length > 0
      ? soDoc.items
      : cartItems;

  const displaySubtotal =
    (soDoc as any)?.subtotal ??
    (soDoc?.items && soDoc.items.length > 0
      ? soDoc.items.reduce((s: number, i: any) => s + ((i.price_list_rate || i.rate || 0) * (i.qty || 1)), 0)
      : cartSubtotal);

  const exchangeDiscount =
    (soDoc as any)?.discount_amount ||
    (soDoc as any)?.exchange_discount ||
    (draft && draft.estimated_value && draft.estimated_value > 0 && displayItems && displayItems.length > 0
      ? (draft.estimated_value || 0) + (draft.bonus || 0)
      : 0);

  const shipping = displaySubtotal > 0 && displaySubtotal < 25000 ? 199 : 0;
  const taxable = Math.max(0, displaySubtotal - exchangeDiscount);
  const payable = taxable + shipping;

  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);

  function payOnline() {
    setError(null);
    setRazorpayModalOpen(true);
  }

  async function payCod() {
    setError(null);
    setBusy(true);
    try {
      if (draft?.doc_name) {
        try {
          await markExchangeOfferUsed(draft.doc_name, so, exchangeDiscount);
        } catch (excErr) {
          console.error("Mark exchange offer used notice:", excErr);
        }
      }
      const res = await createCashOnDeliveryOrder({ sales_order: so, payment_mode: "Cash in Hand" });
      const pe = res?.payment_entry ?? "";
      const dn = res?.delivery_note ?? "";
      const si = res?.sales_invoice ?? "";
      clear();
      reset();
      toast.success("Order placed! Exchanged devices routed to Refurbishment.");
      navigate({ to: "/order-success", search: { so, dn, si, pe, mode: "Cash in Hand" } });
    } catch (e: any) {
      console.error("Cash on delivery error:", e);
      setError(e?.message || "Could not confirm the cash-in-hand order. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ErpLayout>
      <PageHeader
        title="Payment"
        subtitle="Complete the payment to move your Sales Order into fulfilment."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <MethodCard
            active={method === "online"}
            onSelect={() => setMethod("online")}
            icon={CreditCard}
            title="Pay Online"
            lines={["Razorpay secure checkout", "UPI, cards, net banking, wallets & EMI", "Instant order confirmation"]}
          />
          <MethodCard
            active={method === "cod"}
            onSelect={() => setMethod("cod")}
            icon={Banknote}
            title="Cash in Hand (Cash on Delivery)"
            lines={["Pay when the product is delivered", "No advance payment required", "Payment Entry created after delivery"]}
          />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Payment verification and Payment Entry creation run inside ERPNext.
          </p>
        </section>

        <aside className="erp-panel h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold">Order summary</h2>
          {so ? (
            <p className="font-mono text-xs text-muted-foreground">Sales Order {so}</p>
          ) : (
            <p className="text-xs text-warning-foreground">
              No sales order reference — start from{" "}
              <Link to="/checkout" className="underline">
                checkout
              </Link>
              .
            </p>
          )}

          <ul className="space-y-2 text-sm">
            {displayItems.map((i) => (
              <li key={i.item_code} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {i.item_name} × {i.qty}
                </span>
                <span className="shrink-0">{formatCurrency(((i as any).price_list_rate || i.rate || 0) * (i.qty || 1))}</span>
              </li>
            ))}
          </ul>

          <Row label="Subtotal" value={formatCurrency(displaySubtotal)} />
          {exchangeDiscount > 0 ? (
            <Row label="Exchange discount" value={`− ${formatCurrency(exchangeDiscount)}`} tone="success" />
          ) : null}
          <Row label="Shipping" value={shipping ? formatCurrency(shipping) : "Free"} />
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Final payable</span>
            <span>{formatCurrency(payable)}</span>
          </div>

          <Button
            className="w-full"
            disabled={busy || payable <= 0}
            onClick={method === "online" ? payOnline : payCod}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Make Payment
          </Button>
        </aside>
      </div>

      <RazorpayGatewayModal
        open={razorpayModalOpen}
        onOpenChange={setRazorpayModalOpen}
        salesOrder={so || ""}
        amount={payable}
        customerName={customer?.customer_name}
        customerEmail={customer?.email_id}
        customerPhone={customer?.mobile_no}
        onPaymentSuccess={async (res) => {
          if (draft?.doc_name) {
            try {
              await markExchangeOfferUsed(draft.doc_name, so, exchangeDiscount);
            } catch (excErr) {
              console.error("Mark exchange offer used notice:", excErr);
            }
          }
          const pe = res?.payment_entry ?? "";
          const dn = res?.delivery_note ?? "";
          const si = res?.sales_invoice ?? "";
          clear();
          reset();
          toast.success("Razorpay payment verified! Exchanged devices routed to Refurbishment.");
          navigate({
            to: "/order-success",
            search: { so, dn, si, pe, mode: "Razorpay" },
          });
        }}
      />
    </ErpLayout>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(tone === "success" && "font-medium text-success")}>{value}</span>
    </div>
  );
}

function MethodCard({
  active,
  onSelect,
  icon: Icon,
  title,
  lines,
}: {
  active: boolean;
  onSelect: () => void;
  icon: typeof CreditCard;
  title: string;
  lines: string[];
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "erp-panel flex w-full items-start gap-4 p-5 text-left transition-all hover:shadow-md",
        active && "ring-2 ring-primary",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
          active ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {active ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </span>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </span>
    </button>
  );
}
