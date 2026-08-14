import { callMethod, createDoc, getDoc, getList, withFallback } from "./client";
import { demoOrders } from "@/services/demoData";

export type SalesOrder = (typeof demoOrders)[number];

export function getSalesOrders(params: Record<string, unknown> = {}) {
  return withFallback(
    async () => {
      const res = await callMethod<SalesOrder[]>(
        "mobile_management.api.get_customer_sales_orders",
        params
      );
      if (Array.isArray(res)) return res;
      return [];
    },
    demoOrders,
  );
}

export function getSalesOrder(name: string) {
  return withFallback(
    async () => {
      const res = await callMethod<SalesOrder>(
        "mobile_management.api.get_customer_sales_order_details",
        { name }
      );
      if (res) return res;
      return demoOrders.find((o) => o.name === name) ?? demoOrders[0];
    },
    demoOrders.find((o) => o.name === name) ?? demoOrders[0],
  );
}

/** Selling flow: Customer -> Quotation -> Sales Order -> Delivery Note -> Sales Invoice -> Payment Entry */
export function createQuotation(doc: unknown) {
  return createDoc("Quotation", doc);
}

export function createSalesOrder(doc: unknown) {
  return createDoc("Sales Order", doc);
}

export function createDeliveryNote(doc: unknown) {
  return createDoc("Delivery Note", doc);
}

export function createSalesInvoice(doc: unknown) {
  return createDoc("Sales Invoice", doc);
}

export function createPaymentEntry(doc: unknown) {
  return createDoc("Payment Entry", doc);
}

export function saveDraftSalesOrderOnCheckout(
  salesOrder?: string,
  customer?: string,
  shippingAddressName?: string,
  customerAddress?: string,
  deliveryDate?: string,
  exchangeDiscount = 0
) {
  return withFallback(
    () =>
      callMethod<{ status: string; sales_order: string; docstatus: number }>(
        "mobile_management.api.save_draft_sales_order_on_checkout",
        {
          sales_order: salesOrder,
          customer,
          shipping_address_name: shippingAddressName,
          customer_address: customerAddress,
          delivery_date: deliveryDate,
          exchange_discount: exchangeDiscount,
        }
      ),
    null
  );
}

export function submitSalesOrderOnCheckout(
  salesOrder?: string,
  customer?: string,
  shippingAddressName?: string,
  customerAddress?: string,
  deliveryDate?: string,
  exchangeDiscount = 0
) {
  return withFallback(
    () =>
      callMethod<{ status: string; sales_order: string; docstatus: number }>(
        "mobile_management.api.submit_sales_order_on_checkout",
        {
          sales_order: salesOrder,
          customer,
          shipping_address_name: shippingAddressName,
          customer_address: customerAddress,
          delivery_date: deliveryDate,
          exchange_discount: exchangeDiscount,
        }
      ),
    null
  );
}

export function processOrderPaymentAndCreateDrafts(salesOrder?: string, paymentMode = "Cash") {
  return withFallback(
    () =>
      callMethod<{
        status: string;
        sales_order: string;
        delivery_note: string;
        sales_invoice: string;
        payment_entry: string;
      }>("mobile_management.api.process_order_payment_and_create_drafts", {
        sales_order: salesOrder,
        payment_mode: paymentMode,
      }),
    null
  );
}

export function buyNowDirect(itemCode: string, qty = 1, rate = 0, customer?: string, exchangeDiscount = 0) {
  return withFallback(
    () =>
      callMethod<{
        status: string;
        quotation_name: string;
        sales_order_name: string;
        customer: string;
        grand_total: number;
      }>("mobile_management.api.buy_now_direct", {
        item_code: itemCode,
        qty,
        rate,
        customer,
        exchange_discount: exchangeDiscount,
      }),
    null
  );
}