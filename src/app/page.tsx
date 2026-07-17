import Link from "next/link";
import { getFundSummary } from "@/lib/portfolio";
import { getPublicTrackRecordHref } from "@/lib/public-links";
import { getAlpha } from "@/lib/analytics";
import {
  formatCurrency,
  formatSignedPercent,
  formatDate,
} from "@/lib/format";
import { HeroPerformance } from "@/app/components/HeroPerformance";
import { ComparisonChart } from "@/app/components/ComparisonChart";
import { ValueChart } from "@/app/components/ValueChart";
import { GoalProgress } from "@/app/components/GoalProgress";

export const dynamic = "force-dynamic";

const SUBSTACK_URL = "https://capitalalpha.substack.com/";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need an account or password?",
    a: "No. After you join, Ali sends you a private link. That link is your window into your share — open it anytime on your phone or computer. Bookmark it. There is nothing to log into.",
  },
  {
    q: "Is this like a bank account?",
    a: "No. Money in the fund is invested in the stock market (and related investments Ali chooses). The value goes up and down. It is not FDIC insured, and it is not a savings account.",
  },
  {
    q: "Can I lose money?",
    a: "Yes. Markets fall sometimes. You can get back less than you put in. Only put in money you can afford to leave invested for a while.",
  },
  {
    q: "Are there fees? Why is it free?",
    a: "Ali cannot legally charge for this arrangement — and he does not. No management fee, no cut of profits. That is also why it stays invite-only for people who already know him personally.",
  },
  {
    q: "Who is allowed to join?",
    a: "Only people who know Ali personally and already have a way to contact him. There is no public signup form and no open offer to strangers. Even then, joining means accepting a short set of terms so everyone understands the risks and how money moves.",
  },
  {
    q: "Is Ali a financial advisor?",
    a: "No. He is not licensed. This is an informal friends-and-family pool — not a commercial advisory service and not a public fund offering.",
  },
  {
    q: "What is the $1,000 → $100,000 goal?",
    a: "Ali is building a public track record of growing money through investing. The long-term marker he is aiming at is turning $1,000 into $100,000. The live charts on this site and the public track record page are part of that record.",
  },
  {
    q: "What if I want more money in later?",
    a: "Same process as the first time: tell Ali, send the transfer he asks for, and he records it. New money buys into the fund at whatever the value is on that day — you do not get credited for gains from before you added it.",
  },
  {
    q: "What is the Substack for?",
    a: "That is Ali’s public writing — how he thinks about markets and positions. Anyone can read it. Being in the fund is separate and private; reading the notes does not mean you are invested.",
  },
];

const TERMS: { title: string; body: string }[] = [
  {
    title: "You know Ali personally",
    body: "This is not open to the public. You already have a normal way to reach him — text, call, in person. There is no stranger signup.",
  },
  {
    title: "You can lose money",
    body: "You confirm you understand this is investing, not a savings account, and that balances can go down as well as up.",
  },
  {
    title: "This is not paid advice",
    body: "Ali is not acting as your licensed advisor and is not charging you. You are choosing to put money into a shared pool he manages informally.",
  },
  {
    title: "Cash moves by arrangement",
    body: "Deposits and withdrawals happen through transfers Ali coordinates with you — not an ATM button. Getting money out can take a few days.",
  },
  {
    title: "Your link is private",
    body: "You agree to keep your personal tracking link to yourself. It shows your share only; other members’ details stay private.",
  },
];

