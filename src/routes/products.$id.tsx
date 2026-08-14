import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { Smartphone, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFetch } from "@/hooks/useFetch";
import { useCart } from "@/hooks/useCart";
import { useCustomer } from "@/hooks/useCustomer";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { getProduct } from "@/api/product";
import { buyNowDirect } from "@/api/order";
import { formatCurrency } from "@/utils/format";
import { ExchangeWizardModal } from "@/components/ExchangeWizardModal";
import { ExchangeAppliedBanner } from "@/components/ExchangeAppliedBanner";
import FlipkartImageViewer from "@/components/FlipkartImageViewer";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Item Details | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Item specification, stock position and ERPNext product details.",
      },
      { property: "og:title", content: "Item Details | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Pricing, specifications, condition grade, and warehouse stock.",
      },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { id } = useParams({ from: "/products/$id" });
  const { data, loading } = useFetch(() => getProduct(id), [id]);
  const { add } = useCart();
  const { customer } = useCustomer();
  const { draft, reset: resetDraft } = useExchangeDraft();
  const navigate = useNavigate();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [alreadyAppliedOpen, setAlreadyAppliedOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [appliedExchange, setAppliedExchange] = useState<{
    docName: string;
    exchangeValue: number;
    brand: string;
    model: string;
  } | null>(null);

  if (loading || !data) {
    return (
      <ErpLayout>
        <Loader label="Loading item details from ERPNext…" />
      </ErpLayout>
    );
  }

  const cleanDescription = (data.description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();

  const rawImage = data.image || "";
  const imageUrl = rawImage
    ? rawImage.startsWith("http")
      ? encodeURI(rawImage)
      : rawImage.startsWith("/")
      ? `${typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8006` : "http://mobile.local:8006"}${encodeURI(rawImage)}`
      : encodeURI(rawImage)
    : "";

  const originalPrice = data.standard_rate || 0;
  const exchangeDiscount = appliedExchange ? appliedExchange.exchangeValue : 0;
  const netEffectivePrice = Math.max(0, originalPrice - exchangeDiscount);

  const isRefurbishedOrPart =
    data.item_group === "Refurbished Products" ||
    data.item_group === "Refurbished" ||
    data.item_group === "Refurbished Phones" ||
    data.name?.startsWith("REF-") ||
    (Boolean(data.warehouse) && data.warehouse.includes("Refurbishment Warehouse"));

  const canExchange =
    (data.item_group === "Smartphones" || data.item_group === "Finished Products") &&
    !data.name?.startsWith("REF-") &&
    !isRefurbishedOrPart;

  const isAccessory = data.item_group === "Accessories";

  const specs = isAccessory
    ? [
        ["Item Code", data.name || "N/A"],
        ["Item Group", data.item_group || "N/A"],
        ["Brand", data.brand || "N/A"],
        ["Colour", data.custom_colour || data.color || "N/A"],
        ["Warranty", data.custom_warranty || "N/A"],
      ]
    : [
        ["Item Code", data.name || "N/A"],
        ["Item Group", data.item_group || "N/A"],
        ["Brand", data.brand || "N/A"],
        ...(isRefurbishedOrPart ? [["Available Stock Qty", `${data.stock_qty ?? data.actual_qty ?? 1} Nos`]] : []),
        ["Model", data.custom_model || data.model || "N/A"],
        ["Storage", data.custom_storage || data.storage || "N/A"],
        ["Colour", data.custom_colour || data.color || "N/A"],
        ["RAM", data.custom_ram || "N/A"],
        ["Processor", data.custom_processor || "N/A"],
        ["Display", data.custom_display || "N/A"],
        ["Battery", data.custom_battery || "N/A"],
        ["Operating System", data.custom_operating_system || "N/A"],
        ["Warranty", data.custom_warranty || "N/A"],
        ["Network", data.custom_network || "N/A"],
      ];

  return (
    <ErpLayout>
      <PageHeader
        title={data.item_name}
        subtitle={`${data.item_group || "Finished Products"} · ${data.brand || ""}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/products">Back</Link>
            </Button>
            {canExchange ? (
              <Button
                variant="outline"
                className={
                  draft.estimated_value > 0
                    ? "border-amber-500/60 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    : "border-emerald-600/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                }
                onClick={() => {
                  if (draft.estimated_value > 0) {
                    setAlreadyAppliedOpen(true);
                  } else {
                    setExchangeOpen(true);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                {draft.estimated_value > 0 ? "Offer Applied" : "With Exchange"}
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                const maxStock = data.stock_qty ?? (data as any).available_qty ?? (data as any).actual_qty;
                add({
                  item_code: data.name,
                  item_name: data.item_name,
                  rate: originalPrice,
                  qty: 1,
                  condition: data.condition,
                  stock_qty: maxStock,
                  available_qty: maxStock,
                });
                toast.success(`${data.item_name} added to cart & Draft Quotation synced!`);
              }}
            >
              Add to cart
            </Button>
            <Button
              disabled={buying}
              onClick={async () => {
                setBuying(true);
                try {
                  toast.loading("Creating & submitting quotation in ERPNext...", { id: "buynow" });
                  const res = await buyNowDirect(data.name, 1, originalPrice, customer?.name, exchangeDiscount);
                  if (res && res.sales_order_name) {
                    toast.success("Draft Sales Order created! Redirecting to checkout...", { id: "buynow" });
                    navigate({ to: "/checkout", search: { so: res.sales_order_name } });
                  } else {
                    toast.error(res?.message || "Failed to process direct Buy Now", { id: "buynow" });
                  }
                } catch (err: any) {
                  toast.error(err?.message || "An error occurred during Buy Now process", { id: "buynow" });
                } finally {
                  setBuying(false);
                }
              }}
            >
              {buying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Buy now
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Flipkart Multi-Angle Interactive Gallery & Viewer */}
        <div className="lg:col-span-1">
          <FlipkartImageViewer
            mainImageUrl={imageUrl}
            productName={data.item_name}
            brand={data.brand}
            condition={data.condition}
          />
        </div>

        <section className="erp-panel space-y-4 p-5 lg:col-span-2 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              {appliedExchange ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm line-through text-muted-foreground">{formatCurrency(originalPrice)}</span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                      Exchange Discount: -{formatCurrency(exchangeDiscount)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="erp-label">Net Effective Price</span>
                    <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(netEffectivePrice)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                    <RefreshCw className="h-3 w-3 text-amber-500" />
                    Exchange Applied for {appliedExchange.brand} {appliedExchange.model} (Ref: <span className="font-mono font-semibold">{appliedExchange.docName}</span>)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="erp-label">Standard Selling Rate</p>
                  <p className="text-3xl font-bold">{formatCurrency(originalPrice)}</p>
                </div>
              )}
            </div>
            {data.condition ? <StatusBadge status={data.condition} /> : null}
          </div>

          <ExchangeAppliedBanner itemCode={data.name} onRemove={() => setAppliedExchange(null)} />
          
          {cleanDescription ? (
            <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-700/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {cleanDescription}
              </p>
            </div>
          ) : null}

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between items-center gap-3 border-b border-border/60 pb-2">
                <dt className="text-sm text-muted-foreground shrink-0">{k}</dt>
                <dd className="text-sm font-medium text-right break-words max-w-[65%]">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {canExchange ? (
        <ExchangeWizardModal
          open={exchangeOpen}
          onOpenChange={setExchangeOpen}
          targetProductName={data.item_name}
          targetProductCode={data.name}
          originalPrice={originalPrice}
          onExchangeSuccess={(res) => setAppliedExchange(res)}
        />
      ) : null}

      {/* Already Applied Exchange Popup Dialog */}
      <Dialog open={alreadyAppliedOpen} onOpenChange={setAlreadyAppliedOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Exchange Offer Already Applied
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              You have already applied an exchange offer of{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCurrency(draft.estimated_value)}
              </strong>{" "}
              {draft.doc_name ? `(Ref: ${draft.doc_name})` : ""}. Only one exchange discount can be applied per order.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mt-1">
            To use a different exchange offer or modify your trade-in, click <strong>Replace Offer</strong> to reset your current discount.
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setAlreadyAppliedOpen(false)} className="flex-1">
              Keep Current Offer
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDraft();
                setAlreadyAppliedOpen(false);
                setExchangeOpen(true);
              }}
              className="flex-1"
            >
              Replace Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErpLayout>
  );
}