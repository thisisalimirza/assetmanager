"use client";

import { useState } from "react";
import { reconcileTransactions } from "@/app/actions";
import { formatCurrency, formatSignedCurrency, formatDate } from "@/lib/format";
import {
  parseCsv,
  matchMovements,
  DATE_WINDOW_DAYS,
  type MatchResult,
  type ReconcileTx,
} from "@/lib/reconcile";
import { CsvDropZone } from "./CsvDropZone";

export type { ReconcileTx };

export function ReconcileTool({
  transactions,
  clientNames,
}: {
  transactions: ReconcileTx[];
  clientNames: Record<number, string>;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [parsedCount, setParsedCount] = useState(0);

  const runWith = (csvText: string) => {
    const movements = parseCsv(csvText);
    setParsedCount(movements.length);
    setResult(matchMovements(movements, transactions));
  };
  const run = () => runWith(text);

  const unreconciledMatchIds = result
    ? result.matched.filter((m) => !m.tx.reconciledAt).map((m) => m.tx.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label htmlFor="csv" className="text-sm font-medium">
          Drop or paste a Venmo / bank / Robinhood CSV export
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          Any CSV works — each row just needs a date and an amount. Movements are matched to
          recorded transactions by amount, within {DATE_WINDOW_DAYS} days.
        </p>
        <div className="mt-3">
          <CsvDropZone
            onFileText={(csvText) => {
              setText(csvText);
              runWith(csvText);
            }}
            hint="Drop a CSV here to match instantly — or click to browse"
          />
        </div>
        <textarea
          id="csv"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={`Datetime,Type,Note,From,To,Amount (total)\n2026-06-27T14:33:41,Payment,June contribution,Mom,Ali,+ $300.00`}
          className="mt-3 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={run}
          disabled={!text.trim()}
          className="mt-3 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Match against recorded transactions
        </button>
      </div>

      {result && (
        <>
          {parsedCount === 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              Couldn&apos;t find any rows with both a date and an amount in that paste — check that
              you copied the CSV contents (not a screenshot or summary).
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Found {parsedCount} movement{parsedCount === 1 ? "" : "s"} in the export:{" "}
              {result.matched.length} matched, {result.unmatchedMovements.length} unmatched.
            </p>
          )}

          {result.matched.length > 0 && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-zinc-500">
                  Matched ({result.matched.length})
                </h2>
                {unreconciledMatchIds.length > 0 && (
                  <form action={reconcileTransactions}>
                    <input type="hidden" name="ids" value={unreconciledMatchIds.join(",")} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Mark all {unreconciledMatchIds.length} as reconciled
                    </button>
                  </form>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Bank movement</th>
                      <th className="px-4 py-2.5 font-medium">Recorded transaction</th>
                      <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                      <th className="px-4 py-2.5 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900">
                    {result.matched.map(({ movement, tx }) => (
                      <tr key={tx.id} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="px-4 py-2.5 tabular-nums text-zinc-500">
                          {formatDate(movement.date)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium">{clientNames[tx.clientId] ?? "—"}</span>{" "}
                          <span className="tabular-nums text-zinc-500">{formatDate(tx.date)}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatSignedCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {tx.reconciledAt ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              ✓ Reconciled
                            </span>
                          ) : (
                            <form action={reconcileTransactions} className="inline">
                              <input type="hidden" name="ids" value={String(tx.id)} />
                              <button
                                type="submit"
                                className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
                              >
                                Mark reconciled
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.unmatchedMovements.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
                In the export but not recorded here ({result.unmatchedMovements.length})
              </h2>
              <div className="overflow-x-auto rounded-xl border border-red-200 dark:border-red-900">
                <table className="w-full text-sm">
                  <tbody className="bg-white dark:bg-zinc-900">
                    {result.unmatchedMovements.map((m) => (
                      <tr key={m.line} className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800">
                        <td className="px-4 py-2.5 tabular-nums">{formatDate(m.date)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatCurrency(Math.abs(m.amount))}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          Real money moved, but there&apos;s no matching transaction — record it if
                          it belongs to the fund.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.unmatchedTxs.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                Recorded here but not in the export ({result.unmatchedTxs.length})
              </h2>
              <div className="overflow-x-auto rounded-xl border border-amber-200 dark:border-amber-900">
                <table className="w-full text-sm">
                  <tbody className="bg-white dark:bg-zinc-900">
                    {result.unmatchedTxs.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800">
                        <td className="px-4 py-2.5 font-medium">{clientNames[t.clientId] ?? "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums">{formatDate(t.date)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatSignedCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          {t.reconciledAt
                            ? "Already reconciled against an earlier export."
                            : "No matching bank movement in this export — double-check it really happened."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
