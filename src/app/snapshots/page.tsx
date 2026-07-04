import { listSnapshots } from "@/lib/portfolio";
import { createSnapshot, editSnapshot, removeSnapshot } from "@/app/actions";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function SnapshotsPage() {
  const snapshots = await listSnapshots();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Snapshots</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Record the portfolio&apos;s total value (from Robinhood) periodically. The most recent
          snapshot drives the dashboard&apos;s profit split.
        </p>
      </div>

      <form
        action={createSnapshot}
        className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-4"
      >
        <input
          type="date"
          name="date"
          required
          defaultValue={todayIso()}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="number"
          name="totalValue"
          step="0.01"
          required
          placeholder="Total value"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="note"
          placeholder="Note (optional)"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {snapshots.length === 0 && (
          <div className="p-4 text-sm text-zinc-500">No snapshots recorded yet.</div>
        )}
        {snapshots.map((s) => (
          <form
            key={s.id}
            action={editSnapshot}
            className="grid grid-cols-2 items-center gap-2 p-3 sm:grid-cols-5"
          >
            <input type="hidden" name="id" value={s.id} />
            <input
              type="date"
              name="date"
              defaultValue={s.date.slice(0, 10)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="number"
              name="totalValue"
              step="0.01"
              defaultValue={s.totalValue}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              name="note"
              defaultValue={s.note ?? ""}
              placeholder="Note"
              className="col-span-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Save
              </button>
              <ConfirmSubmitButton
                confirmMessage="Delete this snapshot?"
                formAction={removeSnapshot}
                className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </ConfirmSubmitButton>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
