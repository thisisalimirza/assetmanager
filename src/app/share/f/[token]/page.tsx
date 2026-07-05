import { notFound } from "next/navigation";
import {
  getFundShareToken,
  getFundSummary,
  getPublicShowDollars,
  listActivities,
} from "@/lib/portfolio";
import { getAlpha } from "@/lib/analytics";
import { classifyActivity } from "@/lib/robinhood";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { ComparisonChart } from "@/app/components/ComparisonChart";
import { ActivityTable } from "@/app/components/ActivityTable";

export const dynamic = "force-dynamic";

/**
 * The prospect-facing fund overview, reached via the fund's secret share link.
 * Deliberately shows track record only — time-weighted return, the benchmark
 * comparison, and a growth-of-$10k illustration. No AUM, no client names, no
 * real dollar amounts: enough for someone deciding whether to invest, nothing
 * that exposes anyone's personal finances.
 */
export default async function FundSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = await getFundShareToken();
  if (!expected || token !== expected) notFound();

  const [fund, alpha, activities, showDollars] = await Promise.all([
    getFundSummary(),
    getAlpha(),
    listActivities(),
    getPublicShowDollars(),
  ]);
  const growthOf10k = alpha.available ? 10_000 * (1 + alpha.fundReturn) : null;

  // Detail level is the owner's choice (Settings → "Show dollar amounts on
  // the public link"). Full transparency shows AUM, profit, and the complete
  // ledger; the sanitized mode shows trades/dividends only, with quantities,
  // amounts, and descriptions hidden (they reveal the fund's size) — cash
  // transfers are clients' personal money movements and are hidden too.
  // In sanitized mode the private fields are stripped here, server-side — not
  // just hidden as table columns — because props passed to a client component
  // are serialized into the page source verbatim.
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
          // Keep only the classification marker; full descriptions embed
          // share counts.
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

      {alpha.available ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Fund performance"
              value={formatSignedPercent(alpha.fundReturn)}
              tone={alpha.fundReturn >= 0 ? "positive" : "negative"}
              hint={`since ${formatDate(alpha.anchorDate)}`}
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

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-zinc-500">Performance vs {alpha.label}</h2>
              <span className="text-xs text-zinc-400">since {formatDate(alpha.anchorDate)}</span>
            </div>
            <ComparisonChart series={alpha.series} benchmarkLabel={alpha.label} primaryLabel="This fund" />
            <p className="mt-2 text-xs text-zinc-400">
              Time-weighted return vs the {alpha.label} over the same period. Alpha is how much the
              fund beat (or trailed) simply holding the index.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <StatCard
            label="Fund performance (time-weighted)"
            value={formatSignedPercent(fund.twr)}
            tone={fund.twr >= 0 ? "positive" : "negative"}
            hint="since inception"
          />
          <p className="mt-3 text-sm text-zinc-400">{alpha.reason}</p>
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
        it reflects pure investment results regardless of when money moved in or out. The
        $10,000 figure is a hypothetical illustration over the same period, not an actual account.
        Past performance does not guarantee future results.
      </div>
    </div>
  );
}
