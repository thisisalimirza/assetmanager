import type { Metadata } from "next";

// Read-only pages reached via secret share links — no session, no nav, and
// (since the URL is the credential) explicitly excluded from search indexing.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-semibold tracking-tight">
            Portfolio<span className="text-emerald-600 dark:text-emerald-400">Tracker</span>
          </span>
          <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-500 dark:border-zinc-700">
            Read-only
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-zinc-400 sm:px-6 print:hidden">
        This page is a private, read-only view. If you have questions about anything shown here,
        contact your advisor directly.
      </footer>
    </div>
  );
}
