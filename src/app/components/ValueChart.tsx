type Point = { date: string; value: number };

export function ValueChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        Add at least two snapshots to see a trend line.
      </div>
    );
  }

  const width = 640;
  const height = 160;
  const padding = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" preserveAspectRatio="none">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-emerald-600 dark:text-emerald-400"
      />
    </svg>
  );
}
