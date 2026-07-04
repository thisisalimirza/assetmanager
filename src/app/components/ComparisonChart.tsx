"use client";

import { useRef, useState } from "react";
import { niceTicks, pickLabelIndices } from "@/lib/chart";
import { formatDate, formatSignedPercent, formatCurrency } from "@/lib/format";

type Point = { date: string; fund: number; benchmark: number | null };

const WIDTH = 720;
const PAD_X = 12;
const PAD_Y = 14;
const AXIS_H = 20;

/**
 * Interactive two-line comparison chart, in one of two modes:
 * - "percent" (default): series values are growth-of-$1 ratios (1 = start);
 *   rendered as % return from the anchor. Used for the fund vs benchmark.
 * - "currency": series values are raw dollar amounts, rendered as-is. Used
 *   for a client's real value vs a hypothetical same-cashflow benchmark value.
 */
export function ComparisonChart({
  series,
  benchmarkLabel,
  primaryLabel = "Your fund",
  mode = "percent",
  height = 220,
}: {
  series: Point[];
  benchmarkLabel: string;
  primaryLabel?: string;
  mode?: "percent" | "currency";
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const axisW = mode === "currency" ? 64 : 48;

  if (series.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-zinc-400" style={{ height }}>
        Record more valuations over time to chart performance vs {benchmarkLabel}.
      </div>
    );
  }

  const pts =
    mode === "percent"
      ? series.map((p) => ({
          date: p.date,
          fund: (p.fund - 1) * 100,
          benchmark: p.benchmark != null ? (p.benchmark - 1) * 100 : null,
        }))
      : series;

  const formatAxis = (v: number) => (mode === "currency" ? formatCurrency(v) : `${v > 0 ? "+" : ""}${v.toFixed(0)}%`);
  const formatTooltip = (v: number) => (mode === "currency" ? formatCurrency(v) : formatSignedPercent(v / 100));

  const plotW = WIDTH - axisW - PAD_X;
  const plotH = height - AXIS_H - PAD_Y;
  const allVals = pts.flatMap((p) => (p.benchmark != null ? [p.fund, p.benchmark] : [p.fund]));
  const zeroBaseline = mode === "percent" ? 0 : allVals[0];
  const min = Math.min(...allVals, zeroBaseline);
  const max = Math.max(...allVals, zeroBaseline);
  const ticks = niceTicks(min, max, 4);
  const loBound = Math.min(min, ticks[0]);
  const hiBound = Math.max(max, ticks[ticks.length - 1]);
  const range = hiBound - loBound || 1;

  const x = (i: number) => axisW + (i / (pts.length - 1)) * plotW;
  const y = (v: number) => PAD_Y + (1 - (v - loBound) / range) * plotH;

  const fundLine = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.fund).toFixed(1)}`).join(" ");

  const benchRuns: string[] = [];
  let run: string[] = [];
  pts.forEach((p, i) => {
    if (p.benchmark != null) run.push(`${x(i).toFixed(1)},${y(p.benchmark).toFixed(1)}`);
    else if (run.length) {
      benchRuns.push(run.join(" "));
      run = [];
    }
  });
  if (run.length) benchRuns.push(run.join(" "));

  const labelIdx = pickLabelIndices(pts.length, 4);

  function handleMove(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const targetX = frac * WIDTH;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(x(i) - targetX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setHover(nearest);
  }

  const hp = hover != null ? pts[hover] : null;
  const tooltipLeftPct = hover != null ? (x(hover) / WIDTH) * 100 : 0;
  const tooltipAlignRight = tooltipLeftPct > 65;

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" /> {primaryLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-zinc-400" /> {benchmarkLabel}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full cursor-crosshair"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={axisW}
              x2={WIDTH - PAD_X}
              y1={y(t)}
              y2={y(t)}
              className={
                mode === "percent" && t === 0
                  ? "stroke-zinc-300 dark:stroke-zinc-700"
                  : "stroke-zinc-200 dark:stroke-zinc-800"
              }
              strokeWidth={1}
              strokeDasharray={mode === "percent" && t === 0 ? "4 4" : undefined}
            />
            <text x={axisW - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-zinc-400 text-[10px]">
              {formatAxis(t)}
            </text>
          </g>
        ))}

        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 4}
            textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
            className="fill-zinc-400 text-[10px]"
          >
            {formatDate(pts[i].date)}
          </text>
        ))}

        {benchRuns.map((p, i) => (
          <polyline key={i} points={p} fill="none" className="stroke-zinc-400" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
        <polyline points={fundLine} fill="none" className="stroke-emerald-500" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />

        {hp && hover != null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD_Y}
              y2={PAD_Y + plotH}
              className="stroke-zinc-400 dark:stroke-zinc-600"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={x(hover)} cy={y(hp.fund)} r={4} className="fill-emerald-500" />
            {hp.benchmark != null && <circle cx={x(hover)} cy={y(hp.benchmark)} r={4} className="fill-zinc-400" />}
          </g>
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          style={
            tooltipAlignRight
              ? { right: `${100 - tooltipLeftPct}%`, marginRight: 8 }
              : { left: `${tooltipLeftPct}%`, marginLeft: 8 }
          }
        >
          <div className="text-zinc-400">{formatDate(hp.date)}</div>
          <div className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            {primaryLabel} {formatTooltip(hp.fund)}
          </div>
          {hp.benchmark != null && (
            <div className="tabular-nums text-zinc-500">
              {benchmarkLabel} {formatTooltip(hp.benchmark)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
