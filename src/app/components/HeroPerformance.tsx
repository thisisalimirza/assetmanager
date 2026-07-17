"use client";

import { useEffect, useId, useState } from "react";

type Point = { date: string; value: number };

/**
 * Full-bleed SVG of the fund's real NAV-per-unit path — the product itself as
 * the hero visual, not a stock photo.
 */
export function HeroPerformance({ points }: { points: Point[] }) {
  const gradId = useId();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const w = 1200;
  const h = 640;
  const padX = 0;
  const padY = 48;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (p.value - min) / range) * (h - padY * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const length = approxPathLength(coords);

  return (
    <svg
      className="hero-chart absolute inset-0 h-full w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--caf-signal)" stopOpacity="0.35" />
          <stop offset="55%" stopColor="var(--caf-signal)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--caf-signal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill={`url(#${gradId})`}
        className={ready ? "hero-chart-fill is-ready" : "hero-chart-fill"}
      />
      <path
        d={line}
        fill="none"
        stroke="var(--caf-signal)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={length}
        style={{ strokeDasharray: length, strokeDashoffset: ready ? 0 : length }}
        className="hero-chart-stroke"
      />
    </svg>
  );
}

function approxPathLength(coords: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    total += Math.hypot(x1 - x0, y1 - y0);
  }
  return Math.max(total, 1);
}
