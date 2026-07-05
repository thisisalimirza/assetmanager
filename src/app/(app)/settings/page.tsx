import Link from "next/link";
import { getFundShareToken } from "@/lib/portfolio";
import { createFundShareLink, revokeFundShareLink } from "@/app/actions";
import { ShareLinkCard } from "@/app/components/ShareLinkCard";
import { PageHeader, SectionHeader } from "@/app/components/PageHeader";
import { buttonStyles, cardStyles } from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const fundShareToken = await getFundShareToken();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        subtitle="Sharing, backups, and record-keeping. Each client's private link lives on their own page."
      />

      <div>
        <SectionHeader>Sharing</SectionHeader>
        <ShareLinkCard
          title="Public track record link"
          description="A read-only page for prospective investors: time-weighted performance vs the S&P only — no dollar amounts, no client names, no AUM."
          path={fundShareToken ? `/share/f/${fundShareToken}` : null}
          createAction={createFundShareLink}
          revokeAction={revokeFundShareLink}
        />
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
            <Link href="/audit" className={buttonStyles.secondary}>
              View audit trail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
