import { callMethod, withFallback } from "./client";

export type CartLine = { item_code: string; qty: number; rate?: number };

/** Server-side cart hooks — ERPNext keeps the pricing/stock rules. */
export function getServerCart() {
  return withFallback(() => callMethod("mobile_erp.cart.get_cart"), { items: [] as CartLine[] });
}

export function syncCart(items: CartLine[]) {
  return withFallback(() => callMethod("mobile_erp.cart.sync", { items }), { items });
}

export function applyCoupon(code: string) {
  return withFallback(() => callMethod<{ discount: number }>("mobile_erp.cart.apply_coupon", { code }), {
    discount: 0,
  });
}
