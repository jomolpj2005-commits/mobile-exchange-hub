import { api, callMethod, withFallback } from "./client";

export type SessionUser = { full_name: string; email: string; roles?: string[] };

/** ERPNext login: POST /api/method/login */
export async function login(usr: string, pwd: string) {
  return withFallback(
    async () => {
      const res = await api.post("/api/method/login", { usr, pwd });
      return res.data;
    },
    { message: "Logged In", full_name: usr },
  );
}

export async function logout() {
  return withFallback(() => callMethod("logout"), { message: "ok" });
}

/** frappe.auth.get_logged_user */
export async function getLoggedUser(): Promise<string> {
  return withFallback(() => callMethod<string>("frappe.auth.get_logged_user"), "demo@erp.local");
}