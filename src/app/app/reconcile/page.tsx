import { listClients, listTransactions } from "@/lib/portfolio";
import { ReconcileTool } from "@/app/components/ReconcileTool";
import { PageHeader } from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const [clients, txns] = await Promise.all([listClients(), listTransactions()]);
  const clientNames = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const unreconciled = txns.filter((t) => !t.reconciledAt).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reconcile"
        subtitle={
          "Check recorded deposits and withdrawals against actual money movement (Venmo, bank, or brokerage exports) and flag mismatches." +
          (txns.length > 0
            ? ` ${txns.length - unreconciled} of ${txns.length} transactions reconciled so far.`
            : "")
        }
      />

      <ReconcileTool
        transactions={txns.map((t) => ({
          id: t.id,
          clientId: t.clientId,
          date: t.date,
          amount: t.amount,
          reconciledAt: t.reconciledAt,
        }))}
        clientNames={clientNames}
      />
    </div>
  );
}
