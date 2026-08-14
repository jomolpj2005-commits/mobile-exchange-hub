import { useCallback, useEffect, useState } from "react";
import { syncCartQuotation } from "@/api/cart";

export type CartItem = {
  item_code: string;
  item_name: string;
  rate: number;
  qty: number;
  condition?: string;
  stock_qty?: number;
  available_qty?: number;
};

const KEY = "erp_cart";
const EVENT = "erp-cart-change";
const EXCHANGE_KEY = "erp_exchange_draft";
const EXCHANGE_EVENT = "erp-exchange-change";

function getActiveExchange(): { code?: string; name?: string; discount?: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EXCHANGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || !draft.estimated_value || draft.estimated_value <= 0) return null;
    return {
      code: draft.new_item_code || draft.target_item,
      name: draft.new_item_name,
      discount: (draft.estimated_value || 0) + (draft.bonus || 0),
    };
  } catch {
    return null;
  }
}

function isExchangeLinked(item: CartItem, exc: { code?: string; name?: string } | null, allItems: CartItem[] = []): boolean {
  if (!exc) return false;
  if (exc.code && item.item_code === exc.code) return true;
  if (exc.name && item.item_name && item.item_name.trim().toLowerCase() === exc.name.trim().toLowerCase()) return true;
  if (!exc.code && !exc.name) return true;

  const hasExactMatch = allItems.some(
    (i) =>
      (exc.code && i.item_code === exc.code) ||
      (exc.name && i.item_name && i.item_name.trim().toLowerCase() === exc.name.trim().toLowerCase())
  );
  if (!hasExactMatch && allItems.length > 0 && allItems[0].item_code === item.item_code) {
    return true;
  }
  return false;
}

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];

    // Normalize quantity of exchange-linked items to 1
    const exc = getActiveExchange();
    if (exc) {
      let changed = false;
      const sanitized = raw.map((item: CartItem) => {
        if (isExchangeLinked(item, exc, raw) && item.qty !== 1) {
          changed = true;
          return { ...item, qty: 1 };
        }
        return item;
      });
      if (changed) {
        window.localStorage.setItem(KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    }
    return raw;
  } catch {
    return [];
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncItems: CartItem[] | null = null;

function debouncedSyncQuotation(items: CartItem[], onComplete?: (qtnName?: string) => void) {
  pendingSyncItems = items;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (!pendingSyncItems || pendingSyncItems.length === 0) return;
    const itemsToSync = [...pendingSyncItems];
    pendingSyncItems = null;
    const exc = getActiveExchange();
    const exDisc = exc ? (exc.discount || 0) : 0;
    const custName =
      (typeof window !== "undefined" ? localStorage.getItem("active_customer_name") : null) ||
      (typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : null) ||
      undefined;
    syncCartQuotation(itemsToSync, custName, exDisc)
      .then((res) => {
        if (res?.quotation_name && onComplete) {
          onComplete(res.quotation_name);
        }
      })
      .catch(() => {});
  }, 250);
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [quotationName, setQuotationName] = useState<string>("");

  useEffect(() => {
    const sync = () => {
      const currentItems = read();
      setItems(currentItems);
      if (currentItems.length > 0) {
        debouncedSyncQuotation(currentItems, (name) => {
          if (name) setQuotationName(name);
        });
      }
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener(EXCHANGE_EVENT, sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(EXCHANGE_EVENT, sync);
    };
  }, []);

  const add = useCallback((item: CartItem) => {
    import("sonner").then(({ toast }) => {
      const next = read();
      const exc = getActiveExchange();
      const isExc = isExchangeLinked(item, exc);
      const targetQty = isExc ? 1 : Math.max(1, item.qty);

      const maxStock = item.stock_qty ?? item.available_qty;

      const found = next.find((i) => i.item_code === item.item_code);
      if (found) {
        const itemMax = maxStock ?? found.stock_qty ?? found.available_qty;
        const potentialQty = found.qty + targetQty;

        if (itemMax != null && itemMax > 0 && potentialQty > itemMax) {
          toast.error(`Cannot add more than available stock (${itemMax}) for ${item.item_name || item.item_code}`);
          found.qty = itemMax;
        } else {
          found.qty = isExc ? 1 : potentialQty;
        }
        found.rate = item.rate;
        if (itemMax != null) found.stock_qty = itemMax;
      } else {
        if (maxStock != null && maxStock > 0 && targetQty > maxStock) {
          toast.error(`Cannot add more than available stock (${maxStock}) for ${item.item_name || item.item_code}`);
          next.push({ ...item, qty: maxStock, stock_qty: maxStock });
        } else {
          next.push({ ...item, qty: targetQty, stock_qty: maxStock });
        }
      }
      write(next);
    });
  }, []);

  const setQty = useCallback((item_code: string, requestedQty: number) => {
    import("sonner").then(({ toast }) => {
      const exc = getActiveExchange();
      write(
        read().map((i) => {
          if (i.item_code !== item_code) return i;
          const isExc = isExchangeLinked(i, exc);
          if (isExc) return { ...i, qty: 1 };

          const maxStock = i.stock_qty ?? i.available_qty;
          let finalQty = Math.max(1, requestedQty);
          if (maxStock != null && maxStock > 0 && finalQty > maxStock) {
            toast.error(`Only ${maxStock} unit(s) available in stock for ${i.item_name || i.item_code}`);
            finalQty = maxStock;
          }
          return { ...i, qty: finalQty };
        })
      );
    });
  }, []);

  const remove = useCallback((item_code: string) => {
    write(read().filter((i) => i.item_code !== item_code));
  }, []);

  const clear = useCallback(() => write([]), []);

  const buyNow = useCallback((item: CartItem) => {
    const exc = getActiveExchange();
    const isExc = isExchangeLinked(item, exc);
    write([{ ...item, qty: isExc ? 1 : Math.max(1, item.qty) }]);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.rate * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, add, setQty, remove, clear, buyNow, subtotal, count, quotationName };
}