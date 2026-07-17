import {
  getFundSummary,
  getPublicShowDollars,
  listActivities,
} from "@/lib/portfolio";
import { getAlpha, getAlphaWindows } from "@/lib/analytics";
import { classifyActivity } from "@/lib/robinhood";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { WindowedPerformance } from "@/app/components/WindowedPerformance";
import { ActivityTable } from "@/app/components/ActivityTable";

/**
 * Public / prospect-facing track record: performance vs the market and the
 * brokerage activity ledger. Never shows client names. Dollar detail follows
 * the Settings "Show dollar amounts on the public link" toggle.
 */
export async function FundTrackRecord() {
  const [fund, alpha, windows, activities, showDollars] = await Promise.all([
    getFundSummary(),
    getAlpha(),
    getAlphaWindows(),
    listActivities(),
    getPublicShowDollars(),
  ]);
  const growthOf10k = alpha.available ? 10_000 * (1 + alpha.fundReturn) : null;
  const anyBenchmark = windows.some((w) => w.alpha.available);

  const publicActivities = showDollars
    ? activities
    : activities
        .filter((row) => {
          const group = classifyActivity(row).group;
          return group === "trade" || group === "dividend";
        })
        .map((row) => ({
          ...row,
          quantity: null,
          amount: null,
          description: /dividend reinvestment/i.test(row.description)
            ? "Dividend Reinvestment"
            : "",
        }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fund performance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {fund.asOf ? `As of ${formatDate(fund.asOf)}` : "No valuation recorded yet"}
          {" · "}Public track record of the shared portfolio — no member names
        </p>
      </div>

      {showDollars && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Assets under management"
            value={formatCurrency(fund.aum)}
            hint={fund.asOf ? `as of ${formatDate(fund.asOf)}` : undefined}
          />
          <StatCard
            label="Total profit / loss"
            value={formatSignedCurrency(fund.totalProfit)}
            tone={fund.totalProfit >= 0 ? "positive" : "negative"}
            hint={`on ${formatCurrency(fund.totalCostBasis)} invested`}
          />
        </div>
      )}

      {alpha.available && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Fund performance"
            value={formatSignedPercent(alpha.fundReturn)}
            tone={alpha.fundReturn >= 0 ? "positive" : "negative"}
            hint={`since first audited valuation — ${formatDate(alpha.anchorDate)}`}
          />
          <StatCard
            label={alpha.label}
            value={formatSignedPercent(alpha.benchmarkReturn)}
            hint="same period"
          />
          <StatCard
            label="Alpha"
            value={formatSignedPercent(alpha.alpha)}
            tone={alpha.alpha >= 0 ? "positive" : "negative"}
            hint={`vs ${alpha.label}`}
          />
          <StatCard
            label="$10,000 would be"
            value={growthOf10k != null ? formatCurrency(growthOf10k) : "—"}
            hint="hypothetical, same period"
          />
        </div>
      )}

      {anyBenchmark ? (
        <WindowedPerformance windows={windows} height={260} variant="app" />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <StatCard
            label="Fund performance (time-weighted)"
            value={formatSignedPercent(fund.twr)}
            tone={fund.twr >= 0 ? "positive" : "negative"}
            hint="since inception"
          />
          <p className="mt-3 text-sm text-zinc-400">
            {alpha.available === false ? alpha.reason : "Benchmark comparison unavailable."}
          </p>
        </div>
      )}

      {publicActivities.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-500">Activity</h2>
            {!showDollars && (
              <span className="text-xs text-zinc-400">
                Quantities and dollar amounts are omitted on this public view.
              </span>
            )}
          </div>
          <ActivityTable rows={publicActivities} variant={showDollars ? "full" : "public"} />
        </div>
      )}

      <div className="rounded-xl bg-zinc-100 p-4 text-xs leading-relaxed text-zinc-500 dark:bg-zinc-900">
        <p className="mb-1 font-medium text-zinc-600 dark:text-zinc-400">How this is calculated</p>
        The fund uses unit (NAV) accounting, like a mutual fund: performance is time-weighted, so
        it reflects pure investment results regardless of when money moved in or out. Use the
        YTD / 3M / 6M / 1Y / All filters to change the comparison window against the S&amp;P 500.
        Windows that begin before the first audited valuation are measured from that first mark
        instead. The $10,000 figure is a hypothetical illustration over the full audited period,
        not an actual account. Past performance does not guarantee future results.
      </div>
    </div>
  );
}
