"use client";

import { useEffect, useState } from "react";

const SUBSTACK_URL = "https://capitalalpha.substack.com/";

const LINKS = [
  { href: "#performance", label: "Performance" },
  { href: "#join", label: "How to join" },
  { href: SUBSTACK_URL, label: "Writing", external: true },
] as const;

/**
 * Marketing header: compact brand + hamburger on small screens,
 * inline links from sm up.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="relative z-20 mx-auto w-full max-w-6xl px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 font-display text-xs font-semibold tracking-[0.08em] uppercase text-[var(--caf-signal)] sm:text-sm">
          <span className="sm:hidden">Capital Alpha</span>
          <span className="hidden sm:inline">Capital Alpha Fund</span>
        </p>

        <nav
          className="hidden items-center gap-6 text-sm text-[var(--caf-mist)] sm:flex"
          aria-label="Primary"
        >
          {LINKS.map((link) =>
            "external" in link && link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="caf-nav-link hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <a key={link.href} href={link.href} className="caf-nav-link hover:text-white">
                {link.label}
              </a>
            ),
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border border-[var(--caf-mist)]/35 text-[var(--caf-paper)] sm:hidden"
          aria-expanded={open}
          aria-controls="marketing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span className="relative block h-3.5 w-4" aria-hidden>
            <span
              className={
                "absolute left-0 block h-0.5 w-4 bg-current transition-transform " +
                (open ? "top-1.5 rotate-45" : "top-0")
              }
            />
            <span
              className={
                "absolute left-0 top-1.5 block h-0.5 w-4 bg-current transition-opacity " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            <span
              className={
                "absolute left-0 block h-0.5 w-4 bg-current transition-transform " +
                (open ? "top-1.5 -rotate-45" : "top-3")
              }
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="marketing-mobile-nav"
          className="mt-3 border border-[var(--caf-mist)]/25 bg-[var(--caf-ink)]/95 p-2 backdrop-blur sm:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-3 text-base text-[var(--caf-paper)] active:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-3 text-base text-[var(--caf-paper)] active:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
