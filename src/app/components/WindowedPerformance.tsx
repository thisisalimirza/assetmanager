"use client";

import { useState } from "react";
import type { AlphaWindow, AlphaWindowId } from "@/lib/analytics";
import { BENCHMARK_DETAIL } from "@/lib/benchmark";
import { formatSignedPercent, formatDate } from "@/lib/format";
import { ComparisonChart } from "./ComparisonChart";

/**
 * Filterable fund-vs-benchmark panel (YTD / 3M / 6M / 1Y / All).
 * Used on the marketing site and public track record.
 */
export function WindowedPerformance({
  windows,
  height = 300,
  variant = "marketing",
  framed = true,
  defaultWindow = "all",
}: {
  windows: AlphaWindow[];
  height?: number;
  variant?: "marketing" | "app";
  /** When false, skip the outer card chrome (for nesting inside another panel). */
  framed?: boolean;
  /** Preferred window when available (marketing + dashboard default to All). */
  defaultWindow?: AlphaWindowId;
}) {
  const available = windows.filter((w) => w.alpha.available);
  const defaultId: AlphaWindowId =
    available.find((w) => w.id === defaultWindow)?.id ??
    available.find((w) => w.id === "all")?.id ??
    available.find((w) => w.id === "ytd")?.id ??
    available[0]?.id ??
    "all";

  const [activeId, setActiveId] = useState<AlphaWindowId>(defaultId);
  const active = windows.find((w) => w.id === activeId) ?? windows[windows.length - 1];
  const alpha = active?.alpha;

  const isMarketing = variant === "marketing";
  const tabWrap = isMarketing
    ? "flex w-full gap-1 overflow-x-auto border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-wrap"
    : "flex w-full gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-zinc-950 sm:w-auto sm:flex-wrap";
  const tabBtn = (on: boolean) =>
    isMarketing
      ? "min-h-10 shrink-0 px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:py-1.5 " +
        (on
          ? "bg-[var(--caf-ink)] text-[var(--caf-paper)]"
          : "text-[var(--caf-mute)] hover:text-[var(--caf-ink)]")
      : "min-h-10 shrink-0 rounded-md px-3 py-2 text-sm transition-colors sm:min-h-0 sm:py-1 " +
        (on
          ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100");

  if (!windows.length) return null;

  const shell = !framed
    ? "p-0"
    : isMarketing
      ? "border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-4 sm:p-8"
      : "rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4";

  const dateBits: string[] = [];
  if (alpha?.available) {
    dateBits.push(`${formatDate(alpha.anchorDate)} → ${formatDate(alpha.asOf)}`);
    if (
      active.requestedStart &&
      active.requestedStart < alpha.anchorDate &&
      active.id !== "all"
    ) {
      dateBits.push("from first audited mark");
    }
    if (alpha.fundMarkDate < alpha.anchorDate) {
      dateBits.push(`NAV from ${formatDate(alpha.fundMarkDate)}`);
    }
    if (alpha.benchmarkAsOfDate < alpha.asOf) {
      dateBits.push(`${alpha.label} as of ${formatDate(alpha.benchmarkAsOfDate)}`);
    }
  }

  return (
    <div className={shell}>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3
            className={
              isMarketing
                ? "font-display text-base font-semibold sm:text-lg"
                : "text-sm font-medium text-zinc-500"
            }
          >
            Performance vs {alpha?.available ? alpha.label : windows[0]?.alpha.label ?? "S&P 500"}
          </h3>
          {alpha?.available && (
            <p
              className={
                isMarketing
                  ? "mt-1 text-xs leading-relaxed text-[var(--caf-mute)] sm:text-sm"
                  : "mt-0.5 text-xs text-zinc-400"
              }
            >
              <span className="sm:hidden">{dateBits[0]}</span>
              <span className="hidden sm:inline">{dateBits.join(" · ")}</span>
            </p>
          )}
        </div>
        <div className={tabWrap} role="tablist" aria-label="Performance window">
          {windows.map((w) => {
            const disabled = !w.alpha.available;
            return (
              <button
                key={w.id}
                type="button"
                role="tab"
                aria-selected={w.id === activeId}
                disabled={disabled}
                title={disabled && !w.alpha.available ? w.alpha.reason : undefined}
                className={
                  tabBtn(w.id === activeId) +
                  (disabled ? " cursor-not-allowed opacity-40" : "")
                }
                onClick={() => setActiveId(w.id)}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {alpha?.available ? (
        <div key={activeId} className="caf-window-swap">
          <div
            className={
              isMarketing
                ? "mb-6 grid grid-cols-1 gap-4 border-t border-[var(--caf-mist)] pt-6 sm:grid-cols-3"
                : "mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
            }
          >
            <Stat
              label="Fund return"
              value={formatSignedPercent(alpha.fundReturn)}
              tone={alpha.fundReturn >= 0 ? "pos" : "neg"}
              marketing={isMarketing}
            />
            <Stat
              label={alpha.label}
              value={formatSignedPercent(alpha.benchmarkReturn)}
              tone="mute"
              marketing={isMarketing}
            />
            <Stat
              label="Alpha"
              value={formatSignedPercent(alpha.alpha)}
              tone={alpha.alpha >= 0 ? "pos" : "neg"}
              marketing={isMarketing}
            />
          </div>
          <ComparisonChart
            series={alpha.series}
            benchmarkLabel={alpha.label}
            primaryLabel="Alpha Fund"
            height={height}
          />
          <p
            className={
              isMarketing
                ? "mt-3 text-sm leading-relaxed text-[var(--caf-mute)]"
                : "mt-2 text-xs text-zinc-400"
            }
          >
            Time-weighted per-unit (NAV) return vs the {alpha.label} ({BENCHMARK_DETAIL}) over
            the same calendar window — the fair comparison to an index. This is not the %
            change in total dollars in the account; deposits raise that balance without being
            investment performance. NAV is carried from the last mark on or before the start
            date. Past performance does not guarantee future results.
          </p>
        </div>
      ) : (
        <div
          className={
            isMarketing
              ? "flex h-40 items-center justify-center text-center text-sm text-[var(--caf-mute)]"
              : "flex h-24 items-center justify-center text-center text-sm text-zinc-400"
          }
        >
          {alpha && !alpha.available
            ? alpha.reason
            : "Benchmark comparison is not available yet."}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  marketing,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg" | "mute";
  marketing: boolean;
}) {
  const color = marketing
    ? tone === "mute"
      ? "text-[var(--caf-ink)]"
      : tone === "pos"
        ? "text-[var(--caf-signal-deep)]"
        : "text-red-700"
    : tone === "mute"
      ? "text-zinc-500"
      : tone === "pos"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div>
      <div
        className={
          marketing
            ? "text-sm text-[var(--caf-mute)]"
            : "text-xs font-medium uppercase tracking-wide text-zinc-500"
        }
      >
        {label}
      </div>
      <div
        className={
          (marketing
            ? "mt-1 font-display text-xl font-semibold tabular-nums sm:text-3xl "
            : "mt-0.5 text-lg font-semibold tabular-nums sm:text-xl ") + color
        }
      >
        {value}
      </div>
    </div>
  );
}
