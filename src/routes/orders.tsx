import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  Package,
  Search,
  ShoppingBag,
  Truck,
  FileText,
  Smartphone,
  RefreshCw,
  Barcode,
} from "lucide-react";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetch } from "@/hooks/useFetch";
import { useCustomer } from "@/hooks/useCustomer";
import { getSalesOrders } from "@/api/order";
import { getCustomerExchangeOffers } from "@/api/exchange";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  validateSearch: (search: Record<string, unknown>): {
    so?: string;
    type?: string;
  } => ({
    so: typeof search["so"] === "string" ? search["so"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Orders | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Track your Flipkart-style mobile orders, shipment status, and delivery notes in real-time.",
      },
      { property: "og:title", content: "My Orders | NovaCell Mobile ERP" },
      { property: "og:description", content: "Order history and tracking powered by ERPNext Sales Orders." },
    ],
  }),
  component: OrdersPage,
});

const PAGE_SIZE = 5;

const FLIPKART_STEPS = ["Order Placed", "Shipped", "Delivered"];

function OrdersPage() {
  const { so: searchSo, type: searchType } = Route.useSearch();
  const { customer } = useCustomer();
  const { data: salesOrders, loading: loadingOrders } = useFetch(
    () => getSalesOrders(customer ? { customer: customer.name } : {}),
    [customer?.name]
  );
  const { data: exchangeOffers, loading: loadingExchanges } = useFetch(
    () => getCustomerExchangeOffers(customer?.name),
    [customer?.name]
  );

  const loading = loadingOrders || loadingExchanges;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "shipped" | "delivered">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "exchange">(
    searchType === "exchange" || searchSo ? "exchange" : "all"
  );
  const [page, setPage] = useState(1);

  const exchangeSoNames = useMemo(() => {
    const set = new Set<string>();
    if (exchangeOffers && Array.isArray(exchangeOffers)) {
      for (const off of exchangeOffers) {
        if (off.sales_order) {
          set.add(off.sales_order);
        }
      }
    }
    return set;
  }, [exchangeOffers]);

  const filtered = useMemo(() => {
    let list = salesOrders ?? [];

    if (sourceFilter === "exchange") {
      list = list.filter((o: any) => exchangeSoNames.has(o.name) || o.name === searchSo);
    } else if (searchSo) {
      list = list.filter((o: any) => o.name === searchSo);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          (o.items && o.items.some((i: any) => i.item_name?.toLowerCase().includes(q) || i.item_code?.toLowerCase().includes(q))),
      );
    }

    if (statusFilter === "shipped") {
      list = list.filter((o: any) => o.delivery_status === "Shipped" || o.step_index === 1);
    } else if (statusFilter === "delivered") {
      list = list.filter((o: any) => o.delivery_status === "Delivered" || o.step_index === 2);
    }

    return list;
  }, [salesOrders, query, statusFilter, sourceFilter, exchangeSoNames, searchSo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <ErpLayout>
      <div className="space-y-6">
        <PageHeader title="My Orders" subtitle="Track order status, delivery progress & download invoices." />

        {/* Search & Filter Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order ID or item name..."
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Wholesale Exchange vs All Orders Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-full border border-border mr-2">
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("exchange");
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1 rounded-full font-semibold transition-all text-xs flex items-center gap-1.5",
                  sourceFilter === "exchange"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <RefreshCw className="h-3 w-3" /> Wholesale Exchange
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("all");
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1 rounded-full font-semibold transition-all text-xs",
                  sourceFilter === "all"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Orders
              </button>
            </div>

            {[
              { id: "all", label: "All Status" },
              { id: "shipped", label: "Shipped" },
              { id: "delivered", label: "Delivered" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.id as any);
                  setPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full font-medium transition-colors border",
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards Container */}
        {loading ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-card">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold">
              {sourceFilter === "exchange" ? "No Wholesale Exchange Orders Found" : "No orders found"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {sourceFilter === "exchange"
                ? "You haven't completed any orders using an approved wholesale exchange offer yet."
                : query
                ? "Try clearing your search query or changing filters."
                : "You haven't placed any orders yet."}
            </p>
            {sourceFilter === "exchange" ? (
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" onClick={() => setSourceFilter("all")}>
                  Show All Orders
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/exchange">Go to Wholesale Exchange</Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="mt-4" size="sm">
                <Link to="/products">Explore Mobile Catalog</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((order: any) => {
              // Map 4-stage backend step_index (0..3) to 3-step UI (0..2)
              // 0: Order Placed, 1: Shipped, 2: Delivered
              const rawStep = typeof order.step_index === "number" ? order.step_index : 0;
              const currentStep = rawStep >= 3 || order.delivery_status === "Delivered" ? 2 : rawStep >= 2 || order.delivery_status === "On the Way" ? 1 : 0;
              const isExchangeOrder = exchangeSoNames.has(order.name) || order.name === searchSo;

              const discountAmount = order.exchange_discount || order.discount_amount || 0;
              const originalTotal = order.subtotal || (order.grand_total + discountAmount);
              const netPaid = order.net_paid || order.grand_total;

              return (
                <div
                  key={order.name}
                  className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Flipkart Card Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">ORDER PLACED</span>
                        <p className="font-semibold text-foreground">{formatDate(order.transaction_date)}</p>
                      </div>

                      <div className="hidden sm:block border-l border-border pl-4">
                        <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">ORIGINAL AMOUNT</span>
                        <p className={cn("font-semibold text-foreground", discountAmount > 0 && "line-through text-muted-foreground")}>
                          {formatCurrency(originalTotal)}
                        </p>
                      </div>

                      {discountAmount > 0 ? (
                        <>
                          <div className="border-l border-border pl-4">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px] tracking-wider block">DISCOUNT AMOUNT</span>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              -{formatCurrency(discountAmount)}
                            </p>
                          </div>

                          <div className="border-l border-border pl-4">
                            <span className="text-primary font-bold uppercase text-[10px] tracking-wider block">CUSTOMER PAID AMOUNT</span>
                            <p className="font-extrabold text-primary">
                              {formatCurrency(netPaid)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="hidden sm:block border-l border-border pl-4">
                          <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">CUSTOMER PAID AMOUNT</span>
                          <p className="font-semibold text-primary">{formatCurrency(order.grand_total)}</p>
                        </div>
                      )}

                      <div className="border-l border-border pl-4">
                        <span className="text-muted-foreground">ORDER #</span>
                        <p className="font-mono font-semibold text-foreground">{order.name}</p>
                      </div>

                      {(order.delivery_date || order.transaction_date) && (
                        <div className="border-l border-border pl-4">
                          <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider block">
                            {currentStep === 2 || order.is_delivered ? "DELIVERED DATE" : "ESTIMATED DELIVERY"}
                          </span>
                          <p className="font-bold text-foreground">
                            {formatDate(order.delivery_date || order.transaction_date)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isExchangeOrder && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <RefreshCw className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Wholesale Exchange
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs border",
                          currentStep === 2
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                            : currentStep === 1
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                        )}
                      >
                        {currentStep === 2 ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : currentStep === 1 ? (
                          <Truck className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {order.delivery_status || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Main Body: Each item rendered separately with its own delivery status stepper */}
                  <div className="divide-y divide-border">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: any, itemIdx: number) => {
                        const itemStepRaw = typeof item.step_index === "number" ? item.step_index : currentStep;
                        const itemStep = itemStepRaw >= 2 || item.delivery_status === "Delivered" ? 2 : itemStepRaw >= 1 || item.delivery_status === "Shipped" ? 1 : 0;
                        const itemStatusLabel = item.delivery_status || (itemStep === 2 ? "Delivered" : itemStep === 1 ? "Shipped" : "Order Placed");
                        const itemTotal = (item.rate || 0) * (item.qty || 1);
                        const itemDelDate = item.delivery_date || order.delivery_date;

                        return (
                          <div key={item.name || item.item_code || itemIdx} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                              {/* Left: Product Info */}
                              <div className="md:col-span-6 flex items-start gap-4">
                                <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border overflow-hidden">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.item_name}
                                      className="h-full w-full object-contain p-1"
                                    />
                                  ) : (
                                    <Smartphone className="h-8 w-8 text-muted-foreground/60" />
                                  )}
                                </div>

                                <div className="min-w-0 space-y-1">
                                  <h4 className="font-semibold text-sm line-clamp-1">{item.item_name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.qty || 1} • Original Rate: {formatCurrency(item.rate || 0)}
                                  </p>
                                  {discountAmount > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="line-through text-muted-foreground font-medium">
                                        {formatCurrency(itemTotal)}
                                      </span>
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        - {formatCurrency(discountAmount)} (Exchange Offer)
                                      </span>
                                      <span className="font-extrabold text-primary">
                                        Net: {formatCurrency(netPaid)}
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs font-semibold text-primary">
                                      {formatCurrency(itemTotal)}
                                    </p>
                                  )}
                                  {item.serial_no ? (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[11px] border border-blue-500/20 mt-1">
                                      <Barcode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                      <span>Serial No: <strong className="font-semibold">{item.serial_no}</strong></span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {/* Right: 3-Step Progress Stepper for this specific item */}
                              <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Delivery Status</p>
                                    {itemDelDate && (
                                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {itemStep === 2 || item.is_delivered ? "Delivered on: " : "Expected Delivery: "}
                                        {formatDate(itemDelDate)}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] border",
                                      itemStep === 2
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                        : itemStep === 1
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                                    )}
                                  >
                                    {itemStatusLabel}
                                  </span>
                                </div>
                                <div className="relative flex items-center justify-between">
                                  {/* Background connecting line */}
                                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-secondary -translate-y-1/2 z-0" />
                                  <div
                                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                                    style={{
                                      width: `${(itemStep / (FLIPKART_STEPS.length - 1)) * 100}%`,
                                    }}
                                  />

                                  {FLIPKART_STEPS.map((step, idx) => {
                                    const isDone = idx <= itemStep;
                                    return (
                                      <div key={step} className="relative z-10 flex flex-col items-center">
                                        <div
                                          className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border",
                                            isDone
                                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                              : "bg-card text-muted-foreground border-border"
                                          )}
                                        >
                                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                                        </div>
                                        <span
                                          className={cn(
                                            "mt-1.5 text-[11px] text-center font-medium whitespace-nowrap",
                                            isDone ? "text-foreground font-semibold" : "text-muted-foreground"
                                          )}
                                        >
                                          {step}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5">
                        <p className="text-xs text-muted-foreground">Order #{order.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between border-t border-border bg-muted/20 px-5 py-3 gap-2">
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      <span>Fulfilled via ERPNext Sales Lifecycle</span>
                      {discountAmount > 0 && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                          Original: {formatCurrency(originalTotal)} • Savings: -{formatCurrency(discountAmount)} • Net Paid: {formatCurrency(netPaid)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                        <Link to="/checkout" search={{ so: order.name, view: "1" }}>
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} total={filtered.length} />
      </div>
    </ErpLayout>
  );
}