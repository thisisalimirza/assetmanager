import { getFundSummary, listValuations, listTransactionsForClient, getClientValueSeries } from "./portfolio";
import {
  BENCHMARK_SYMBOL,
  BENCHMARK_LABEL,
  ensureBenchmarkData,
  benchmarkCloseOnOrBefore,
  benchmarkPriceOnOrBefore,
} from "./benchmark";

export type AlphaPoint = { date: string; fund: number; benchmark: number | null };

export type Alpha =
  | { available: false; reason: string; label: string }
  | {
      available: true;
      label: string;
      /** Calendar / requested window start actually used for this comparison. */
      anchorDate: string;
      asOf: string;
      /** Date of the fund NAV mark carried into the window (≤ anchorDate). */
      fundMarkDate: string;
      /** Date of the benchmark bar used at the window start. */
      benchmarkAnchorDate: string;
      /** Date of the benchmark bar used at as-of. */
      benchmarkAsOfDate: string;
      fundReturn: number;
      benchmarkReturn: number;
      alpha: number; // fundReturn − benchmarkReturn (active return)
      series: AlphaPoint[]; // growth of $1 from the anchor, both rebased to 1
    };

export type AlphaWindowId = "ytd" | "3m" | "6m" | "1y" | "all";

export type AlphaWindow = {
  id: AlphaWindowId;
  label: string;
  /** Requested window start before clamping to first real valuation. */
  requestedStart: string;
  alpha: Alpha;
};

/**
 * Active return vs the benchmark from the first *real* valuation onward.
 * Earlier NAV history is a flat placeholder (no interim marks), so comparing
 * it to the moving market would be misleading.
 */
export async function getAlpha(): Promise<Alpha> {
  const [fund, valuations] = await Promise.all([getFundSummary(), listValuations()]);
  if (valuations.length === 0 || fund.totalUnits <= 0) {
    return {
      available: false,
      reason: "Record a portfolio valuation to compare against the market.",
      label: BENCHMARK_LABEL,
    };
  }
  const firstValuation = valuations.reduce(
    (min, v) => (v.date < min ? v.date : min),
    valuations[0].date,
  );
  return getAlphaSince(firstValuation);
}

/**
 * Time-weighted fund return vs the benchmark from `startDate` through the
 * latest valuation.
 *
 * Fund NAV is carried forward from the last mark on or before the window
 * start (standard for irregular valuations). The S&P side uses the same
 * calendar window start/end so YTD / 3M / etc. mean the same period on both
 * sides — not "fund from its last mark date, market from the calendar date".
 */
export async function getAlphaSince(startDate: string): Promise<Alpha> {
  const [fund, valuations] = await Promise.all([getFundSummary(), listValuations()]);

  if (valuations.length === 0 || fund.totalUnits <= 0) {
    return {
      available: false,
      reason: "Record a portfolio valuation to compare against the market.",
      label: BENCHMARK_LABEL,
    };
  }

  const firstValuation = valuations.reduce(
    (min, v) => (v.date < min ? v.date : min),
    valuations[0].date,
  );
  const asOf = fund.asOf ?? firstValuation;
  // Never start before the first real mark — earlier NAV is a flat placeholder.
  const anchorDate = startDate < firstValuation ? firstValuation : startDate;

  if (anchorDate >= asOf) {
    return {
      available: false,
      reason: "Not enough history in this window yet.",
      label: BENCHMARK_LABEL,
    };
  }

  // Last fund mark on or before the window start (carry-forward into the window).
  const anchorPoint = navOnOrBefore(fund.navSeries, anchorDate);
  if (!anchorPoint || anchorPoint.navPerUnit <= 0) {
    return { available: false, reason: "Not enough valuation history yet.", label: BENCHMARK_LABEL };
  }
  // Refuse to invent a mark after the window start (navOnOrBefore may fall forward
  // only when the series begins after the requested date — that is not a valid
  // start-of-window carry).
  if (anchorPoint.date > anchorDate) {
    return {
      available: false,
      reason: "Not enough valuation history in this window yet.",
      label: BENCHMARK_LABEL,
    };
  }
  const anchorNav = anchorPoint.navPerUnit;
  const fundReturn = fund.navPerUnit / anchorNav - 1;

  await ensureBenchmarkData(BENCHMARK_SYMBOL, anchorDate);
  const benchAnchor = await benchmarkPriceOnOrBefore(BENCHMARK_SYMBOL, anchorDate);
  const benchNow = await benchmarkPriceOnOrBefore(BENCHMARK_SYMBOL, asOf);

  if (benchAnchor == null || benchNow == null || benchAnchor.close <= 0) {
    return {
      available: false,
      reason: "Benchmark data is temporarily unavailable — it will populate on the next refresh.",
      label: BENCHMARK_LABEL,
    };
  }
  const benchmarkReturn = benchNow.close / benchAnchor.close - 1;

  // Growth-of-$1 series from the window start onward (rebased).
  const points = fund.navSeries.filter((p) => p.date >= anchorDate);
  // Ensure the series starts at the window start even if no NAV lands exactly on it.
  if (points.length === 0 || points[0].date > anchorDate) {
    points.unshift({ date: anchorDate, navPerUnit: anchorNav, fundValue: anchorPoint.fundValue });
  }

  const series: AlphaPoint[] = [];
  for (const p of points) {
    const bClose = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, p.date);
    series.push({
      date: p.date,
      fund: p.navPerUnit / anchorNav,
      benchmark: bClose != null ? bClose / benchAnchor.close : null,
    });
  }

  if (series.length < 2) {
    return {
      available: false,
      reason: "Not enough history in this window yet.",
      label: BENCHMARK_LABEL,
    };
  }

  return {
    available: true,
    label: BENCHMARK_LABEL,
    anchorDate,
    asOf,
    fundMarkDate: anchorPoint.date,
    benchmarkAnchorDate: benchAnchor.date,
    benchmarkAsOfDate: benchNow.date,
    fundReturn,
    benchmarkReturn,
    alpha: fundReturn - benchmarkReturn,
    series,
  };
}

