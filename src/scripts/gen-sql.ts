// Builds a fresh temp DB from the canonical seed dataset, then reads it back
// and prints raw SQL that reproduces it exactly — for pasting into a SQL
// console (e.g. Turso's web dashboard) when a local shell isn't available.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const tmp = mkdtempSync(join(tmpdir(), "pt-gensql-"));
process.env.TURSO_DATABASE_URL = `file:${join(tmp, "a.db")}`;
delete process.env.TURSO_AUTH_TOKEN;
process.on("exit", () => rmSync(tmp, { recursive: true, force: true }));

import { getDb } from "../lib/db";
import { seedData } from "./seed";

function sqlStr(v: string | null | undefined): string {
  if (v == null) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}
function sqlNum(v: number | null | undefined): string {
  return v == null ? "NULL" : String(v);
}

async function main() {
  await seedData();
  const db = await getDb();

  const clients = (await db.execute("SELECT id, name FROM clients ORDER BY id")).rows;
  const txns = (await db.execute(
    "SELECT client_id, date, amount, account_value_before, note FROM transactions ORDER BY id"
  )).rows;
  const vals = (await db.execute("SELECT date, total_value, note FROM valuations ORDER BY id")).rows;

  const lines: string[] = [];
  lines.push("-- Reconcile: wipe and rebuild from the corrected dataset.");
  lines.push("DELETE FROM transactions;");
  lines.push("DELETE FROM valuations;");
  lines.push("DELETE FROM clients;");
  lines.push("");
  lines.push("INSERT INTO clients (id, name) VALUES");
  lines.push(
    clients.map((c) => `  (${c.id}, ${sqlStr(String(c.name))})`).join(",\n") + ";"
  );
  lines.push("");
  lines.push("INSERT INTO transactions (client_id, date, amount, account_value_before, note) VALUES");
  lines.push(
    txns
      .map(
        (t) =>
          `  (${t.client_id}, ${sqlStr(String(t.date))}, ${sqlNum(Number(t.amount))}, ${sqlNum(
            t.account_value_before == null ? null : Number(t.account_value_before)
          )}, ${sqlStr(t.note == null ? null : String(t.note))})`
      )
      .join(",\n") + ";"
  );
  lines.push("");
  lines.push("INSERT INTO valuations (date, total_value, note) VALUES");
  lines.push(
    vals
      .map(
        (v) =>
          `  (${sqlStr(String(v.date))}, ${sqlNum(Number(v.total_value))}, ${sqlStr(
            v.note == null ? null : String(v.note)
          )})`
      )
      .join(",\n") + ";"
  );

  console.log(lines.join("\n"));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
