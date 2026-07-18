import Link from "next/link";
import { getFundSummary } from "@/lib/portfolio";
import { getPublicTrackRecordHref } from "@/lib/public-links";
import { getAlpha, getAlphaWindows } from "@/lib/analytics";
import { formatDate } from "@/lib/format";
import { HeroPerformance } from "@/app/components/HeroPerformance";
import { ValueChart } from "@/app/components/ValueChart";
import { GoalProgress } from "@/app/components/GoalProgress";
import { WindowedPerformance } from "@/app/components/WindowedPerformance";
import { Reveal } from "@/app/components/Reveal";
import { MarketingStats } from "@/app/components/MarketingStats";

export const dynamic = "force-dynamic";

const SUBSTACK_URL = "https://capitalalpha.substack.com/";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need an account or password?",
    a: "No. After you join, you get a private link. Open it anytime on your phone or computer to see your share. Bookmark it — there is nothing to log into.",
  },
  {
    q: "Is this like a bank account?",
    a: "No. Money in the Alpha Fund is invested in the stock market and related investments. The value goes up and down. It is not FDIC insured, and it is not a savings account.",
  },
  {
    q: "Can I lose money?",
    a: "Yes. Markets fall sometimes. You can get back less than you put in. Only put in money you can afford to leave invested for a while.",
  },
  {
    q: "Are there fees? Why is it free?",
    a: "This arrangement cannot legally be charged for — and it is not. No management fee, no cut of profits. That is also why it stays invite-only for people who already know me personally.",
  },
  {
    q: "Who is allowed to join?",
    a: "Only people who know me personally and already have a way to contact me. There is no public signup and no open offer to strangers. Even then, joining means accepting a short set of terms so everyone understands the risks and how money moves.",
  },
  {
    q: "Is this run by a licensed advisor?",
    a: "No. I am not licensed. This is an informal friends-and-family arrangement around the Alpha Fund — not a commercial advisory service and not a public fund offering.",
  },
  {
    q: "What is the $1,000 → $100,000 goal?",
    a: "That is a public fund-size goal: grow the Alpha Fund’s actual value toward $100,000 (it started from a $1,000 marker). The meter shows how large the fund is today — including money people have added — not how much the investments have returned. For investment performance, use the NAV return vs the S&P 500 above.",
  },
  {
    q: "Why doesn’t “account up X%” match the YTD return?",
    a: "Deposits raise the total dollars in the fund without counting as investment return. We report time-weighted per-unit (NAV) return so it can be compared fairly to the S&P 500 — the same way a mutual fund does.",
  },
  {
    q: "What if I want more money in later?",
    a: "Same process as the first time: tell me, send the transfer I ask for, and it gets recorded. New money buys into the Alpha Fund at whatever the value is on that day — you do not get credited for gains from before you added it.",
  },
  {
    q: "What is the Substack for?",
    a: "Public writing about markets and positions — free for anyone to read. Being in the Alpha Fund is separate and private; reading the notes does not mean you are invested.",
  },
];

const TERMS: { title: string; body: string }[] = [
  {
    title: "You already know me personally",
    body: "This is not open to the public. You already have a normal way to reach me — text, call, in person. There is no stranger signup.",
  },
  {
    title: "You can lose money",
    body: "You confirm you understand this is investing, not a savings account, and that balances can go down as well as up.",
  },
  {
    title: "This is not paid advice",
    body: "I am not acting as your licensed advisor and I am not charging you. You are choosing to put money into the Alpha Fund, managed informally.",
  },
  {
    title: "Cash moves by arrangement",
    body: "Deposits and withdrawals happen through transfers we coordinate — not an ATM button. Getting money out can take a few days.",
  },
  {
    title: "Your link is private",
    body: "You agree to keep your personal tracking link to yourself. It shows your share only; other members’ details stay private.",
  },
];

