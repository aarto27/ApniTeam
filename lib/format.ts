export function formatCurrency(value: number) {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

export function formatDateTime(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString([], { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}
