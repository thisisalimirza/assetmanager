# Portfolio Tracker

A lean webapp for a small independent advisor / fund manager to track and manage
investments across multiple clients (including yourself), replacing a
spreadsheet workflow. It models:

- **Clients** — everyone with money in the fund (you and the people whose money
  you manage), with optional contact details for statements.
- **Transactions** — dated deposits and withdrawals per client. Each records the
  fund's total value _immediately before_ it, which is used to price units.
- **Valuations** — the fund's total market value at a point in time (entered by
  hand, e.g. from Robinhood). The most recent one drives every client's current
  balance.

## How the accounting works (unit / NAV model)

The fund is unitized like a real investment fund. When a client deposits money,
they buy **units** at the current NAV per unit (fund value ÷ units outstanding);
a withdrawal redeems units the same way. A client's balance is
`their units × current NAV per unit`.

This correctly attributes gains and losses only to the period each dollar was
actually invested. A client who deposits after the fund has already gained does
**not** get handed a slice of those earlier gains — which the naive
"split profit by share of total contributions" approach gets wrong. Fund-level
performance is reported as a **time-weighted return (TWR)** off the NAV-per-unit
series, independent of when cash flowed in.

The math is recomputed from the transaction ledger on every read (nothing
derived is stored), and is covered by a scenario test:

```bash
npm run verify
```

## Stack

- **Next.js (App Router)** — server-rendered pages + server actions. No separate
  API server. Client-facing statements are print-optimized pages ("Download PDF"
  → browser print-to-PDF), so there's no heavy PDF/Chromium dependency.
- **SQLite via [Turso](https://turso.tech)** (libSQL) in production — a hosted
  SQLite service, because Vercel's serverless filesystem isn't persistent so a
  plain on-disk SQLite file won't survive there. Locally, the same
  `@libsql/client` talks to a file on disk, so no external service is needed for
  development.
- **Auth** — a single shared password (see env vars below) protects the whole
  app via middleware; there's no multi-user system.

## Environment variables

| Variable              | Required        | Purpose                                             |
| --------------------- | --------------- | --------------------------------------------------- |
| `APP_PASSWORD`        | yes (prod)      | The password to sign in.                            |
| `SESSION_SECRET`      | yes (prod)      | Secret used to sign the session cookie (any random string). |
| `TURSO_DATABASE_URL`  | prod only       | Turso database URL. Omit locally to use `local.db`. |
| `TURSO_AUTH_TOKEN`    | prod only       | Turso auth token.                                   |
| `ALPHA_VANTAGE_API_KEY` | optional      | Free key from [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key), used to fetch S&P 500 prices for the alpha/benchmark comparison. Without it, alpha simply shows "unavailable" — everything else works fine. |

Locally, `APP_PASSWORD`/`SESSION_SECRET` fall back to insecure defaults so the
app runs without setup — set real values before deploying.

## Local development

```bash
npm install
APP_PASSWORD=yourpass SESSION_SECRET=dev npm run dev
```

Uses a local SQLite file (`local.db`, gitignored) by default; tables are created
automatically on first run. To load the historical Ali/Mom data:

```bash
npm run seed
```

It skips itself if any client already exists, so it's safe to run twice.

To **rebuild** a database that already has data from the canonical dataset in
`src/scripts/seed.ts` (e.g. after reconciling figures against the brokerage),
use `npm run reconcile` — it wipes clients/transactions/valuations and re-seeds,
then prints the resulting per-client split so you can confirm it ties out. Point
it at production by exporting `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` first.

If you don't have a local shell handy (e.g. you're on mobile), `npm run gen-sql`
prints a plain SQL script that does the same rebuild — paste it into Turso's
web dashboard SQL console (app.turso.tech → your database → SQL/Studio tab)
instead of running the npm script locally.

## Migrating from the original spreadsheet-era schema

If the database still has the original v1 tables (`contributors` /
`contributions` / `snapshots`), they are migrated automatically on first run
into the new `clients` / `transactions` / `valuations` tables. Because v1 never
recorded interim valuations, migrated deposits are priced at a flat NAV — this
reproduces the exact balances the old model showed, so **nobody's balance jumps
at migration**. Only deposits recorded _after_ migrating are priced against real
market values.

## Deploying to Vercel

1. **Create a Turso database** (free tier is plenty):
   - `curl -sSfL https://get.tur.so/install.sh | bash`
   - `turso auth login`
   - `turso db create portfolio-tracker`
   - `turso db show portfolio-tracker --url` → `TURSO_DATABASE_URL`
   - `turso db tokens create portfolio-tracker` → `TURSO_AUTH_TOKEN`
2. **(Optional) seed the remote DB once**: run `npm run seed` locally with
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` exported in your shell.
3. **Deploy**: import the repo at [vercel.com/new](https://vercel.com/new) and
   set `APP_PASSWORD`, `SESSION_SECRET`, `TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN`, and (optional) `ALPHA_VANTAGE_API_KEY` as Production
   environment variables. Vercel auto-detects Next.js — no other config needed.

Note: the S&P benchmark data comes from Alpha Vantage rather than a free
scraping-style endpoint (like Stooq) specifically because those commonly block
requests from cloud/datacenter IP ranges — Vercel's outbound IPs included —
regardless of headers. A keyed API avoids that.

## Possible next steps

- Management / performance fees (carry, high-water marks) per client.
- Per-position (ticker-level) holdings and allocation breakdowns.
- One-click server-generated PDF statements emailed to clients (e.g. via
  `@react-pdf/renderer`) instead of browser print-to-PDF.
