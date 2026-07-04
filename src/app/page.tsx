import Link from "next/link";
import { getPortfolioSummary, listSnapshots } from "@/lib/portfolio";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { StatCard } from "./components/StatCard";
import { ValueChart } from "./components/ValueChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, snapshots] = await Promise.all([getPortfolioSummary(), listSnapshots()]);

  const chartPoints = [...snapshots]
    .reverse()
    .map((s) => ({ date: s.date, value: s.totalValue }));

  const hasData = summary.totalCostBasis !== 0 || summary.contributors.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {summary.latestSnapshotDate
            ? `Current value as of ${formatDate(summary.latestSnapshotDate)}`
            : "No portfolio value recorded yet — add a snapshot to see profit split."}
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Get started by adding{" "}
          <Link href="/contributors" className="underline">
            contributors
          </Link>{" "}
          and their{" "}
          <Link href="/contributions" className="underline">
            contributions
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Cost Basis" value={formatCurrency(summary.totalCostBasis)} />
            <StatCard label="Current Value" value={formatCurrency(summary.currentValue)} />
            <StatCard
              label="Total Profit/Loss"
              value={formatCurrency(summary.totalProfit)}
              tone={summary.totalProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Growth Rate"
              value={formatPercent(summary.growthRate)}
              tone={summary.growthRate >= 0 ? "positive" : "negative"}
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-medium text-zinc-500">Portfolio value over time</h2>
            <ValueChart points={chartPoints} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-zinc-500">Contributors</h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Cost Basis</th>
                    <th className="px-4 py-2 font-medium">Share</th>
                    <th className="px-4 py-2 font-medium">Profit</th>
                    <th className="px-4 py-2 font-medium">Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.contributors.map((c) => (
                    <tr key={c.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2">{formatCurrency(c.costBasis)}</td>
                      <td className="px-4 py-2">{formatPercent(c.share)}</td>
                      <td
                        className={
                          c.profitAmount >= 0
                            ? "px-4 py-2 text-emerald-600 dark:text-emerald-400"
                            : "px-4 py-2 text-red-600 dark:text-red-400"
                        }
                      >
                        {formatCurrency(c.profitAmount)}
                      </td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(c.currentValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
