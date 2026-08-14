import { callMethod, withFallback } from "./client";
import type { Customer } from "@/types";

export async function getCustomerProfile(): Promise<Customer | null> {
  return withFallback(async () => {
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") : null;
    const storedCust = typeof window !== "undefined" ? localStorage.getItem("active_customer_name") : null;
    const storedName = typeof window !== "undefined" ? localStorage.getItem("erp_user_fullname") : null;

    const emailParam = storedEmail || storedCust || storedName || undefined;

    const cust = await callMethod<Customer>("mobile_management.api.get_my_customer", { 
      email: emailParam
    });
    if (cust && cust.name) {
      if (typeof window !== "undefined") {
        localStorage.setItem("active_customer_name", cust.name);
        if (cust.email_id) localStorage.setItem("active_dealer_email", cust.email_id);
      }
    }
    return cust;
  }, null);
}

export function updateCustomerProfile(name: string, doc: Partial<Customer>) {
  return callMethod<Customer>("mobile_management.api.update_my_profile", {
    customer_name: name,
    doc: doc,
  });
}