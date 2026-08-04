import { createDoc, getList, withFallback } from "./client";
import { demoDealers } from "@/services/demoData";

export type Dealer = (typeof demoDealers)[number];

export function getDealers(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<Dealer>("Customer", {
        fields: '["name","customer_name","territory","customer_group"]',
        limit_page_length: 100,
        ...params,
      }),
    demoDealers,
  );
}

export function createDealer(doc: unknown) {
  return createDoc("Customer", doc);
}