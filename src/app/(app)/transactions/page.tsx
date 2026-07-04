import Link from "next/link";
import { getFundSummary, listClients, listTransactions } from "@/lib/portfolio";
import { formatCurrency, formatSignedCurrency, formatDate } from "@/lib/format";
import { TransactionModal } from "@/app/components/TransactionModal";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [fund, clients, txns] = await Promise.all([
    getFundSummary(),
    listClients(),
    listTransactions(),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-zinc-500">All deposits and withdrawals across clients.</p>
        </div>
        {clients.length > 0 && (
          <TransactionModal label="+ Record transaction" clients={clients} latestValue={fund.aum} />
        )}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Add a{" "}
          <Link href="/clients" className="underline">
            client
          </Link>{" "}
          before recording transactions.
        </div>
      ) : txns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No transactions recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right font-medium">Value before</th>
                <th className="px-4 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {txns.map((t) => (
                <tr key={t.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2.5 tabular-nums">{formatDate(t.date)}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/clients/${t.clientId}`} className="font-medium hover:underline">
                      {clientName.get(t.clientId) ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{t.amount < 0 ? "Withdrawal" : "Deposit"}</td>
                  <td
                    className={
                      "px-4 py-2.5 text-right tabular-nums " +
                      (t.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")
                    }
                  >
                    {formatSignedCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                    {t.accountValueBefore != null ? formatCurrency(t.accountValueBefore) : "—"}
                  </td>
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
  );
}
