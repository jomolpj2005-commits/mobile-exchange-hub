/** Loads the official Razorpay Checkout SDK once. */
const SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayInstance = { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };

export function openRazorpay(options: Record<string, unknown>): RazorpayInstance | null {
  const Ctor = (window as unknown as { Razorpay?: new (o: Record<string, unknown>) => RazorpayInstance }).Razorpay;
  if (!Ctor) return null;
  const rzp = new Ctor(options);
  rzp.open();
  return rzp;
}
