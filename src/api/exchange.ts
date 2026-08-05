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
/** Master data for the customer exchange wizard (served by ERPNext when connected). */
export function getExchangeCategories() {
  return callMethod<unknown[]>("mobile_erp.exchange.get_categories");
}

export function getExchangeBrands(category: string) {
  return callMethod<unknown[]>("mobile_erp.exchange.get_brands", { category });
}

export function getExchangeModels(category: string, brand: string) {
  return callMethod<unknown[]>("mobile_erp.exchange.get_models", { category, brand });
}

/** Valuation is computed by ERPNext from the condition answers. */
export function evaluateExchange(payload: unknown) {
  return callMethod<{ estimated_value: number; bonus: number }>(
    "mobile_erp.exchange.evaluate",
    payload,
  );
}
