import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/portfolio";
import { PrintButton } from "@/app/components/PrintButton";
import {
  AllTimeStatementCard,
  PeriodStatementCard,
  RangeChips,
  isoDate,
  resolvePeriod,
} from "@/app/components/StatementView";

export const dynamic = "force-dynamic";

export default async function StatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id: idStr } = await params;
  const { from, to } = await searchParams;
  const id = Number(idStr);
  if (Number.isNaN(id)) notFound();

  const generatedOn = isoDate(new Date());
  const period = await resolvePeriod(id, from, to);
  const client = period ? period.client : await getClient(id);
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/app/clients/${id}`} className="text-sm text-zinc-500 hover:underline">
          ← {client.name}
        </Link>
        <PrintButton />
      </div>

      <RangeChips basePath={`/app/clients/${id}/statement`} period={period} />

      {period ? (
        <PeriodStatementCard period={period} generatedOn={generatedOn} />
      ) : (
        <AllTimeStatementCard id={id} generatedOn={generatedOn} />
      )}
    </div>
  );
}
