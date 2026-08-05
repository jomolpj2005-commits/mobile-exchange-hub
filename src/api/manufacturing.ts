import { getDoc, getList, withFallback } from "./client";
import type { Bom, JobCard, WorkOrder } from "@/types";

export function getBoms(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<Bom>("BOM", {
        fields: '["name","item","item_name","quantity","is_active","is_default"]',
        limit_page_length: 100,
        ...params,
      }),
    [] as Bom[],
  );
}

export function getWorkOrders(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<WorkOrder>("Work Order", {
        fields:
          '["name","production_item","item_name","qty","produced_qty","status","bom_no","planned_start_date"]',
        order_by: "planned_start_date desc",
        limit_page_length: 100,
        ...params,
      }),
    [] as WorkOrder[],
  );
}

export function getWorkOrder(name: string) {
  return withFallback(() => getDoc<WorkOrder>("Work Order", name), null);
}

export function getJobCards(params: Record<string, unknown> = {}) {
  return withFallback(
    () =>
      getList<JobCard>("Job Card", {
        fields:
          '["name","work_order","operation","workstation","status","for_quantity","total_completed_qty"]',
        limit_page_length: 100,
        ...params,
      }),
    [] as JobCard[],
  );
}