/** YTD / 3M / 6M / 1Y / all-time windows for filterable public charts. */
export async function getAlphaWindows(): Promise<AlphaWindow[]> {
  const [fund, valuations] = await Promise.all([getFundSummary(), listValuations()]);
  if (valuations.length === 0 || !fund.asOf) {
    const empty: Alpha = {
      available: false,
      reason: "Record a portfolio valuation to compare against the market.",
      label: BENCHMARK_LABEL,
    };
    return WINDOW_DEFS.map((w) => ({
      id: w.id,
      label: w.label,
      requestedStart: "",
      alpha: empty,
    }));
  }

  const asOf = fund.asOf;
  const firstValuation = valuations.reduce(
    (min, v) => (v.date < min ? v.date : min),
    valuations[0].date,
  );

  const starts: Record<AlphaWindowId, string> = {
    ytd: `${asOf.slice(0, 4)}-01-01`,
    "3m": shiftMonths(asOf, -3),
    "6m": shiftMonths(asOf, -6),
    "1y": shiftMonths(asOf, -12),
    all: firstValuation,
  };

  const windows: AlphaWindow[] = [];
  for (const def of WINDOW_DEFS) {
    const requestedStart = starts[def.id];
    // Fixed-length windows must actually cover the full length. Previously we
    // silently clamped 1Y back to the first audited mark, so 1Y == All.
    if (
      (def.id === "3m" || def.id === "6m" || def.id === "1y") &&
      requestedStart < firstValuation
    ) {
      windows.push({
        id: def.id,
        label: def.label,
        requestedStart,
        alpha: {
          available: false,
          reason: "Not enough audited history for this full window yet.",
          label: BENCHMARK_LABEL,
        },
      });
      continue;
    }
    const alpha = await getAlphaSince(requestedStart);
    windows.push({ id: def.id, label: def.label, requestedStart, alpha });
  }
  return windows;
}

const WINDOW_DEFS: { id: AlphaWindowId; label: string }[] = [
  { id: "ytd", label: "YTD" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "all", label: "All" },
];

function navOnOrBefore(
  series: { date: string; navPerUnit: number; fundValue: number }[],
  date: string,
) {
  let best: (typeof series)[number] | null = null;
  for (const p of series) {
    if (p.date <= date) best = p;
    else break;
  }
  // Fall forward only when callers need *a* mark (e.g. empty prefix). getAlphaSince
  // rejects fall-forward for window starts — carrying a future NAV backward would
  // invent history.
  return best ?? series.find((p) => p.date >= date) ?? null;
}

