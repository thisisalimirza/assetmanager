import Link from "next/link";
import { getFundShareToken, getPublicShowDollars } from "@/lib/portfolio";
import { createFundShareLink, revokeFundShareLink, setPublicDollars } from "@/app/actions";
import { ShareLinkCard } from "@/app/components/ShareLinkCard";
import { PageHeader, SectionHeader } from "@/app/components/PageHeader";
import { buttonStyles, cardStyles } from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [fundShareToken, showDollars] = await Promise.all([
    getFundShareToken(),
    getPublicShowDollars(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        subtitle="Sharing, backups, and record-keeping. Each client's private link lives on their own page."
      />

      <div>
        <SectionHeader>Sharing</SectionHeader>
        <div className="flex flex-col gap-3">
          <ShareLinkCard
            title="Shareable track record link"
            description="Same content as the always-public /track-record page, but as a secret capability URL you can revoke. Client names are never shown."
            path={fundShareToken ? `/share/f/${fundShareToken}` : null}
            createAction={createFundShareLink}
            revokeAction={revokeFundShareLink}
          />
          <p className="text-xs text-zinc-500">
            The marketing site also links to the stable public page{" "}
            <a href="/track-record" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              /track-record
            </a>
            .
          </p>

          <div className={`${cardStyles} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <h3 className="text-sm font-medium">Show dollar amounts on the public link</h3>
              <p className="mt-0.5 max-w-xl text-xs text-zinc-500">
                On: prospects see AUM, total profit, and the complete activity ledger with real
                dollar amounts. Off: percent-only track record — trades show date, ticker, and
                market price, with no AUM, quantities, or dollar figures.
              </p>
            </div>
            <form action={setPublicDollars} className="flex items-center gap-2">
              <input type="hidden" name="value" value={showDollars ? "0" : "1"} />
              <span className="text-xs font-medium text-zinc-500">{showDollars ? "On" : "Off"}</span>
              <button
                type="submit"
                role="switch"
                aria-checked={showDollars}
                aria-label="Show dollar amounts on the public link"
                className={
                  "flex h-6 w-10 items-center rounded-full p-1 transition-colors " +
                  (showDollars ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")
                }
              >
                <span
                  className={
                    "h-4 w-4 rounded-full bg-white shadow transition-transform " +
                    (showDollars ? "translate-x-4" : "")
                  }
                />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader>Data &amp; records</SectionHeader>
        <div className="flex flex-col gap-3">
          <div className={`${cardStyles} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <h3 className="text-sm font-medium">Backup</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Complete snapshot of clients, transactions, and valuations as JSON. Download one
                before making big changes.
              </p>
            </div>
            <a href="/api/export" className={buttonStyles.secondary}>
              Download backup
            </a>
          </div>

          <div className={`${cardStyles} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <h3 className="text-sm font-medium">Audit trail</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Append-only history of every change to transactions and valuations, with
                before/after snapshots — the paper trail behind every balance.
              </p>
            </div>
            <Link href="/app/audit" className={buttonStyles.secondary}>
              View audit trail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
