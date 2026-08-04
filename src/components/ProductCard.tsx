import { Link } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import type { Product } from "@/services/demoData";
import { formatCurrency, formatNumber } from "@/utils/format";

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
}) {
  return (
    <article className="erp-panel flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="grid h-32 place-items-center border-b border-border bg-secondary">
        <Smartphone className="h-12 w-12 text-primary/40" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{product.item_name}</h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {product.name} · {product.brand}
            </p>
          </div>
          <StatusBadge status={product.condition} />
        </div>
        <p className="text-xs text-muted-foreground">
          {product.storage} · {product.color}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-lg font-bold">{formatCurrency(product.standard_rate)}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(product.stock_qty)} in stock
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link to="/products/$id" params={{ id: product.name }}>
                View
              </Link>
            </Button>
            {onAdd ? (
              <Button size="sm" onClick={() => onAdd(product)}>
                Add
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;