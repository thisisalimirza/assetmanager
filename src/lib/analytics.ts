import { getFundSummary, listValuations, listTransactionsForClient, getClientValueSeries } from "./portfolio";
import {
  BENCHMARK_SYMBOL,
  BENCHMARK_LABEL,
  ensureBenchmarkData,
  benchmarkCloseOnOrBefore,
} from "./benchmark";

export type AlphaPoint = { date: string; fund: number; benchmark: number | null };

export type Alpha =
  | { available: false; reason: string; label: string }
  | {
      available: true;
      label: string;
      anchorDate: string;
      asOf: string;
      fundReturn: number;
      benchmarkReturn: number;
      alpha: number; // fundReturn − benchmarkReturn (active return)
      series: AlphaPoint[]; // growth of $1 from the anchor, both rebased to 1
    };

/**
 * Active return vs the benchmark: the fund's time-weighted (per-unit) return
 * minus the benchmark's return over the same window. Anchored at the first
 * *real* valuation, because before that the fund's NAV is a flat placeholder
 * (no interim marks) and comparing it to the moving market would be misleading.
 */
export async function getAlpha(): Promise<Alpha> {
  const [fund, valuations] = await Promise.all([getFundSummary(), listValuations()]);

  if (valuations.length === 0 || fund.totalUnits <= 0) {
    return { available: false, reason: "Record a portfolio valuation to compare against the market.", label: BENCHMARK_LABEL };
  }

  // Earliest valuation = first real mark = our anchor.
  const anchorDate = valuations.reduce((min, v) => (v.date < min ? v.date : min), valuations[0].date);
  const asOf = fund.asOf ?? anchorDate;

  const anchorPoint = fund.navSeries.find((p) => p.date >= anchorDate);
  if (!anchorPoint || anchorPoint.navPerUnit <= 0) {
    return { available: false, reason: "Not enough valuation history yet.", label: BENCHMARK_LABEL };
  }
  const anchorNav = anchorPoint.navPerUnit;
  const fundReturn = fund.navPerUnit / anchorNav - 1;

  await ensureBenchmarkData(BENCHMARK_SYMBOL, anchorDate);
  const benchAnchor = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, anchorDate);
  const benchNow = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, asOf);

  if (benchAnchor == null || benchNow == null || benchAnchor <= 0) {
    return {
      available: false,
      reason: "Benchmark data is temporarily unavailable — it will populate on the next refresh.",
      label: BENCHMARK_LABEL,
    };
  }
  const benchmarkReturn = benchNow / benchAnchor - 1;

  // Growth-of-$1 series from the anchor onward.
  const points = fund.navSeries.filter((p) => p.date >= anchorDate);
  const series: AlphaPoint[] = [];
  for (const p of points) {
    const bClose = await benchmarkCloseOnOrBefore(BENCHMARK_SYMBOL, p.date);
    series.push({
      date: p.date,
      fund: p.navPerUnit / anchorNav,
      benchmark: bClose != null ? bClose / benchAnchor : null,
    });
  }

  return {
    available: true,
    label: BENCHMARK_LABEL,
    anchorDate,
    asOf,
    fundReturn,
    benchmarkReturn,
    alpha: fundReturn - benchmarkReturn,
    series,
  };
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