/** Shift an ISO date by whole months (UTC calendar), keeping YYYY-MM-DD. */
function shiftMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  // Clamp overflow (e.g. Jan 31 → Feb) by using the last day of the target month.
  if (dt.getUTCDate() !== d) {
    dt.setUTCDate(0);
  }
  return dt.toISOString().slice(0, 10);
}

export type ClientAlpha =
  | { available: false; reason: string; label: string }
  | {
      available: true;
      label: string;
      anchorDate: string;
      asOf: string;
      actualValue: number;
      hypotheticalValue: number;
      actualReturn: number;
      benchmarkReturn: number;
      alpha: number; // percentage points
      alphaDollars: number; // actualValue − hypotheticalValue
      series: AlphaPoint[]; // date, fund=actual $, benchmark=hypothetical $
    };

/**
 * A client's own alpha: what if each of their deposits/withdrawals had instead
 * bought/sold the benchmark on that same date, instead of fund units? Both
 * sides use the client's real cash-flow timing and amounts, so it's a fair,
 * personal "did staying with this fund beat just buying the index myself"
 * comparison — distinct from the fund-level alpha, which compares the whole
 * fund's per-unit performance and isn't affected by any client's flows.
 */
export async function getClientAlpha(clientId: number): Promise<ClientAlpha> {
  const [fund, transactions] = await Promise.all([getFundSummary(), listTransactionsForClient(clientId)]);
  const summary = fund.clients.find((c) => c.id === clientId);
  if (!summary) return { available: false, reason: "Client not found.", label: BENCHMARK_LABEL };
  if (transactions.length === 0) {
    return { available: false, reason: "Record a transaction to compare against the market.", label: BENCHMARK_LABEL };
  }
  if (!fund.asOf) {
    return { available: false, reason: "Record a portfolio valuation to compare against the market.", label: BENCHMARK_LABEL };
  }

  const sorted = [...transactions].sort((a, b) => {
    const k = a.date.localeCompare(b.date);
    return k !== 0 ? k : a.id - b.id;
  });
  const anchorDate = sorted[0].date;
  const asOf = fund.asOf;

  await ensureBenchmarkData(BENCHMARK_SYMBOL, anchorDate);

  // Hypothetical: each of the client's own transactions buys/sells the
  // benchmark at that date's close, mirroring exactly how it buys/sells fund
  // units in the real ledger.
  let shares = 0;
  let txIdx = 0;
  const actualSeries = (await getClientValueSeries(clientId)).filter((p) => p.date >= anchorDate);
  if (actualSeries.length === 0) {
    return { available: false, reason: "Not enough history yet.", label: BENCHMARK_LABEL };
  }
  // A brand-new client's first deposit has no NAV history yet (nothing to mark
  // it against), so getClientValueSeries may not have a point exactly on the
  // anchor date. Prepend one: on day zero, before any market movement, both
  // sides are trivially worth exactly what was deposited that day.
  if (actualSeries[0].date > anchorDate) {
    const anchorDeposits = sorted.filter((t) => t.date === anchorDate).reduce((s, t) => s + t.amount, 0);
    actualSeries.unshift({ date: anchorDate, value: anchorDeposits });
  }

  const series: AlphaPoint[] = [];
  for (const p of actualSeries) {
    while (txIdx < sorted.length && sorted[txIdx].date <= p.date) {
      const tx = sorted[txIdx];
      const price = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, tx.date);
      if (price == null || price <= 0) {
        return {
          available: false,
          reason: "Benchmark data is temporarily unavailable — it will populate on the next refresh.",
          label: BENCHMARK_LABEL,
        };
      }
      shares += tx.amount / price;
      txIdx++;
    }
    const bClose = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, p.date);
    series.push({ date: p.date, fund: p.value, benchmark: bClose != null ? shares * bClose : null });
  }

  const actualValue = summary.currentValue;
  const hypotheticalValue = series[series.length - 1].benchmark ?? shares * (await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, asOf) ?? 0);
  const costBasis = summary.costBasis;
  const actualReturn = summary.returnPct;
  const benchmarkReturn = costBasis > 0 ? (hypotheticalValue - costBasis) / costBasis : 0;

  return {
    available: true,
    label: BENCHMARK_LABEL,
    anchorDate,
    asOf,
    actualValue,
    hypotheticalValue,
    actualReturn,
    benchmarkReturn,
    alpha: actualReturn - benchmarkReturn,
    alphaDollars: actualValue - hypotheticalValue,
    series,
  };
}
