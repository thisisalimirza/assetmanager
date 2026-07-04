/**
 * Rebuilds the database from the canonical dataset in seed.ts. Unlike `seed`,
 * this WIPES existing clients/transactions/valuations first, so it can correct
 * a database that already has data. Use it to apply the reconciled figures to
 * the live (Turso) database.
 *
 * Usage (against production):
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run reconcile
 */
import { getFundSummary } from "../lib/portfolio";
import { seedData, wipeAll } from "./seed";

async function main() {
  await wipeAll();
  await seedData();

  const fund = await getFundSummary();
  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  console.log("\nReconcile complete. Fund summary:");
  console.log(`  AUM:            ${money(fund.aum)}`);
  console.log(`  Total invested: ${money(fund.totalCostBasis)}`);
  console.log(`  Total profit:   ${money(fund.totalProfit)} (${(fund.simpleReturn * 100).toFixed(2)}%)`);
  for (const c of fund.clients.sort((a, b) => b.currentValue - a.currentValue)) {
    console.log(
      `  ${c.name.padEnd(6)} value ${money(c.currentValue)}  invested ${money(c.costBasis)}  ` +
        `profit ${money(c.profit)} (${(c.returnPct * 100).toFixed(1)}%)  own ${(c.ownership * 100).toFixed(1)}%`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
