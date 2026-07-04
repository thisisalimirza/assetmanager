import { getDb } from "./db";

export type Contributor = {
  id: number;
  name: string;
};

export type Contribution = {
  id: number;
  contributorId: number;
  date: string;
  amount: number;
  note: string | null;
};

export type Snapshot = {
  id: number;
  date: string;
  totalValue: number;
  note: string | null;
};

export type ContributorSummary = {
  id: number;
  name: string;
  costBasis: number;
  share: number;
  profitAmount: number;
  currentValue: number;
};

export type PortfolioSummary = {
  totalCostBasis: number;
  currentValue: number;
  totalProfit: number;
  growthRate: number;
  latestSnapshotDate: string | null;
  contributors: ContributorSummary[];
};

// --- Contributors ---

export async function listContributors(): Promise<Contributor[]> {
  const db = await getDb();
  const res = await db.execute("SELECT id, name FROM contributors ORDER BY name");
  return res.rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
}

export async function addContributor(name: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "INSERT INTO contributors (name) VALUES (?)", args: [name] });
}

export async function renameContributor(id: number, name: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "UPDATE contributors SET name = ? WHERE id = ?", args: [name, id] });
}

export async function deleteContributor(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM contributors WHERE id = ?", args: [id] });
}

// --- Contributions ---

export async function listContributions(): Promise<Contribution[]> {
  const db = await getDb();
  const res = await db.execute(
    "SELECT id, contributor_id, date, amount, note FROM contributions ORDER BY date DESC, id DESC"
  );
  return res.rows.map((r) => ({
    id: Number(r.id),
    contributorId: Number(r.contributor_id),
    date: String(r.date),
    amount: Number(r.amount),
    note: r.note == null ? null : String(r.note),
  }));
}

export async function addContribution(
  contributorId: number,
  date: string,
  amount: number,
  note?: string
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO contributions (contributor_id, date, amount, note) VALUES (?, ?, ?, ?)",
    args: [contributorId, date, amount, note ?? null],
  });
}

export async function updateContribution(
  id: number,
  fields: { contributorId: number; date: string; amount: number; note?: string }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE contributions SET contributor_id = ?, date = ?, amount = ?, note = ? WHERE id = ?",
    args: [fields.contributorId, fields.date, fields.amount, fields.note ?? null, id],
  });
}

export async function deleteContribution(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM contributions WHERE id = ?", args: [id] });
}

// --- Snapshots ---

export async function listSnapshots(): Promise<Snapshot[]> {
  const db = await getDb();
  const res = await db.execute(
    "SELECT id, date, total_value, note FROM snapshots ORDER BY date DESC, id DESC"
  );
  return res.rows.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    totalValue: Number(r.total_value),
    note: r.note == null ? null : String(r.note),
  }));
}

export async function addSnapshot(date: string, totalValue: number, note?: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO snapshots (date, total_value, note) VALUES (?, ?, ?)",
    args: [date, totalValue, note ?? null],
  });
}

export async function updateSnapshot(
  id: number,
  fields: { date: string; totalValue: number; note?: string }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE snapshots SET date = ?, total_value = ?, note = ? WHERE id = ?",
    args: [fields.date, fields.totalValue, fields.note ?? null, id],
  });
}

export async function deleteSnapshot(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM snapshots WHERE id = ?", args: [id] });
}

// --- Summary ---

/**
 * Splits profit pro-rata by each contributor's share of total net deposits
 * (dollar-weighted, not time-weighted — a contribution from yesterday counts
 * the same per dollar as one from years ago). Matches the spreadsheet model
 * this app replaces.
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [contributors, contributions, snapshots] = await Promise.all([
    listContributors(),
    listContributions(),
    listSnapshots(),
  ]);

  const costBasisByContributor = new Map<number, number>();
  for (const c of contributors) costBasisByContributor.set(c.id, 0);
  for (const c of contributions) {
    costBasisByContributor.set(c.contributorId, (costBasisByContributor.get(c.contributorId) ?? 0) + c.amount);
  }

  const totalCostBasis = contributions.reduce((sum, c) => sum + c.amount, 0);
  const latest = snapshots[0] ?? null;
  const currentValue = latest ? latest.totalValue : totalCostBasis;
  const totalProfit = currentValue - totalCostBasis;
  const growthRate = totalCostBasis !== 0 ? totalProfit / totalCostBasis : 0;

  const contributorSummaries: ContributorSummary[] = contributors.map((c) => {
    const costBasis = costBasisByContributor.get(c.id) ?? 0;
    const share = totalCostBasis !== 0 ? costBasis / totalCostBasis : 0;
    const profitAmount = share * totalProfit;
    return {
      id: c.id,
      name: c.name,
      costBasis,
      share,
      profitAmount,
      currentValue: costBasis + profitAmount,
    };
  });

  return {
    totalCostBasis,
    currentValue,
    totalProfit,
    growthRate,
    latestSnapshotDate: latest?.date ?? null,
    contributors: contributorSummaries,
  };
}
