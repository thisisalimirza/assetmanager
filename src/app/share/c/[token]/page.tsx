import { notFound } from "next/navigation";
import { getClientByShareToken, getClientStatementData } from "@/lib/portfolio";
import { getClientAlpha } from "@/lib/analytics";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { ComparisonChart } from "@/app/components/ComparisonChart";
import { PrintButton } from "@/app/components/PrintButton";
import {
  AllTimeStatementCard,
  PeriodStatementCard,
  RangeChips,
  isoDate,
  resolvePeriod,
} from "@/app/components/StatementView";

export const dynamic = "force-dynamic";

/**
 * A client's private, read-only portal, reached via their secret share link.
 * Shows only their own money: balance, what they put in, what it earned, and
 * how that compares to just holding the index — plus the same printable
 * statement the advisor sees. No other clients, no fund totals.
 */
export default async function ClientSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { token } = await params;
  const { from, to } = await searchParams;

  const client = await getClientByShareToken(token);
  if (!client) notFound();

  const [data, alpha] = await Promise.all([
    getClientStatementData(client.id),
    getClientAlpha(client.id),
  ]);
  if (!data) notFound();
  const { summary, asOf } = data;

  const generatedOn = isoDate(new Date());
  const period = await resolvePeriod(client.id, from, to);
  const basePath = `/share/c/${token}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}&apos;s portfolio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {asOf ? `As of ${formatDate(asOf)}` : "No valuation recorded yet"}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:hidden">
        <StatCard label="Current value" value={formatCurrency(summary.currentValue)} />
        <StatCard label="Invested (net)" value={formatCurrency(summary.costBasis)} />
        <StatCard
          label="Profit / loss"
          value={formatSignedCurrency(summary.profit)}
          tone={summary.profit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Return"
          value={formatSignedPercent(summary.returnPct)}
          tone={summary.returnPct >= 0 ? "positive" : "negative"}
        />
      </div>

      {alpha.available && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 print:hidden">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-500">
              Your money vs. {alpha.label}
            </h2>
            <span className="text-xs text-zinc-400">since {formatDate(alpha.anchorDate)}</span>
          </div>
          <ComparisonChart
            series={alpha.series}
            benchmarkLabel={alpha.label}
            primaryLabel="Your account"
            mode="currency"
          />
          <p className="mt-2 text-xs text-zinc-400">
            What your actual deposits and withdrawals earned here, vs. what those same dollars, on
            those same dates, would be worth if they had simply bought the {alpha.label}.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <RangeChips basePath={basePath} period={period} />
        {period ? (
          <PeriodStatementCard period={period} generatedOn={generatedOn} />
        ) : (
          <AllTimeStatementCard id={client.id} generatedOn={generatedOn} />
        )}
      </div>
    </div>
  );
}
