import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { loadRazorpay, openRazorpay } from "@/utils/razorpay";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    so: typeof search["so"] === "string" ? search["so"] : "",
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
  const { items, subtotal, clear } = useCart();
  const { draft, reset } = useExchangeDraft();
  const { customer } = useCustomer();
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exchangeDiscount = draft.estimated_value + draft.bonus;
  const shipping = subtotal > 0 && subtotal < 25000 ? 199 : 0;
  const taxable = Math.max(0, subtotal - exchangeDiscount);
  const gst = Math.round(taxable * 0.18);
  const payable = Math.max(0, taxable + gst + shipping);

  async function payOnline() {
    setError(null);
    setBusy(true);
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error("Could not load the Razorpay checkout script.");
      const order = await createRazorpayOrder({ sales_order: so, amount: payable, currency: "INR" });
      const instance = openRazorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: order.name ?? "NovaCell",
        description: order.description ?? `Payment for ${so}`,
        prefill: order.prefill ?? {
          name: customer?.customer_name,
          email: customer?.email_id,
          contact: customer?.mobile_no,
        },
        theme: { color: "#1d4ed8" },
        handler: async (response: Record<string, string>) => {
          try {
            const result = await verifyRazorpayPayment({
              sales_order: so,
              razorpay_order_id: response["razorpay_order_id"] ?? "",
              razorpay_payment_id: response["razorpay_payment_id"] ?? "",
              razorpay_signature: response["razorpay_signature"] ?? "",
            });
            clear();
            reset();
            navigate({
              to: "/order-success",
              search: { so, pe: result.payment_entry ?? "", mode: "Online" },
            });
          } catch {
            setError("Payment could not be verified. Please retry or contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was cancelled. You can retry whenever you are ready.");
          },
        },
      });
      if (!instance) throw new Error("Razorpay checkout is unavailable.");
      instance.on("payment.failed", () => {
        setBusy(false);
        setError("Payment failed. Please retry with another method.");
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `${err.message} Check the Razorpay keys configured in ERPNext.`
          : "Payment could not be started.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function payCod() {
    setError(null);
    setBusy(true);
    try {
      await createCashOnDeliveryOrder({ sales_order: so });
      clear();
      reset();
      toast.success("Order placed — pay on delivery");
      navigate({ to: "/order-success", search: { so, pe: "", mode: "Cash on Delivery" } });
    } catch {
      setError("Could not confirm the cash-on-delivery order. Please retry.");
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
      <FlowSteps title="Selling flow" steps={SELLING_FLOW} activeIndex={3} />

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
            {items.map((i) => (
              <li key={i.item_code} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {i.item_name} × {i.qty}
                </span>
                <span className="shrink-0">{formatCurrency(i.rate * i.qty)}</span>
              </li>
            ))}
          </ul>

          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          {exchangeDiscount > 0 ? (
            <Row label="Exchange discount" value={`− ${formatCurrency(exchangeDiscount)}`} tone="success" />
          ) : null}
          <Row label="GST @ 18%" value={formatCurrency(gst)} />
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
            {method === "online" ? `Pay ${formatCurrency(payable)}` : "Place COD order"}
          </Button>
        </aside>
      </div>
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
