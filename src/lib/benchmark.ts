import { getDb } from "./db";

// Default benchmark: the S&P 500 tracked via the SPY ETF. Prices come from
// Alpha Vantage (requires a free API key — see README). We use a keyed API
// rather than scraping-style CSV endpoints (e.g. Stooq) because those commonly
// block datacenter IPs like Vercel's.
//
// Free-tier strategy: monthly history for long windows (YTD / 1Y / all-time),
// plus daily compact (~100 trading days) so recent 3M / 6M windows are not
// stuck on month-end stamps. Full daily history is paid-only.
//
// Fetched server-side and cached in benchmark_prices so we don't hit the
// network (or its daily rate limit) on every render.
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

type AvSeriesKey = "Monthly Time Series" | "Time Series (Daily)";

async function fetchFromAlphaVantage(
  symbol: string,
  apiKey: string,
  fn: "TIME_SERIES_MONTHLY" | "TIME_SERIES_DAILY",
  seriesKey: AvSeriesKey,
): Promise<{ date: string; close: number }[] | null> {
  const url = `${ALPHA_VANTAGE_URL}?function=${fn}&symbol=${encodeURIComponent(
    symbol,
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
      json["Error Message"] || json["Note"] || json["Information"],
    );
    return null;
  }

  const series = json[seriesKey] as Record<string, Record<string, string>> | undefined;
  if (!series) {
    console.error(
      `[benchmark] Alpha Vantage response missing ${seriesKey} (keys: ${Object.keys(json).join(", ")})`,
    );
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

async function upsertBenchmarkRows(
  symbol: string,
  rows: { date: string; close: number }[],
): Promise<void> {
  const db = await getDb();
  // Batch defensively to stay under libSQL's per-request statement limits.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.batch(
      rows.slice(i, i + CHUNK).map((r) => ({
        sql: "INSERT OR REPLACE INTO benchmark_prices (symbol, date, close) VALUES (?, ?, ?)",
        args: [symbol, r.date, r.close],
      })),
    );
  }
}

/**
 * Ensures we have cached SPY closes for `symbol` back through `fromDate`.
 *
 * Strategy (Alpha Vantage free tier):
 * - Monthly history covers long windows (YTD / 1Y / all-time).
 * - Daily compact (~100 trading days) fills recent months so 3M / 6M
 *   comparisons are not stuck on month-end stamps.
 *
 * Fetches only when the cache is missing, doesn't reach `fromDate`, or
 * hasn't been refreshed in a while. Network/parse failures are logged and
 * swallowed — callers degrade to "benchmark unavailable".
 */
export async function ensureBenchmarkData(symbol: string, fromDate: string): Promise<void> {
  const today = todayIso();
  const latest = await maxCachedDate(symbol);
  const fresh = latest && daysBetween(latest, today) <= 3 && latest >= fromDate;
  if (fresh) return;

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("[benchmark] ALPHA_VANTAGE_API_KEY is not set — skipping benchmark fetch");
    return;
  }

  // Monthly first so long history is present even if the daily call is rate-limited.
  const monthly = await fetchFromAlphaVantage(
    symbol,
    apiKey,
    "TIME_SERIES_MONTHLY",
    "Monthly Time Series",
  );
  if (monthly) await upsertBenchmarkRows(symbol, monthly);

  const daily = await fetchFromAlphaVantage(
    symbol,
    apiKey,
    "TIME_SERIES_DAILY",
    "Time Series (Daily)",
  );
  if (daily) await upsertBenchmarkRows(symbol, daily);
}

/** Latest close on or before `date`, or null if we have no data that early. */
export async function benchmarkCloseOnOrBefore(
  symbol: string,
  date: string,
): Promise<number | null> {
  const row = await benchmarkPriceOnOrBefore(symbol, date);
  return row?.close ?? null;
}

/** Latest priced bar on or before `date` (date + close), or null. */
export async function benchmarkPriceOnOrBefore(
  symbol: string,
  date: string,
): Promise<{ date: string; close: number } | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT date, close FROM benchmark_prices WHERE symbol = ? AND date <= ? ORDER BY date DESC LIMIT 1",
    args: [symbol, date],
  });
  const row = res.rows[0];
  if (!row) return null;
  const close = Number(row.close);
  if (!Number.isFinite(close)) return null;
  return { date: String(row.date), close };
}
