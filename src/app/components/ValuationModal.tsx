import { createValuation, editValuation, removeValuation } from "@/app/actions";
import type { Valuation } from "@/lib/portfolio";
import { Modal, ModalSubmit } from "./Modal";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";
const labelClass = "mb-1 block text-xs font-medium text-zinc-500";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ValuationModal({
  latestValue,
  valuation,
  label,
  variant = "primary",
  className,
}: {
  latestValue?: number;
  valuation?: Valuation;
  label: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const isEdit = !!valuation;
  const value = valuation?.totalValue ?? (latestValue && latestValue > 0 ? latestValue : "");

  return (
    <Modal label={label} title={isEdit ? "Edit valuation" : "Record valuation"} variant={variant} className={className}>
      <form action={isEdit ? editValuation : createValuation} className="flex flex-col gap-3">
        {isEdit && <input type="hidden" name="id" value={valuation!.id} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="date" defaultValue={valuation?.date ?? today()} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total value</label>
            <input
              type="number"
              name="totalValue"
              step="0.01"
              min="0"
              defaultValue={value}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Note (optional)</label>
          <input name="note" defaultValue={valuation?.note ?? ""} className={inputClass} />
        </div>
        <ModalSubmit>{isEdit ? "Save changes" : "Record valuation"}</ModalSubmit>
      </form>

      {isEdit && (
        <form className="mt-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <input type="hidden" name="id" value={valuation!.id} />
          <ConfirmSubmitButton
            confirmMessage="Delete this valuation?"
            formAction={removeValuation}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Delete valuation
          </ConfirmSubmitButton>
        </form>
      )}
    </Modal>
  );
}
