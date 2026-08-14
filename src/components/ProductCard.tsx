import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Smartphone, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import type { Product } from "@/services/demoData";
import { formatCurrency, formatNumber } from "@/utils/format";
import { ExchangeWizardModal } from "@/components/ExchangeWizardModal";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
}) {
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [alreadyAppliedOpen, setAlreadyAppliedOpen] = useState(false);
  const { draft, reset: resetDraft } = useExchangeDraft();

  const rawImage = product.image || "";
  const imageUrl = rawImage
    ? rawImage.startsWith("http")
      ? encodeURI(rawImage)
      : rawImage.startsWith("/")
      ? `${typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8006` : "http://mobile.local:8006"}${encodeURI(rawImage)}`
      : encodeURI(rawImage)
    : "";

  const isRefurbishedOrPart =
    product.item_group === "Refurbished Products" ||
    product.item_group === "Refurbished" ||
    product.item_group === "Refurbished Phones" ||
    product.name?.startsWith("REF-") ||
    (Boolean(product.warehouse) && product.warehouse.includes("Refurbishment Warehouse"));

  const canExchange =
    (product.item_group === "Smartphones" || product.item_group === "Finished Products") &&
    !product.name?.startsWith("REF-") &&
    !isRefurbishedOrPart;

  const isOfferApplied = draft.estimated_value > 0;

  return (
    <article className="erp-panel flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl rounded-xl border border-border/80 group bg-card">
      {/* Product Image Container */}
      <div className="relative grid h-52 sm:h-56 w-full place-items-center border-b border-border/60 bg-white dark:bg-slate-900/60 p-4 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.item_name}
            className="max-h-44 w-auto object-contain drop-shadow-md transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-20 w-20 text-muted-foreground flex items-center justify-center bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Smartphone className="h-10 w-10 stroke-1 text-slate-400" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{product.item_name}</h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {product.name} · {product.brand}
            </p>
          </div>
          {product.condition ? <StatusBadge status={product.condition} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {product.storage || (product as any).custom_storage || "Standard"} · {product.color || (product as any).custom_colour || "Standard"}
        </p>

        {/* Stock Qty Display - ONLY for Refurbished Products */}
        {isRefurbishedOrPart ? (
          <div className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded px-2.5 py-1.5 mt-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Available Stock
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Qty: {formatNumber(product.stock_qty ?? (product as any).actual_qty ?? 1)}
            </span>
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">{formatCurrency(product.standard_rate)}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/products/$id" params={{ id: product.name }}>
                View
              </Link>
            </Button>
            {canExchange ? (
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${
                  isOfferApplied
                    ? "border-amber-500/60 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    : "border-emerald-600/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                }`}
                onClick={() => {
                  if (isOfferApplied) {
                    setAlreadyAppliedOpen(true);
                  } else {
                    setExchangeOpen(true);
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                {isOfferApplied ? "Offer Applied" : "With Exchange"}
              </Button>
            ) : null}
            {onAdd ? (
              <Button size="sm" className="flex-1" onClick={() => onAdd(product)}>
                Add to Cart
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {canExchange ? (
        <ExchangeWizardModal
          open={exchangeOpen}
          onOpenChange={setExchangeOpen}
          targetProductName={product.item_name}
          targetProductCode={product.name}
          originalPrice={product.standard_rate}
          onExchangeSuccess={() => {
            if (onAdd) {
              onAdd(product);
            }
          }}
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
    </article>
  );
}

export default ProductCard;