import { getClientStatementData } from "@/lib/portfolio";
import { formatPercent } from "@/lib/format";

// Per-client cost-basis export: every dated cash flow with a running net
// invested figure, plus the current value — the numbers a client (or their
// accountant) needs for "you put in $X across these dates, it's worth $Y now".
// Protected by the auth middleware like the rest of the app.
export const dynamic = "force-dynamic";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const data = Number.isNaN(id) ? null : await getClientStatementData(id);
  if (!data) return new Response("Not found", { status: 404 });

  const { client, summary, transactions, asOf } = data;
  const generated = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    `Client,${csvCell(client.name)}`,
    `Generated,${generated}`,
    `As of,${asOf ?? ""}`,
    `Current value,${summary.currentValue.toFixed(2)}`,
    `Net invested,${summary.costBasis.toFixed(2)}`,
    `Profit/loss,${summary.profit.toFixed(2)}`,
    `Return,${formatPercent(summary.returnPct)}`,
    `Ownership of fund,${formatPercent(summary.ownership)}`,
    "",
    "Date,Type,Amount,Running net invested,Note",
  ];

  let running = 0;
  for (const t of [...transactions].reverse()) {
    running += t.amount;
    lines.push(
      [
        t.date,
        t.amount < 0 ? "Withdrawal" : "Deposit",
        t.amount.toFixed(2),
        running.toFixed(2),
        csvCell(t.note ?? ""),
      ].join(",")
    );
  }

  const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cost-basis-${slug}-${generated}.csv"`,
    },
  });
}
