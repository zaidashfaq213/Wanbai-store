import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Expo app calls this server from a phone on the LAN. Next 16 blocks
  // cross-origin dev requests by default, so allow the local network here.
  allowedDevOrigins: [
    // Wildcarded — the machine's LAN IP on this subnet keeps changing
    // (DHCP), so pin the subnet instead of chasing individual addresses.
    "192.168.100.*",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
  ],
  // Baseline security headers on every response.
  async headers() {
    // Audited against the actual codebase before writing this (no external
    // scripts/CDNs, next/font self-hosts fonts, JSON-LD uses
    // application/ld+json which CSP doesn't gate). 'unsafe-inline' stays on
    // script-src/style-src deliberately: Next.js App Router injects its own
    // inline bootstrap/streaming <script> tags (no nonce wired up here) and
    // this app uses plain React inline style={{}} in ~16 files — blocking
    // either without a nonce-based rewrite would break rendering outright.
    // Everything else (third-party script/frame/object loading, clickjacking,
    // MIME sniffing) is still locked down.
    //
    // Dev-only: Turbopack/React need eval() for HMR and dev-mode stack-trace
    // reconstruction (React never uses eval() in production) — without this,
    // `next dev` fails at the "eval() is not supported" error. Kept out of
    // the production policy.
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      // api.g2bulk.com: game icons shown on Admin -> Game API (lib/gameapi/).
      "img-src 'self' data: blob: https://api.g2bulk.com",
      "font-src 'self'",
      `connect-src 'self'${isDev ? " ws:" : ""}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Safe once the site is always served over HTTPS (it is, via the
          // Let's Encrypt cert + nginx). 2 years, applies to subdomains.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
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
