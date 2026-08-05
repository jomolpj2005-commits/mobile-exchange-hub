import axios from "axios";

/**
 * Central Axios instance for the ERPNext / Frappe backend.
 * Set VITE_ERP_URL in your environment, e.g. https://erp.mycompany.com
 * All requests go to /api/resource/... or /api/method/...
 */
export const ERP_URL = import.meta.env["VITE_ERP_URL"] ?? "";

export const api = axios.create({
  baseURL: ERP_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Optional token auth (ERPNext API key/secret): "token api_key:api_secret"
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("erp_token");
    if (token) config.headers.Authorization = `token ${token}`;
  }
  return config;
});

/** GET a Frappe doctype list. */
export async function getList<T = Record<string, unknown>>(
  doctype: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const res = await api.get(`/api/resource/${encodeURIComponent(doctype)}`, {
    params: { limit_page_length: 20, ...params },
  });
  return res.data?.data ?? [];
}

/** GET a single Frappe document. */
export async function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  const res = await api.get(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
  );
  return res.data?.data;
}

/** POST a new Frappe document. */
export async function createDoc<T = Record<string, unknown>>(doctype: string, doc: unknown): Promise<T> {
  const res = await api.post(`/api/resource/${encodeURIComponent(doctype)}`, doc);
  return res.data?.data;
}

/** PUT (update) a Frappe document. */
export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  doc: unknown,
): Promise<T> {
  const res = await api.put(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    doc,
  );
  return res.data?.data;
}

/** Call a whitelisted server method: /api/method/<dotted.path> */
export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await api.delete(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
}

/** Call a whitelisted server method: /api/method/<dotted.path> */
export async function callMethod<T = unknown>(method: string, args: unknown = {}): Promise<T> {
  const res = await api.post(`/api/method/${method}`, args);
  return res.data?.message ?? res.data;
}

/**
 * Small helper so the UI keeps rendering while the ERPNext backend
 * is still being built. Replace nothing — just point VITE_ERP_URL at ERPNext.
 */
export async function withFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  if (!ERP_URL) return fallback;
  try {
    return await request();
  } catch {
    return fallback;
  }
}