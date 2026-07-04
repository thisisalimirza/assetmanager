# Portfolio Tracker

A small webapp for tracking a shared investment portfolio contributed to by
multiple people (e.g. you and family members), replacing a spreadsheet-based
workflow. It tracks:

- **Contributors** — the people who have money in the portfolio.
- **Contributions** — dated deposits (or withdrawals, as negative amounts)
  per contributor. These sum to each person's cost basis.
- **Snapshots** — the portfolio's total value at a point in time (you enter
  this by hand, e.g. by checking Robinhood). The most recent snapshot is used
  as "current value."

From these, the dashboard computes total profit/loss and splits it pro-rata
by each contributor's share of total contributions (dollar-weighted, not
time-weighted — a dollar contributed yesterday counts the same as a dollar
contributed years ago). This matches the spreadsheet model it replaces. If
you later want time-weighted returns (so early money is credited for
compounding longer), that would replace the `share` calculation in
`src/lib/portfolio.ts` with an XIRR-style calculation — flagging it here in
case it matters once contribution timing varies more.

## Stack

- **Next.js (App Router)** — server-rendered pages, server actions for
  mutations. No separate API server.
- **SQLite via [Turso](https://turso.tech)** (libSQL) — in production. Turso
  is a hosted SQLite service, chosen because Vercel's serverless functions
  don't have a persistent filesystem, so a plain on-disk SQLite file won't
  survive between requests/deploys there. Locally, the same `@libsql/client`
  talks to a plain file on disk, so no external service is needed for
  day-to-day development.

## Local development

```bash
npm install
npm run dev
```

By default this uses a local SQLite file (`local.db`, gitignored) — no setup
required. Tables are created automatically on first run.

To import your historical data from the old spreadsheet (Ali/Mom
contributions + an initial snapshot), run once against a fresh database:

```bash
npm run seed
```

It skips itself if contributors already exist, so it's safe even if you
forget and run it twice.

## Deploying to Vercel

1. **Create a Turso database** (free tier is plenty for this):
   - Install the CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
   - `turso auth login`
   - `turso db create portfolio-tracker`
   - `turso db show portfolio-tracker --url` → this is `TURSO_DATABASE_URL`
   - `turso db tokens create portfolio-tracker` → this is `TURSO_AUTH_TOKEN`
2. **Import your existing data into Turso** (optional, one-time): run
   `npm run seed` locally with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
   set in your shell so it seeds the remote database instead of the local
   file.
3. **Deploy to Vercel**: import the repo at [vercel.com/new](https://vercel.com/new),
   and set the environment variables `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN` in the project settings. No other configuration is
   needed — Vercel auto-detects Next.js.

Since this is meant for personal/family use with no login system, don't
share the deployed URL publicly — anyone with the link can view and edit
the data.
