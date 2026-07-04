/**
 * Canonical dataset for the fund, in the v2 model (clients / transactions /
 * valuations), reconciled against the Robinhood account as of 2026-07-04
 * (total value $12,411.98, after Mom's $300 landed in the account that day).
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
  // Ali's recon deposit here no longer assumes Mom's $300 was already in the
  // pot (see note below) — avb is just the real 6/27 mark.
  { client: "Ali", date: "2026-06-28", amount: 302.6, avb: 11950.09, note: RECON },
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
