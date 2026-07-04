import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientStatementData } from "@/lib/portfolio";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { PrintButton } from "@/app/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const data = await getClientStatementData(id);
  if (!data) notFound();

  const { client, summary, transactions, totalDeposits, totalWithdrawals, asOf } = data;
  const chronological = [...transactions].reverse(); // oldest first for a statement
  const generatedOn = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}`} className="text-sm text-zinc-500 hover:underline">
          ← {client.name}
        </Link>
        <PrintButton />
      </div>

      {/* The statement — styled for print (always light) */}
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm print:border-0 print:p-0 print:shadow-none dark:border-zinc-800">
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
          <div>
            <div className="text-lg font-semibold">Portfolio Statement</div>
            <div className="text-sm text-zinc-500">Prepared for {client.name}</div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>As of {asOf ? formatDate(asOf) : "—"}</div>
            <div>Generated {formatDate(generatedOn)}</div>
          </div>
        </div>

        {(client.email || client.phone) && (
          <div className="mt-3 text-xs text-zinc-500">
            {[client.email, client.phone].filter(Boolean).join(" · ")}
          </div>
        )}

        {/* Summary grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryItem label="Current value" value={formatCurrency(summary.currentValue)} />
          <SummaryItem label="Net invested" value={formatCurrency(summary.costBasis)} />
          <SummaryItem
            label="Profit / loss"
            value={formatSignedCurrency(summary.profit)}
            tone={summary.profit >= 0 ? "pos" : "neg"}
          />
          <SummaryItem
            label="Return"
            value={formatSignedPercent(summary.returnPct)}
            tone={summary.returnPct >= 0 ? "pos" : "neg"}
          />
        </div>

        <div className="mt-2 text-xs text-zinc-500">
          Ownership of fund: {formatPercent(summary.ownership)} · Total deposits{" "}
          {formatCurrency(totalDeposits)} · Total withdrawals {formatCurrency(totalWithdrawals)}
        </div>

        {/* Transaction ledger */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-medium">Transaction history</div>
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-300 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-1.5 font-medium">Date</th>
                <th className="py-1.5 font-medium">Type</th>
                <th className="py-1.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {chronological.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100">
                  <td className="py-1.5 tabular-nums">{formatDate(t.date)}</td>
                  <td className="py-1.5">{t.amount < 0 ? "Withdrawal" : "Deposit"}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatSignedCurrency(t.amount)}</td>
                </tr>
              ))}
              {chronological.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-zinc-400">
                    No transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-3 text-[11px] leading-relaxed text-zinc-400">
          This statement is for informational purposes only. Balances are computed using unit
          (NAV) accounting: gains and losses are allocated to each client for the period their
          capital was actually invested. Past performance does not guarantee future results.
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const toneClass = tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-red-600" : "text-zinc-900";
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
