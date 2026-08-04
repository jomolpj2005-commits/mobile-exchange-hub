import { getDoc, getList, withFallback } from "./client";
import { demoProducts, type Product } from "@/services/demoData";

const FIELDS = '["name","item_name","item_group","brand","standard_rate","description"]';

export function getProducts(params: Record<string, unknown> = {}) {
  return withFallback(
    () => getList<Product>("Item", { fields: FIELDS, limit_page_length: 100, ...params }),
    demoProducts,
  );
}

export function getProduct(name: string) {
  return withFallback(
    () => getDoc<Product>("Item", name),
    demoProducts.find((p) => p.name === name) ?? demoProducts[0],
  );
}

export function getItemPrice(item_code: string) {
  return withFallback(
    () => getList("Item Price", { filters: `[["item_code","=","${item_code}"]]` }),
    [],
  );
}