export default async function MarketingPage() {
  const [fund, alpha, trackRecordHref] = await Promise.all([
    getFundSummary(),
    getAlpha(),
    getPublicTrackRecordHref(),
  ]);

  const headlineReturn = alpha.available ? alpha.fundReturn : fund.twr;
  const growthOf1k = 1_000 * (1 + fund.twr);
  const chartPoints = trimFlatSeedEra(
    dedupeNavSeries(fund.navSeries.map((p) => ({ date: p.date, value: p.navPerUnit }))),
  );
  const valuePoints = trimFlatSeedEra(
    dedupeNavSeries(fund.navSeries.map((p) => ({ date: p.date, value: p.fundValue }))),
  );

  const performanceWindow = alpha.available
    ? `from ${formatDate(alpha.anchorDate)} to ${formatDate(alpha.asOf)}`
    : fund.asOf
      ? `as of ${formatDate(fund.asOf)}`
      : "since the fund started";

  return (
    <div className="bg-[var(--caf-paper)] text-[var(--caf-ink)]">
      {/* —— Hero —— */}
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
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm text-[var(--caf-mist)] sm:gap-6">
            <Link href={trackRecordHref} className="transition-colors hover:text-white">
              Track record
            </Link>
            <a href="#join" className="transition-colors hover:text-white">
              How to join
            </a>
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
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
            An invite-only investment pool for people who already know Ali.
            He handles the investing. You get a clear view of your share. No
            charge — by design.
          </p>
          <div className="marketing-rise marketing-rise-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <a
              href="#join"
              className="inline-flex items-center justify-center bg-[var(--caf-signal)] px-6 py-3 text-sm font-semibold text-[var(--caf-ink)] transition-transform hover:-translate-y-0.5"
            >
              How to join
            </a>
            <Link
              href={trackRecordHref}
              className="inline-flex items-center justify-center border border-[var(--caf-mist)]/40 px-6 py-3 text-sm font-medium text-[var(--caf-paper)] transition-colors hover:border-[var(--caf-signal)] hover:text-[var(--caf-signal)]"
            >
              See live track record
            </Link>
          </div>
        </div>
      </section>

      {/* —— What this is —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          In plain English
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Think of it as one shared investment pot.
        </h2>
        <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
          <p>
            People Ali knows kept asking how they should invest. He is not a
            licensed advisor, he cannot charge for managing money this way, and
            running a separate account for every person was never realistic.
          </p>
          <p>
            So close friends and family who already know him can put money into{" "}
            <strong className="font-semibold text-[var(--caf-ink)]">
              one portfolio he runs
            </strong>
            . Everyone owns a slice of that same pot. When investments do well,
            every slice grows. When they do poorly, every slice shrinks.
          </p>
          <p>
            There is no app to download and no stock-picking homework for you.
            You send money, he invests the pool, and you check your slice on a
            private link.
          </p>
        </div>
      </section>

      {/* —— Why + $1k to $100k —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Why this exists
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Help people close to him — and build a real public track record.
          </h2>
          <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
            <p>
              Short term: friends and family get a clean way to benefit from the
              same investment decisions without needing Ali to be their
              personal advisor.
            </p>
            <p>
              Longer term: Ali is documenting the journey of growing money from{" "}
              <strong className="font-semibold text-[var(--caf-ink)]">$1,000 toward $100,000</strong>
              {" "}in public. If results stay strong and he remains confident in
              the work, that record is meant to support a future step into a
              formal, licensed fund someday. That is a maybe — not a promise,
              and not what this site is selling today.
            </p>
            <p>
              For now, this arrangement stays free, informal, and limited to
              people who know him personally.
            </p>
          </div>

          <div className="mt-12 max-w-3xl border border-[var(--caf-mist)] bg-[var(--caf-paper)] p-6 sm:p-8">
            <GoalProgress current={growthOf1k} />
          </div>
        </div>
      </section>

      {/* —— Live visuals + track record CTA —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
              Live numbers
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
              See the portfolio, not just a press release.
            </h2>
          </div>
          <Link
            href={trackRecordHref}
            className="inline-flex items-center justify-center bg-[var(--caf-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            Open full track record →
          </Link>
        </div>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          The public track record page shows performance versus the market and
          the fund&apos;s trading activity — without anyone&apos;s private
          balances. Window: {performanceWindow}.
        </p>

        <dl className="mt-10 grid gap-8 border-t border-[var(--caf-mist)] pt-10 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-[var(--caf-mute)]">Fund return</dt>
            <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
              {formatSignedPercent(headlineReturn)}
            </dd>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
              How much the shared pot grew over this period after ups and downs.
            </dd>
          </div>
          {alpha.available ? (
            <>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Broad market (S&amp;P 500)</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
                  {formatSignedPercent(alpha.benchmarkReturn)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  Same stretch of time, if you just owned the overall U.S. market.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Extra vs the market</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums text-[var(--caf-signal-deep)]">
                  {formatSignedPercent(alpha.alpha)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  Also called <em>alpha</em> — how much the fund beat or trailed
                  that yardstick.
                </dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">$1,000 would be about</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
                  {formatCurrency(growthOf1k)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  Hypothetical using the fund&apos;s published return since start.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Goal marker</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
                  $100,000
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  The public long-term target for the track-record journey.
                </dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="border border-[var(--caf-mist)] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-[var(--caf-mute)]">
                Fund value over time
              </h3>
              <span className="text-xs text-[var(--caf-mute)]">shared pot</span>
            </div>
            <ValueChart
              points={valuePoints}
              emptyHint="Valuations will appear here as the books are updated."
            />
          </div>
          <div className="border border-[var(--caf-mist)] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-[var(--caf-mute)]">
                {alpha.available ? `Vs ${alpha.label}` : "Market comparison"}
              </h3>
              <span className="text-xs text-[var(--caf-mute)]">growth of $1</span>
            </div>
            {alpha.available ? (
              <ComparisonChart
                series={alpha.series}
                benchmarkLabel={alpha.label}
                primaryLabel="This fund"
                height={200}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center px-4 text-center text-sm text-[var(--caf-mute)]">
                Market comparison fills in when benchmark data is available. The
                full track record page still shows the fund&apos;s own return.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* —— How to join —— */}
      <section
        id="join"
        className="scroll-mt-8 border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            How to join
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Only if you already know Ali — and accept the terms.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            There is no form on this website. If you do not already have a
            personal way to reach him, this offer is not for you.
          </p>

          <ol className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 1
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Reach out to Ali</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Text, call, or talk in person. Say you want to put money in. He
                will tell you whether it is a fit and what comes next.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 2
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Review the terms</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Before any money moves, you will be asked to accept a short set
                of terms so everyone is clear on risk, process, and privacy.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 3
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Send the money</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Ali will tell you exactly how — usually a normal transfer you
                already use. Wait for his instructions before sending anything.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 4
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Get your private link</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Once the deposit is in and recorded, you get a personal link to
                watch your share. Bookmark it — that is your access.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* —— Terms —— */}
      <section id="terms" className="scroll-mt-8 mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Terms everyone accepts
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Same page before any money moves.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          Ali will walk you through these when you ask to join. This is the
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
      </section>

      {/* —— Money out —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Getting money back out
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Want to cash out? Ask Ali. There is no ATM button.
          </h2>
          <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
            <p>
              Tell him how much you need (some or all). He sells what is needed
              from the shared account, sends the cash back to you the same way
              you usually exchange money, and updates the books so your share
              shrinks by the right amount.
            </p>
            <p>
              This is not instant like a bank withdrawal. Markets, weekends, and
              transfer times can add a few days. Plan ahead if you know you will
              need the money by a certain date — and please do not invest money
              you might need next week.
            </p>
          </div>
        </div>
      </section>

      {/* —— What you see —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Keeping track
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Your private link shows only your money.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          No password, no app store. When you open the link Ali sends you, you
          can see how much you put in, what it is worth now, profit or loss, and
          a simple comparison to the broad U.S. stock market. You will not see
          other people&apos;s names or balances.
        </p>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          Anyone can also view the{" "}
          <Link href={trackRecordHref} className="font-semibold text-[var(--caf-ink)] underline-offset-4 hover:underline">
            public track record
          </Link>{" "}
          for the whole fund — performance and activity, still without member
          identities.
        </p>
      </section>

      {/* —— Glossary —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
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
                When you put money in, you buy a slice of the pot. We track that
                as &quot;units&quot; so timing is fair — like a mutual fund,
                without you needing a brokerage login.
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">What your money is worth</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Investments are marked to market from time to time. Your
                balance = your slice × that updated value. Between updates, the
                number can be a little stale.
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">S&amp;P 500</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                A common yardstick for the overall U.S. stock market. We show it
                so you can compare &quot;how we did&quot; to &quot;how the
                market did.&quot;
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">Alpha</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                The gap between the fund&apos;s return and the market&apos;s
                return over the same period. Positive means better than the
                yardstick; negative means worse.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* —— Risks —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
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
              This is not a bank, not FDIC insured, and not a registered product
              sold to the public.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Ali is not a licensed financial advisor and cannot charge for this
              service. It is a private friends-and-family arrangement.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Any future licensed fund would be a separate project with its own
              rules. Nothing here is an offer for that.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Only join if you trust Ali personally, accept the terms, and
              understand the risks. Ask before sending money.
            </span>
          </li>
        </ul>
      </section>

      {/* —— Writing —— */}
      <section className="border-y border-[var(--caf-mist)] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
            Public notes
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
            Want to follow the thinking? That part is free and public.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            On Substack, Ali writes about markets and positions in plain view.
            Reading is for anyone. Being in the fund is separate and only by
            invitation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
            >
              Read Capital Alpha on Substack →
            </a>
            <Link
              href={trackRecordHref}
              className="inline-flex items-center justify-center border border-[var(--caf-ink)]/20 px-6 py-3 text-sm font-medium transition-colors hover:border-[var(--caf-ink)]"
            >
              Live track record
            </Link>
          </div>
        </div>
      </section>

      {/* —— FAQ —— */}
      <section
        id="questions"
        className="scroll-mt-8 mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
      >
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
          Anything else — including &quot;can I join?&quot; — ask Ali directly.
          That conversation is the only front door.
        </p>
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
            <Link
              href="/login"
              className="text-[var(--caf-mute)] underline-offset-4 hover:underline"
            >
              Books login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function dedupeNavSeries(points: { date: string; value: number }[]) {
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.value);
  return [...byDate.entries()].map(([date, value]) => ({ date, value }));
}

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
  return points.slice(Math.max(0, start));
}
