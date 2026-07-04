import { NavBar } from "@/app/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-zinc-400 sm:px-6 print:hidden">
        <a href="/api/export" className="hover:text-zinc-600 hover:underline dark:hover:text-zinc-300">
          Download backup (JSON)
        </a>
      </footer>
    </div>
  );
}
