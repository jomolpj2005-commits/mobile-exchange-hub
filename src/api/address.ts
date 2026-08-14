import { callMethod, deleteDoc, withFallback } from "./client";
import type { Address } from "@/types";

/** All addresses linked to a Customer through Dynamic Link (bypassing 403 permission blocks). */
export async function getCustomerAddresses(customer?: string | null): Promise<Address[]> {
  return withFallback(
    () => callMethod<Address[]>("mobile_management.api.get_customer_addresses", { customer_name: customer }),
    [] as Address[],
  );
}

export async function getDefaultAddress(customer: string, kind: "shipping" | "billing" = "shipping") {
  const list = await getCustomerAddresses(customer);
  const flag = kind === "shipping" ? "is_shipping_address" : "is_primary_address";
  return list.find((a) => a[flag] === 1) ?? list[0] ?? null;
}

export async function createAddress(customer: string, doc: Partial<Address>) {
  return callMethod("mobile_management.api.save_customer_address", {
    customer_name: customer,
    address_data: doc,
  });
}

export async function updateAddress(name: string, doc: Partial<Address>) {
  return callMethod("mobile_management.api.save_customer_address", {
    address_name: name,
    address_data: doc,
  });
}

export function removeAddress(name: string) {
  return deleteDoc("Address", name);
}

export function setDefaultAddress(name: string, kind: "shipping" | "billing" = "shipping") {
  return callMethod("mobile_management.api.set_default", { name, kind });
}