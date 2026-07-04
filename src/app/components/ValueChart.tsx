type Point = { date: string; value: number };

/** Dependency-free SVG area chart. Server-renderable. */
export function ValueChart({
  points,
  emptyHint = "Add at least two data points to see a trend.",
  height = 180,
}: {
  points: Point[];
  emptyHint?: string;
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-zinc-400"
        style={{ height }}
      >
        {emptyHint}
      </div>
    );
  }

  const width = 720;
  const padX = 6;
  const padY = 12;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.abs(max) || 1;

  const x = (i: number) => padX + (i / (points.length - 1)) * (width - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / range) * (height - padY * 2);

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;

  const gridY = [0.25, 0.5, 0.75].map((f) => padY + f * (height - padY * 2));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="text-emerald-600 dark:text-emerald-400">
        {gridY.map((gy, i) => (
          <line
            key={i}
            x1={padX}
            x2={width - padX}
            y1={gy}
            y2={gy}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth={1}
          />
        ))}
        <polygon points={area} fill="url(#areaFill)" stroke="none" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
