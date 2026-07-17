import Link from "next/link";
import { login } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--caf-paper)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-[var(--caf-ink)]"
          >
            Capital <span className="text-[var(--caf-signal-deep)]">Alpha</span> Fund
          </Link>
          <p className="mt-2 text-sm text-[var(--caf-mute)]">Member portal — enter your password</p>
        </div>
        <form
          action={login}
          className="border border-[var(--caf-mist)] bg-white p-6"
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
            className="w-full border border-[var(--caf-mist)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--caf-ink)]"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full bg-[var(--caf-ink)] px-3 py-2 text-sm font-semibold text-[var(--caf-paper)] hover:bg-[var(--caf-forest)]"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--caf-mute)]">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to Capital Alpha Fund
          </Link>
        </p>
      </div>
    </div>
  );
}
