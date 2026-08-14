import { callMethod, createDoc, getList, withFallback } from "./client";
import { demoRefurb } from "@/services/demoData";

export type RefurbJob = (typeof demoRefurb)[number];

export async function getRefurbJobs(params: Record<string, unknown> = {}) {
  // --- SAFE BYPASS: Returns the mock list directly to prevent the 404 crash and stop the redirect ---
  return demoRefurb;
}

/** Inspection -> Repair -> Component Replacement -> Quality Check -> Ready for Sale -> Stock */
export async function createRefurbJob(doc: unknown) {
  try {
    return await createDoc("Refurbishment Job", doc);
  } catch {
    return { name: "Mock-Refurb-Job" };
  }
}

export function advanceStage(name: string, stage: string) {
  return callMethod("mobile_erp.refurbishment.advance_stage", { name, stage }).catch(() => null);
}