import { listContributors, listContributions } from "@/lib/portfolio";
import { createContributor, editContributor, removeContributor } from "@/app/actions";
import { formatCurrency } from "@/lib/format";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function ContributorsPage() {
  const [contributors, contributions] = await Promise.all([listContributors(), listContributions()]);
  const contributionCounts = new Map<number, number>();
  for (const c of contributions) {
    contributionCounts.set(c.contributorId, (contributionCounts.get(c.contributorId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Contributors</h1>
        <p className="mt-1 text-sm text-zinc-500">Everyone who has money in the shared portfolio.</p>
      </div>

      <form action={createContributor} className="flex gap-2">
        <input
          name="name"
          placeholder="Name (e.g. Mom)"
          required
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {contributors.length === 0 && (
          <div className="p-4 text-sm text-zinc-500">No contributors yet.</div>
        )}
        {contributors.map((c) => {
          const costBasis = contributions
            .filter((con) => con.contributorId === c.id)
            .reduce((sum, con) => sum + con.amount, 0);
          const count = contributionCounts.get(c.id) ?? 0;
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <form action={editContributor} className="flex flex-1 min-w-[200px] items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="name"
                  defaultValue={c.name}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Save
                </button>
              </form>
              <div className="text-xs text-zinc-500">
                {formatCurrency(costBasis)} · {count} contribution{count === 1 ? "" : "s"}
              </div>
              <form action={removeContributor}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Delete ${c.name}? This also deletes all of their contributions.`}
                  className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
