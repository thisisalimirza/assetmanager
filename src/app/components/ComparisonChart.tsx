type Point = { date: string; fund: number; benchmark: number | null };

/** Two-line growth-of-$1 chart: the fund vs a benchmark, both starting at 1. */
export function ComparisonChart({
  series,
  benchmarkLabel,
  height = 200,
}: {
  series: Point[];
  benchmarkLabel: string;
  height?: number;
}) {
  if (series.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-zinc-400" style={{ height }}>
        Record more valuations over time to chart performance vs {benchmarkLabel}.
      </div>
    );
  }

  const width = 720;
  const padX = 6;
  const padY = 14;

  const all: number[] = [];
  for (const p of series) {
    all.push(p.fund);
    if (p.benchmark != null) all.push(p.benchmark);
  }
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const x = (i: number) => padX + (i / (series.length - 1)) * (width - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / range) * (height - padY * 2);

  const fundLine = series.map((p, i) => `${x(i).toFixed(1)},${y(p.fund).toFixed(1)}`).join(" ");

  // Benchmark line may have gaps (missing days); split into contiguous runs.
  const benchRuns: string[] = [];
  let run: string[] = [];
  series.forEach((p, i) => {
    if (p.benchmark != null) {
      run.push(`${x(i).toFixed(1)},${y(p.benchmark).toFixed(1)}`);
    } else if (run.length) {
      benchRuns.push(run.join(" "));
      run = [];
    }
  });
  if (run.length) benchRuns.push(run.join(" "));

  // Baseline at $1 (starting value) for reference.
  const baseY = y(1);

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" /> Your fund
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-zinc-400" /> {benchmarkLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {min < 1 && max > 1 && (
          <line
            x1={padX}
            x2={width - padX}
            y1={baseY}
            y2={baseY}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}
        {benchRuns.map((pts, i) => (
          <polyline
            key={i}
            points={pts}
            fill="none"
            className="stroke-zinc-400"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polyline
          points={fundLine}
          fill="none"
          className="stroke-emerald-500"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
