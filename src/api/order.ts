import { createDoc, getDoc, getList, withFallback } from "./client";
import { demoOrders } from "@/services/demoData";

export type SalesOrder = (typeof demoOrders)[number];

export function getSalesOrders(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<SalesOrder>("Sales Order", {
        fields: '["name","customer","transaction_date","grand_total","status"]',
        order_by: "transaction_date desc",
        limit_page_length: 100,
        ...params,
      }),
    demoOrders,
  );
}

export function getSalesOrder(name: string) {
  return withFallback(
    () => getDoc<SalesOrder>("Sales Order", name),
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