// Parsing, deduplication, and diffing for Robinhood activity CSV exports.
// Pure module (no DB imports): the same code runs in the browser (the import
// wizard parses the dropped file and previews the diff) and on the server (the
// import action recomputes the diff authoritatively before writing).

export type ActivityRow = {
  activityDate: string; // ISO yyyy-mm-dd
  processDate: string | null;
  settleDate: string | null;
  instrument: string | null; // ticker, null for cash events
  description: string;
  transCode: string; // Buy, Sell, CDIV, ACH, OGWIRE, INT, SLIP, DTAX, ...
  quantity: number | null;
  price: number | null;
  amount: number | null; // signed; parenthesized amounts are negative
};

export type ParsedActivityCsv = {
  rows: ActivityRow[];
  skipped: number; // non-data lines (header, blank, disclaimer)
};

// --- CSV records (multiline-aware) ---
// Robinhood quotes the Description field and puts real newlines inside it
// ("NVIDIA\nCUSIP: ...\nDividend Reinvestment"), so records must be split by
// walking characters, not by line.

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  const push = () => {
    fields.push(cur);
    cur = "";
  };
  const endRecord = () => {
    push();
    // Ignore records that are entirely empty (trailing blank lines).
    if (fields.some((f) => f.trim() !== "")) records.push(fields);
    fields = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
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
      push();
    } else if (ch === "\n") {
      endRecord();
    } else if (ch !== "\r") {
      cur += ch;
    }
  }
  if (cur !== "" || fields.length > 0) endRecord();
  return records;
}

// --- field parsing ---

function parseUsDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** "$372.12" → 372.12, "($1,500.00)" → -1500, "" → null */
function parseMoney(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const negative = t.startsWith("(") && t.endsWith(")");
  const n = Number(t.replace(/[()$,]/g, ""));
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

function parseQuantity(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const EXPECTED_COLUMNS = [
  "Activity Date",
  "Process Date",
  "Settle Date",
  "Instrument",
  "Description",
  "Trans Code",
  "Quantity",
  "Price",
  "Amount",
];

/**
 * Parses a Robinhood activity export. Columns are located by header name when
 * a header row is present, falling back to Robinhood's standard order. Rows
 * without a parseable activity date and trans code (the trailing disclaimer,
 * blank padding rows) are counted as skipped.
 */
export function parseRobinhoodActivityCsv(text: string): ParsedActivityCsv {
  const records = parseCsvRecords(text);
  let skipped = 0;

  // Column index lookup from the header row, if any.
  let col: Record<string, number> = {};
  EXPECTED_COLUMNS.forEach((name, i) => (col[name] = i));
  const headerIdx = records.findIndex((r) => r.some((f) => f.trim() === "Activity Date"));
  if (headerIdx >= 0) {
    col = {};
    records[headerIdx].forEach((f, i) => (col[f.trim()] = i));
    skipped++;
  }
  const get = (r: string[], name: string): string => r[col[name]] ?? "";

  const rows: ActivityRow[] = [];
  records.forEach((r, i) => {
    if (i === headerIdx) return;
    const activityDate = parseUsDate(get(r, "Activity Date"));
    const transCode = get(r, "Trans Code").trim();
    if (!activityDate || !transCode) {
      skipped++;
      return;
    }
    rows.push({
      activityDate,
      processDate: parseUsDate(get(r, "Process Date")),
      settleDate: parseUsDate(get(r, "Settle Date")),
      instrument: get(r, "Instrument").trim() || null,
      description: get(r, "Description").trim(),
      transCode,
      quantity: parseQuantity(get(r, "Quantity")),
      price: parseMoney(get(r, "Price")),
      amount: parseMoney(get(r, "Amount")),
    });
  });
  return { rows, skipped };
}

// --- dedupe keys & diffing ---

/**
 * Identity key for an activity row. Identical rows legitimately occur (e.g.
 * two $200 ACH deposits on the same day after a cancel/redeposit), so the key
 * is not unique — imports compare per-key COUNTS: if the CSV has three rows
 * with a key and the database has one, two are new. That makes re-importing an
 * overlapping export a no-op for everything already recorded.
 */
export function activityKey(row: ActivityRow): string {
  const desc = row.description.replace(/\s+/g, " ").trim();
  return [
    row.activityDate,
    row.transCode,
    row.instrument ?? "",
    row.quantity ?? "",
    row.price ?? "",
    row.amount ?? "",
    desc,
  ].join("|");
}

export type ActivityDiff = {
  newRows: ActivityRow[]; // rows in the CSV not yet in the database
  duplicateCount: number; // CSV rows already recorded
  missingCount: number; // recorded rows inside the CSV's date range that the CSV lacks
  from: string | null; // CSV date range
  to: string | null;
};

export function diffActivities(existing: ActivityRow[], incoming: ActivityRow[]): ActivityDiff {
  const existingCounts = new Map<string, number>();
  for (const row of existing) {
    const k = activityKey(row);
    existingCounts.set(k, (existingCounts.get(k) ?? 0) + 1);
  }

  const newRows: ActivityRow[] = [];
  let duplicateCount = 0;
  const incomingCounts = new Map<string, number>();
  for (const row of incoming) {
    const k = activityKey(row);
    const seen = (incomingCounts.get(k) ?? 0) + 1;
    incomingCounts.set(k, seen);
    if (seen <= (existingCounts.get(k) ?? 0)) duplicateCount++;
    else newRows.push(row);
  }

  let from: string | null = null;
  let to: string | null = null;
  for (const row of incoming) {
    if (from == null || row.activityDate < from) from = row.activityDate;
    if (to == null || row.activityDate > to) to = row.activityDate;
  }

  // Recorded rows inside the export's window that the export doesn't contain —
  // surfaced as a warning (Robinhood corrections, or a partial export), never
  // auto-deleted.
  let missingCount = 0;
  if (from && to) {
    for (const row of existing) {
      if (row.activityDate < from || row.activityDate > to) continue;
      const k = activityKey(row);
      const inCsv = incomingCounts.get(k) ?? 0;
      const inDb = existingCounts.get(k) ?? 0;
      if (inDb > inCsv) {
        missingCount++;
        // decrement so n identical missing rows are each counted once
        existingCounts.set(k, inDb - 1);
      }
    }
  }

  return { newRows, duplicateCount, missingCount, from, to };
}

// --- display helpers ---

export type ActivityGroup = "trade" | "dividend" | "transfer" | "income" | "other";

/** Friendly label + filter group for a raw trans code / row. */
export function classifyActivity(row: ActivityRow): { label: string; group: ActivityGroup } {
  const desc = row.description.toLowerCase();
  switch (row.transCode) {
    case "Buy":
      return desc.includes("dividend reinvestment")
        ? { label: "Reinvest", group: "dividend" }
        : { label: "Buy", group: "trade" };
    case "Sell":
      return { label: "Sell", group: "trade" };
    case "CDIV":
      return { label: "Dividend", group: "dividend" };
    case "DTAX":
      return { label: "Div. tax", group: "dividend" };
    case "ACH":
      if (desc.includes("cancel") || desc.includes("reversal"))
        return { label: "Reversal", group: "transfer" };
      return (row.amount ?? 0) >= 0
        ? { label: "Deposit", group: "transfer" }
        : { label: "Withdrawal", group: "transfer" };
    case "OGWIRE":
      return desc.includes("fee")
        ? { label: "Wire fee", group: "transfer" }
        : { label: "Wire", group: "transfer" };
    case "INT":
      return { label: "Interest", group: "income" };
    case "SLIP":
      return { label: "Stock lending", group: "income" };
    case "XENT_CC":
      return { label: "Cashback", group: "income" };
    case "SPL":
      return { label: "Split", group: "other" };
    default:
      return { label: row.transCode, group: "other" };
  }
}

/**
 * Compact one-line description for tables: drops CUSIP lines and the
 * "Dividend Reinvestment" marker (the type column already says it).
 */
export function shortDescription(row: ActivityRow): string {
  return row.description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("CUSIP:") && l !== "Dividend Reinvestment")
    .join(" · ");
}
