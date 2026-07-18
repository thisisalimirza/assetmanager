import { NavBar } from "@/app/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 pb-20 sm:px-6 sm:py-8 sm:pb-16">
        {children}
      </main>
    </div>
  );
}
