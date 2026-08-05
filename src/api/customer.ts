import { callMethod, getDoc, getList, updateDoc, withFallback } from "./client";
import type { Customer } from "@/types";

const FIELDS =
  '["name","customer_name","email_id","mobile_no","customer_group","territory"]';

/** Logged-in customer profile (ERPNext Customer linked to the session user). */
export async function getCustomerProfile(): Promise<Customer | null> {
  return withFallback(async () => {
    const linked = await callMethod<Customer | string>(
      "mobile_erp.customer.get_my_customer",
    ).catch(() => null);
    if (linked && typeof linked === "object") return linked;
    if (typeof linked === "string" && linked) return getDoc<Customer>("Customer", linked);
    const list = await getList<Customer>("Customer", { fields: FIELDS, limit_page_length: 1 });
    return list[0] ?? null;
  }, null);
}

export function getCustomer(name: string) {
  return withFallback(() => getDoc<Customer>("Customer", name), null);
}

export function updateCustomerProfile(name: string, doc: Partial<Customer>) {
  return updateDoc<Customer>("Customer", name, doc);
}

export function getCustomers(params: Record<string, unknown> = {}) {
  return withFallback(
    () => getList<Customer>("Customer", { fields: FIELDS, limit_page_length: 100, ...params }),
    [] as Customer[],
  );
}
