import { getLatestFundValue, listValuations } from "@/lib/portfolio";
import { formatCurrency, formatDate } from "@/lib/format";
import { ValuationModal } from "@/app/components/ValuationModal";
import { PageHeader } from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ValuationsPage() {
  const [valuations, latestValue] = await Promise.all([listValuations(), getLatestFundValue()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Valuations"
        subtitle="Record the fund's total value periodically (e.g. from Robinhood). The most recent valuation drives every client's current balance."
        actions={<ValuationModal label="+ Add valuation" latestValue={latestValue} />}
      />

      {valuations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No valuations recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Total value</th>
                <th className="px-4 py-2.5 font-medium">Note</th>
                <th className="px-4 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {valuations.map((v) => (
                <tr key={v.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2.5 tabular-nums">{formatDate(v.date)}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatCurrency(v.totalValue)}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{v.note ?? ""}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ValuationModal label="Edit" variant="ghost" valuation={v} />
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
