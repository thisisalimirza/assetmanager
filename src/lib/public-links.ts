import { getFundShareToken } from "@/lib/portfolio";

/**
 * Canonical public track-record URL for the marketing site.
 * Prefers the capability link managed in Settings (`/share/f/<token>`).
 * Falls back to `/track-record` when no token has been created yet.
 */
export async function getPublicTrackRecordHref(): Promise<string> {
  const token = await getFundShareToken();
  if (token) return `/share/f/${token}`;
  return "/track-record";
}
