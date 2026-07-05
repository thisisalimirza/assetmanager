"use client";

import { useMemo, useState } from "react";
import {
  classifyActivity,
  shortDescription,
  type ActivityRow,
  type ActivityGroup,
} from "@/lib/robinhood";
import { formatCurrency, formatSignedCurrency, formatDate } from "@/lib/format";

type Row = ActivityRow & { id: number };

const FILTERS: { key: ActivityGroup | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "trade", label: "Trades" },
  { key: "dividend", label: "Dividends" },
  { key: "transfer", label: "Transfers" },
  { key: "income", label: "Income" },
  { key: "other", label: "Other" },
];

const groupTone: Record<ActivityGroup, string> = {
  trade: "text-zinc-700 dark:text-zinc-300",
  dividend: "text-emerald-600 dark:text-emerald-400",
  transfer: "text-amber-600 dark:text-amber-400",
  income: "text-sky-600 dark:text-sky-400",
  other: "text-zinc-400",
};

function monthLabel(iso: string): string {
  return new Date(`${iso.slice(0, 7)}-01T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/**
 * The brokerage ledger: filter chips by kind, free-text ticker search, and
 * month separators so a multi-year history stays scannable.
 *
 * `variant="public"` renders the sanitized read-only version used on the
 * fund's share link: date, type, instrument, and market price only — no
 * quantities, dollar amounts, or descriptions, since those reveal the fund's
 * size (the caller is also expected to pass only trade/dividend rows).
 */
export function ActivityTable({
  rows,
  variant = "full",
}: {
  rows: Row[];
  variant?: "full" | "public";
}) {
  const isPublic = variant === "public";
  const [filter, setFilter] = useState<ActivityGroup | "all">("all");
  const [query, setQuery] = useState("");

  const classified = useMemo(
    () => rows.map((row) => ({ row, kind: classifyActivity(row) })),
    [rows]
  );

  const q = query.trim().toUpperCase();
  const visible = classified.filter(({ row, kind }) => {
    if (filter !== "all" && kind.group !== filter) return false;
    if (q && !(row.instrument ?? "").toUpperCase().includes(q)) return false;
    return true;
  });

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const { kind } of classified) m.set(kind.group, (m.get(kind.group) ?? 0) + 1);
    return m;
  }, [classified]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? rows.length : (counts.get(f.key) ?? 0);
            if (f.key !== "all" && count === 0) return null;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium " +
                  (active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800")
                }
              >
                {f.label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by ticker…"
          className="w-40 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nothing matches this filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Instrument</th>
                {!isPublic && <th className="px-4 py-2.5 font-medium">Description</th>}
                {!isPublic && <th className="px-4 py-2.5 text-right font-medium">Qty</th>}
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                {!isPublic && <th className="px-4 py-2.5 text-right font-medium">Amount</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {visible.map(({ row, kind }, i) => {
                const prev = visible[i - 1]?.row;
                const newMonth = !prev || prev.activityDate.slice(0, 7) !== row.activityDate.slice(0, 7);
                return [
                  newMonth ? (
                    <tr key={`m-${row.id}`} className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <td colSpan={isPublic ? 4 : 7} className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                        {monthLabel(row.activityDate)}
                      </td>
                    </tr>
                  ) : null,
                  <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800/70">
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-zinc-500">
                      {formatDate(row.activityDate)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2 font-medium ${groupTone[kind.group]}`}>
                      {kind.label}
                    </td>
                    <td className="px-4 py-2 font-medium">{row.instrument ?? "—"}</td>
                    {!isPublic && (
                      <td className="max-w-64 truncate px-4 py-2 text-xs text-zinc-500" title={shortDescription(row)}>
                        {shortDescription(row)}
                      </td>
                    )}
                    {!isPublic && (
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                        {row.quantity ?? ""}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                      {row.price != null ? formatCurrency(row.price) : ""}
                    </td>
                    {!isPublic && (
                      <td
                        className={
                          "whitespace-nowrap px-4 py-2 text-right tabular-nums " +
                          (row.amount == null
                            ? "text-zinc-400"
                            : row.amount < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400")
                        }
                      >
                        {row.amount != null ? formatSignedCurrency(row.amount) : "—"}
                      </td>
                    )}
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
