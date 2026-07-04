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

/** Evenly-spaced indices into an array of length n, for x-axis date labels. */
export function pickLabelIndices(n: number, count: number): number[] {
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const out = new Set<number>();
  for (let i = 0; i < count; i++) {
    out.add(Math.round((i / (count - 1)) * (n - 1)));
  }
  return [...out].sort((a, b) => a - b);
}
