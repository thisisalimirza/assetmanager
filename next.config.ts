import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old bookmark-friendly paths → portal under /app.
  async redirects() {
    return [
      {
        source: "/clients",
        destination: "/app/clients",
        permanent: true,
      },
      {
        source: "/clients/:path*",
        destination: "/app/clients/:path*",
        permanent: true,
      },
      {
        source: "/transactions",
        destination: "/app/transactions",
        permanent: true,
      },
      {
        source: "/valuations",
        destination: "/app/valuations",
        permanent: true,
      },
      {
        source: "/activity",
        destination: "/app/activity",
        permanent: true,
      },
      {
        source: "/reconcile",
        destination: "/app/reconcile",
        permanent: true,
      },
      {
        source: "/settings",
        destination: "/app/settings",
        permanent: true,
      },
      {
        source: "/audit",
        destination: "/app/audit",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
