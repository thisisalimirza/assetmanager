import type { Metadata } from "next";

// Default for share routes: keep out of search indexes. `/share/f` overrides
// this in its own layout because that URL is the intentional public track record.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ShareRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
