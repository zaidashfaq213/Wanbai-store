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
};

export default nextConfig;
