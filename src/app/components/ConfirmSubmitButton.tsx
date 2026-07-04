"use client";

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
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
