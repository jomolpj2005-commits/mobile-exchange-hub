import { useCallback, useEffect, useState } from "react";
import { getCustomerProfile } from "@/api/customer";
import { getCustomerAddresses } from "@/api/address";
import type { Address, Customer } from "@/types";

/** Loads the signed-in ERPNext Customer and its Address Book. */
export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const profile = await getCustomerProfile();
    setCustomer(profile);
    setAddresses(profile ? await getCustomerAddresses(profile.name) : []);
    setLoading(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("erp-cart-change"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultShipping = addresses.find((a) => a.is_shipping_address === 1) ?? addresses[0] ?? null;
  const defaultBilling = addresses.find((a) => a.is_primary_address === 1) ?? addresses[0] ?? null;

  return { customer, addresses, defaultShipping, defaultBilling, loading, reload: load };
}
