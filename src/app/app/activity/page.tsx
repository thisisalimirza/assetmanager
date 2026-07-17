import { listActivities } from "@/lib/portfolio";
import { classifyActivity } from "@/lib/robinhood";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/app/components/PageHeader";
import { StatCard } from "@/app/components/StatCard";
import { ActivityImport } from "@/app/components/ActivityImport";
import { ActivityTable } from "@/app/components/ActivityTable";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const activities = await listActivities();

  // Summary stats over the whole ledger.
  let buys = 0;
  let sells = 0;
  let dividends = 0; // cash dividends net of foreign tax withholding
  let netTransfers = 0; // deposits − withdrawals/wires/fees
  for (const row of activities) {
    const { group } = classifyActivity(row);
    if (row.transCode === "Buy") buys++;
    else if (row.transCode === "Sell") sells++;
    if (row.transCode === "CDIV" || row.transCode === "DTAX") dividends += row.amount ?? 0;
    if (group === "transfer") netTransfers += row.amount ?? 0;
  }
  const oldest = activities[activities.length - 1]?.activityDate;
  const newest = activities[0]?.activityDate;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Activity"
        subtitle="The brokerage's own record: every trade, dividend, and transfer, imported straight from Robinhood's activity CSV. Drop a fresh export any time — only new rows are added."
      />

      <ActivityImport existing={activities} />

      {activities.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Activities"
            value={String(activities.length)}
            hint={oldest && newest ? `${formatDate(oldest)} – ${formatDate(newest)}` : undefined}
          />
          <StatCard label="Trades" value={String(buys + sells)} hint={`${buys} buys · ${sells} sells`} />
          <StatCard
            label="Dividends collected"
            value={formatCurrency(dividends)}
            hint="net of foreign tax withheld"
          />
          <StatCard
            label="Net transfers"
            value={formatCurrency(netTransfers)}
            hint="deposits − withdrawals & fees"
          />
        </div>
      )}

      <div>
        <SectionHeader>Ledger</SectionHeader>
        {activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No activity imported yet — drop your Robinhood activity CSV above to load the full
            history.
          </div>
        ) : (
          <ActivityTable rows={activities} />
        )}
      </div>
    </div>
  );
}
