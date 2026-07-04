import { getDb } from "./db";

// NAV per unit at the fund's inception. Arbitrary base (like a fund launching
// at $100/unit); all returns are measured relative to it, so the exact value
// doesn't matter as long as it's constant.
const SEED_NAV = 100;

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type Transaction = {
  id: number;
  clientId: number;
  date: string;
  amount: number; // signed: positive = deposit, negative = withdrawal
  accountValueBefore: number | null; // total fund value immediately before this tx
  note: string | null;
  createdAt: string;
};

export type Valuation = {
  id: number;
  date: string;
  totalValue: number;
  note: string | null;
  createdAt: string;
};

export type ClientSummary = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  units: number;
  ownership: number; // fraction 0..1
  costBasis: number; // net deposits (deposits - withdrawals)
  currentValue: number;
  profit: number;
  returnPct: number; // simple return: profit / costBasis
};

export type NavPoint = { date: string; navPerUnit: number; fundValue: number };

export type FundSummary = {
  aum: number; // current total fund value
  totalUnits: number;
  navPerUnit: number;
  totalCostBasis: number;
  totalProfit: number;
  simpleReturn: number; // money-weighted: total profit / total invested (matches broker "all-time")
  twr: number; // time-weighted return since inception (pure per-unit performance)
  asOf: string | null;
  clients: ClientSummary[];
  navSeries: NavPoint[];
};

// --- Clients ---

export async function listClients(): Promise<Client[]> {
  const db = await getDb();
  const res = await db.execute("SELECT id, name, email, phone, notes FROM clients ORDER BY name");
  return res.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    email: r.email == null ? null : String(r.email),
    phone: r.phone == null ? null : String(r.phone),
    notes: r.notes == null ? null : String(r.notes),
  }));
}

export async function getClient(id: number): Promise<Client | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, name, email, phone, notes FROM clients WHERE id = ?",
    args: [id],
  });
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: Number(r.id),
    name: String(r.name),
    email: r.email == null ? null : String(r.email),
    phone: r.phone == null ? null : String(r.phone),
    notes: r.notes == null ? null : String(r.notes),
  };
}

export async function addClient(fields: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO clients (name, email, phone, notes) VALUES (?, ?, ?, ?)",
    args: [fields.name, fields.email ?? null, fields.phone ?? null, fields.notes ?? null],
  });
}

export async function updateClient(
  id: number,
  fields: { name: string; email?: string; phone?: string; notes?: string }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE clients SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ?",
    args: [fields.name, fields.email ?? null, fields.phone ?? null, fields.notes ?? null, id],
  });
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM clients WHERE id = ?", args: [id] });
}

// --- Transactions ---

export async function listTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const res = await db.execute(
    "SELECT id, client_id, date, amount, account_value_before, note, created_at FROM transactions ORDER BY date DESC, id DESC"
  );
  return res.rows.map(mapTransaction);
}

export async function listTransactionsForClient(clientId: number): Promise<Transaction[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, client_id, date, amount, account_value_before, note, created_at FROM transactions WHERE client_id = ? ORDER BY date DESC, id DESC",
    args: [clientId],
  });
  return res.rows.map(mapTransaction);
}

function mapTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: Number(r.id),
    clientId: Number(r.client_id),
    date: String(r.date),
    amount: Number(r.amount),
    accountValueBefore: r.account_value_before == null ? null : Number(r.account_value_before),
    note: r.note == null ? null : String(r.note),
    createdAt: String(r.created_at),
  };
}

export async function addTransaction(fields: {
  clientId: number;
  date: string;
  amount: number;
  accountValueBefore: number | null;
  note?: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO transactions (client_id, date, amount, account_value_before, note) VALUES (?, ?, ?, ?, ?)",
    args: [
      fields.clientId,
      fields.date,
      fields.amount,
      fields.accountValueBefore,
      fields.note ?? null,
    ],
  });
}

