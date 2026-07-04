import { getDb } from "./db";

// Default benchmark: the S&P 500 tracked via the SPY ETF. Prices come from
// Stooq's free daily CSV endpoint (no API key). Fetched server-side and cached
// in the benchmark_prices table so we don't hit the network on every render.
export const BENCHMARK_SYMBOL = "spy.us";
export const BENCHMARK_LABEL = "S&P 500";

// Stooq mirrors — .com is sometimes geo/rate-limited; .pl usually still works.
const STOOQ_HOSTS = ["stooq.com", "stooq.pl"];

function compact(date: string): string {
  return date.slice(0, 10).replace(/-/g, "");
}

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

function parseCsv(text: string): { date: string; close: number }[] {
  const rows: { date: string; close: number }[] = [];
  for (const line of text.trim().split("\n").slice(1)) {
    const cols = line.split(",");
    const date = cols[0];
    const close = Number(cols[4]);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(close)) {
      rows.push({ date, close });
    }
  }
  return rows;
}

async function fetchFromHost(
  host: string,
  symbol: string,
  from: string,
  to: string
): Promise<{ date: string; close: number }[] | null> {
  const url = `https://${host}/q/d/l/?s=${symbol}&i=d&d1=${compact(from)}&d2=${compact(to)}`;
  const res = await fetch(url, {
    cache: "no-store",
    // Stooq's CSV endpoint rejects/rate-limits requests without a browser-like UA.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/csv,*/*",
    },
  });
  if (!res.ok) {
    console.error(`[benchmark] ${host} responded ${res.status} ${res.statusText}`);
    return null;
  }
  const text = await res.text();
  if (/exceeded|limit/i.test(text) && text.length < 200) {
    console.error(`[benchmark] ${host} rate-limited us: ${text.trim()}`);
    return null;
  }
  const rows = parseCsv(text);
  if (rows.length === 0) {
    console.error(`[benchmark] ${host} returned no parseable rows (first 100 chars): ${text.slice(0, 100)}`);
    return null;
  }
  return rows;
}

/**
 * Ensures we have cached daily closes for `symbol` from `fromDate` to today.
 * Fetches from Stooq only when the cache is missing or more than a couple of
 * days stale. Network/parse failures are logged (check Vercel function logs)
 * and swallowed — callers degrade to "benchmark unavailable" rather than
 * throwing, since a slow/unreliable third-party price feed shouldn't break
 * the dashboard.
 */
export async function ensureBenchmarkData(symbol: string, fromDate: string): Promise<void> {
  const today = todayIso();
  const latest = await maxCachedDate(symbol);
  if (latest && daysBetween(latest, today) <= 3 && latest >= fromDate) {
    return; // fresh enough
  }

  const from = latest && latest > fromDate ? latest : fromDate;

  let rows: { date: string; close: number }[] | null = null;
  for (const host of STOOQ_HOSTS) {
    try {
      rows = await fetchFromHost(host, symbol, from, today);
      if (rows) break;
    } catch (e) {
      console.error(`[benchmark] fetch from ${host} threw:`, e);
    }
  }
  if (!rows) return;

  const db = await getDb();
  await db.batch(
    rows.map((r) => ({
      sql: "INSERT OR REPLACE INTO benchmark_prices (symbol, date, close) VALUES (?, ?, ?)",
      args: [symbol, r.date, r.close],
    }))
  );
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
