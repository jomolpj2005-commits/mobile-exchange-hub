import { callMethod, createDoc, getList, withFallback } from "./client";
import { demoRefurb } from "@/services/demoData";

export type RefurbJob = (typeof demoRefurb)[number];

export function getRefurbJobs(params: Record<string, unknown> = {}) {
  return withFallback(
    () => getList<RefurbJob>("Refurbishment Job", { limit_page_length: 100, ...params }),
    demoRefurb,
  );
}

/** Inspection -> Repair -> Component Replacement -> Quality Check -> Ready for Sale -> Stock */
export function createRefurbJob(doc: unknown) {
  return createDoc("Refurbishment Job", doc);
}

export function advanceStage(name: string, stage: string) {
  return callMethod("mobile_erp.refurbishment.advance_stage", { name, stage });
}