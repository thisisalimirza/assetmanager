import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClient,
  getFundSummary,
  listClients,
  listTransactionsForClient,
} from "@/lib/portfolio";
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

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const [fund, client, clients, txns] = await Promise.all([
    getFundSummary(),
    getClient(id),
    listClients(),
    listTransactionsForClient(id),
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
