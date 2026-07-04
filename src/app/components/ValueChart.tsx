"use client";

import { useRef, useState } from "react";
import { niceTicks, pickLabelIndices } from "@/lib/chart";
import { formatCurrency, formatDate } from "@/lib/format";

type Point = { date: string; value: number };

const WIDTH = 720;
const PAD_X = 12;
const PAD_Y = 14;
const AXIS_W = 64; // reserved space on the left for y-axis labels
const AXIS_H = 20; // reserved space at the bottom for x-axis labels

export function ValueChart({
  points,
  emptyHint = "Add at least two data points to see a trend.",
  height = 220,
}: {
  points: Point[];
  emptyHint?: string;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-zinc-400" style={{ height }}>
        {emptyHint}
      </div>
    );
  }

  const plotW = WIDTH - AXIS_W - PAD_X;
  const plotH = height - AXIS_H - PAD_Y;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ticks = niceTicks(min, max, 4);
  const loBound = Math.min(min, ticks[0]);
  const hiBound = Math.max(max, ticks[ticks.length - 1]);
  const range = hiBound - loBound || 1;

  const x = (i: number) => AXIS_W + (i / (points.length - 1)) * plotW;
  const y = (v: number) => PAD_Y + (1 - (v - loBound) / range) * plotH;

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${x(0)},${PAD_Y + plotH} ${line} ${x(points.length - 1)},${PAD_Y + plotH}`;

  const labelIdx = pickLabelIndices(points.length, 4);

  function handleMove(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const targetX = frac * WIDTH;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(x(i) - targetX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setHover(nearest);
  }

  const hp = hover != null ? points[hover] : null;
  const tooltipLeftPct = hover != null ? (x(hover) / WIDTH) * 100 : 0;
  const tooltipAlignRight = tooltipLeftPct > 65;

  return (
    <div className="relative">
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
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + y-axis labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={AXIS_W}
              x2={WIDTH - PAD_X}
              y1={y(t)}
              y2={y(t)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <text x={AXIS_W - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-zinc-400 text-[10px]">
              {formatCurrency(t)}
            </text>
          </g>
        ))}

        {/* x-axis date labels */}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 4}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            className="fill-zinc-400 text-[10px]"
          >
            {formatDate(points[i].date)}
          </text>
        ))}

        <g className="text-emerald-600 dark:text-emerald-400">
          <polygon points={area} fill="url(#areaFill)" stroke="none" />
          <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </g>

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
            <circle cx={x(hover)} cy={y(hp.value)} r={4} className="fill-emerald-600 dark:fill-emerald-400" />
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
          <div className="font-medium tabular-nums">{formatCurrency(hp.value)}</div>
          <div className="text-zinc-400">{formatDate(hp.date)}</div>
        </div>
      )}
    </div>
  );
}