export default async function MarketingPage() {
  // Same production data path as the internal dashboard (/app):
  // getFundSummary + getAlpha + getAlphaWindows.
  const [fund, alpha, windows, trackRecordHref] = await Promise.all([
    getFundSummary(),
    getAlpha(),
    getAlphaWindows(),
    getPublicTrackRecordHref(),
  ]);

  // Headline matches dashboard "NAV return (audited)" / All window — not YTD.
  const all = windows.find((w) => w.id === "all")?.alpha;
  const headline = alpha.available ? alpha : all?.available ? all : null;
  const anyBenchmark = windows.some((w) => w.alpha.available) || alpha.available;

  // Charts start at the first audited valuation — same filter as /app dashboard.
  const seriesStart = fund.auditedSince;
  const chartPoints = dedupeNavSeries(
    fund.navSeries
      .filter((p) => !seriesStart || p.date >= seriesStart)
      .map((p) => ({ date: p.date, value: p.navPerUnit })),
  );
  const valuePoints = dedupeNavSeries(
    fund.navSeries
      .filter((p) => !seriesStart || p.date >= seriesStart)
      .map((p) => ({ date: p.date, value: p.fundValue })),
  );
  const publicReturn =
    headline?.available
      ? headline.fundReturn
      : fund.auditedTwr;

  return (
    <div className="bg-[var(--caf-paper)] text-[var(--caf-ink)]">
      {/* —— Hero —— */}
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[var(--caf-ink)] text-[var(--caf-paper)]">
        <div
          className="hero-aurora pointer-events-none absolute inset-[-10%] opacity-90"
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
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm text-[var(--caf-mist)] sm:gap-6">
            <a href="#performance" className="caf-nav-link hover:text-white">
              Performance
            </a>
            <a href="#join" className="caf-nav-link hover:text-white">
              How to join
            </a>
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="caf-nav-link hover:text-white"
            >
              Writing
            </a>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-12 pt-8 sm:justify-end sm:px-8 sm:pb-20 sm:pt-24">
          <p className="marketing-rise font-display text-[clamp(2.25rem,6.5vw,4.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            Capital
            <br />
            Alpha Fund
          </p>
          <h1 className="marketing-rise marketing-rise-delay-1 mt-5 max-w-lg font-display text-xl font-medium leading-snug text-[#b8f53a] sm:mt-6 sm:text-2xl">
            Put money beside people you trust — without needing to pick stocks.
          </h1>
          <p className="marketing-rise marketing-rise-delay-2 mt-3 max-w-xl text-base text-[#d7e3dc] sm:mt-4 sm:text-xl">
            An invite-only Alpha Fund for close friends and family — clear
            tracking, no charge, by design.
          </p>
          <div className="marketing-rise marketing-rise-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <a
              href="#performance"
              className="caf-cta-primary is-live inline-flex items-center justify-center bg-[var(--caf-signal)] px-6 py-3 text-sm font-semibold text-[var(--caf-ink)]"
            >
              See performance
            </a>
            <a
              href="#join"
              className="inline-flex items-center justify-center border border-[var(--caf-mist)]/40 px-6 py-3 text-sm font-medium text-[var(--caf-paper)] transition-all hover:-translate-y-0.5 hover:border-[var(--caf-signal)] hover:text-[var(--caf-signal)]"
            >
              How to join
            </a>
          </div>
        </div>

        <a
          href="#performance"
          className="hero-scroll-cue absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[var(--caf-mist)] sm:flex"
        >
          <span>Scroll</span>
          <span className="block h-8 w-px bg-[var(--caf-signal)]/70" aria-hidden />
        </a>
      </section>

      {/* —— Performance first (prominent) —— */}
      <section
        id="performance"
        className="scroll-mt-8 border-b border-[var(--caf-mist)] bg-white px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
                  Live track record
                </p>
                <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-snug sm:text-[2.5rem]">
                  How the Alpha Fund is doing — versus the market.
                </h2>
              </div>
              <Link
                href={trackRecordHref}
                className="caf-cta-primary inline-flex items-center justify-center bg-[var(--caf-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--caf-paper)]"
              >
                Full track record →
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--caf-mute)]">
              Live numbers from the same production books as the internal
              dashboard. Defaults to the full audited record vs the S&amp;P 500 —
              switch windows to compare YTD or recent periods. Past performance
              does not guarantee future results.
            </p>
          </Reveal>

          <Reveal delayMs={80}>
            <MarketingStats
              returnLabel="NAV return (audited)"
              returnValue={publicReturn}
              returnHint={
                headline?.available
                  ? `${formatDate(headline.anchorDate)} → ${formatDate(headline.asOf)} · same books as the internal dashboard`
                  : fund.auditedSince && fund.auditedTwr != null
                    ? `${formatDate(fund.auditedSince)} → ${fund.asOf ? formatDate(fund.asOf) : "now"} · per-unit since first audited mark`
                    : "Time-weighted per-unit return"
              }
              aum={fund.aum}
              aumHint={`Assets under management${fund.asOf ? ` as of ${formatDate(fund.asOf)}` : ""} (size, not return).`}
              thirdLabel={headline?.available ? `vs ${headline.label}` : "Size goal"}
              thirdValue={headline?.available ? headline.alpha : null}
              thirdIsCurrencyGoal={!headline?.available}
              thirdHint={
                headline?.available
                  ? "Alpha since first audited valuation — same figure as /app"
                  : "Public size target for the Alpha Fund"
              }
              thirdPositive={headline?.available ? headline.alpha >= 0 : null}
            />
          </Reveal>

          <Reveal delayMs={120} className="mt-12">
            {anyBenchmark ? (
              <div className="caf-panel">
                <WindowedPerformance
                  windows={windows}
                  height={320}
                  variant="marketing"
                  defaultWindow="all"
                />
              </div>
            ) : (
              <div className="caf-panel border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-5 sm:p-8">
                <h3 className="font-display text-lg font-semibold">Fund value over time</h3>
                <p className="mt-1 text-sm text-[var(--caf-mute)]">
                  Market comparison fills in when benchmark data is available.
                </p>
                <div className="mt-4">
                  <ValueChart
                    points={valuePoints}
                    height={300}
                    emptyHint="Valuations will appear here as the books are updated."
                  />
                </div>
              </div>
            )}
          </Reveal>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {anyBenchmark && (
              <Reveal delayMs={60}>
                <div className="caf-panel border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-5 sm:p-6">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-[var(--caf-mute)]">
                      Fund value over time
                    </h3>
                    <span className="text-xs text-[var(--caf-mute)]">dollars in the account</span>
                  </div>
                  <ValueChart
                    points={valuePoints}
                    height={240}
                    emptyHint="Valuations will appear here as the books are updated."
                  />
                  <p className="mt-3 text-xs leading-relaxed text-[var(--caf-mute)]">
                    Account value rises with both market gains and new deposits — use NAV return
                    above for performance vs the index.
                  </p>
                </div>
              </Reveal>
            )}
            <Reveal delayMs={120}>
              <div
                className={
                  "caf-panel border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-5 sm:p-6 " +
                  (anyBenchmark ? "" : "lg:col-span-2")
                }
              >
                <GoalProgress
                  current={fund.aum}
                  asOf={fund.asOf ? formatDate(fund.asOf) : null}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* —— What this is —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            In plain English
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            This is the Alpha Fund.
          </h2>
          <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
            <p>
              Friends and family kept asking how they should invest. I am not a
              licensed advisor, I cannot charge for managing money this way, and
              running a separate account for every person was never realistic.
            </p>
            <p>
              So people I already know can put money into{" "}
              <strong className="font-semibold text-[var(--caf-ink)]">
                the Alpha Fund
              </strong>
              . Everyone owns a share of it. When investments do well,
              every share grows. When they do poorly, every share shrinks.
            </p>
            <p>
              There is no app to download and no stock-picking homework for you.
              You send money, it gets invested in the Alpha Fund, and you check your
              share on a private link.
            </p>
          </div>
        </Reveal>
      </section>

      {/* —— Why —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
              Why this exists
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
              Help people close to me — and build a real public track record.
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
              <p>
                Short term: friends and family get a clean way to benefit from the
                same investment decisions without needing a personal advisor
                relationship.
              </p>
              <p>
                Longer term: this site documents growing the Alpha Fund&apos;s{" "}
                <strong className="font-semibold text-[var(--caf-ink)]">size</strong>
                {" "}from a $1,000 marker toward $100,000, alongside a public{" "}
                <strong className="font-semibold text-[var(--caf-ink)]">NAV track record</strong>
                {" "}vs the market. Size and return are different numbers. If results
                stay strong, that record is meant to support a possible future step
                into a formal, licensed fund. That is a maybe — not a promise, and
                not what this site is offering today.
              </p>
              <p>
                For now, this stays free, informal, and limited to people who
                already know me.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* —— How to join —— */}
      <section
        id="join"
        className="scroll-mt-8 mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
      >
        <Reveal>
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            How to join
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Only if we already know each other — and you accept the terms.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            There is no form on this website. If you do not already have a
            personal way to reach me, this offer is not for you.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "Step 1",
              title: "Reach out",
              body: "Text, call, or talk in person. Say you want to put money in. I will tell you whether it is a fit and what comes next.",
            },
            {
              step: "Step 2",
              title: "Review the terms",
              body: "Before any money moves, you will be asked to accept a short set of terms so everyone is clear on risk, process, and privacy.",
            },
            {
              step: "Step 3",
              title: "Send the money",
              body: "You will get exact instructions — usually a normal transfer you already use. Wait for those before sending anything.",
            },
            {
              step: "Step 4",
              title: "Get your private link",
              body: "Once the deposit is in and recorded, you get a personal link to watch your share. Bookmark it — that is your access.",
            },
          ].map((item, i) => (
            <Reveal key={item.step} delayMs={i * 70}>
              <div className="caf-stat-tile">
                <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* —— Terms —— */}
      <section
        id="terms"
        className="scroll-mt-8 border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Terms everyone accepts
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Same page before any money moves.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            We will walk through these when you ask to join. This is the
            substance — not a surprise later.
          </p>
          <ol className="mt-12 max-w-2xl space-y-8">
            {TERMS.map((t, i) => (
              <li key={t.title} className="border-t border-[var(--caf-mist)] pt-6">
                <p className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">{t.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* —— Money out —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Getting money back out
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Want to cash out? Just ask. There is no ATM button.
        </h2>
        <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
          <p>
            Tell me how much you need (some or all). I sell what is needed from
            the Alpha Fund account, send the cash back the same way we usually
            exchange money, and update the books so your share shrinks by the
            right amount.
          </p>
          <p>
            This is not instant like a bank withdrawal. Markets, weekends, and
            transfer times can add a few days. Plan ahead if you know you will
            need the money by a certain date — and please do not invest money
            you might need next week.
          </p>
        </div>
      </section>

      {/* —— What you see —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Keeping track
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Your private link shows only your money.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            No password, no app store. When you open the link you are sent, you
            can see how much you put in, what it is worth now, profit or loss,
            and a simple comparison to the broad U.S. stock market. You will not
            see other people&apos;s names or balances.
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            Anyone can also view the{" "}
            <Link
              href={trackRecordHref}
              className="font-semibold text-[var(--caf-ink)] underline-offset-4 hover:underline"
            >
              public track record
            </Link>{" "}
            for the Alpha Fund — performance and activity, still without member
            identities.
          </p>
        </div>
      </section>

      {/* —— Glossary —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Words you might hear
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          A tiny glossary — no quiz later.
        </h2>
        <dl className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <dt className="font-display text-lg font-semibold">Your share / units</dt>
            <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              When you put money in, you buy a share of the Alpha Fund. We track that
              as &quot;units&quot; so timing is fair — like a mutual fund,
              without you needing a brokerage login.
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">What your money is worth</dt>
            <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              Investments are marked to market from time to time. Your balance =
              your share × that updated value. Between updates, the number can
              be a little stale.
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">S&amp;P 500</dt>
            <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              A common yardstick for the overall U.S. stock market. We show it
              so you can compare &quot;how we did&quot; to &quot;how the market
              did.&quot;
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">Alpha</dt>
            <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              The gap between the Alpha Fund&apos;s NAV return and the S&amp;P 500
              (SPY price) over the same period. Positive means better than the
              yardstick; negative means worse.
            </dd>
          </div>
          <div>
            <dt className="font-display text-lg font-semibold">Fund value vs NAV return</dt>
            <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
              Fund value is total dollars in the account. NAV return is how each
              share performed. Adding money raises fund value; it does not raise
              NAV return.
            </dd>
          </div>
        </dl>
      </section>

      {/* —— Risks —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Please read this
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Honest limits — said upfront.
          </h2>
          <ul className="mt-8 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
              <span>You can lose money. Investing is not a guarantee.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
              <span>
                This is not a bank, not FDIC insured, and not a registered
                product sold to the public.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
              <span>
                I am not a licensed financial advisor and cannot charge for this
                service. It is a private friends-and-family arrangement.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
              <span>
                Any future licensed fund would be a separate project with its
                own rules. Nothing here is an offer for that.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
              <span>
                Only join if you trust me personally, accept the terms, and
                understand the risks. Ask before sending money.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* —— Writing —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Public notes
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Want to follow the thinking? That part is free and public.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          The Capital Alpha Substack is public writing about markets and
          positions. Reading is for anyone. Being in the Alpha Fund is separate
          and only by invitation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            Read on Substack →
          </a>
          <Link
            href={trackRecordHref}
            className="inline-flex items-center justify-center border border-[var(--caf-ink)]/20 px-6 py-3 text-sm font-medium transition-colors hover:border-[var(--caf-ink)]"
          >
            Live track record
          </Link>
        </div>
      </section>

      {/* —— FAQ —— */}
      <section
        id="questions"
        className="scroll-mt-8 border-t border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Common questions
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Still wondering about something?
          </h2>
          <div className="mt-10 max-w-2xl divide-y divide-[var(--caf-mist)] border-y border-[var(--caf-mist)]">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-lg font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {item.q}
                    <span
                      className="mt-1 shrink-0 text-[var(--caf-mute)] transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-xl leading-relaxed text-[var(--caf-mute)]">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            Anything else — including &quot;can I join?&quot; — just ask me
            directly. That conversation is the only front door.
          </p>
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
              Nothing on this site is an offer to the general public or
              personalized investment advice. No fees are charged.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={trackRecordHref}
              className="text-[var(--caf-ink)] underline-offset-4 hover:underline"
            >
              Track record →
            </Link>
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--caf-ink)] underline-offset-4 hover:underline"
            >
              Writing →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function dedupeNavSeries(points: { date: string; value: number }[]) {
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.value);
  return [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
