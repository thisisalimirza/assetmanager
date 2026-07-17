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
    q: "Are there fees?",
    a: "Ali does not charge a management fee or take a cut of profits. You keep what your share of the fund earns (or loses). Brokerage costs inside the account are just part of normal investing.",
  },
  {
    q: "Who is allowed to join?",
    a: "Close friends and close family that Ali already knows. There is no public signup and no open invitation to strangers. If you are not sure you qualify, just ask him.",
  },
  {
    q: "Is Ali a financial advisor?",
    a: "No. He is not a licensed advisor. This is an informal friends-and-family arrangement — people pooling money into one portfolio he already runs — not a commercial advisory service.",
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

export default async function MarketingPage() {
  const [fund, alpha] = await Promise.all([getFundSummary(), getAlpha()]);

  const headlineReturn = alpha.available ? alpha.fundReturn : fund.twr;
  const growthOf10k = 10_000 * (1 + headlineReturn);
  const chartPoints = trimFlatSeedEra(
    dedupeNavSeries(fund.navSeries.map((p) => ({ date: p.date, value: p.navPerUnit }))),
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
          <nav className="flex items-center gap-4 text-sm text-[var(--caf-mist)] sm:gap-6">
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
            A small, invite-only investment pool for close friends and family.
            Ali handles the investing. You get a clear view of your share.
          </p>
          <div className="marketing-rise marketing-rise-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <a
              href="#join"
              className="inline-flex items-center justify-center bg-[var(--caf-signal)] px-6 py-3 text-sm font-semibold text-[var(--caf-ink)] transition-transform hover:-translate-y-0.5"
            >
              How to join
            </a>
            <a
              href="#questions"
              className="inline-flex items-center justify-center border border-[var(--caf-mist)]/40 px-6 py-3 text-sm font-medium text-[var(--caf-paper)] transition-colors hover:border-[var(--caf-signal)] hover:text-[var(--caf-signal)]"
            >
              Common questions
            </a>
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
            licensed advisor, and managing a separate account for every person
            was never realistic.
          </p>
          <p>
            So instead, close friends and family can put money into{" "}
            <strong className="font-semibold text-[var(--caf-ink)]">
              one portfolio Ali already runs
            </strong>
            . Everyone owns a slice of that same pot. When the investments do
            well, every slice grows. When they do poorly, every slice shrinks.
          </p>
          <p>
            There is no app to download, no stock-picking homework for you, and
            no fee paid to Ali. You send money, he invests the pool, and you can
            check your slice anytime on a private link.
          </p>
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
            Four simple steps. Nothing happens online until Ali says you are in.
          </h2>

          <ol className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 1
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Ask Ali</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Text, call, or talk in person. Say you want to put money in the
                fund. This is invite-only — if it is a fit, he will say yes and
                walk you through the rest.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 2
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Send the money</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Ali will tell you exactly how to send it — usually a normal
                transfer you already know (like Venmo or a bank transfer). Do
                not send money until he confirms the amount and method.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 3
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">It gets invested</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Once he receives it, he adds it to the shared brokerage account
                and records your deposit in the books. Your money becomes a
                share of the whole pot from that day forward.
              </p>
            </li>
            <li>
              <span className="font-display text-sm font-semibold text-[var(--caf-signal-deep)]">
                Step 4
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold">Get your private link</h3>
              <p className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Ali sends you a personal web link. Open it anytime to see how
                much you have in, what it is worth now, and how you are doing.
                Bookmark it — that link is your access.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* —— Money out —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          Getting money back out
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Want to cash out? Ask Ali. There is no ATM button.
        </h2>
        <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-[var(--caf-mute)]">
          <p>
            Tell him how much you need (some or all). He sells what is needed
            from the shared account, sends the cash back to you the same way you
            usually exchange money, and updates the books so your share shrinks
            by the right amount.
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
            No password, no app store. When you open the link Ali sends you, you
            can see:
          </p>
          <ul className="mt-8 max-w-xl space-y-3 text-lg leading-relaxed text-[var(--caf-mute)]">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-signal-deep)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--caf-ink)]">How much you put in</strong>
                {" — "}total you have sent, minus anything you already took out
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-signal-deep)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--caf-ink)]">What it is worth now</strong>
                {" — "}your slice of the pot at the latest update
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-signal-deep)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--caf-ink)]">Profit or loss</strong>
                {" — "}the difference, in dollars and as a percent
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-signal-deep)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--caf-ink)]">A simple comparison</strong>
                {" — "}how you would have done if the same money had sat in the
                broad U.S. stock market (the S&amp;P 500) instead
              </span>
            </li>
          </ul>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
            You will not see other people’s names or balances. If you ever lose
            the link, ask Ali for a new one — the old one can be turned off.
          </p>
        </div>
      </section>

      {/* —— Performance (plain labels) —— */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="font-display text-sm font-semibold tracking-[0.06em] uppercase text-[var(--caf-mute)]">
          How the fund has done
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-snug sm:text-[2.35rem]">
          Recent results — explained simply.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--caf-mute)]">
          These numbers are for the shared pot as a whole, not a promise of what
          you will earn. Past performance does not guarantee future results.
          Window: {performanceWindow}.
        </p>

        <dl className="mt-12 grid gap-10 border-t border-[var(--caf-mist)] pt-10 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-[var(--caf-mute)]">Fund return</dt>
            <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
              {formatSignedPercent(headlineReturn)}
            </dd>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
              How much $1 invested in the pot grew over this period, after ups
              and downs. This is the fund&apos;s investment performance.
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
                  What a plain &quot;own the whole U.S. stock market&quot;
                  approach returned in the same stretch of time.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Extra vs the market</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums text-[var(--caf-signal-deep)]">
                  {formatSignedPercent(alpha.alpha)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  Sometimes called <em>alpha</em> — how much the fund beat (or
                  trailed) simply holding the market.
                </dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">Including deposit timing</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
                  {formatSignedPercent(fund.simpleReturn)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  A second view that factors in when cash moved in and out —
                  closer to what a person&apos;s own experience can feel like.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--caf-mute)]">If $10,000 had been in</dt>
                <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">
                  {formatCurrency(growthOf10k)}
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--caf-mute)]">
                  A hypothetical example using the same fund return — not a
                  guarantee for any real deposit.
                </dd>
              </div>
            </>
          )}
        </dl>
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
                When you put money in, you are buying a slice of the pot. We
                track that slice as &quot;units&quot; so everyone is treated
                fairly — like shares of a mutual fund, without you needing a
                brokerage login.
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">What your money is worth</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                The investments are marked to their current market value from
                time to time. Your balance = your slice × that updated value.
                Between updates, the number you see can be a little stale.
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">S&amp;P 500</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                A common yardstick for the overall U.S. stock market — roughly
                the 500 largest public companies. We show it so you can compare
                &quot;how we did&quot; to &quot;how the market did.&quot;
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold">Alpha</dt>
              <dd className="mt-2 leading-relaxed text-[var(--caf-mute)]">
                Fancy word for the gap between the fund&apos;s return and the
                market&apos;s return over the same period. Positive means the
                fund did better than the yardstick; negative means worse.
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
              This is not a bank, not FDIC insured, and not a registered
              investment product sold to the public.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Ali is not a licensed financial advisor and does not charge for
              this. It is a private friends-and-family arrangement.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Getting cash out takes coordination and a little time — it is not
              an instant withdrawal button.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--caf-ink)]" aria-hidden />
            <span>
              Only join if you trust Ali personally and understand the risks. If
              anything is unclear, ask him before sending money.
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
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center bg-[var(--caf-ink)] px-6 py-3 text-sm font-semibold text-[var(--caf-paper)] transition-transform hover:-translate-y-0.5"
          >
            Read Capital Alpha on Substack →
          </a>
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
          Anything else — including &quot;can I join?&quot; — just ask Ali
          directly. That conversation is the front door.
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
              personalized investment advice.
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
