import { callMethod, getList, withFallback } from "./client";
import { demoExchanges } from "@/services/demoData";

export type Exchange = (typeof demoExchanges)[number];

export interface ExchangeOfferDevice {
  brand: string;
  model: string;
  imei_serial_number?: string;
  device_type?: string;
  condition?: string;
  quantity?: number;
  customer_remarks?: string;
  image?: string;
}

export interface ExchangeOfferDoc {
  name?: string;
  customer?: string;
  customer_name?: string;
  email?: string;
  mobile_number?: string;
  request_date?: string;
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Used" | "Expired" | "Cancelled";
  docstatus?: number;
  total_devices?: number;
  approved_exchange_value?: number;
  admin_remarks?: string;
  evaluated_by?: string;
  evaluation_date?: string;
  approval_date?: string;
  sales_order?: string;
  used_amount?: number;
  used_date?: string;
  refurbishment_reference?: string;
  exchange_devices?: ExchangeOfferDevice[];
}

export function getExchangeRequests(params: Record<string, unknown> = {}) {
  return withFallback(
    () => getList<Exchange>("Mobile Exchange Request", { limit_page_length: 100, ...params }),
    demoExchanges,
  );
}

/** Dealer / Customer -> Submit Multi-Device Exchange Offer to ERPNext */
export function submitExchangeOffer(payload: {
  customer?: string;
  customer_name?: string;
  email?: string;
  mobile_number?: string;
  devices: ExchangeOfferDevice[];
}) {
  return callMethod<ExchangeOfferDoc>("mobile_management.api.submit_exchange_offer", payload as unknown as Record<string, unknown>);
}

export function getCustomerExchangeOffers(customer?: string, email?: string) {
  const activeUser = email || (typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : "") || undefined;
  return withFallback(
    () => callMethod<ExchangeOfferDoc[]>("mobile_management.api.get_customer_exchange_offers", { customer, email: activeUser }),
    []
  );
}

export function getApprovedExchangeOffers(customer?: string, email?: string) {
  const activeUser = email || (typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : "") || undefined;
  return withFallback(
    () => callMethod<ExchangeOfferDoc[]>("mobile_management.api.get_approved_exchange_offers", { customer, email: activeUser }),
    []
  );
}

export function approveExchangeOffer(exchangeOfferName: string, approvedValue: number, adminRemarks?: string) {
  return callMethod<ExchangeOfferDoc>("mobile_management.api.approve_exchange_offer", {
    exchange_offer_name: exchangeOfferName,
    approved_exchange_value: approvedValue,
    admin_remarks: adminRemarks || "",
  });
}

export function markExchangeOfferUsed(exchangeOfferName: string, salesOrder?: string, usedAmount?: number) {
  return callMethod<ExchangeOfferDoc>("mobile_management.api.mark_exchange_offer_used", {
    exchange_offer_name: exchangeOfferName,
    sales_order: salesOrder || "",
    used_amount: usedAmount || 0,
  });
}

export function createExchangeRequest(doc: unknown) {
  return withFallback(
    () => callMethod<string | { name?: string }>("mobile_management.api.create_exchange_request", doc as Record<string, unknown>),
    null
  );
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

export function getExchangeCategories() {
  return callMethod<unknown[]>("mobile_erp.exchange.get_categories");
}

export function getExchangeBrands(category: string) {
  return callMethod<unknown[]>("mobile_erp.exchange.get_brands", { category });
}

export function getExchangeModels(category: string, brand: string) {
  return callMethod<unknown[]>("mobile_erp.exchange.get_models", { category, brand });
}

export function evaluateExchange(payload: unknown) {
  return callMethod<{ estimated_value: number; bonus: number }>(
    "mobile_erp.exchange.evaluate",
    payload,
  );
}

export interface ValuationIssue {
  issue: string;
  type?: string;
  percentage: number;
  amount: number;
  description?: string;
}

export interface ValuationResult {
  market_value: number;
  device_age_months: number;
  age_deduction_percentage: number;
  age_deduction_amount: number;
  issue_deductions: ValuationIssue[];
  total_deduction_percentage: number;
  total_deduction_amount: number;
  final_exchange_value: number;
  valuation_doc?: string;
}

export function fetchExchangeMarketValue(brand: string, model: string, storage?: string, ram?: string, item_code?: string) {
  return callMethod<{ market_value: number; emv_name?: string }>(
    "mobile_management.api.get_exchange_market_value",
    { brand, model, storage, ram, item_code }
  );
}

export function calculateExchangeValueBackend(payload: {
  brand: string;
  model: string;
  storage?: string;
  ram?: string;
  item_code?: string;
  purchase_date?: string;
  device_age_months?: number;
  issues?: string[];
  questionnaire_answers?: Record<string, string>;
  customer?: string;
}) {
  return callMethod<ValuationResult>(
    "mobile_management.api.calculate_exchange_value",
    payload as Record<string, unknown>
  );
}

export function fetchExchangeDeductionRules() {
  return callMethod<unknown[]>("mobile_management.api.get_exchange_deduction_rules");
}

