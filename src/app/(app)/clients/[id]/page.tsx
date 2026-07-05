import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClient,
  getFundSummary,
  listClients,
  listTransactionsForClient,
} from "@/lib/portfolio";
import { getClientAlpha } from "@/lib/analytics";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { StatCard } from "@/app/components/StatCard";
import { ClientModal } from "@/app/components/ClientModal";
import { TransactionModal } from "@/app/components/TransactionModal";
import { ComparisonChart } from "@/app/components/ComparisonChart";
import { ShareLinkCard } from "@/app/components/ShareLinkCard";
import { createClientShareLink, revokeClientShareLink } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const [fund, client, clients, txns, alpha] = await Promise.all([
    getFundSummary(),
    getClient(id),
    listClients(),
    listTransactionsForClient(id),
    getClientAlpha(id),
  ]);
  if (!client) notFound();

  const s = fund.clients.find((c) => c.id === id);
  if (!s) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/clients" className="text-sm text-zinc-500 hover:underline">
          ← Clients
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ClientModal client={client} label="Edit" variant="secondary" />
          <Link
            href={`/clients/${id}/statement`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            View statement
          </Link>
          <a
            href={`/api/export/client/${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Export CSV
          </a>
          <TransactionModal
            label="+ Record transaction"
            clients={clients}
            defaultClientId={id}
            latestValue={fund.aum}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current value" value={formatCurrency(s.currentValue)} hint={`${formatPercent(s.ownership)} of fund`} />
        <StatCard label="Invested (net)" value={formatCurrency(s.costBasis)} />
        <StatCard
          label="Profit / loss"
          value={formatSignedCurrency(s.profit)}
          tone={s.profit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Return"
          value={formatSignedPercent(s.returnPct)}
          tone={s.returnPct >= 0 ? "positive" : "negative"}
        />
      </div>

      <ShareLinkCard
        title={`${client.name}'s private link`}
        description="A read-only page with their balance, returns, and printable statement — no password needed. Send it to them directly."
        path={client.shareToken ? `/share/c/${client.shareToken}` : null}
        clientId={client.id}
        createAction={createClientShareLink}
        revokeAction={revokeClientShareLink}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-500">{client.name}&apos;s performance vs {alpha.label}</h2>
          {alpha.available && (
            <span className="text-xs text-zinc-400">since {formatDate(alpha.anchorDate)}</span>
          )}
        </div>
        {alpha.available ? (
          <>
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">With this fund</div>
                <div className="mt-0.5 text-xl font-semibold tabular-nums">{formatCurrency(alpha.actualValue)}</div>
                <div
                  className={
                    "text-xs tabular-nums " +
                    (alpha.actualReturn >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                  }
                >
                  {formatSignedPercent(alpha.actualReturn)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">If in {alpha.label} instead</div>
                <div className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-500">
                  {formatCurrency(alpha.hypotheticalValue)}
                </div>
                <div className="text-xs tabular-nums text-zinc-400">{formatSignedPercent(alpha.benchmarkReturn)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Difference</div>
                <div
                  className={
                    "mt-0.5 text-xl font-semibold tabular-nums " +
                    (alpha.alphaDollars >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                  }
                >
                  {formatSignedCurrency(alpha.alphaDollars)}
                </div>
                <div
                  className={
                    "text-xs tabular-nums " +
                    (alpha.alpha >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                  }
                >
                  {formatSignedPercent(alpha.alpha)}
                </div>
              </div>
            </div>
            <ComparisonChart
              series={alpha.series}
              benchmarkLabel={alpha.label}
              primaryLabel="With this fund"
              mode="currency"
            />
            <p className="mt-2 text-xs text-zinc-400">
              Compares what {client.name}&apos;s actual deposits/withdrawals earned in this fund vs.
              what those same dollars, on those same dates, would have earned simply buying the{" "}
              {alpha.label}.
            </p>
          </>
        ) : (
          <div className="flex h-24 items-center justify-center text-center text-sm text-zinc-400">
            {alpha.reason}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Transaction history</h2>
        {txns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                  <th className="px-4 py-2.5 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900">
                {txns.map((t) => (
                  <tr key={t.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2.5 tabular-nums">{formatDate(t.date)}</td>
                    <td className="px-4 py-2.5">{t.amount < 0 ? "Withdrawal" : "Deposit"}</td>
                    <td
                      className={
                        "px-4 py-2.5 text-right tabular-nums " +
                        (t.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")
                      }
                    >
                      {formatSignedCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">{t.note ?? ""}</td>
                    <td className="px-4 py-2.5 text-right">
                      <TransactionModal
                        label="Edit"
                        variant="ghost"
                        clients={clients}
                        transaction={t}
                        latestValue={fund.aum}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
