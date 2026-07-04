/**
 * One-time import of historical data from the old Robinhood tracking spreadsheet.
 * Safe to re-run against an empty database; will error on unique contributor name
 * conflicts if run twice against a database that already has this data.
 *
 * Usage: npm run seed
 */
import { addContributor, addContribution, addSnapshot, listContributors } from "../lib/portfolio";

// A couple of these entries had no date (or a date range) in the original
// spreadsheet — placeholders are used below and flagged with a note so they
// can be corrected on the Contributions page after seeding.

const ALI_CONTRIBUTIONS: { date: string; amount: number; note?: string }[] = [
  { date: "2025-09-14", amount: 2624.49 },
  { date: "2025-09-15", amount: 265.0, note: "Date was blank in original spreadsheet — verify" },
];

const MOM_CONTRIBUTIONS: { date: string; amount: number; note?: string }[] = [
  {
    date: "2024-12-01",
    amount: 700.0,
    note: "Originally recorded as 'December 2024 to March 2025' in spreadsheet — verify date",
  },
  { date: "2025-03-21", amount: 200.0 },
  { date: "2025-03-23", amount: 50.0 },
  { date: "2025-05-02", amount: 250.0 },
  { date: "2025-06-23", amount: 200.0 },
  { date: "2025-07-22", amount: 200.0 },
  { date: "2025-08-22", amount: 200.0 },
  { date: "2025-08-28", amount: 500.0 },
  { date: "2025-09-16", amount: 250.0 },
  { date: "2025-10-19", amount: 300.0 },
  { date: "2025-10-20", amount: 200.0, note: "Date was blank in original spreadsheet — verify" },
];

// Total cost basis in the spreadsheet was $5,939.49 with a 15.24% growth rate,
// giving an AUM of ~$6,844.67 at the time it was last updated.
const INITIAL_SNAPSHOT = {
  totalValue: 6844.67,
  note: "Imported from spreadsheet migration",
};

async function main() {
  const existing = await listContributors();
  if (existing.length > 0) {
    console.log("Contributors already exist — skipping seed to avoid duplicates.");
    console.log(existing.map((c) => c.name));
    return;
  }

  await addContributor("Ali");
  await addContributor("Mom");

  const contributors = await listContributors();
  const ali = contributors.find((c) => c.name === "Ali")!;
  const mom = contributors.find((c) => c.name === "Mom")!;

  for (const c of ALI_CONTRIBUTIONS) {
    await addContribution(ali.id, c.date, c.amount, c.note);
  }
  for (const c of MOM_CONTRIBUTIONS) {
    await addContribution(mom.id, c.date, c.amount, c.note);
  }

  const today = new Date().toISOString().slice(0, 10);
  await addSnapshot(today, INITIAL_SNAPSHOT.totalValue, INITIAL_SNAPSHOT.note);

  console.log("Seed complete: 2 contributors, contributions imported, 1 initial snapshot added.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
