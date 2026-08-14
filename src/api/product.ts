import { getDoc, getList, withFallback, callMethod } from "./client"; // <-- callMethod is correctly at the top!
import { demoProducts, type Product } from "@/services/demoData";

// --- Defining ERP_URL directly to bypass any linter or import errors ---
const ERP_URL = import.meta.env.VITE_ERP_URL || "";

const FIELDS = '["name","item_name","item_group","brand","standard_rate","description","image","custom_storage","custom_colour","custom_model","custom_battery","custom_processor","custom_display","custom_ram","custom_operating_system","custom_warranty","custom_network"]';

export async function getProducts(params: Record<string, unknown> = {}) {
  const apiItems = await withFallback<any[]>(
    () => callMethod<any[]>("mobile_management.api.get_products", params),
    [],
  );

  if (Array.isArray(apiItems) && apiItems.length > 0) {
    const mappedApiList = apiItems.map((item: any) => {
      if (item?.image && item.image.startsWith("/")) {
        item.image = `${ERP_URL}${item.image}`;
      }
      return item;
    });
    console.log("LIVE ERPNEXT PRODUCTS DATA (from get_products API):", mappedApiList);
    return mappedApiList;
  }

  const list = await withFallback<any[]>(
    () => getList<any>("Item", { fields: FIELDS, limit_page_length: 100, ...params }),
    demoProducts,
  );

  const prices = await withFallback<any[]>(
    () => callMethod<any[]>("mobile_management.api.get_item_prices"),
    []
  );

  const priceMap = new Map(
    Array.isArray(prices) ? prices.map((p: any) => [p?.item_code, p?.price_list_rate]) : []
  );

  const mappedList = (list || []).map((item: any) => {
    if (item?.image && item.image.startsWith("/")) {
      item.image = `${ERP_URL}${item.image}`;
    }
    item.standard_rate = priceMap.get(item?.name) || item?.standard_rate || 0;
    return item;
  });

  console.log("LIVE ERPNEXT PRODUCTS DATA:", mappedList);
  return mappedList;
}

export async function getProduct(name: string) {
  const item = await withFallback<any>(
    () => callMethod<any>("mobile_management.api.get_item_detail", { item_code: name }),
    demoProducts.find((p) => p.name === name) ?? demoProducts[0],
  );

  if (item && item.image && item.image.startsWith("/")) {
    item.image = `${ERP_URL}${item.image}`;
  }

  console.log("LIVE SINGLE PRODUCT DATA:", item);
  return item;
}

export function getItemPrice(item_code: string) {
  return withFallback(
    () => getList("Item Price", { filters: `[["item_code","=","${item_code}"]]` }),
    [],
  );
}