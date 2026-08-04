import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  item_code: string;
  item_name: string;
  rate: number;
  qty: number;
  condition?: string;
};

const KEY = "erp_cart";
const EVENT = "erp-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((item: CartItem) => {
    const next = read();
    const found = next.find((i) => i.item_code === item.item_code);
    if (found) found.qty += item.qty;
    else next.push(item);
    write(next);
  }, []);

  const setQty = useCallback((item_code: string, qty: number) => {
    write(read().map((i) => (i.item_code === item_code ? { ...i, qty: Math.max(1, qty) } : i)));
  }, []);

  const remove = useCallback((item_code: string) => {
    write(read().filter((i) => i.item_code !== item_code));
  }, []);

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.rate * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, add, setQty, remove, clear, subtotal, count };
}