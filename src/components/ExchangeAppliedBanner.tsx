import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";

export function ExchangeAppliedBanner({
  itemCode,
  onRemove,
}: {
  itemCode?: string;
  onRemove?: () => void;
}) {
  const { draft, reset } = useExchangeDraft();
  const { items } = useCart();

  if (!draft.estimated_value || draft.estimated_value <= 0) return null;
  
  if (itemCode) {
    const matchesCode = Boolean(
      (draft.new_item_code && draft.new_item_code === itemCode) ||
      (draft.target_item && draft.target_item === itemCode)
    );
    const matchesName = Boolean(
      draft.new_item_name && items.some(i => i.item_code === itemCode && i.item_name && draft.new_item_name.trim().toLowerCase() === i.item_name.trim().toLowerCase())
    );
    const hasExactMatch = items.some(i => 
      (draft.new_item_code && draft.new_item_code === i.item_code) ||
      (draft.target_item && draft.target_item === i.item_code) ||
      (draft.new_item_name && i.item_name && draft.new_item_name.trim().toLowerCase() === i.item_name.trim().toLowerCase())
    );

    if (!matchesCode && !matchesName) {
      if (hasExactMatch || (items.length > 0 && items[0].item_code !== itemCode)) {
        return null;
      }
    }
  }

  const handleRemove = () => {
    reset();
    window.localStorage.removeItem("erp_exchange_draft");
    window.dispatchEvent(new Event("erp-exchange-change"));
    toast.info("Exchange offer removed");
    if (onRemove) onRemove();
  };

  return (
    <div className="mt-2 flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-950 dark:text-emerald-200">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold">
            Exchange applied up to {formatCurrency(draft.estimated_value)}
          </p>
          <p className="text-[11px] opacity-80">
            {draft.brand ? `${draft.brand} ` : ""}{draft.model || "Old Device"} · Trade-in discount deducted from total order amount
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white"
        onClick={handleRemove}
        title="Remove Exchange Offer"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ExchangeAppliedBanner;
