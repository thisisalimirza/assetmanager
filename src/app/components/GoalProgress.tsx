import { formatCurrency } from "@/lib/format";

/**
 * Visual for the public $1k → $100k track-record goal. Uses a hypothetical
 * "if $1,000 had ridden the fund's return" figure — not a promise.
 */
export function GoalProgress({
  start = 1_000,
  goal = 100_000,
  current,
}: {
  start?: number;
  goal?: number;
  current: number;
}) {
  // Log scale so early progress is visible on a 100x journey.
  const logStart = Math.log10(start);
  const logGoal = Math.log10(goal);
  const logCurrent = Math.log10(Math.min(Math.max(current, start), goal));
  const pct = ((logCurrent - logStart) / (logGoal - logStart)) * 100;
  const linearPct = Math.min(100, Math.max(0, ((current - start) / (goal - start)) * 100));

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Public goal
        </p>
        <p className="text-sm text-[var(--caf-mute)]">
          {formatCurrency(current)} of {formatCurrency(goal)}
          <span className="hidden sm:inline"> · {linearPct.toFixed(1)}% of the way</span>
        </p>
      </div>

      <div className="relative mt-6">
        <div className="h-3 w-full bg-[var(--caf-mist)]">
          <div
            className="h-full bg-[var(--caf-signal-deep)] transition-[width] duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--caf-ink)] bg-[var(--caf-signal)]"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex justify-between font-display text-sm font-semibold">
        <span>{formatCurrency(start)}</span>
        <span className="text-[var(--caf-signal-deep)]">{formatCurrency(current)} now*</span>
        <span>{formatCurrency(goal)}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--caf-mute)]">
        *If {formatCurrency(start)} had been invested at the start and earned the fund&apos;s
        published return — a simple illustration of the public track record, not anyone&apos;s
        actual account.
      </p>
    </div>
  );
}
