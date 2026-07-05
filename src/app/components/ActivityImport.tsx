"use client";

import { useActionState, useState } from "react";
import { importActivitiesAction, type ImportActivitiesState } from "@/app/actions";
import {
  parseRobinhoodActivityCsv,
  diffActivities,
  classifyActivity,
  type ActivityRow,
  type ActivityDiff,
} from "@/lib/robinhood";
import { formatDate, formatSignedCurrency } from "@/lib/format";
import { buttonStyles, cardStyles } from "./ui";
import { CsvDropZone } from "./CsvDropZone";

type Review = {
  fileName: string;
  parsed: ActivityRow[];
  diff: ActivityDiff;
};

/**
 * The "drop a Robinhood export to update" wizard: parse in the browser, show
 * exactly what's new before anything is written, then confirm. The server
 * recomputes the diff on confirm, so re-importing an overlapping export (or
 * double-clicking) can never duplicate rows.
 */
export function ActivityImport({ existing }: { existing: ActivityRow[] }) {
  const [review, setReview] = useState<Review | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ImportActivitiesState, FormData>(
    importActivitiesAction,
    {}
  );
  // Track which review the last submit belonged to, so the success panel
  // doesn't linger after a new file is dropped.
  const [submittedFile, setSubmittedFile] = useState<string | null>(null);
  const showResult = state.ok && !pending && submittedFile != null && review?.fileName === submittedFile;

  const handleFile = (text: string, fileName: string) => {
    setParseError(null);
    const { rows } = parseRobinhoodActivityCsv(text);
    if (rows.length === 0) {
      setReview(null);
      setParseError(
        "No activity rows found in that file — make sure it's the CSV export from Robinhood's account activity page."
      );
      return;
    }
    setSubmittedFile(null);
    setReview({ fileName, parsed: rows, diff: diffActivities(existing, rows) });
  };

  if (!review) {
    return (
      <div>
        <CsvDropZone
          onFileText={handleFile}
          hint="Drop a Robinhood activity CSV here to update the ledger — or click to browse"
        />
        {parseError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{parseError}</p>}
      </div>
    );
  }

  const { diff, fileName, parsed } = review;

  if (showResult) {
    return (
      <div className={`${cardStyles} border-emerald-300 dark:border-emerald-900`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Import complete
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Added {state.imported} new row{state.imported === 1 ? "" : "s"} from {fileName}
              {state.duplicates ? ` · ${state.duplicates} already recorded were skipped` : ""}.
            </p>
          </div>
          <button type="button" className={buttonStyles.secondary} onClick={() => setReview(null)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardStyles}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Review import — {fileName}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {parsed.length} rows in the export
            {diff.from && diff.to && <> ({formatDate(diff.from)} – {formatDate(diff.to)})</>} ·{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">{diff.newRows.length} new</strong> ·{" "}
            {diff.duplicateCount} already recorded
          </p>
        </div>
        <button type="button" className={buttonStyles.secondary} onClick={() => setReview(null)}>
          Cancel
        </button>
      </div>

      {diff.missingCount > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Heads up: {diff.missingCount} recorded row{diff.missingCount === 1 ? "" : "s"} inside this
          export&apos;s date range {diff.missingCount === 1 ? "isn't" : "aren't"} in the file.
          Nothing is deleted on import — but it may mean the export is partial or Robinhood issued a
          correction.
        </p>
      )}

      {diff.newRows.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Everything in this export is already recorded — nothing to import.
        </p>
      ) : (
        <>
          <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Instrument</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900">
                {diff.newRows.map((r, i) => (
                  <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-1.5 tabular-nums">{formatDate(r.activityDate)}</td>
                    <td className="px-3 py-1.5">{classifyActivity(r).label}</td>
                    <td className="px-3 py-1.5 font-medium">{r.instrument ?? "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.quantity ?? ""}</td>
                    <td
                      className={
                        "px-3 py-1.5 text-right tabular-nums " +
                        ((r.amount ?? 0) < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")
                      }
                    >
                      {r.amount != null ? formatSignedCurrency(r.amount) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={formAction} onSubmit={() => setSubmittedFile(fileName)} className="mt-4">
            <input type="hidden" name="rows" value={JSON.stringify(parsed)} />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className={buttonStyles.primary + " disabled:opacity-60"}>
                {pending
                  ? "Importing…"
                  : `Import ${diff.newRows.length} new row${diff.newRows.length === 1 ? "" : "s"}`}
              </button>
              {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
