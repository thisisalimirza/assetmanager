"use client";

import { useState, useSyncExternalStore } from "react";
import { buttonStyles } from "./ui";

// window.location.origin doesn't exist during SSR; useSyncExternalStore gives
// us "" on the server and the real origin after hydration without a mismatch.
const noopSubscribe = () => () => {};
function useOrigin(): string {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}

/**
 * Manages a secret read-only share link (create / copy / regenerate / revoke).
 * The URL itself is the credential: regenerating or revoking immediately kills
 * the old link, so a leaked URL is always recoverable.
 */
export function ShareLinkCard({
  title,
  description,
  path,
  clientId,
  createAction,
  revokeAction,
}: {
  title: string;
  description: string;
  path: string | null; // e.g. "/share/c/<token>", or null when no link exists
  clientId?: number; // included as a hidden field for the per-client actions
  createAction: (formData: FormData) => Promise<void>;
  revokeAction: (formData: FormData) => Promise<void>;
}) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  const url = path ? `${origin}${path}` : null;

  const hidden = clientId != null && (
    <input type="hidden" name="id" value={clientId} />
  );

  const buttonClass = buttonStyles.secondary;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
        {!path && (
          <form action={createAction}>
            {hidden}
            <button type="submit" className={buttonClass}>
              Create link
            </button>
          </form>
        )}
      </div>

      {url && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
          />
          <button
            type="button"
            className={buttonClass}
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <form
            action={createAction}
            onSubmit={(e) => {
              if (!confirm("Generate a new link? The current link will stop working immediately.")) {
                e.preventDefault();
              }
            }}
          >
            {hidden}
            <button type="submit" className={buttonClass}>
              Regenerate
            </button>
          </form>
          <form
            action={revokeAction}
            onSubmit={(e) => {
              if (!confirm("Revoke this link? Anyone who has it will lose access immediately.")) {
                e.preventDefault();
              }
            }}
          >
            {hidden}
            <button type="submit" className={buttonStyles.danger}>
              Revoke
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
