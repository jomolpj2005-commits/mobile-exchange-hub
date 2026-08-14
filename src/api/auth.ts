import { api, callMethod, withFallback } from "./client";

export type SessionUser = { full_name: string; email: string; roles?: string[] };

/** ERPNext login: POST /api/method/login (Strict authentication without fake fallback) */
export async function login(usr: string, pwd: string) {
  const payload = new URLSearchParams();
  payload.append("usr", usr);
  payload.append("pwd", pwd);

  const res = await api.post("/api/method/login", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return res.data;
}

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("erp_logged_in");
    localStorage.removeItem("active_dealer_email");
    localStorage.removeItem("erp_user_fullname");
    localStorage.removeItem("erp_token");
  }
  return withFallback(() => callMethod("logout"), { message: "ok" });
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const loggedIn = localStorage.getItem("erp_logged_in") === "true";
  const email = localStorage.getItem("active_dealer_email");
  return Boolean(loggedIn && email);
}

/** frappe.auth.get_logged_user */
export async function getLoggedUser(): Promise<string> {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("active_dealer_email");
    if (email) return email;
  }
  return withFallback(() => callMethod<string>("frappe.auth.get_logged_user"), "");
}