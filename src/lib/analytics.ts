import { getFundSummary, listValuations } from "./portfolio";
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
