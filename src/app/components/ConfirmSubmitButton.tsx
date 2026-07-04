"use client";

import { useModalClose } from "./Modal";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  formAction,
  children,
}: {
  confirmMessage: string;
  className?: string;
  formAction?: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  const close = useModalClose();
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        // Close the enclosing modal (if any) after the submit dispatches.
        setTimeout(close, 0);
      }}
    >
      {children}
    </button>
  );
}
