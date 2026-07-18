import Link from "next/link";
import { getFundSummary, listClients } from "@/lib/portfolio";
import { getAlpha, getAlphaWindows } from "@/lib/analytics";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { PerformancePanel } from "@/app/components/PerformancePanel";
import { PageHeader, SectionHeader } from "@/app/components/PageHeader";
import { TransactionModal } from "@/app/components/TransactionModal";
import { ValuationModal } from "@/app/components/ValuationModal";
import { ClientModal } from "@/app/components/ClientModal";

export const dynamic = "force-dynamic";

const STALE_DAYS = 14;

function daysAgo(dateIso: string): number {
  return Math.floor((Date.now() - Date.parse(`${dateIso.slice(0, 10)}T00:00:00`)) / 86_400_000);
}

export default async function DashboardPage() {
  const [fund, clients, alpha, windows] = await Promise.all([
    getFundSummary(),
    listClients(),
    getAlpha(),
    getAlphaWindows(),
  ]);
  const chartPoints = fund.navSeries
    .filter((p) => !fund.auditedSince || p.date >= fund.auditedSince)
    .map((p) => ({ date: p.date, value: p.fundValue }));
  const inception = fund.auditedSince ?? fund.navSeries[0]?.date ?? null;
  const performance = fund.auditedTwr ?? fund.twr;
  const rankedClients = [...fund.clients].sort((a, b) => b.currentValue - a.currentValue);
  const staleDays = fund.asOf ? daysAgo(fund.asOf) : null;
  const isStale = staleDays != null && staleDays > STALE_DAYS;

  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
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
      <PageHeader
        title="Dashboard"
        subtitle={
          fund.asOf
            ? `As of ${formatDate(fund.asOf)}${staleDays != null ? ` · ${staleDays === 0 ? "today" : `${staleDays}d ago`}` : ""}`
            : "No valuation recorded yet"
        }
        actions={
          <>
            <ValuationModal label="Add valuation" variant="secondary" latestValue={fund.aum} />
            <TransactionModal label="+ Record transaction" clients={clients} latestValue={fund.aum} />
          </>
        }
      />

      {isStale && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <span>
            Your last valuation was <strong>{staleDays} days ago</strong>. Client balances are
            frozen at that value until you record a fresh one.
          </span>
          <ValuationModal label="Update value" variant="secondary" latestValue={fund.aum} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assets under mgmt" value={formatCurrency(fund.aum)} hint={`${clients.length} client${clients.length === 1 ? "" : "s"}`} />
        <StatCard
          label="Total profit / loss"
          value={formatSignedCurrency(fund.totalProfit)}
          tone={fund.totalProfit >= 0 ? "positive" : "negative"}
          hint={`on ${formatCurrency(fund.totalCostBasis)} invested`}
        />
        <StatCard
          label="NAV return (audited)"
          value={formatSignedPercent(performance)}
          tone={performance >= 0 ? "positive" : "negative"}
          hint={`${inception ? `from ${formatDate(inception)} · ` : ""}${formatSignedPercent(fund.simpleReturn)} money-weighted`}
        />
        <StatCard label="NAV per unit" value={formatCurrency(fund.navPerUnit)} hint={`${fund.totalUnits.toFixed(2)} units`} />
      </div>

      <div>
        <SectionHeader>Performance</SectionHeader>
        <PerformancePanel points={chartPoints} alpha={alpha} windows={windows} />
      </div>

      <div>
        <SectionHeader
          right={
            <Link href="/app/clients" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
              Manage clients →
            </Link>
          }
        >
          Clients
        </SectionHeader>
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
                    <Link href={`/app/clients/${c.id}`} className="hover:underline">
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
