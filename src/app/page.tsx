import Link from "next/link";
import { getFundSummary } from "@/lib/portfolio";
import { getAlpha } from "@/lib/analytics";
import {
  formatCurrency,
  formatSignedPercent,
  formatDate,
} from "@/lib/format";
import { HeroPerformance } from "@/app/components/HeroPerformance";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [fund, alpha] = await Promise.all([getFundSummary(), getAlpha()]);

  // Prefer audited-window alpha when the benchmark is available; otherwise the
  // since-inception time-weighted return is the honest headline number.
  const headlineReturn = alpha.available ? alpha.fundReturn : fund.twr;
  const headlineHint = alpha.available
    ? `since first audited mark · ${formatDate(alpha.anchorDate)}`
    : "time-weighted return since inception";
  const growthOf10k = 10_000 * (1 + headlineReturn);
  // Hero curve starts at the first real mark (NAV left the flat seed era) so
  // the visual reads as the actual climb, not months of placeholder NAV 100.
  const chartPoints = trimFlatSeedEra(
    dedupeNavSeries(fund.navSeries.map((p) => ({ date: p.date, value: p.navPerUnit }))),
  );

  return (
    <div className="bg-[var(--caf-paper)] text-[var(--caf-ink)]">
      {/* —— Hero: brand + one line + CTA + live curve —— */}
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[var(--caf-ink)] text-[var(--caf-paper)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 80% at 70% 20%, rgba(184,245,58,0.16), transparent 55%), radial-gradient(90% 70% at 10% 90%, rgba(26,64,52,0.9), transparent 50%), linear-gradient(165deg, #071410 0%, #0f2a22 48%, #071410 100%)",
          }}
        />
        <HeroPerformance points={chartPoints} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--caf-ink)] via-[var(--caf-ink)]/55 to-transparent" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <p className="font-display text-sm font-semibold tracking-[0.08em] uppercase text-[var(--caf-signal)]">
            Capital Alpha Fund
          </p>
          <Link
            href="/login"
            className="text-sm text-[var(--caf-mist)] transition-colors hover:text-white"
          >
            Member sign in
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-12 pt-8 sm:justify-end sm:px-8 sm:pb-20 sm:pt-24">
          <p className="marketing-rise font-display text-[clamp(2.25rem,6.5vw,4.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            Capital
            <br />
            Alpha Fund
          </p>
          <h1 className="marketing-rise marketing-rise-delay-1 mt-5 max-w-md font-display text-xl font-medium leading-snug text-[#b8f53a] sm:mt-6 sm:text-2xl">
            My portfolio. Your seat at the table.
          </h1>
          <p className="marketing-rise marketing-rise-delay-2 mt-3 max-w-xl text-base text-[#d7e3dc] sm:mt-4 sm:text-xl">
            Friends and family who invest beside me — same book of trades, clear
            tracking, no fees.
          </p>
          <div className="marketing-rise marketing-rise-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[var(--caf-signal)] px-6 py-3 text-sm font-semibold text-[var(--caf-ink)] transition-transform hover:-translate-y-0.5"
            >
              Open the portal
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center border border-[var(--caf-mist)]/40 px-6 py-3 text-sm font-medium text-[var(--caf-paper)] transition-colors hover:border-[var(--caf-signal)] hover:text-[var(--caf-signal)]"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* —— Performance —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          The track record
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Built to beat sitting in cash — and measured against the market.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          Every dollar buys units in one shared portfolio. Gains and losses
          accrue only while your money is in — the same way a real fund works.
          {fund.asOf ? ` Figures as of ${formatDate(fund.asOf)}.` : ""}
        </p>

        <dl className="mt-12 grid gap-10 border-t border-[var(--caf-mist)] pt-10 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-[var(--caf-mute)]">Fund performance</dt>
            <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-normal">
              {formatSignedPercent(headlineReturn)}
            </dd>
            <dd className="mt-1 text-sm text-[var(--caf-mute)]">{headlineHint}</dd>
          </div>
          {alpha.available ? (
            <>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">{alpha.label}</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-normal">
                  {formatSignedPercent(alpha.benchmarkReturn)}
                </dd>
                <dd className="mt-1 text-sm text-[var(--caf-mute)]">same window</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Alpha</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-normal text-[var(--caf-signal-deep)]">
                  {formatSignedPercent(alpha.alpha)}
                </dd>
                <dd className="mt-1 text-sm text-[var(--caf-mute)]">
                  active return vs {alpha.label}
                </dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Money-weighted</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-normal">
                  {formatSignedPercent(fund.simpleReturn)}
                </dd>
                <dd className="mt-1 text-sm text-[var(--caf-mute)]">
                  accounts for when cash moved
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">$10,000 would be</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-normal">
                  {formatCurrency(growthOf10k)}
                </dd>
                <dd className="mt-1 text-sm text-[var(--caf-mute)]">
                  hypothetical, same return
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>

      {/* —— How it works —— */}
      <section
        id="how"
        className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            How it works
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            You are not getting a separate managed account. You are joining mine.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            Capital Alpha Fund is Ali&apos;s personal brokerage portfolio, opened
            so people he trusts can put money in beside him. There is no
            advisory fee, no AUM cut, and no separate book of trades for each
            person — one fund, unitized ownership.
          </p>

          <ol className="mt-14 grid gap-12 sm:grid-cols-3">
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                01
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">
                You send money in
              </h3>
              <p className="mt-2 text-[var(--caf-mute)]">
                Deposits buy units at the fund&apos;s current NAV. Withdrawals
                redeem the same way. Timing matters — late capital does not
                inherit earlier gains.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                02
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">
                I invest the pool
              </h3>
              <p className="mt-2 text-[var(--caf-mute)]">
                Trades happen in one Robinhood account. Everyone rides the same
                positions. I am not a licensed advisor — this is personal, not a
                commercial practice.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                03
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">
                You watch your share
              </h3>
              <p className="mt-2 text-[var(--caf-mute)]">
                A private link shows your balance, invested capital, profit, and
                how you would have done in the S&amp;P instead — plus printable
                statements when you need them.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* —— Invite —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Invitation only
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          If we know each other and you want in, ask me.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--caf-mute)]">
          There is no public signup. Members get a secret read-only link; I keep
          the books in the portal. Past performance is not a promise — markets
          move, and your money can go down.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            Member sign in
          </Link>
            <a
            href="#how"
            className="inline-flex items-center justify-center border border-[var(--caf-ink)]/20 px-6 py-3 text-sm font-medium transition-colors hover:border-[var(--caf-ink)]"
          >
            Read how it works
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--caf-mist)] px-5 py-10 text-sm text-[var(--caf-mute)] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-[var(--caf-ink)]">
              Capital Alpha Fund
            </p>
            <p className="mt-2 max-w-xl">
              A private, non-commercial friends-and-family arrangement. Not a
              registered investment adviser, broker-dealer, or public offering.
              Nothing here is an offer to the general public.
            </p>
          </div>
          <Link href="/app" className="text-[var(--caf-ink)] underline-offset-4 hover:underline">
            Portal →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Collapse same-day duplicate NAV marks so the hero curve stays clean. */
function dedupeNavSeries(points: { date: string; value: number }[]) {
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.value);
  return [...byDate.entries()].map(([date, value]) => ({ date, value }));
}

/** Drop the leading run of near-identical seed NAV so the hero shows the climb. */
function trimFlatSeedEra(points: { date: string; value: number }[]) {
  if (points.length < 3) return points;
  const first = points[0].value;
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].value - first) / Math.max(first, 1) < 0.02) {
      start = i;
    } else {
      break;
    }
  }
  // Keep one flat anchor point so the lift-off is visible.
  return points.slice(Math.max(0, start));
}
