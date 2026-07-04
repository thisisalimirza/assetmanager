"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const ModalContext = createContext<() => void>(() => {});

type ModalProps = {
  label: ReactNode;
  title: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const triggerStyles: Record<string, string> = {
  primary:
    "inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  secondary:
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  ghost:
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
};

export function Modal({ label, title, children, variant = "primary", className }: ModalProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? triggerStyles[variant]}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>
            <ModalContext.Provider value={close}>{children}</ModalContext.Provider>
          </div>
        </div>
      )}
    </>
  );
}

/** Access the enclosing Modal's close function (no-op outside a Modal). */
export function useModalClose(): () => void {
  return useContext(ModalContext);
}
