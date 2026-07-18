import type { Metadata } from "next";
import Link from "next/link";

// The fund share URL is the intentional public track record — allow indexing.
export const metadata: Metadata = {
  title: "Public track record",
  description:
    "Live performance of Capital Alpha Fund versus the S&P 500 — a public record of the Alpha Fund.",
  robots: { index: true, follow: true },
};

export default function FundShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--caf-paper)] text-[var(--caf-ink)]">
      <header className="border-b border-[var(--caf-mist)] bg-white/80 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-[0.08em] uppercase text-[var(--caf-signal-deep)]"
          >
            Capital Alpha Fund
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--caf-mute)]">Public track record</span>
            <Link href="/" className="text-[var(--caf-mute)] transition-colors hover:text-[var(--caf-ink)]">
              Home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-[var(--caf-mute)] sm:px-6 print:hidden">
        Public track record — no member names or private balances. Not an offer to the general
        public.{" "}
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to Capital Alpha Fund
        </Link>
      </footer>
    </div>
  );
}
