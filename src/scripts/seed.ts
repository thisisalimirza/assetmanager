/**
 * Canonical dataset for the fund, in the v2 model (clients / transactions /
 * valuations), reconciled against the Robinhood account as of 2026-07-04
 * (total value $12,311.98, all-time gain +$4,414.71 → ~$7,897.27 deposited).
 *
 * Pricing:
 * - Pre-spreadsheet deposits (through 2025-10-19) are priced flat (NAV 100) via
 *   account_value_before = cumulative prior deposits — we have no interim marks
 *   for that era, and this reproduces the original spreadsheet's allocations.
 * - Later deposits are priced at the real fund value on the day (from Robinhood).
 * - Ali made additional deposits since the spreadsheet whose exact dates are
 *   unknown; the ~$907.78 gap (confirmed by Robinhood's totals) is modeled as
 *   three evenly-spread "reconciliation" deposits at the known marks. These are
 *   flagged and can be replaced with exact dates later without affecting the
 *   totals (which are pinned by the current valuation).
 *
 * Safe to re-run: seed skips itself if any client already exists.
 * Usage: npm run seed   (fresh DB)   |   npm run reconcile   (rebuild existing DB)
 */
import { addClient, addTransaction, addValuation, listClients } from "../lib/portfolio";
import { getDb } from "../lib/db";

type Tx = { client: "Ali" | "Mom"; date: string; amount: number; avb: number | null; note?: string };

const RECON = "Estimated timing — reconciled from Robinhood totals; refine when exact dates are known";

// Chronological. `avb` = fund total value immediately before the deposit.
const TRANSACTIONS: Tx[] = [
  // Flat era (NAV 100; avb = cumulative prior deposits).
  { client: "Mom", date: "2024-12-01", amount: 700.0, avb: 0, note: "Originally 'Dec 2024–Mar 2025' — verify date" },
  { client: "Mom", date: "2025-03-21", amount: 200.0, avb: 700 },
  { client: "Mom", date: "2025-03-23", amount: 50.0, avb: 900 },
  { client: "Mom", date: "2025-05-02", amount: 250.0, avb: 950 },
  { client: "Mom", date: "2025-06-23", amount: 200.0, avb: 1200 },
  { client: "Mom", date: "2025-07-22", amount: 200.0, avb: 1400 },
  { client: "Mom", date: "2025-08-22", amount: 200.0, avb: 1600 },
  { client: "Mom", date: "2025-08-28", amount: 500.0, avb: 1800 },
  { client: "Mom", date: "2025-08-28", amount: 200.0, avb: 2300 },
  { client: "Ali", date: "2025-09-14", amount: 2624.49, avb: 2500 },
  { client: "Ali", date: "2025-09-15", amount: 265.0, avb: 5124.49 },
  { client: "Mom", date: "2025-09-16", amount: 250.0, avb: 5389.49 },
  { client: "Mom", date: "2025-10-19", amount: 300.0, avb: 5639.49 },
  // Post-spreadsheet, priced at real Robinhood marks.
  { client: "Mom", date: "2025-12-19", amount: 500.0, avb: 8996.6 },
  { client: "Ali", date: "2025-12-20", amount: 302.59, avb: 9496.6, note: RECON },
  { client: "Mom", date: "2026-03-04", amount: 250.0, avb: 8413.39 },
  { client: "Ali", date: "2026-03-05", amount: 302.59, avb: 8663.39, note: RECON },
  { client: "Mom", date: "2026-06-27", amount: 300.0, avb: 11950.09 },
  { client: "Ali", date: "2026-06-28", amount: 302.6, avb: 12250.09, note: RECON },
];

const VALUATIONS: { date: string; value: number; note?: string }[] = [
  { date: "2025-10-31", value: 6844.67, note: "Estimated from original spreadsheet" },
  { date: "2026-07-04", value: 12311.98, note: "Robinhood account value" },
];

/** Inserts the full dataset. Assumes clients/transactions/valuations are empty. */
export async function seedData() {
  await addClient({ name: "Ali" });
  await addClient({ name: "Mom" });
  const clients = await listClients();
  const idByName = new Map(clients.map((c) => [c.name, c.id]));

  for (const t of TRANSACTIONS) {
    await addTransaction({
      clientId: idByName.get(t.client)!,
      date: t.date,
      amount: t.amount,
      accountValueBefore: t.avb,
      note: t.note,
    });
  }
  for (const v of VALUATIONS) {
    await addValuation(v.date, v.value, v.note);
  }
}

/** Deletes all data — used by the reconcile script before re-seeding. */
export async function wipeAll() {
  const db = await getDb();
  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM valuations");
  await db.execute("DELETE FROM clients");
}

async function main() {
  const existing = await listClients();
  if (existing.length > 0) {
    console.log("Clients already exist — skipping seed. Use `npm run reconcile` to rebuild.");
    return;
  }
  await seedData();
  console.log(`Seed complete: 2 clients, ${TRANSACTIONS.length} transactions, ${VALUATIONS.length} valuations.`);
}

// Only run when invoked directly (not when imported by reconcile).
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
