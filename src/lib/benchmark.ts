import { getDb } from "./db";

// Default benchmark: the S&P 500 tracked via the SPY ETF. Prices come from
// Alpha Vantage's free TIME_SERIES_MONTHLY endpoint (requires a free API key
// — see README). We use a keyed API rather than a scraping-style endpoint
// (e.g. Stooq) because free CSV-export endpoints commonly block requests
// from cloud/datacenter IP ranges like Vercel's, regardless of headers —
// Alpha Vantage is built for exactly this kind of programmatic access.
//
// We use the *monthly* series rather than daily: Alpha Vantage locked full
// daily history (outputsize=full) behind a paid plan, and the free daily
// tier only returns the last ~100 trading days — not enough to reach back to
// an anchor date from a year ago. Monthly history has no such restriction and
// is included in the free tier. Monthly granularity is plenty of precision
// for a "performance since inception" comparison measured in months/years.
//
// Fetched server-side and cached in the benchmark_prices table so we don't
// hit the network (or its daily rate limit) on every render.
export const BENCHMARK_SYMBOL = "SPY";
export const BENCHMARK_LABEL = "S&P 500";

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

async function maxCachedDate(symbol: string): Promise<string | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT MAX(date) AS d FROM benchmark_prices WHERE symbol = ?",
    args: [symbol],
  });
  const d = res.rows[0]?.d;
  return d == null ? null : String(d);
}

async function fetchFromAlphaVantage(
  symbol: string,
  apiKey: string
): Promise<{ date: string; close: number }[] | null> {
  const url = `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_MONTHLY&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error(`[benchmark] Alpha Vantage responded ${res.status} ${res.statusText}`);
    return null;
  }
  const json = (await res.json()) as Record<string, unknown>;

  if (json["Error Message"] || json["Note"] || json["Information"]) {
    console.error(
      `[benchmark] Alpha Vantage error/rate-limit:`,
      json["Error Message"] || json["Note"] || json["Information"]
    );
    return null;
  }

  const series = json["Monthly Time Series"] as Record<string, Record<string, string>> | undefined;
  if (!series) {
    console.error(`[benchmark] Alpha Vantage response missing time series (keys: ${Object.keys(json).join(", ")})`);
    return null;
  }

  const rows: { date: string; close: number }[] = [];
  for (const [date, day] of Object.entries(series)) {
    const close = Number(day["4. close"]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(close)) {
      rows.push({ date, close });
    }
  }
  if (rows.length === 0) {
    console.error("[benchmark] Alpha Vantage returned a time series with no parseable rows");
    return null;
  }
  return rows;
}

/**
 * Ensures we have cached monthly closes for `symbol` back through `fromDate`.
 * Fetches from Alpha Vantage only when the cache is missing, doesn't reach
 * `fromDate`, or hasn't been refreshed in a while — monthly data changes
 * slowly, and its free tier has a modest daily rate limit. Network/parse
 * failures are logged (check Vercel function logs) and swallowed — callers
 * degrade to "benchmark unavailable" rather than throwing, since a
 * third-party price feed being briefly down shouldn't break the dashboard.
 */
export async function ensureBenchmarkData(symbol: string, fromDate: string): Promise<void> {
  const today = todayIso();
  const latest = await maxCachedDate(symbol);
  if (latest && daysBetween(latest, today) <= 7 && latest >= fromDate) {
    return; // fresh enough
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("[benchmark] ALPHA_VANTAGE_API_KEY is not set — skipping benchmark fetch");
    return;
  }

  const rows = await fetchFromAlphaVantage(symbol, apiKey);
  if (!rows) return;

  const db = await getDb();
  // Monthly history is only a few hundred rows, but batch defensively anyway
  // to stay well under libSQL's per-request statement limits.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.batch(
      rows.slice(i, i + CHUNK).map((r) => ({
        sql: "INSERT OR REPLACE INTO benchmark_prices (symbol, date, close) VALUES (?, ?, ?)",
        args: [symbol, r.date, r.close],
      }))
    );
  }
}

/** Latest close on or before `date`, or null if we have no data that early. */
export async function benchmarkCloseOnOrBefore(symbol: string, date: string): Promise<number | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT close FROM benchmark_prices WHERE symbol = ? AND date <= ? ORDER BY date DESC LIMIT 1",
    args: [symbol, date],
  });
  const c = res.rows[0]?.close;
  return c == null ? null : Number(c);
}
