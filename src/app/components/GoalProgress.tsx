import { formatCurrency } from "@/lib/format";

/**
 * Visual for the public $1k → $100k goal using the portfolio's actual
 * current value (AUM), not a hypothetical.
 */
export function GoalProgress({
  start = 1_000,
  goal = 100_000,
  current,
  asOf,
}: {
  start?: number;
  goal?: number;
  current: number;
  asOf?: string | null;
}) {
  // Log scale so early progress is visible on a 100x journey.
  const clamped = Math.min(Math.max(current, start * 0.5), goal);
  const logStart = Math.log10(start);
  const logGoal = Math.log10(goal);
  const logCurrent = Math.log10(Math.max(clamped, start * 0.5));
  const pct = Math.min(100, Math.max(2, ((logCurrent - logStart) / (logGoal - logStart)) * 100));
  const linearPct = Math.min(100, Math.max(0, (current / goal) * 100));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Portfolio goal · $1k → $100k
        </p>
        <p className="text-sm text-[var(--caf-mute)]">
          {linearPct.toFixed(1)}% of the way
          {asOf ? ` · as of ${asOf}` : ""}
        </p>
      </div>

      <p className="mt-4 font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
        {formatCurrency(current)}
        <span className="ml-2 text-lg font-medium text-[var(--caf-mute)]">
          of {formatCurrency(goal)}
        </span>
      </p>
      <p className="mt-1 text-sm text-[var(--caf-mute)]">
        Actual value of the shared portfolio today
      </p>

      <div className="relative mt-8">
        <div className="h-4 w-full bg-[var(--caf-mist)]">
          <div
            className="h-full bg-[var(--caf-signal-deep)] transition-[width] duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 border-2 border-[var(--caf-ink)] bg-[var(--caf-signal)]"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex justify-between font-display text-sm font-semibold">
        <span>{formatCurrency(start)}</span>
        <span>{formatCurrency(goal)}</span>
      </div>
    </div>
  );
}
