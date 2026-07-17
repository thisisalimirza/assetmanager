"use client";

import { useState } from "react";
import type { AlphaWindow, AlphaWindowId } from "@/lib/analytics";
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
}: {
  windows: AlphaWindow[];
  height?: number;
  variant?: "marketing" | "app";
  /** When false, skip the outer card chrome (for nesting inside another panel). */
  framed?: boolean;
}) {
  const available = windows.filter((w) => w.alpha.available);
  const defaultId: AlphaWindowId =
    available.find((w) => w.id === "ytd")?.id ??
    available.find((w) => w.id === "all")?.id ??
    available[0]?.id ??
    "all";

  const [activeId, setActiveId] = useState<AlphaWindowId>(defaultId);
  const active = windows.find((w) => w.id === activeId) ?? windows[windows.length - 1];
  const alpha = active?.alpha;

  const isMarketing = variant === "marketing";
  const tabWrap = isMarketing
    ? "flex flex-wrap gap-1 border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-1"
    : "flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-950";
  const tabBtn = (on: boolean) =>
    isMarketing
      ? "px-3 py-1.5 text-sm font-medium transition-colors " +
        (on
          ? "bg-[var(--caf-ink)] text-[var(--caf-paper)]"
          : "text-[var(--caf-mute)] hover:text-[var(--caf-ink)]")
      : "rounded-md px-3 py-1 text-sm transition-colors " +
        (on
          ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100");

  if (!windows.length) return null;

  const shell = !framed
    ? "p-0"
    : isMarketing
      ? "border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-5 sm:p-8"
      : "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className={shell}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            className={
              isMarketing
                ? "font-display text-lg font-semibold"
                : "text-sm font-medium text-zinc-500"
            }
          >
            Performance vs {alpha?.available ? alpha.label : windows[0]?.alpha.label ?? "S&P 500"}
          </h3>
          {alpha?.available && (
            <p
              className={
                isMarketing ? "mt-1 text-sm text-[var(--caf-mute)]" : "mt-0.5 text-xs text-zinc-400"
              }
            >
              {formatDate(alpha.anchorDate)} → {formatDate(alpha.asOf)}
              {active.requestedStart &&
              active.requestedStart < alpha.anchorDate &&
              active.id !== "all"
                ? " · from first audited mark"
                : ""}
              {alpha.fundMarkDate < alpha.anchorDate
                ? ` · fund NAV carried from ${formatDate(alpha.fundMarkDate)}`
                : ""}
              {alpha.benchmarkAsOfDate < alpha.asOf
                ? ` · ${alpha.label} as of ${formatDate(alpha.benchmarkAsOfDate)}`
                : ""}
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
        <>
          <div
            className={
              isMarketing
                ? "mb-6 grid grid-cols-3 gap-4 border-t border-[var(--caf-mist)] pt-6"
                : "mb-4 grid grid-cols-3 gap-4"
            }
          >
            <Stat
              label="Fund NAV"
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
            primaryLabel="Capital Alpha"
            height={height}
          />
          <p
            className={
              isMarketing
                ? "mt-3 text-sm leading-relaxed text-[var(--caf-mute)]"
                : "mt-2 text-xs text-zinc-400"
            }
          >
            Time-weighted per-unit (NAV) return vs the {alpha.label} over the same calendar
            window — the fair comparison to an index. This is not the % change in total
            dollars in the account; deposits and withdrawals move that balance without being
            investment performance. NAV is carried from the last mark on or before the start
            date. Past performance does not guarantee future results.
          </p>
        </>
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
            ? "mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl "
            : "mt-0.5 text-xl font-semibold tabular-nums ") + color
        }
      >
        {value}
      </div>
    </div>
  );
}
