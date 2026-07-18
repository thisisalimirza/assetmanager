import { formatCurrency } from "@/lib/format";

/**
 * Visual for the public $1k → $100k size goal using the Alpha Fund's actual
 * AUM. Linear scale only — log scales made ~$12k look "halfway" to $100k.
 * This is a fund-size goal, not a return figure.
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
  const safeGoal = Math.max(goal, 1);
  const pct = Math.min(100, Math.max(0, (current / safeGoal) * 100));
  const startPct = Math.min(100, Math.max(0, (start / safeGoal) * 100));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Fund size goal · $100k
        </p>
        <p className="text-sm text-[var(--caf-mute)]">
          {pct.toFixed(1)}% of goal
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
        Actual fund value (includes deposits) — not a return %
      </p>

      <div
        className="relative mt-8"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.round(current)}
        aria-label={`Fund size ${formatCurrency(current)} of ${formatCurrency(goal)} goal`}
      >
        <div className="h-4 w-full bg-[var(--caf-mist)]">
          <div
            className="h-full bg-[var(--caf-signal-deep)] transition-[width] duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* $1k starting marker */}
        <div
          className="absolute top-0 h-4 w-px bg-[var(--caf-ink)]/35"
          style={{ left: `${startPct}%` }}
          title={`${formatCurrency(start)} starting marker`}
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 border-2 border-[var(--caf-ink)] bg-[var(--caf-signal)]"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex justify-between font-display text-sm font-semibold">
        <span>{formatCurrency(0)}</span>
        <span className="text-[var(--caf-mute)]">{formatCurrency(start)} start</span>
        <span>{formatCurrency(goal)}</span>
      </div>
    </div>
  );
}
