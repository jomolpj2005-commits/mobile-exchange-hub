import { callMethod, createDoc, getList, withFallback } from "./client";
import { demoExchanges } from "@/services/demoData";

export type Exchange = (typeof demoExchanges)[number];

export function getExchangeRequests(params: Record<string, unknown> = {}) {
  return withFallback(
    () => getList<Exchange>("Exchange Request", { limit_page_length: 100, ...params }),
    demoExchanges,
  );
}

/** Dealer -> Exchange Request -> Approval -> Used Mobile Received -> Balance -> New Mobile Purchase */
export function createExchangeRequest(doc: unknown) {
  return createDoc("Exchange Request", doc);
}

export function approveExchange(name: string) {
  return callMethod("mobile_erp.exchange.approve", { name });
}

export function receiveUsedMobile(name: string, payload: unknown) {
  return callMethod("mobile_erp.exchange.receive_used_mobile", { name, payload });
}

export function calculateBalance(name: string) {
  return callMethod("mobile_erp.exchange.calculate_balance", { name });
}