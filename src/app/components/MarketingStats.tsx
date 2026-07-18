"use client";

import { useCallback } from "react";
import { CountUp } from "@/app/components/CountUp";
import { formatCurrency, formatSignedPercent } from "@/lib/format";

type Props = {
  returnLabel: string;
  returnValue: number | null;
  returnHint: string;
  aum: number;
  aumHint: string;
  thirdLabel: string;
  thirdValue: number | null;
  thirdIsCurrencyGoal?: boolean;
  thirdHint: string;
  thirdPositive?: boolean | null;
};

export function MarketingStats({
  returnLabel,
  returnValue,
  returnHint,
  aum,
  aumHint,
  thirdLabel,
  thirdValue,
  thirdIsCurrencyGoal,
  thirdHint,
  thirdPositive,
}: Props) {
  const fmtPct = useCallback((n: number) => formatSignedPercent(n), []);
  const fmtMoney = useCallback((n: number) => formatCurrency(n), []);

  const thirdTone =
    thirdPositive == null
      ? ""
      : thirdPositive
        ? "text-[var(--caf-signal-deep)]"
        : "text-red-700";

  return (
    <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[var(--caf-mist)] pt-8 sm:mt-10 sm:grid-cols-3 sm:gap-8 sm:pt-10">
      <div className="caf-stat-tile rounded-sm p-1">
        <dt className="text-sm text-[var(--caf-mute)]">{returnLabel}</dt>
        <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
          {returnValue != null ? (
            <CountUp value={returnValue} format={fmtPct} />
          ) : (
            "—"
          )}
        </dd>
        <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">{returnHint}</dd>
      </div>
      <div className="caf-stat-tile rounded-sm p-1">
        <dt className="text-sm text-[var(--caf-mute)]">Alpha Fund value</dt>
        <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
          <CountUp value={aum} format={fmtMoney} durationMs={1300} />
        </dd>
        <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">{aumHint}</dd>
      </div>
      <div className="caf-stat-tile rounded-sm p-1">
        <dt className="text-sm text-[var(--caf-mute)]">{thirdLabel}</dt>
        <dd
          className={
            "mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl " +
            thirdTone
          }
        >
          {thirdIsCurrencyGoal ? (
            "$100,000"
          ) : thirdValue != null ? (
            <CountUp value={thirdValue} format={fmtPct} />
          ) : (
            "—"
          )}
        </dd>
        <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">{thirdHint}</dd>
      </div>
    </dl>
  );
}
