import { createDoc, getList, withFallback } from "./client";
import { demoInventory } from "@/services/demoData";

export type StockRow = (typeof demoInventory)[number];

export function getStockBalance(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<StockRow>("Bin", {
        fields: '["item_code","warehouse","actual_qty","reserved_qty","valuation_rate"]',
        limit_page_length: 200,
        ...params,
      }),
    demoInventory,
  );
}

export function getWarehouses() {
  return withFallback(
    () => getList<{ name: string }>("Warehouse", { fields: '["name"]' }),
    [...new Set(demoInventory.map((r) => r.warehouse))].map((name) => ({ name })),
  );
}

/** Manufacturing flow: BOM -> Work Order -> Job Card -> Material Transfer -> Manufacture */
export function createWorkOrder(doc: unknown) {
  return createDoc("Work Order", doc);
}

export function createStockEntry(doc: unknown) {
  return createDoc("Stock Entry", doc);
}