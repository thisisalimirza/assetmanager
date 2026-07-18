"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions";

const LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/transactions", label: "Transactions" },
  { href: "/app/valuations", label: "Valuations" },
  { href: "/app/activity", label: "Activity" },
  { href: "/app/reconcile", label: "Reconcile" },
  { href: "/app/settings", label: "Settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 print:hidden">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-3 sm:px-6">
        <Link href="/app" className="mr-1 shrink-0 font-semibold tracking-tight sm:mr-2">
          Capital<span className="text-emerald-600 dark:text-emerald-400">Alpha</span>
        </Link>

        {/* Desktop / tablet links */}
        <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors lg:px-3 " +
                  (active
                    ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <form action={logout} className="ml-auto shrink-0 md:ml-0">
          <button
            type="submit"
            className="hidden rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:inline-block dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 md:hidden dark:border-zinc-700 dark:text-zinc-200"
          aria-expanded={open}
          aria-controls="app-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
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
      </nav>

      {open && (
        <div
          id="app-mobile-nav"
          className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-col">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "rounded-md px-3 py-3 text-base " +
                    (active
                      ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-700 dark:text-zinc-300")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
            <form action={logout} className="mt-1 border-t border-zinc-200 pt-1 dark:border-zinc-800">
              <button
                type="submit"
                className="w-full rounded-md px-3 py-3 text-left text-base text-zinc-600 dark:text-zinc-400"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
