import { getDb } from "./db";

// Default benchmark: the S&P 500 tracked via the SPY ETF. Prices come from
// Stooq's free daily CSV endpoint (no API key). Fetched server-side and cached
// in the benchmark_prices table so we don't hit the network on every render.
export const BENCHMARK_SYMBOL = "spy.us";
export const BENCHMARK_LABEL = "S&P 500";

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

/**
 * Ensures we have cached daily closes for `symbol` from `fromDate` to today.
 * Fetches from Stooq only when the cache is missing or more than a couple of
 * days stale. Network/parse failures are swallowed — callers degrade to
 * "benchmark unavailable" rather than erroring.
 */
export async function ensureBenchmarkData(symbol: string, fromDate: string): Promise<void> {
  const today = todayIso();
  const latest = await maxCachedDate(symbol);
  if (latest && daysBetween(latest, today) <= 3 && latest >= fromDate) {
    return; // fresh enough
  }

  const from = latest && latest > fromDate ? latest : fromDate;
  const url = `https://stooq.com/q/d/l/?s=${symbol}&i=d&d1=${compact(from)}&d2=${compact(today)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const text = await res.text();
    const rows: { date: string; close: number }[] = [];
    for (const line of text.trim().split("\n").slice(1)) {
      const cols = line.split(",");
      const date = cols[0];
      const close = Number(cols[4]);
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(close)) {
        rows.push({ date, close });
      }
    }
    if (rows.length === 0) return;

    const db = await getDb();
    await db.batch(
      rows.map((r) => ({
        sql: "INSERT OR REPLACE INTO benchmark_prices (symbol, date, close) VALUES (?, ?, ?)",
        args: [symbol, r.date, r.close],
      }))
    );
  } catch {
    // leave cache as-is; callers handle missing data
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
