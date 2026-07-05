/**
 * Canonical dataset for the fund, in the v2 model (clients / transactions /
 * valuations), reconciled against the Robinhood account as of 2026-07-04
 * (total value $12,411.98, after Mom's $300 landed in the account that day).
 *
 * Reconciled 2026-07-05 against the complete Robinhood activity export
 * (2024-11-26 through present). That export is the source of truth for every
 * deposit/withdrawal date and amount below unless noted otherwise. Changes
 * from the prior version, found by diffing this seed against every real
 * ACH/wire row in the export:
 * - Added 9 real deposits (Nov 2024–Sep 2025, $2,602 total) that had never
 *   been recorded for anyone — including the account's actual first-ever
 *   transaction (2024-11-26, $500). All assigned to Ali per his confirmation
 *   that he funded the account alone before Mom started contributing.
 * - Fixed Ali's 2025-09-15 deposit: recorded as $265.00, the real ACH deposit
 *   that day was $300.00.
 * - Removed Mom's "2025-05-02: $250" — no matching transaction exists
 *   anywhere in the export; confirmed with Ali it never actually landed in
 *   Robinhood and should be dropped.
 * - Reassigned the 2026-03-23 $200+$50 ACH deposits (previously credited to
 *   Ali) to Mom — this pair matches her self-reported "March 21: $200" /
 *   "March 23: $50" contributions almost exactly, just posted a year later
 *   than she remembered. The real 2025-03-21 $200 deposit that had been
 *   sitting on Mom's ledger (no counterpart in her list) reverts to Ali.
 * - Split the combined "Dec 2024: $700" placeholder into its two real dated
 *   transactions (2024-12-06 $500, 2024-12-23 $200), and swapped Mom's other
 *   approximate self-reported dates for the exact real ACH dates now that
 *   we have them (amounts unchanged).
 * - Dropped Ali's 2025-09-14 ($2,624.49) and 2025-12-20 ($302.59) entries —
 *   neither had any matching transaction anywhere in the export, and Ali
 *   confirmed nothing else backs them. With these gone, total invested is
 *   $7,726.00, which matches the real ACH/wire cash-flow total from the
 *   export to the penny.
 *
 * Pricing:
 * - Pre-spreadsheet deposits (through 2025-10-20) are priced flat (NAV 100) via
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
 *   ever found.
 *
 * Safe to re-run: seed skips itself if any client already exists.
 * Usage: npm run seed   (fresh DB)   |   npm run reconcile   (rebuild existing DB)
 */
import { addClient, addTransaction, addValuation, listClients } from "../lib/portfolio";
import { getDb } from "../lib/db";

type Tx = { client: "Ali" | "Mom"; date: string; amount: number; avb: number | null; note?: string };

const INTERP = "Priced via linear interpolation between known account values — approximate";

// Chronological. `avb` = fund total value immediately before the deposit.
const NEW = "Real Robinhood ACH deposit found in the full activity export — previously unrecorded";
const SWAPPED =
  "Real 2026-03-23 ACH deposits ($200+$50), previously credited to Ali — matches Mom's self-reported March contributions a year later than she remembered";
const FREED =
  "Real 2025-03-21 ACH deposit, previously credited to Mom — no counterpart in her contribution list, reverts to Ali now that 2026-03-23 covers her March contributions";

const TRANSACTIONS: Tx[] = [
  // Flat era (NAV 100; avb = cumulative prior deposits).
  { client: "Ali", date: "2024-11-26", amount: 500.0, avb: 0, note: NEW + " — the account's first-ever transaction" },
  { client: "Mom", date: "2024-12-06", amount: 500.0, avb: 500 },
  { client: "Mom", date: "2024-12-23", amount: 200.0, avb: 1000 },
  { client: "Ali", date: "2025-01-06", amount: 800.0, avb: 1200, note: NEW },
  { client: "Ali", date: "2025-01-30", amount: 300.0, avb: 2000, note: NEW },
  { client: "Ali", date: "2025-03-21", amount: 200.0, avb: 2300, note: FREED },
  { client: "Ali", date: "2025-06-09", amount: 200.0, avb: 2500, note: NEW },
  { client: "Mom", date: "2025-06-25", amount: 200.0, avb: 2700 },
  { client: "Mom", date: "2025-07-23", amount: 200.0, avb: 2900 },
  { client: "Mom", date: "2025-08-26", amount: 200.0, avb: 3100 },
  { client: "Ali", date: "2025-08-26", amount: 87.0, avb: 3300, note: NEW },
  { client: "Mom", date: "2025-08-28", amount: 700.0, avb: 3387 },
  { client: "Ali", date: "2025-09-04", amount: 50.0, avb: 4087, note: NEW },
  { client: "Ali", date: "2025-09-09", amount: 400.0, avb: 4137, note: NEW },
  { client: "Ali", date: "2025-09-15", amount: 300.0, avb: 4537, note: "Corrected from $265.00 — real ACH deposit that day was $300.00" },
  { client: "Mom", date: "2025-09-17", amount: 250.0, avb: 4837 },
  { client: "Ali", date: "2025-09-24", amount: 250.0, avb: 5087, note: NEW },
  { client: "Ali", date: "2025-09-24", amount: 15.0, avb: 5337, note: NEW },
  { client: "Mom", date: "2025-10-20", amount: 300.0, avb: 5352 },
  // Post-spreadsheet, priced at real Robinhood marks.
  { client: "Mom", date: "2025-12-19", amount: 500.0, avb: 8996.6 },

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
  { client: "Mom", date: "2026-03-23", amount: 250.0, avb: 9206.41, note: SWAPPED }, // $200 + $50 ACH deposits
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
