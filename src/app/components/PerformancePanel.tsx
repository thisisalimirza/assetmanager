"use client";

import { useState } from "react";
import type { Alpha } from "@/lib/analytics";
import { formatSignedPercent, formatDate } from "@/lib/format";
import { ValueChart } from "./ValueChart";
import { ComparisonChart } from "./ComparisonChart";

/**
 * The dashboard's single performance card: one place to look, with two tabs —
 * the fund's dollar value over time, and its time-weighted return vs the
 * benchmark. Replaces two stacked full-width chart cards.
 */
export function PerformancePanel({
  points,
  alpha,
}: {
  points: { date: string; value: number }[];
  alpha: Alpha;
}) {
  const [tab, setTab] = useState<"value" | "benchmark">("value");

  const tabClass = (active: boolean) =>
    "rounded-md px-3 py-1 text-sm transition-colors " +
    (active
      ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-950">
          <button type="button" className={tabClass(tab === "value")} onClick={() => setTab("value")}>
            Fund value
          </button>
          <button
            type="button"
            className={tabClass(tab === "benchmark")}
            onClick={() => setTab("benchmark")}
          >
            vs {alpha.label}
          </button>
        </div>
        {tab === "benchmark" && alpha.available && (
          <span className="text-xs text-zinc-400">since {formatDate(alpha.anchorDate)}</span>
        )}
      </div>

      {tab === "value" ? (
        <>
          <ValueChart points={points} emptyHint="Record valuations over time to see the trend." />
          <p className="mt-2 text-xs text-zinc-400">
            Total market value of the fund at each valuation and transaction.
          </p>
        </>
      ) : alpha.available ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <PanelStat
              label="Fund performance"
              value={formatSignedPercent(alpha.fundReturn)}
              positive={alpha.fundReturn >= 0}
            />
            <PanelStat label={alpha.label} value={formatSignedPercent(alpha.benchmarkReturn)} muted />
            <PanelStat label="Alpha" value={formatSignedPercent(alpha.alpha)} positive={alpha.alpha >= 0} />
          </div>
          <ComparisonChart series={alpha.series} benchmarkLabel={alpha.label} />
          <p className="mt-2 text-xs text-zinc-400">
            Time-weighted return vs the {alpha.label} over the same period — pure investment
            performance, unaffected by deposit timing. Alpha is how much you beat (or trailed)
            simply holding the index.
          </p>
        </>
      ) : (
        <div className="flex h-24 items-center justify-center text-center text-sm text-zinc-400">
          {alpha.reason}
        </div>
      )}
    </div>
  );
}

function PanelStat({
  label,
  value,
  positive,
  muted,
}: {
  label: string;
  value: string;
  positive?: boolean;
  muted?: boolean;
}) {
  const toneClass = muted
    ? "text-zinc-500"
    : positive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
