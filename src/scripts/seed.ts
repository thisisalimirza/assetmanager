/**
 * Canonical dataset for the fund, in the v2 model (clients / transactions /
 * valuations), reconciled against the Robinhood account as of 2026-07-04
 * (total value $12,411.98, after Mom's $300 landed in the account that day).
 *
 * Pricing:
 * - Pre-spreadsheet deposits (through 2025-10-19) are priced flat (NAV 100) via
 *   account_value_before = cumulative prior deposits — we have no interim marks
 *   for that era, and this reproduces the original spreadsheet's allocations.
 * - Deposits from Dec 2025 onward are priced at real Robinhood account-value
 *   marks where we have one.
 * - Ali's own deposits/withdrawals for Jan 1 – Jul 4, 2026 come directly from
 *   his Robinhood activity export (real dates and amounts). Where we lack a
 *   real total-value mark for one of those dates, `avb` is linearly
 *   interpolated (by day-count) between the nearest real marks before/after
 *   it — flagged INTERP. This is materially more accurate than a flat
 *   estimate, though still approximate; replace with a real mark if one is
 *   ever found. Only Ali's 2025-12-20 entry remains a flat placeholder — it's
 *   outside the CSV export's coverage.
 *
 * Safe to re-run: seed skips itself if any client already exists.
 * Usage: npm run seed   (fresh DB)   |   npm run reconcile   (rebuild existing DB)
 */
import { addClient, addTransaction, addValuation, listClients } from "../lib/portfolio";
import { getDb } from "../lib/db";

type Tx = { client: "Ali" | "Mom"; date: string; amount: number; avb: number | null; note?: string };

const RECON = "Estimated timing — reconciled from Robinhood totals; refine when exact dates are known";
const INTERP = "Priced via linear interpolation between known account values — approximate";

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
  // Only remaining flat placeholder — outside the Robinhood CSV export's
  // coverage (Jan 2026 onward), so there's no real data to replace it with yet.
  { client: "Ali", date: "2025-12-20", amount: 302.59, avb: 9496.6, note: RECON },

  // From here on, every Ali entry is a real dated amount from the Robinhood
  // activity export, replacing the old flat reconciliation placeholders.
  { client: "Ali", date: "2026-01-02", amount: 570.0, avb: 9555.74, note: INTERP }, // $70 + $500 ACH deposits
  { client: "Ali", date: "2026-01-20", amount: 230.0, avb: 9218.65, note: INTERP },
  { client: "Ali", date: "2026-02-02", amount: 200.0, avb: 8975.2, note: INTERP },
  { client: "Ali", date: "2026-02-23", amount: 500.0, avb: 8581.93, note: INTERP },
  { client: "Mom", date: "2026-03-04", amount: 250.0, avb: 8413.39 }, // real mark
  { client: "Ali", date: "2026-03-09", amount: 10.0, avb: 8806.29, note: INTERP },
  { client: "Ali", date: "2026-03-11", amount: -1.0, avb: 8863.45, note: INTERP + " ($9 deposit, $10 reversal)" },
  { client: "Ali", date: "2026-03-16", amount: 200.0, avb: 9006.35, note: INTERP },
  { client: "Ali", date: "2026-03-23", amount: 250.0, avb: 9206.41, note: INTERP }, // $200 + $50 ACH deposits
  { client: "Ali", date: "2026-04-29", amount: -425.0, avb: 10263.87, note: INTERP + " (wire withdrawal + fee)" },
  { client: "Ali", date: "2026-04-30", amount: -325.0, avb: 10292.45, note: INTERP + " (wire withdrawal + fee)" },
  { client: "Ali", date: "2026-05-11", amount: -185.0, avb: 10606.83, note: INTERP + " (wire withdrawal + fee)" },
  // Mom sent this $300 on 6/27, but it sat as cash outside Robinhood until Ali
  // actually deposited it into the account on 7/4 — priced at the real 7/4
  // pre-money value, not the 6/27 mark it was originally (incorrectly) dated to.
  { client: "Mom", date: "2026-07-04", amount: 300.0, avb: 12111.98, note: "Received from Mom 6/27; deposited to Robinhood 7/4" },
];

const VALUATIONS: { date: string; value: number; note?: string }[] = [
  { date: "2025-10-31", value: 6844.67, note: "Estimated from original spreadsheet" },
  { date: "2026-06-27", value: 11950.09, note: "Robinhood account value" },
  { date: "2026-07-04", value: 12411.98, note: "Robinhood account value" },
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
