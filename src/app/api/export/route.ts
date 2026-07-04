import { listClients, listTransactions, listValuations } from "@/lib/portfolio";

// Full JSON backup of everything in the app. Protected by the auth middleware
// like every other route. Downloaded as a dated file.
export const dynamic = "force-dynamic";

export async function GET() {
  const [clients, transactions, valuations] = await Promise.all([
    listClients(),
    listTransactions(),
    listValuations(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 2,
    clients,
    transactions,
    valuations,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="portfolio-backup-${date}.json"`,
    },
  });
}
