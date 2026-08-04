import { useCallback, useEffect, useState } from "react";

/** Tiny data-fetching hook around the api/ layer. */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    run()
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err?.message ?? "Request failed"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [run]);

  return { data, loading, error };
}