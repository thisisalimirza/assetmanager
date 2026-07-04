/**
 * Seeds a fresh database with the historical data from the original Robinhood
 * spreadsheet, in the v2 fund model (clients / transactions / valuations).
 *
 * Each transaction's `account_value_before` is backfilled with the running sum
 * of prior net deposits so the NAV per unit stays flat across all historical
 * deposits — this reproduces the original spreadsheet's allocations exactly
 * (we have no historical interim valuations to price against). The final
 * valuation then strikes the current NAV. Deposits recorded from now on are
 * priced against the real account value entered at the time.
 *
 * Safe to re-run: skips itself if any client already exists.
 *
 * Usage: npm run seed
 */
import { addClient, addTransaction, addValuation, listClients } from "../lib/portfolio";

type Entry = { client: "Ali" | "Mom"; date: string; amount: number; note?: string };

const ENTRIES: Entry[] = [
  { client: "Mom", date: "2024-12-01", amount: 700.0, note: "Originally 'December 2024 to March 2025' — verify date" },
  { client: "Mom", date: "2025-03-21", amount: 200.0 },
  { client: "Mom", date: "2025-03-23", amount: 50.0 },
  { client: "Mom", date: "2025-05-02", amount: 250.0 },
  { client: "Mom", date: "2025-06-23", amount: 200.0 },
  { client: "Mom", date: "2025-07-22", amount: 200.0 },
  { client: "Mom", date: "2025-08-22", amount: 200.0 },
  { client: "Mom", date: "2025-08-28", amount: 500.0 },
  { client: "Ali", date: "2025-09-14", amount: 2624.49 },
  { client: "Ali", date: "2025-09-15", amount: 265.0, note: "Date was blank in original spreadsheet — verify" },
  { client: "Mom", date: "2025-09-16", amount: 250.0 },
  { client: "Mom", date: "2025-10-19", amount: 300.0 },
  { client: "Mom", date: "2025-10-20", amount: 200.0, note: "Date was blank in original spreadsheet — verify" },
];

const FINAL_VALUATION = { totalValue: 6844.67, note: "Imported from spreadsheet migration" };

async function main() {
  const existing = await listClients();
  if (existing.length > 0) {
    console.log("Clients already exist — skipping seed to avoid duplicates.");
    console.log(existing.map((c) => c.name));
    return;
  }

  await addClient({ name: "Ali" });
  await addClient({ name: "Mom" });
  const clients = await listClients();
  const idByName = new Map(clients.map((c) => [c.name, c.id]));

  // Insert in chronological order, backfilling account_value_before with the
  // cumulative prior net deposits (flat NAV — see file header).
  const chronological = [...ENTRIES].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  for (const e of chronological) {
    await addTransaction({
      clientId: idByName.get(e.client)!,
      date: e.date,
      amount: e.amount,
      accountValueBefore: cumulative,
      note: e.note,
    });
    cumulative += e.amount;
  }

  const today = new Date().toISOString().slice(0, 10);
  await addValuation(today, FINAL_VALUATION.totalValue, FINAL_VALUATION.note);

  console.log(`Seed complete: 2 clients, ${ENTRIES.length} transactions, 1 valuation.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
