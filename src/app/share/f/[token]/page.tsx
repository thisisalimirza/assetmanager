import { notFound } from "next/navigation";
import { getFundShareToken } from "@/lib/portfolio";
import { FundTrackRecord } from "@/app/components/FundTrackRecord";

export const dynamic = "force-dynamic";

/** Canonical public track record — capability URL managed in Settings. */
export default async function FundSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = await getFundShareToken();
  if (!expected || token !== expected) notFound();

  return <FundTrackRecord />;
}
