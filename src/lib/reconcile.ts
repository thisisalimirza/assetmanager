// Pure CSV-parsing and matching logic for the Reconcile view. Kept free of any
// server/DB imports so it runs in the browser (the matching is interactive)
// and in tests.

export type ReconcileTx = {
  id: number;
  clientId: number;
  date: string;
  amount: number;
  reconciledAt: string | null;
};

export type CsvMovement = { line: number; date: string; amount: number };

export type MatchResult = {
  matched: { movement: CsvMovement; tx: ReconcileTx }[];
  unmatchedMovements: CsvMovement[];
  unmatchedTxs: ReconcileTx[]; // recorded in-range but with no bank movement
};

export const DATE_WINDOW_DAYS = 5;

// --- lenient CSV parsing ---
// Venmo/bank exports differ wildly in column layout, so instead of hardcoding
// one, each row is scanned for the first date-looking cell and the first
// money-looking cell. Rows without both (headers, balance summaries) are
// skipped.

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseDateCell(cell: string): string | null {
  const s = cell.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})([T ].*)?$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s.*)?$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  return null;
}

function parseMoneyCell(cell: string): { value: number; hasDollar: boolean } | null {
  const s = cell.trim();
  const m = s.match(/^([-+−])?\s*(\$)?\s*([\d,]+(?:\.\d{1,2})?)$/);
  if (!m) return null;
  const value = Number(m[3].replace(/,/g, ""));
  if (!Number.isFinite(value) || value === 0) return null;
  const sign = m[1] === "-" || m[1] === "−" ? -1 : 1;
  return { value: sign * value, hasDollar: m[2] === "$" };
}

export function parseCsv(text: string): CsvMovement[] {
  const movements: CsvMovement[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    const cells = splitCsvLine(line);
    let date: string | null = null;
    let dollarAmount: number | null = null;
    let plainAmount: number | null = null;
    for (const cell of cells) {
      if (date == null) {
        const d = parseDateCell(cell);
        if (d) {
          date = d;
          continue;
        }
      }
      const money = parseMoneyCell(cell);
      if (money) {
        if (money.hasDollar && dollarAmount == null) dollarAmount = money.value;
        else if (!money.hasDollar && plainAmount == null) plainAmount = money.value;
      }
    }
    // Prefer an explicit $-cell (Venmo's "Amount (total)") over bare numbers,
    // which are often IDs or running balances.
    const amount = dollarAmount ?? plainAmount;
    if (date && amount != null) movements.push({ line: idx + 1, date, amount });
  });
  return movements;
}

// --- matching ---

function dayDiff(a: string, b: string): number {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

/**
 * Greedy matcher: each bank movement claims the closest-dated recorded
 * transaction with the same absolute amount within the date window. Absolute
 * (not signed) amounts, because direction conventions differ per export — a
 * transfer into the fund can appear as negative on the sender's statement.
 */
export function matchMovements(movements: CsvMovement[], txs: ReconcileTx[]): MatchResult {
  const claimed = new Set<number>();
  const matched: MatchResult["matched"] = [];
  const unmatchedMovements: CsvMovement[] = [];

  for (const mv of movements) {
    let best: ReconcileTx | null = null;
    let bestDiff = Infinity;
    for (const tx of txs) {
      if (claimed.has(tx.id)) continue;
      if (Math.abs(Math.abs(tx.amount) - Math.abs(mv.amount)) > 0.005) continue;
      const diff = dayDiff(tx.date, mv.date);
      if (diff > DATE_WINDOW_DAYS) continue;
      // Prefer the closest date; on ties prefer a not-yet-reconciled row.
      if (diff < bestDiff || (diff === bestDiff && best?.reconciledAt && !tx.reconciledAt)) {
        best = tx;
        bestDiff = diff;
      }
    }
    if (best) {
      claimed.add(best.id);
      matched.push({ movement: mv, tx: best });
    } else {
      unmatchedMovements.push(mv);
    }
  }

  // Only flag recorded transactions inside the export's own date range —
  // anything outside it simply wasn't part of this statement.
  let unmatchedTxs: ReconcileTx[] = [];
  if (movements.length > 0) {
    const dates = movements.map((m) => m.date).sort();
    const from = dates[0];
    const to = dates[dates.length - 1];
    unmatchedTxs = txs.filter((t) => !claimed.has(t.id) && t.date >= from && t.date <= to);
  }

  return { matched, unmatchedMovements, unmatchedTxs };
}
