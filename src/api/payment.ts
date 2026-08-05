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
  return callMethod<RazorpayOrder>("mobile_erp.payment.create_razorpay_order", payload);
}

/** Signature verification + Payment Entry creation happen server-side. */
export function verifyRazorpayPayment(payload: {
  sales_order: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return callMethod<{ payment_entry: string; status: string }>(
    "mobile_erp.payment.verify_razorpay_payment",
    payload,
  );
}

export function createPaymentEntry(doc: unknown) {
  return createDoc("Payment Entry", doc);
}

export function createCashOnDeliveryOrder(payload: { sales_order: string }) {
  return callMethod<{ sales_order: string; payment_status: string }>(
    "mobile_erp.payment.create_cod_order",
    payload,
  );
}

export function updateSalesOrderPaymentStatus(sales_order: string, status: string) {
  return callMethod("mobile_erp.payment.update_payment_status", { sales_order, status });
}

export function getPaymentStatus(sales_order: string) {
  return withFallback(
    () => callMethod<{ status: string }>("mobile_erp.payment.get_payment_status", { sales_order }),
    { status: "Unpaid" },
  );
}
