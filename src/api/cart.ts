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

export function syncCartQuotation(
  items: { item_code: string; qty: number; rate?: number }[],
  customerName?: string,
  exchangeDiscount = 0
) {
  const activeUser =
    customerName ||
    (typeof window !== "undefined" ? localStorage.getItem("active_customer_name") : null) ||
    (typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : null) ||
    undefined;
  return withFallback(
    () =>
      callMethod<{ status: string; quotation_name: string; grand_total: number }>(
        "mobile_management.api.sync_cart_quotation",
        {
          customer: activeUser,
          exchange_discount: exchangeDiscount,
          items: items.map((i) => ({
            item_code: i.item_code,
            qty: i.qty,
            rate: i.rate || 0,
          })),
        }
      ),
    null
  );
}

export function submitQuotationAndCreateSalesOrder(
  items: { item_code: string; qty: number; rate?: number }[],
  customerName?: string,
  exchangeDiscount = 0
) {
  const activeUser =
    customerName ||
    (typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : null) ||
    undefined;
  return withFallback(
    () =>
      callMethod<{ status: string; quotation_name: string; sales_order_name: string; grand_total: number }>(
        "mobile_management.api.submit_quotation_and_create_sales_order",
        {
          customer: activeUser,
          exchange_discount: exchangeDiscount,
          items: items.map((i) => ({
            item_code: i.item_code,
            qty: i.qty,
            rate: i.rate || 0,
          })),
        }
      ),
    null
  );
}
