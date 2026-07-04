import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientStatementData, getClientPeriodStatement } from "@/lib/portfolio";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatDate,
} from "@/lib/format";
import { PrintButton } from "@/app/components/PrintButton";

export const dynamic = "force-dynamic";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ranges(): { key: string; label: string; from: string; to: string }[] {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const to = iso(now);
  const q = Math.floor(m / 3) * 3;
  return [
    { key: "month", label: "This month", from: iso(new Date(Date.UTC(y, m, 1))), to },
    { key: "quarter", label: "This quarter", from: iso(new Date(Date.UTC(y, q, 1))), to },
    { key: "ytd", label: "Year to date", from: iso(new Date(Date.UTC(y, 0, 1))), to },
  ];
}

export default async function StatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id: idStr } = await params;
  const { from, to } = await searchParams;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const generatedOn = iso(new Date());
  const rangeLinks = ranges();

  const period = from && to ? await getClientPeriodStatement(id, from, to) : null;
  if (from && to && !period) notFound();

  // Header/toolbar shared between both views.
  const client = period ? period.client : (await getClientStatementData(id))?.client;
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/clients/${id}`} className="text-sm text-zinc-500 hover:underline">
          ← {client.name}
        </Link>
        <PrintButton />
      </div>

      {/* Range picker (screen only) */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <RangeChip href={`/clients/${id}/statement`} active={!period}>
          All time
        </RangeChip>
        {rangeLinks.map((r) => (
          <RangeChip
            key={r.key}
            href={`/clients/${id}/statement?from=${r.from}&to=${r.to}`}
            active={!!period && period.from === r.from && period.to === r.to}
          >
            {r.label}
          </RangeChip>
        ))}
      </div>

      {period ? (
        <PeriodStatementCard period={period} generatedOn={generatedOn} />
      ) : (
        <AllTimeStatementCard id={id} generatedOn={generatedOn} />
      )}
    </div>
  );
}

function RangeChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium " +
        (active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800")
      }
    >
      {children}
    </Link>
  );
}

const cardClass =
  "mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm print:border-0 print:p-0 print:shadow-none dark:border-zinc-800";

function StatementHeader({ name, subtitle, right }: { name: string; subtitle: string; right: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
      <div>
        <div className="text-lg font-semibold">Portfolio Statement</div>
        <div className="text-sm text-zinc-500">Prepared for {name}</div>
        <div className="text-xs text-zinc-400">{subtitle}</div>
      </div>
      <div className="text-right text-xs text-zinc-500">{right}</div>
    </div>
  );
}

async function AllTimeStatementCard({ id, generatedOn }: { id: number; generatedOn: string }) {
  const data = await getClientStatementData(id);
  if (!data) notFound();
  const { client, summary, transactions, totalDeposits, totalWithdrawals, asOf } = data;
  const chronological = [...transactions].reverse();

  return (
    <div className={cardClass}>
      <StatementHeader
        name={client.name}
        subtitle="All time"
        right={
          <>
            <div>As of {asOf ? formatDate(asOf) : "—"}</div>
            <div>Generated {formatDate(generatedOn)}</div>
          </>
        }
      />

      {(client.email || client.phone) && (
        <div className="mt-3 text-xs text-zinc-500">
          {[client.email, client.phone].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryItem label="Current value" value={formatCurrency(summary.currentValue)} />
        <SummaryItem label="Net invested" value={formatCurrency(summary.costBasis)} />
        <SummaryItem label="Profit / loss" value={formatSignedCurrency(summary.profit)} tone={summary.profit >= 0 ? "pos" : "neg"} />
        <SummaryItem label="Return" value={formatSignedPercent(summary.returnPct)} tone={summary.returnPct >= 0 ? "pos" : "neg"} />
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        Ownership of fund: {formatPercent(summary.ownership)} · Total deposits {formatCurrency(totalDeposits)} ·
        Total withdrawals {formatCurrency(totalWithdrawals)}
      </div>

      <TxTable rows={chronological} />
      <Disclaimer />
    </div>
  );
}

function PeriodStatementCard({
  period,
  generatedOn,
}: {
  period: NonNullable<Awaited<ReturnType<typeof getClientPeriodStatement>>>;
  generatedOn: string;
}) {
  const chronological = [...period.transactions].reverse();
  return (
    <div className={cardClass}>
      <StatementHeader
        name={period.client.name}
        subtitle={`${formatDate(period.from)} – ${formatDate(period.to)}`}
        right={<div>Generated {formatDate(generatedOn)}</div>}
      />

      {/* Opening → activity → closing */}
      <div className="mt-6 space-y-1.5 text-sm">
        <Row label="Opening value" value={formatCurrency(period.openingValue)} />
        <Row label="Deposits" value={formatSignedCurrency(period.deposits)} />
        <Row label="Withdrawals" value={formatSignedCurrency(-period.withdrawals)} />
        <Row label="Gain / loss" value={formatSignedCurrency(period.gain)} tone={period.gain >= 0 ? "pos" : "neg"} />
        <div className="my-1 border-t border-zinc-200" />
        <Row label="Closing value" value={formatCurrency(period.closingValue)} strong />
        <Row
          label="Return this period"
          value={formatSignedPercent(period.periodReturn)}
          tone={period.periodReturn >= 0 ? "pos" : "neg"}
        />
      </div>

      <TxTable rows={chronological} title="Activity this period" />
      <Disclaimer />
    </div>
  );
}

function Row({ label, value, tone, strong }: { label: string; value: string; tone?: "pos" | "neg"; strong?: boolean }) {
  const toneClass = tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-red-600" : "";
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold" : "text-zinc-600"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""} ${toneClass}`}>{value}</span>
    </div>
  );
}

function TxTable({ rows, title = "Transaction history" }: { rows: { id: number; date: string; amount: number }[]; title?: string }) {
  return (
    <div className="mt-6">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-300 text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="py-1.5 font-medium">Date</th>
            <th className="py-1.5 font-medium">Type</th>
            <th className="py-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-zinc-100">
              <td className="py-1.5 tabular-nums">{formatDate(t.date)}</td>
              <td className="py-1.5">{t.amount < 0 ? "Withdrawal" : "Deposit"}</td>
              <td className="py-1.5 text-right tabular-nums">{formatSignedCurrency(t.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 text-center text-zinc-400">
                No transactions in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="mt-8 border-t border-zinc-200 pt-3 text-[11px] leading-relaxed text-zinc-400">
      This statement is for informational purposes only. Balances are computed using unit (NAV)
      accounting: gains and losses are allocated to each client for the period their capital was
      actually invested. Past performance does not guarantee future results.
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
