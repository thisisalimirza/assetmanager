import { createTransaction, editTransaction, removeTransaction } from "@/app/actions";
import type { Client, Transaction } from "@/lib/portfolio";
import { Modal, ModalSubmit } from "./Modal";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";
const labelClass = "mb-1 block text-xs font-medium text-zinc-500";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionModal({
  clients,
  latestValue,
  transaction,
  defaultClientId,
  label,
  variant = "primary",
  className,
}: {
  clients: Client[];
  latestValue: number;
  transaction?: Transaction;
  defaultClientId?: number;
  label: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const isEdit = !!transaction;
  const dir = transaction ? (transaction.amount < 0 ? "withdrawal" : "deposit") : "deposit";
  const amount = transaction ? Math.abs(transaction.amount) : "";
  const clientId = transaction?.clientId ?? defaultClientId ?? clients[0]?.id;
  const avb = transaction?.accountValueBefore ?? (latestValue > 0 ? latestValue : "");

  return (
    <Modal label={label} title={isEdit ? "Edit transaction" : "Record transaction"} variant={variant} className={className}>
      <form action={isEdit ? editTransaction : createTransaction} className="flex flex-col gap-3">
        {isEdit && <input type="hidden" name="id" value={transaction!.id} />}

        <div>
          <label className={labelClass}>Client</label>
          <select name="clientId" defaultValue={clientId} required className={inputClass}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type</label>
            <select name="direction" defaultValue={dir} className={inputClass}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              defaultValue={amount}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="date" defaultValue={transaction?.date ?? today()} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Account value before</label>
            <input
              type="number"
              name="accountValueBefore"
              step="0.01"
              min="0"
              defaultValue={avb}
              placeholder="Total value pre-deposit"
              className={inputClass}
            />
          </div>
        </div>
        {!isEdit && latestValue > 0 && (
          <p className="-mt-1 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            ← Prefilled with the last recorded value. Update it to your{" "}
            <strong>current Robinhood total</strong> right now, or the client&apos;s units will be mispriced.
          </p>
        )}
        <p className="-mt-1 text-xs text-zinc-400">
          Total fund value right before this transaction — used to price the client&apos;s units fairly.
          Leave blank only for the very first deposit ever.
        </p>

        <div>
          <label className={labelClass}>Note (optional)</label>
          <input name="note" defaultValue={transaction?.note ?? ""} className={inputClass} />
        </div>

        <div className="mt-1 flex items-center gap-2">
          <ModalSubmit>{isEdit ? "Save changes" : "Record transaction"}</ModalSubmit>
        </div>
      </form>

      {isEdit && (
        <form className="mt-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <input type="hidden" name="id" value={transaction!.id} />
          <ConfirmSubmitButton
            confirmMessage="Delete this transaction? This will re-price the fund's units."
            formAction={removeTransaction}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Delete transaction
          </ConfirmSubmitButton>
        </form>
      )}
    </Modal>
  );
}
