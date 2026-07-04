import { login } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Portfolio Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Enter your password to continue</p>
        </div>
        <form
          action={login}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
