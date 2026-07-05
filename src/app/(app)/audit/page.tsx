import Link from "next/link";
import { listAuditLog, listClients, type AuditEntry } from "@/lib/portfolio";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

// Renders the append-only audit trail: every create/update/delete of a
// transaction or valuation, with its before/after snapshot. This page is the
// paper trail for "why does this balance show X" — the working tables stay
// editable, but nothing is ever silently overwritten.

type Snapshot = Record<string, unknown>;

function snap(detail: Record<string, unknown>, key: "before" | "after"): Snapshot | null {
  const v = detail[key];
  return v && typeof v === "object" ? (v as Snapshot) : null;
}

function money(v: unknown): string {
  return typeof v === "number" ? formatCurrency(v) : "?";
}

function date(v: unknown): string {
  return typeof v === "string" ? formatDate(v) : "?";
}

function describeTransaction(s: Snapshot, names: Map<number, string>): string {
  const amount = typeof s.amount === "number" ? s.amount : null;
  const kind = amount != null && amount < 0 ? "withdrawal" : "deposit";
  const who = names.get(Number(s.clientId)) ?? `client #${String(s.clientId ?? "?")}`;
  return `${kind} of ${money(amount != null ? Math.abs(amount) : undefined)} for ${who} on ${date(s.date)}`;
}

function describeValuation(s: Snapshot): string {
  const value = s.totalValue ?? s.total_value;
  return `valuation of ${money(typeof value === "number" ? value : undefined)} on ${date(s.date)}`;
}

function describeActivityImport(s: Snapshot): string {
  const n = typeof s.imported === "number" ? s.imported : "?";
  const range = s.from && s.to ? ` (${date(s.from)} – ${date(s.to)})` : "";
  const dup = typeof s.duplicatesSkipped === "number" && s.duplicatesSkipped > 0
    ? `, ${s.duplicatesSkipped} already recorded`
    : "";
  return `Imported ${n} brokerage activity rows${range}${dup}`;
}

function describe(entry: AuditEntry, names: Map<number, string>): string {
  if (entry.entity === "activities") {
    const after = snap(entry.detail, "after");
    return after ? describeActivityImport(after) : "Imported brokerage activity";
  }
  const which = entry.entity === "transaction" ? describeTransaction : describeValuation;
  const before = snap(entry.detail, "before");
  const after = snap(entry.detail, "after");
  switch (entry.action) {
    case "create":
      return after ? `Recorded ${which(after, names)}` : "Recorded (no snapshot)";
    case "update":
      return before && after
        ? `Changed ${which(before, names)} → ${which(after, names)}`
        : `Changed ${after ? which(after, names) : "(no snapshot)"}`;
    case "delete":
      return before ? `Deleted ${which(before, names)}` : "Deleted (no snapshot)";
    default:
      return entry.action;
  }
}

const actionTone: Record<string, string> = {
  create: "text-emerald-600 dark:text-emerald-400",
  update: "text-amber-600 dark:text-amber-400",
  delete: "text-red-600 dark:text-red-400",
};

export default async function AuditPage() {
  const [entries, clients] = await Promise.all([listAuditLog(), listClients()]);
  const names = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="-mb-2">
        <Link href="/settings" className="text-sm text-zinc-500 hover:underline">
          ← Settings
        </Link>
      </div>
      <PageHeader
        title="Audit trail"
        subtitle="Append-only record of every change to transactions and valuations — each entry keeps a full before/after snapshot, so past states can always be reconstructed."
      />

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nothing yet — entries appear as transactions and valuations are added or changed.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">When (UTC)</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">What changed</th>
                <th className="px-4 py-2.5 text-right font-medium">Snapshot</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-zinc-500">
                    {e.createdAt}
                  </td>
                  <td className={`px-4 py-2.5 font-medium capitalize ${actionTone[e.action] ?? ""}`}>
                    {e.action}
                  </td>
                  <td className="px-4 py-2.5">{describe(e, names)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <details className="text-left">
                      <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                        JSON
                      </summary>
                      <pre className="mt-1 max-w-md overflow-x-auto rounded-md bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                        {JSON.stringify(e.detail, null, 2)}
                      </pre>
                    </details>
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