export async function updateTransaction(
  id: number,
  fields: {
    clientId: number;
    date: string;
    amount: number;
    accountValueBefore: number | null;
    note?: string;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE transactions SET client_id = ?, date = ?, amount = ?, account_value_before = ?, note = ? WHERE id = ?",
    args: [
      fields.clientId,
      fields.date,
      fields.amount,
      fields.accountValueBefore,
      fields.note ?? null,
      id,
    ],
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM transactions WHERE id = ?", args: [id] });
}

// --- Valuations ---

export async function listValuations(): Promise<Valuation[]> {
  const db = await getDb();
  const res = await db.execute(
    "SELECT id, date, total_value, note, created_at FROM valuations ORDER BY date DESC, id DESC"
  );
  return res.rows.map(mapValuation);
}

function mapValuation(r: Record<string, unknown>): Valuation {
  return {
    id: Number(r.id),
    date: String(r.date),
    totalValue: Number(r.total_value),
    note: r.note == null ? null : String(r.note),
    createdAt: String(r.created_at),
  };
}

export async function addValuation(date: string, totalValue: number, note?: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO valuations (date, total_value, note) VALUES (?, ?, ?)",
    args: [date, totalValue, note ?? null],
  });
}

export async function updateValuation(
  id: number,
  fields: { date: string; totalValue: number; note?: string }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE valuations SET date = ?, total_value = ?, note = ? WHERE id = ?",
    args: [fields.date, fields.totalValue, fields.note ?? null, id],
  });
}

export async function deleteValuation(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM valuations WHERE id = ?", args: [id] });
}

// --- Fund accounting (unit ledger) ---

type Ledger = {
  totalUnits: number;
  unitsByClient: Map<number, number>;
  currentFundValue: number;
  navPerUnit: number;
  asOf: string | null;
  navSeries: NavPoint[];
};

function sortKey(date: string, createdAt: string): string {
  return `${date}|${createdAt}`;
}

/**
 * Replays every transaction in chronological order to derive units outstanding
 * and units per client. Units are issued/redeemed at the NAV per unit struck
 * from each transaction's recorded pre-money fund value, so gains accrue only
 * to whoever actually held units during the period they occurred.
 *
 * Recomputed on every read (data volume is tiny) — nothing derived is stored,
 * so edits can never leave stale unit counts behind.
 */
function compareTx(a: Transaction, b: Transaction): number {
  // Chronological, then by creation time, then id — so same-day transactions
  // (e.g. two deposits on the same date) always replay in a stable order.
  const k = sortKey(a.date, a.createdAt).localeCompare(sortKey(b.date, b.createdAt));
  return k !== 0 ? k : a.id - b.id;
}

function buildLedger(transactions: Transaction[], valuations: Valuation[]): Ledger {
  const txs = [...transactions].sort(compareTx);

  let totalUnits = 0;
  let lastNav = SEED_NAV;
  const unitsByClient = new Map<number, number>();

  // Fund-value points for the NAV series: each transaction's post-money value
  // and each standalone valuation, in chronological order.
  type ValuePoint = { date: string; createdAt: string; value: number; unitsAfterTx: number | null };
  const points: ValuePoint[] = [];

  for (const tx of txs) {
    let navPerUnit: number;
    if (totalUnits <= 0) {
      navPerUnit = SEED_NAV;
    } else if (tx.accountValueBefore != null && tx.accountValueBefore > 0) {
      navPerUnit = tx.accountValueBefore / totalUnits;
    } else {
      navPerUnit = lastNav;
    }
    const unitsDelta = tx.amount / navPerUnit;
    unitsByClient.set(tx.clientId, (unitsByClient.get(tx.clientId) ?? 0) + unitsDelta);
    totalUnits += unitsDelta;
    lastNav = navPerUnit;

    if (tx.accountValueBefore != null) {
      points.push({
        date: tx.date,
        createdAt: tx.createdAt,
        value: tx.accountValueBefore + tx.amount,
        unitsAfterTx: totalUnits,
      });
    }
  }

  for (const v of valuations) {
    points.push({ date: v.date, createdAt: v.createdAt, value: v.totalValue, unitsAfterTx: null });
  }

  points.sort((a, b) => sortKey(a.date, a.createdAt).localeCompare(sortKey(b.date, b.createdAt)));

  // Build the NAV-per-unit series. For a valuation point we need the units
  // outstanding as of that date; walk the (already sorted) transactions.
  const navSeries: NavPoint[] = [];
  for (const p of points) {
    // Units as of this point: for a transaction point it's the running total
    // right after issuance; for a valuation point, all units issued on/before it.
    const unitsAtPoint = p.unitsAfterTx != null ? p.unitsAfterTx : unitsUpTo(txs, p.date, p.createdAt);
    if (unitsAtPoint > 0) {
      navSeries.push({ date: p.date, navPerUnit: p.value / unitsAtPoint, fundValue: p.value });
    }
  }

  const currentFundValue = points.length > 0 ? points[points.length - 1].value : 0;
  const navPerUnit = totalUnits > 0 ? currentFundValue / totalUnits : SEED_NAV;
  const asOf = points.length > 0 ? points[points.length - 1].date : null;

  return { totalUnits, unitsByClient, currentFundValue, navPerUnit, asOf, navSeries };
}

