import Link from "next/link";
import { getFundSummary, listClients } from "@/lib/portfolio";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { ValueChart } from "@/app/components/ValueChart";
import { TransactionModal } from "@/app/components/TransactionModal";
import { ValuationModal } from "@/app/components/ValuationModal";
import { ClientModal } from "@/app/components/ClientModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [fund, clients] = await Promise.all([getFundSummary(), listClients()]);
  const chartPoints = fund.navSeries.map((p) => ({ date: p.date, value: p.fundValue }));
  const rankedClients = [...fund.clients].sort((a, b) => b.currentValue - a.currentValue);

  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Add your first client to start tracking the fund.
          </p>
          <div className="mt-4 flex justify-center">
            <ClientModal label="+ Add client" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {fund.asOf ? `As of ${formatDate(fund.asOf)}` : "No valuation recorded yet"}
          </p>
        </div>
        <div className="flex gap-2">
          <ValuationModal label="Add valuation" variant="secondary" latestValue={fund.aum} />
          <TransactionModal label="+ Record transaction" clients={clients} latestValue={fund.aum} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assets under mgmt" value={formatCurrency(fund.aum)} hint={`${clients.length} client${clients.length === 1 ? "" : "s"}`} />
        <StatCard
          label="Total profit / loss"
          value={formatSignedCurrency(fund.totalProfit)}
          tone={fund.totalProfit >= 0 ? "positive" : "negative"}
          hint={`on ${formatCurrency(fund.totalCostBasis)} invested`}
        />
        <StatCard
          label="Return (time-weighted)"
          value={formatSignedPercent(fund.twr)}
          tone={fund.twr >= 0 ? "positive" : "negative"}
          hint="since inception"
        />
        <StatCard label="NAV per unit" value={formatCurrency(fund.navPerUnit)} hint={`${fund.totalUnits.toFixed(2)} units`} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Fund value over time</h2>
        <ValueChart points={chartPoints} emptyHint="Record valuations over time to see the trend." />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">Clients</h2>
          <Link href="/clients" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            Manage clients →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 text-right font-medium">Ownership</th>
                <th className="px-4 py-2.5 text-right font-medium">Invested</th>
                <th className="px-4 py-2.5 text-right font-medium">Value</th>
                <th className="px-4 py-2.5 text-right font-medium">Profit / loss</th>
                <th className="px-4 py-2.5 text-right font-medium">Return</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {rankedClients.map((c) => (
                <tr key={c.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPercent(c.ownership)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(c.costBasis)}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatCurrency(c.currentValue)}</td>
                  <td
                    className={
                      "px-4 py-2.5 text-right tabular-nums " +
                      (c.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                    }
                  >
                    {formatSignedCurrency(c.profit)}
                  </td>
                  <td
                    className={
                      "px-4 py-2.5 text-right tabular-nums " +
                      (c.returnPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                    }
                  >
                    {formatSignedPercent(c.returnPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
