import { callMethod, createDoc, deleteDoc, getList, updateDoc, withFallback } from "./client";
import type { Address } from "@/types";

const FIELDS =
  '["name","address_title","address_line1","address_line2","city","state","country","pincode","phone","is_primary_address","is_shipping_address"]';

/** All addresses linked to a Customer through Dynamic Link. */
export function getCustomerAddresses(customer: string) {
  return withFallback(
    () =>
      getList<Address>("Address", {
        fields: FIELDS,
        filters: `[["Dynamic Link","link_name","=","${customer}"]]`,
        limit_page_length: 50,
      }),
    [] as Address[],
  );
}

export async function getDefaultAddress(customer: string, kind: "shipping" | "billing" = "shipping") {
  const list = await getCustomerAddresses(customer);
  const flag = kind === "shipping" ? "is_shipping_address" : "is_primary_address";
  return list.find((a) => a[flag] === 1) ?? list[0] ?? null;
}

export function createAddress(customer: string, doc: Partial<Address>) {
  return createDoc<Address>("Address", {
    ...doc,
    doctype: "Address",
    links: [{ link_doctype: "Customer", link_name: customer }],
  });
}

export function updateAddress(name: string, doc: Partial<Address>) {
  return updateDoc<Address>("Address", name, doc);
}

export function removeAddress(name: string) {
  return deleteDoc("Address", name);
}

export function setDefaultAddress(name: string, kind: "shipping" | "billing" = "shipping") {
  return callMethod("mobile_erp.address.set_default", { name, kind });
}
