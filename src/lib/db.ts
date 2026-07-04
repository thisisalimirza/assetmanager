import { createClient, type Client } from "@libsql/client";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  account_value_before REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS valuations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  total_value REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON valuations(date);
`;

declare global {
  var __dbClient: Client | undefined;
  var __dbMigrated: Promise<void> | undefined;
}

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

async function tableExists(client: Client, name: string): Promise<boolean> {
  const res = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    args: [name],
  });
  return res.rows.length > 0;
}

/**
 * One-time migration from the original v1 schema
 * (contributors / contributions / snapshots) into the v2 fund model
 * (clients / transactions / valuations).
 *
 * It backfills each migrated transaction's `account_value_before` with the
 * running sum of prior net deposits. That keeps the NAV per unit flat across
 * all historical deposits, so unitization reproduces the exact allocations the
 * v1 pro-rata model produced — nobody's balance jumps at migration. We do this
 * because v1 never recorded interim portfolio valuations, so there's no way to
 * price historical deposits against real market values. Deposits recorded from
 * now on are priced exactly against the account value entered at the time.
 */
async function migrateLegacyData(client: Client): Promise<void> {
  const hasLegacy = await tableExists(client, "contributors");
  if (!hasLegacy) return;

  const clientCount = await client.execute("SELECT COUNT(*) AS n FROM clients");
  if (Number(clientCount.rows[0].n) > 0) return; // already migrated

  // Copy contributors -> clients (preserve ids so FKs line up).
  const contributors = await client.execute(
    "SELECT id, name, created_at FROM contributors ORDER BY id"
  );
  for (const row of contributors.rows) {
    await client.execute({
      sql: "INSERT INTO clients (id, name, created_at) VALUES (?, ?, ?)",
      args: [Number(row.id), String(row.name), String(row.created_at)],
    });
  }

  // Copy snapshots -> valuations.
  if (await tableExists(client, "snapshots")) {
    const snapshots = await client.execute(
      "SELECT date, total_value, note, created_at FROM snapshots ORDER BY id"
    );
    for (const row of snapshots.rows) {
      await client.execute({
        sql: "INSERT INTO valuations (date, total_value, note, created_at) VALUES (?, ?, ?, ?)",
        args: [
          String(row.date),
          Number(row.total_value),
          row.note == null ? null : String(row.note),
          String(row.created_at),
        ],
      });
    }
  }

  // Copy contributions -> transactions, backfilling account_value_before with
  // the cumulative prior net deposits (flat NAV — see doc comment above).
  if (await tableExists(client, "contributions")) {
    const contributions = await client.execute(
      "SELECT contributor_id, date, amount, note, created_at FROM contributions ORDER BY date, id"
    );
    let cumulative = 0;
    for (const row of contributions.rows) {
      await client.execute({
        sql: "INSERT INTO transactions (client_id, date, amount, account_value_before, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [
          Number(row.contributor_id),
          String(row.date),
          Number(row.amount),
          cumulative,
          row.note == null ? null : String(row.note),
          String(row.created_at),
        ],
      });
      cumulative += Number(row.amount);
    }
  }
}

async function migrate(client: Client): Promise<void> {
  await client.executeMultiple(SCHEMA);
  await migrateLegacyData(client);
}

export async function getDb(): Promise<Client> {
  if (!global.__dbClient) {
    global.__dbClient = makeClient();
  }
  if (!global.__dbMigrated) {
    global.__dbMigrated = migrate(global.__dbClient);
  }
  await global.__dbMigrated;
  return global.__dbClient;
}
