import { listContributors, listContributions } from "@/lib/portfolio";
import { createContribution, editContribution, removeContribution } from "@/app/actions";
import { formatCurrency } from "@/lib/format";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";


export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ContributionsPage() {
  const [contributors, contributions] = await Promise.all([listContributors(), listContributions()]);
  const contributorName = new Map(contributors.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Contributions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Deposits into the shared portfolio. Use a negative amount to record a withdrawal.
        </p>
      </div>

      {contributors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Add a contributor first before recording contributions.
        </div>
      ) : (
        <form
          action={createContribution}
          className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-5"
        >
          <select
            name="contributorId"
            required
            defaultValue=""
            className="col-span-2 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-1"
          >
            <option value="" disabled>
              Contributor
            </option>
            {contributors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            required
            defaultValue={todayIso()}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="number"
            name="amount"
            step="0.01"
            required
            placeholder="Amount"
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
      )}

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {contributions.length === 0 && (
          <div className="p-4 text-sm text-zinc-500">No contributions recorded yet.</div>
        )}
        {contributions.map((c) => (
          <form
            key={c.id}
            action={editContribution}
            className="grid grid-cols-2 items-center gap-2 p-3 sm:grid-cols-6"
          >
            <input type="hidden" name="id" value={c.id} />
            <select
              name="contributorId"
              defaultValue={c.contributorId}
              className="col-span-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-1"
            >
              {contributors.map((con) => (
                <option key={con.id} value={con.id}>
                  {contributorName.get(con.id)}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              defaultValue={c.date.slice(0, 10)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="number"
              name="amount"
              step="0.01"
              defaultValue={c.amount}
              className={
                c.amount >= 0
                  ? "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400"
                  : "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-red-400"
              }
            />
            <input
              name="note"
              defaultValue={c.note ?? ""}
              placeholder="Note"
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="hidden text-xs text-zinc-500 sm:block">{formatCurrency(c.amount)}</div>
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Save
              </button>
              <ConfirmSubmitButton
                confirmMessage="Delete this contribution?"
                formAction={removeContribution}
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
