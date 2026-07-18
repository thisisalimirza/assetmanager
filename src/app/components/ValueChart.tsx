"use client";

import { useId, useRef, useState } from "react";
import { niceTicks, pickLabelIndices, xAtTime } from "@/lib/chart";
import { formatCurrency, formatDate } from "@/lib/format";

type Point = { date: string; value: number };

const WIDTH = 720;
const PAD_X = 12;
const PAD_Y = 14;
const AXIS_W = 64;
const AXIS_H = 20;

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
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-zinc-500" style={{ height }}>
        {emptyHint}
      </div>
    );
  }

  const plotW = WIDTH - AXIS_W - PAD_X;
  const plotH = height - AXIS_H - PAD_Y;
  const dates = points.map((p) => p.date);
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ticks = niceTicks(min, max, 4);
  const loBound = Math.min(min, ticks[0]);
  const hiBound = Math.max(max, ticks[ticks.length - 1]);
  const range = hiBound - loBound || 1;

  const x = (i: number) => xAtTime(dates, i, AXIS_W, AXIS_W + plotW);
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
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={AXIS_W}
              x2={WIDTH - PAD_X}
              y1={y(t)}
              y2={y(t)}
              className="stroke-zinc-200"
              strokeWidth={1}
            />
            <text
              x={AXIS_W - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-400 text-[10px]"
            >
              {formatCurrency(t)}
            </text>
          </g>
        ))}

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

        <g className="text-emerald-700">
          <polygon points={area} fill={`url(#${gradId})`} stroke="none" />
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {hp && hover != null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD_Y}
              y2={PAD_Y + plotH}
              className="stroke-zinc-400"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={x(hover)} cy={y(hp.value)} r={4} className="fill-emerald-700" />
          </g>
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs shadow-sm"
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
