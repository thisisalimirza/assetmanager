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

const SUBSTACK_URL = "https://capitalalpha.substack.com/";

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

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <p className="font-display text-sm font-semibold tracking-[0.08em] uppercase text-[var(--caf-signal)]">
            Capital Alpha Fund
          </p>
          <nav className="flex items-center gap-4 text-sm text-[var(--caf-mist)] sm:gap-6">
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Writing
            </a>
            <Link href="/login" className="transition-colors hover:text-white">
              Member sign in
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-12 pt-8 sm:justify-end sm:px-8 sm:pb-20 sm:pt-24">
          <p className="marketing-rise font-display text-[clamp(2.25rem,6.5vw,4.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            Capital
            <br />
            Alpha Fund
          </p>
          <h1 className="marketing-rise marketing-rise-delay-1 mt-5 max-w-lg font-display text-xl font-medium leading-snug text-[#b8f53a] sm:mt-6 sm:text-2xl">
            A private pool for close friends and family.
          </h1>
          <p className="marketing-rise marketing-rise-delay-2 mt-3 max-w-xl text-base text-[#d7e3dc] sm:mt-4 sm:text-xl">
            Built because people kept asking for investing help — and the honest
            answer was that advice and one-off management were not options.
          </p>
          <div className="marketing-rise marketing-rise-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[var(--caf-signal)] px-6 py-3 text-sm font-semibold text-[var(--caf-ink)] transition-transform hover:-translate-y-0.5"
            >
              Member portal
            </Link>
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-[var(--caf-mist)]/40 px-6 py-3 text-sm font-medium text-[var(--caf-paper)] transition-colors hover:border-[var(--caf-signal)] hover:text-[var(--caf-signal)]"
            >
              Read the notes
            </a>
          </div>
        </div>
      </section>

      {/* —— Why it exists —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Why this exists
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          People asked for advice. This was the clean way to say yes.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          Friends and family kept coming with the same question: how should I
          invest? Ali is not a licensed advisor, and running separate accounts
          for everyone was never realistic. Capital Alpha Fund is the informal
          alternative — one pooled portfolio, unitized like a real fund, with
          transparent books and no fees.
        </p>
      </section>

      {/* —— Performance —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            The track record
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Measured the same way a fund is measured.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            Deposits buy units at the current NAV. Returns accrue only while
            capital is in the pool. Performance is time-weighted and compared to
            the S&amp;P 500 when market data is available.
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
        </div>
      </section>

      {/* —— How it works —— */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          How it works
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          One brokerage account. Shared ownership. Clear books.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          Everyone in the fund owns units in the same portfolio. There is no
          advisory fee, no AUM cut, and no separate book of trades per person —
          just a single pool with proper unit accounting.
        </p>

        <ol className="mt-14 grid gap-12 sm:grid-cols-3">
          <li>
            <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
              01
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">Capital goes in</h3>
            <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              Deposits buy units at the fund&apos;s current NAV. Withdrawals
              redeem the same way. Timing matters — later capital does not
              inherit earlier gains.
            </p>
          </li>
          <li>
            <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
              02
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">The pool is invested</h3>
            <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              Trades sit in one account. Every member rides the same positions.
              This is an informal friends-and-family arrangement — not a
              registered advisory business.
            </p>
          </li>
          <li>
            <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
              03
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">Each person can see their share</h3>
            <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              Members get a private link with balance, invested capital, profit,
              and an S&amp;P comparison — plus printable statements when needed.
            </p>
          </li>
        </ol>
      </section>

      {/* —— Writing —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Public notes
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            The thinking is shared openly. The fund is not.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            On Substack, Ali writes through the positions, the risk framing, and
            the market notes — so people can follow the process even if they are
            not in the pool.
          </p>
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            capitalalpha.substack.com →
          </a>
        </div>
      </section>

      {/* —— Invite —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Invitation only
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Membership stays with people we already know.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--caf-mute)]">
          There is no public signup. Close friends and family who want in can
          ask directly. Members get a private read-only link; the books live in
          the portal. Past performance is not a promise — markets move, and
          capital can go down.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            Member sign in
          </Link>
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-[var(--caf-ink)]/20 px-6 py-3 text-sm font-medium transition-colors hover:border-[var(--caf-ink)]"
          >
            Follow on Substack
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--caf-mist)] px-5 py-10 text-sm text-[var(--caf-mute)] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-[var(--caf-ink)]">
              Capital Alpha Fund
            </p>
            <p className="mt-2 max-w-xl leading-relaxed">
              A private, non-commercial friends-and-family arrangement. Not a
              registered investment adviser, broker-dealer, or public offering.
              Nothing here is an offer to the general public.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--caf-ink)] underline-offset-4 hover:underline"
            >
              Writing →
            </a>
            <Link href="/app" className="text-[var(--caf-ink)] underline-offset-4 hover:underline">
              Portal →
            </Link>
          </div>
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
