import { callMethod, createDoc, withFallback } from "./client";

export type RazorpayOrder = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

/** Server creates the Razorpay order (key secret stays in ERPNext). */
export function createRazorpayOrder(payload: {
  sales_order: string;
  amount: number;
  currency?: string;
}) {
  return callMethod<RazorpayOrder>("mobile_management.api.create_razorpay_order", payload);
}

/** Signature verification + Payment Entry creation happen server-side. */
export function verifyRazorpayPayment(payload: {
  sales_order: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return callMethod<{
    status: string;
    sales_order: string;
    delivery_note: string;
    sales_invoice: string;
    payment_entry: string;
  }>("mobile_management.api.verify_razorpay_payment", payload);
}

export function createPaymentEntry(doc: unknown) {
  return createDoc("Payment Entry", doc);
}

export function createCashOnDeliveryOrder(payload: { sales_order: string; payment_mode?: string }) {
  return callMethod<{
    status: string;
    sales_order: string;
    delivery_note: string;
    sales_invoice: string;
    payment_entry: string;
  }>("mobile_management.api.process_order_payment_and_create_drafts", {
    sales_order: payload.sales_order,
    payment_mode: payload.payment_mode || "Cash in Hand",
  });
}

export function updateSalesOrderPaymentStatus(sales_order: string, status: string) {
  return callMethod("mobile_management.api.update_payment_status", { sales_order, status });
}

export function getPaymentStatus(sales_order: string) {
  return withFallback(
    () => callMethod<{ status: string }>("mobile_management.api.get_payment_status", { sales_order }),
    { status: "Unpaid" },
  );
}