// Units outstanding as of a given (date, createdAt), replaying issuance.
function unitsUpTo(sortedTxs: Transaction[], date: string, createdAt: string): number {
  let totalUnits = 0;
  let lastNav = SEED_NAV;
  const cutoff = sortKey(date, createdAt);
  for (const tx of sortedTxs) {
    if (sortKey(tx.date, tx.createdAt).localeCompare(cutoff) > 0) break;
    let navPerUnit: number;
    if (totalUnits <= 0) navPerUnit = SEED_NAV;
    else if (tx.accountValueBefore != null && tx.accountValueBefore > 0)
      navPerUnit = tx.accountValueBefore / totalUnits;
    else navPerUnit = lastNav;
    totalUnits += tx.amount / navPerUnit;
    lastNav = navPerUnit;
  }
  return totalUnits;
}

function costBasisByClient(transactions: Transaction[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const t of transactions) m.set(t.clientId, (m.get(t.clientId) ?? 0) + t.amount);
  return m;
}

/** Current known total fund value — used to pre-fill the "value before" field. */
export async function getLatestFundValue(): Promise<number> {
  const [transactions, valuations] = await Promise.all([listTransactions(), listValuations()]);
  const ledger = buildLedger(transactions, valuations);
  return ledger.currentFundValue;
}

export async function getFundSummary(): Promise<FundSummary> {
  const [clients, transactions, valuations] = await Promise.all([
    listClients(),
    listTransactions(),
    listValuations(),
  ]);

  const ledger = buildLedger(transactions, valuations);
  const costBasis = costBasisByClient(transactions);

  const clientSummaries: ClientSummary[] = clients.map((c) => {
    const units = ledger.unitsByClient.get(c.id) ?? 0;
    const ownership = ledger.totalUnits > 0 ? units / ledger.totalUnits : 0;
    const cb = costBasis.get(c.id) ?? 0;
    const currentValue = units * ledger.navPerUnit;
    const profit = currentValue - cb;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      units,
      ownership,
      costBasis: cb,
      currentValue,
      profit,
      returnPct: cb > 0 ? profit / cb : 0,
    };
  });

  const totalCostBasis = transactions.reduce((s, t) => s + t.amount, 0);
  const totalProfit = ledger.currentFundValue - totalCostBasis;
  const twr = ledger.navPerUnit / SEED_NAV - 1;

  return {
    aum: ledger.currentFundValue,
    totalUnits: ledger.totalUnits,
    navPerUnit: ledger.navPerUnit,
    totalCostBasis,
    totalProfit,
    simpleReturn: totalCostBasis > 0 ? totalProfit / totalCostBasis : 0,
    twr,
    asOf: ledger.asOf,
    clients: clientSummaries,
    navSeries: ledger.navSeries,
  };
}

export async function getClientSummary(id: number): Promise<ClientSummary | null> {
  const summary = await getFundSummary();
  return summary.clients.find((c) => c.id === id) ?? null;
}

export type ClientStatement = {
  client: Client;
  summary: ClientSummary;
  transactions: Transaction[];
  totalDeposits: number;
  totalWithdrawals: number;
  asOf: string | null;
  twr: number;
};

