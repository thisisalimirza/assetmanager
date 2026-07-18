export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${(Math.abs(value) * 100).toFixed(digits)}%`;
}

export function formatUnits(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/** Format a calendar date without timezone day-shift (YYYY-MM-DD → UTC noon). */
export function formatDate(value: string): string {
  const day = value.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const d = new Date(`${day}T12:00:00Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
