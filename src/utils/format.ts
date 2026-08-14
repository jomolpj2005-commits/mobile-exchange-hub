export function formatCurrency(value: number) {
  const hasDecimals = (value || 0) % 1 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}