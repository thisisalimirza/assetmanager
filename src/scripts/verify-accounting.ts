/* Scenario checks for the unit-ledger accounting. Run: npm run verify */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Use a throwaway sqlite file so the check never touches a real database.
const tmpDir = mkdtempSync(join(tmpdir(), "pt-verify-"));
process.env.TURSO_DATABASE_URL = `file:${join(tmpDir, "verify.db")}`;
delete process.env.TURSO_AUTH_TOKEN;
process.on("exit", () => rmSync(tmpDir, { recursive: true, force: true }));

import { addClient, addTransaction, addValuation, getFundSummary, listClients } from "../lib/portfolio";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}
function close(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) < eps;
}

async function main() {
  // Scenario: Ali deposits $1000; fund doubles to $2000; Mom deposits $1000.
  await addClient({ name: "Ali" });
  await addClient({ name: "Mom" });
  const clients = await listClients();
  const ali = clients.find((c) => c.name === "Ali")!;
  const mom = clients.find((c) => c.name === "Mom")!;

  // Day 1: Ali's first deposit (inception, no prior value).
  await addTransaction({ clientId: ali.id, date: "2025-01-01", amount: 1000, accountValueBefore: null });
  // Day 2: Mom deposits after the fund has grown to $2000 (pre-money).
  await addTransaction({ clientId: mom.id, date: "2025-02-01", amount: 1000, accountValueBefore: 2000 });

  const fund = await getFundSummary();
  const aliS = fund.clients.find((c) => c.id === ali.id)!;
  const momS = fund.clients.find((c) => c.id === mom.id)!;

  console.log("\n--- Deposit-after-gains scenario ---");
  console.log("AUM:", fund.aum, "NAV/unit:", fund.navPerUnit.toFixed(2), "TWR:", (fund.twr * 100).toFixed(2) + "%");
  console.log("Ali:", aliS.currentValue.toFixed(2), "Mom:", momS.currentValue.toFixed(2));

  assert(close(fund.aum, 3000), "AUM is $3000 (2000 grown + 1000 fresh)");
  assert(close(aliS.currentValue, 2000), "Ali keeps his full $2000 (not robbed by pro-rata)");
  assert(close(momS.currentValue, 1000), "Mom holds exactly her $1000 (no gains she wasn't there for)");
  assert(close(aliS.profit, 1000) && close(aliS.returnPct, 1.0), "Ali +$1000 / +100%");
  assert(close(momS.profit, 0), "Mom $0 profit");
  assert(close(aliS.ownership + momS.ownership, 1.0), "ownership sums to 100%");
  assert(close(aliS.currentValue + momS.currentValue, fund.aum), "client values reconcile to AUM");
  assert(close(fund.twr, 1.0), "fund TWR since inception is +100%");

  // Add a later valuation: fund grows to $3600 (+20% from $3000).
  await addValuation("2025-03-01", 3600);
  const fund2 = await getFundSummary();
  const aliS2 = fund2.clients.find((c) => c.id === ali.id)!;
  const momS2 = fund2.clients.find((c) => c.id === mom.id)!;
  console.log("\n--- After +20% market move to $3600 ---");
  console.log("Ali:", aliS2.currentValue.toFixed(2), "Mom:", momS2.currentValue.toFixed(2), "TWR:", (fund2.twr * 100).toFixed(2) + "%");
  assert(close(fund2.aum, 3600), "AUM now $3600");
  assert(close(aliS2.currentValue, 2400), "Ali share grows 20% -> $2400");
  assert(close(momS2.currentValue, 1200), "Mom share grows 20% -> $1200");
  assert(close(aliS2.currentValue + momS2.currentValue, 3600), "still reconciles to AUM");
  assert(close(fund2.twr, 1.4), "TWR since inception = +140% (2.0 * 1.2 - 1)");
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
