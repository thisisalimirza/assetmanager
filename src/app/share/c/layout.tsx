import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ClientShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-display font-semibold">
            Capital<span className="text-emerald-600 dark:text-emerald-400">Alpha</span>
          </span>
          <span className="border border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-500 dark:border-zinc-700">
            Private · read-only
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-zinc-400 sm:px-6 print:hidden">
        Private read-only view from Capital Alpha Fund. Questions? Ask Ali directly.
      </footer>
    </div>
  );
}
