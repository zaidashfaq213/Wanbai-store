import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Expo app calls this server from a phone on the LAN. Next 16 blocks
  // cross-origin dev requests by default, so allow the local network here.
  allowedDevOrigins: [
    "192.168.100.7",
    "192.168.100.9",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
  ],
  experimental: {
    serverActions: {
      // Logo/product images are uploaded through Server Actions, which cap the
      // request body at 1 MB by default — raise it so large images go through.
      bodySizeLimit: "25mb",
      // Behind a reverse proxy, Next validates the Server Action's Origin against
      // the Host. List the production domain(s) here so live actions aren't
      // rejected (this is what causes "A server error occurred" on every form).
      allowedOrigins: [
        "wanbai-stoer.com",
        "www.wanbai-stoer.com",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
