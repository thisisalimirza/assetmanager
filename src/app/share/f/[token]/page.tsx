import { notFound } from "next/navigation";
import { getFundShareToken } from "@/lib/portfolio";
import { FundTrackRecord } from "@/app/components/FundTrackRecord";

export const dynamic = "force-dynamic";

/**
 * Capability-URL version of the public track record (same content as
 * /track-record). Useful for sharing a stable secret link from Settings.
 */
export default async function FundSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = await getFundShareToken();
  if (!expected || token !== expected) notFound();

  return <FundTrackRecord />;
}
