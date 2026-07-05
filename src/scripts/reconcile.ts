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
import { getDb } from "../lib/db";
import { seedData, wipeAll } from "./seed";

async function main() {
  const db = await getDb();

  // Share links are live credentials clients already have — snapshot them by
  // name before the wipe and restore them after reseeding, so a rebuild
  // doesn't silently kill everyone's links.
  const savedTokens = (
    await db.execute("SELECT name, share_token FROM clients WHERE share_token IS NOT NULL")
  ).rows.map((r) => ({ name: String(r.name), token: String(r.share_token) }));

  await wipeAll();
  await seedData();

  for (const { name, token } of savedTokens) {
    await db.execute({
      sql: "UPDATE clients SET share_token = ? WHERE name = ?",
      args: [token, name],
    });
  }
  if (savedTokens.length > 0) {
    console.log(`Restored share links for: ${savedTokens.map((t) => t.name).join(", ")}`);
  }

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
