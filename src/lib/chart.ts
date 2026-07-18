/** Shared math for the dependency-free SVG charts (axis scaling + tick values). */

export function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const range = max - min;
  const rawStep = range / Math.max(count - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step = (residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1) * magnitude;

  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    if (v >= min - step * 0.5) ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/** Parse a calendar YYYY-MM-DD (or datetime) to UTC ms for chart spacing. */
export function dateToMs(iso: string): number {
  const day = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return Date.parse(`${day}T00:00:00Z`);
  }
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Map a date onto [x0, x1] by calendar time between the series endpoints.
 * Falls back to equal index spacing when dates are missing or identical.
 */
export function xAtTime(
  dates: string[],
  index: number,
  x0: number,
  x1: number,
): number {
  if (dates.length < 2) return (x0 + x1) / 2;
  const t0 = dateToMs(dates[0]);
  const t1 = dateToMs(dates[dates.length - 1]);
  if (!(t1 > t0)) {
    return x0 + (index / (dates.length - 1)) * (x1 - x0);
  }
  const t = dateToMs(dates[index]);
  return x0 + ((t - t0) / (t1 - t0)) * (x1 - x0);
}

/** Evenly-spaced indices into an array of length n, for x-axis date labels. */
export function pickLabelIndices(n: number, count: number): number[] {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const out = new Set<number>();
  for (let i = 0; i < count; i++) {
    out.add(Math.round((i / (count - 1)) * (n - 1)));
  }
  return [...out].sort((a, b) => a - b);
}
