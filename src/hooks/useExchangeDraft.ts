import { useCallback, useEffect, useState } from "react";
import type { ExchangeDraft } from "@/types";

const KEY = "erp_exchange_draft";
const EVENT = "erp-exchange-change";

export const emptyDraft: ExchangeDraft = {
  answers: {},
  base_value: 0,
  estimated_value: 0,
  bonus: 0,
};

function read(): ExchangeDraft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    return { ...emptyDraft, ...JSON.parse(window.localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return emptyDraft;
  }
}

function write(draft: ExchangeDraft) {
  window.localStorage.setItem(KEY, JSON.stringify(draft));
  window.dispatchEvent(new Event(EVENT));
}

export function useExchangeDraft() {
  const [draft, setDraft] = useState<ExchangeDraft>(emptyDraft);

  useEffect(() => {
    const sync = () => setDraft(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const patch = useCallback((next: Partial<ExchangeDraft>) => {
    write({ ...read(), ...next });
  }, []);

  const reset = useCallback(() => write(emptyDraft), []);

  return { draft, patch, reset };
}
