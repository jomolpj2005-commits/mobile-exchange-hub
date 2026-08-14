import axios from "axios";

/**
 * Central Axios instance for the ERPNext / Frappe backend.
 * Uses VITE_ERP_URL from your .env file.
 */
export const ERP_URL = import.meta.env["VITE_ERP_URL"] ?? "";

export const api = axios.create({
  baseURL: ERP_URL,
  withCredentials: true, // Allows the browser to send your login cookie (sid)
  headers: { 
    "Content-Type": "application/json", 
    "Accept": "application/json" 
  },
});

// Optional token auth support
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("erp_token");
    if (token) config.headers.Authorization = `token ${token}`;
  }
  return config;
});

/** GET a Frappe doctype list. */
export async function getList<T = any>(
  doctype: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const res = await api.get(`/api/resource/${encodeURIComponent(doctype)}`, {
    params: { limit_page_length: 20, ...params },
  });
  return res.data?.data ?? [];
}

/** GET a single Frappe document. */
export async function getDoc<T = any>(doctype: string, name: string): Promise<T> {
  const res = await api.get(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
  );
  return res.data?.data;
}

/** POST a new Frappe document. */
export async function createDoc<T = any>(doctype: string, doc: unknown): Promise<T> {
  const res = await api.post(`/api/resource/${encodeURIComponent(doctype)}`, doc);
  return res.data?.data;
}

/** PUT (update) a Frappe document. */
export async function updateDoc<T = any>(
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

/** DELETE a Frappe document. */
export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await api.delete(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
}

/** Call a whitelisted server method: /api/method/<dotted.path> */
export async function callMethod<T = any>(method: string, args: unknown = {}): Promise<T> {
  const res = await api.post(`/api/method/${method}`, args);
  return res.data?.message ?? res.data;
}

/**
 * Small helper to handle requests and log errors.
 */
export async function withFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch (err: any) {
    console.error("ERPNext Connection Error:", err.response?.data || err.message);
    return fallback;
  }
}