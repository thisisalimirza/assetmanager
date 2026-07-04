"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useModalClose } from "./Modal";
import type { FormState } from "@/app/actions";

/**
 * Wraps a modal's form with useActionState so validation errors returned by the
 * server action render inline, and the modal closes automatically on success.
 */
export function ModalForm({
  action,
  submitLabel,
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const close = useModalClose();
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {children}
      {state.error && (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
