import Link from "next/link";
import { getFundSummary, listClients } from "@/lib/portfolio";
import { formatCurrency, formatSignedPercent, formatPercent } from "@/lib/format";
import { ClientModal } from "@/app/components/ClientModal";
import { PageHeader } from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [fund, clients] = await Promise.all([getFundSummary(), listClients()]);
  const byId = new Map(fund.clients.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        subtitle="Everyone with money in the fund."
        actions={<ClientModal label="+ Add client" />}
      />

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No clients yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((client) => {
            const s = byId.get(client.id);
            const profit = s?.profit ?? 0;
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{client.name}</div>
                    {client.email && <div className="text-xs text-zinc-500">{client.email}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">{formatCurrency(s?.currentValue ?? 0)}</div>
                    <div
                      className={
                        "text-xs tabular-nums " +
                        (profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")
                      }
                    >
                      {formatSignedPercent(s?.returnPct ?? 0)} return
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {formatPercent(s?.ownership ?? 0)} of fund · {formatCurrency(s?.costBasis ?? 0)} invested
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
