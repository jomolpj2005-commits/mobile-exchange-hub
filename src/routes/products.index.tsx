import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useCart } from "@/hooks/useCart";
import { getProducts } from "@/api/product";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Product Catalogue | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Browse manufactured, refurbished and spare-part items synced from ERPNext Item master.",
      },
      { property: "og:title", content: "Product Catalogue | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "New and refurbished handsets, accessories and service parts for dealers.",
      },
    ],
  }),
  component: ProductsPage,
});

const PAGE_SIZE = 6;
const GROUPS = ["Smartphones", "Refurbished Products", "Accessories"];

function ProductsPage() {
  const { data, loading } = useFetch(() => getProducts(), []);
  const { add } = useCart();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Smartphones");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((p) => {
      const isRefurbItem =
        p.item_group === "Refurbished Products" ||
        p.item_group === "Refurbished" ||
        p.item_group === "Refurbished Phones" ||
        p.name?.startsWith("REF-") ||
        (p.warehouse && p.warehouse.includes("Refurbishment Warehouse"));

      const matchesGroup =
        (group === "Smartphones" && (p.item_group === "Finished Products" || p.item_group === "Smartphones") && !isRefurbItem) ||
        (group === "Refurbished Products" && isRefurbItem) ||
        (group === "Spare Parts" && (p.item_group === "Spare Parts" || p.item_group === "Raw Material")) ||
        (p.item_group === group && !isRefurbItem);

      const matchesSearch = `${p.item_name} ${p.name} ${p.brand || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());

      if (group === "Refurbished Products") {
        const isRefurbWh = Boolean(p.warehouse && p.warehouse.includes("Refurbishment Warehouse"));
        const availStock = p.stock_qty ?? p.available_qty ?? (p.actual_qty != null ? p.actual_qty - (p.reserved_qty || 0) : 0);
        if (!isRefurbWh || availStock <= 0) return false;
      }

      return matchesGroup && matchesSearch;
    });
  }, [data, query, group]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <ErpLayout>
      <PageHeader
        title="Product Catalogue"
        subtitle="Item master from ERPNext — new builds, refurbished grades and service parts."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search item code, model or brand…" />
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={g === group ? "default" : "outline"}
              onClick={() => { setGroup(g); setPage(1); }}
            >
              {g}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading items from ERPNext…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => (
              <ProductCard
                key={p.name}
                product={p}
                onAdd={(product) => {
                  const maxStock = product.stock_qty ?? (product as any).available_qty ?? (product as any).actual_qty;
                  add({
                    item_code: product.name,
                    item_name: product.item_name,
                    rate: product.standard_rate,
                    qty: 1,
                    condition: product.condition,
                    stock_qty: maxStock,
                    available_qty: maxStock,
                  });
                  toast.success(`${product.item_name} added to cart & Draft Quotation updated in ERPNext!`);
                }}
              />
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="erp-panel p-10 text-center text-sm text-muted-foreground">
              No items match your filters.
            </p>
          ) : null}
          <div className="erp-panel">
            <Pagination page={current} pageCount={pageCount} onPageChange={setPage} total={filtered.length} />
          </div>
        </>
      )}
    </ErpLayout>
  );
}