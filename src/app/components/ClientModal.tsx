import { createClient, editClient, removeClient } from "@/app/actions";
import type { Client } from "@/lib/portfolio";
import { Modal, ModalSubmit } from "./Modal";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";
const labelClass = "mb-1 block text-xs font-medium text-zinc-500";

export function ClientModal({
  client,
  label,
  variant = "primary",
  className,
}: {
  client?: Client;
  label: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const isEdit = !!client;

  return (
    <Modal label={label} title={isEdit ? "Edit client" : "Add client"} variant={variant} className={className}>
      <form action={isEdit ? editClient : createClient} className="flex flex-col gap-3">
        {isEdit && <input type="hidden" name="id" value={client!.id} />}
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" defaultValue={client?.name ?? ""} required className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email (optional)</label>
            <input type="email" name="email" defaultValue={client?.email ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input name="phone" defaultValue={client?.phone ?? ""} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea name="notes" defaultValue={client?.notes ?? ""} rows={2} className={inputClass} />
        </div>
        <ModalSubmit>{isEdit ? "Save changes" : "Add client"}</ModalSubmit>
      </form>

      {isEdit && (
        <form className="mt-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <input type="hidden" name="id" value={client!.id} />
          <ConfirmSubmitButton
            confirmMessage={`Delete ${client!.name}? This permanently deletes the client and all of their transactions.`}
            formAction={removeClient}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Delete client
          </ConfirmSubmitButton>
        </form>
      )}
    </Modal>
  );
}
