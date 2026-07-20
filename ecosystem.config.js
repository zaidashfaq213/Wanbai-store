// PM2 process config for the production server.
//   pm2 start ecosystem.config.js && pm2 save
//
// Runs the PRODUCTION build (`next start`), not `next dev` — dev mode is far
// heavier and unstable on a VPS. Always run `npm run build` before (re)starting.
module.exports = {
  apps: [
    {
      name: "wanbai",
      // `next start` — production server. Requires a prior `npm run build`.
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      // Restart the app if it grows past this — prevents a slow leak from
      // taking the whole box down. Tune to your RAM (≈ 60–70% of total).
      max_memory_restart: "600M",
      // Cap Node's heap a bit below the memory-restart ceiling.
      node_args: "--max-old-space-size=512",
      // Don't hammer-restart on a hard crash loop (e.g. missing build): back off
      // and stop after 10 quick failures so CPU doesn't spike to 90%+.
      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
