import { callMethod, createDoc, getList, withFallback } from "./client";
import { demoDealers } from "@/services/demoData";

export type Dealer = (typeof demoDealers)[number];

export function getDealers(params: Record<string, unknown> = {}) {
  return withFallback(
    () => callMethod<Dealer[]>("mobile_management.api.get_dealers", params),
    demoDealers,
  );
}

export function createDealer(doc: unknown) {
  return createDoc("Customer", doc);
}