export async function getClientStatementData(id: number): Promise<ClientStatement | null> {
  const client = await getClient(id);
  if (!client) return null;
  const fund = await getFundSummary();
  const summary = fund.clients.find((c) => c.id === id);
  if (!summary) return null;
  const transactions = await listTransactionsForClient(id);
  const totalDeposits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  return {
    client,
    summary,
    transactions,
    totalDeposits,
    totalWithdrawals,
    asOf: fund.asOf,
    twr: fund.twr,
  };
}

// --- Period statements ---

export type PeriodStatement = {
  client: Client;
  from: string;
  to: string;
  openingValue: number;
  deposits: number;
  withdrawals: number;
  gain: number;
  closingValue: number;
  periodReturn: number;
  transactions: Transaction[]; // in-period, oldest first
};

export async function getClientPeriodStatement(
  id: number,
  from: string,
  to: string
): Promise<PeriodStatement | null> {
  const client = await getClient(id);
  if (!client) return null;
  const [transactions, valuations] = await Promise.all([listTransactions(), listValuations()]);
  const ledger = buildLedger(transactions, valuations);
  const sorted = [...transactions].sort(compareTx);

  // Per-client units as of a boundary (replays all clients for correct pricing).
  const clientUnitsAt = (boundary: string, mode: "before" | "through"): number => {
    let totalUnits = 0;
    let lastNav = SEED_NAV;
    let mine = 0;
    for (const tx of sorted) {
      if (mode === "before" ? tx.date >= boundary : tx.date > boundary) break;
      let nav: number;
      if (totalUnits <= 0) nav = SEED_NAV;
      else if (tx.accountValueBefore != null && tx.accountValueBefore > 0) nav = tx.accountValueBefore / totalUnits;
      else nav = lastNav;
      const d = tx.amount / nav;
      if (tx.clientId === id) mine += d;
      totalUnits += d;
      lastNav = nav;
    }
    return mine;
  };

  const navAt = (boundary: string, mode: "before" | "through"): number => {
    let nav = 0;
    for (const p of ledger.navSeries) {
      if (mode === "before" ? p.date < boundary : p.date <= boundary) nav = p.navPerUnit;
      else break;
    }
    return nav;
  };

  const openingValue = clientUnitsAt(from, "before") * navAt(from, "before");
  const closingValue = clientUnitsAt(to, "through") * navAt(to, "through");

  const inPeriod = sorted.filter((t) => t.clientId === id && t.date >= from && t.date <= to);
  const deposits = inPeriod.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const withdrawals = inPeriod.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netFlows = deposits - withdrawals;
  const gain = closingValue - openingValue - netFlows;
  const base = openingValue + deposits;
  const periodReturn = base > 0 ? gain / base : 0;

  return {
    client,
    from,
    to,
    openingValue,
    deposits,
    withdrawals,
    gain,
    closingValue,
    periodReturn,
    transactions: inPeriod,
  };
}

/**
 * A single client's actual account value at every point in the fund's NAV
 * history (their unit count only changes at their own transactions, but the
 * dollar value moves with every fund-wide valuation in between). Used to
 * chart a client's real performance against a hypothetical benchmark
 * investment on the same timeline.
 */
export async function getClientValueSeries(clientId: number): Promise<{ date: string; value: number }[]> {
  const [transactions, valuations] = await Promise.all([listTransactions(), listValuations()]);
  const ledger = buildLedger(transactions, valuations);
  const sorted = [...transactions].sort(compareTx);

  let totalUnits = 0;
  let lastNav = SEED_NAV;
  let mine = 0;
  let txIdx = 0;

  return ledger.navSeries.map((p) => {
    while (txIdx < sorted.length && sorted[txIdx].date <= p.date) {
      const tx = sorted[txIdx];
      let nav: number;
      if (totalUnits <= 0) nav = SEED_NAV;
      else if (tx.accountValueBefore != null && tx.accountValueBefore > 0) nav = tx.accountValueBefore / totalUnits;
      else nav = lastNav;
      const d = tx.amount / nav;
      if (tx.clientId === clientId) mine += d;
      totalUnits += d;
      lastNav = nav;
      txIdx++;
    }
    return { date: p.date, value: mine * p.navPerUnit };
  });
}
