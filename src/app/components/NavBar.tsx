"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

const LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/transactions", label: "Transactions" },
  { href: "/app/valuations", label: "Valuations" },
  { href: "/app/activity", label: "Activity" },
  { href: "/app/reconcile", label: "Reconcile" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 print:hidden">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/app" className="mr-2 shrink-0 font-semibold tracking-tight">
          Capital<span className="text-emerald-600 dark:text-emerald-400">Alpha</span>
        </Link>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors " +
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
        <Link
          href="/app/settings"
          className={
            "shrink-0 rounded-md px-3 py-1.5 text-sm " +
            (isActive(pathname, "/app/settings")
              ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100")
          }
        >
          Settings
        </Link>
        <form action={logout} className="shrink-0">
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
