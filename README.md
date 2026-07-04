WANBAI-STORE — an Arabic-first (RTL), multi-currency digital-goods & game top-up
store built with Next.js 16 (App Router), Tailwind v4, Prisma + PostgreSQL, and
Auth.js v5.

## Getting Started

Use **Node 20/22/24 LTS** (see `.nvmrc`):

```bash
nvm use          # picks up .nvmrc
npm install      # runs `prisma generate` automatically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Milestone 3 — Accounts, Wallet & Checkout (backend setup)

M3 adds authentication, a user dashboard, a wallet, favorites, notifications and
order creation. It needs a PostgreSQL database.

1. **Configure env** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your PostgreSQL connection string.
   - `AUTH_SECRET` — generate with `npx auth secret` (a dev value is pre-filled).
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `AUTH_FACEBOOK_ID` /
     `AUTH_FACEBOOK_SECRET` — optional; the login buttons only appear when set.
   - `SMTP_*` — optional; without them, password-reset links are logged to the
     server console instead of emailed.

2. **Create the tables**:

   ```bash
   npx prisma migrate dev --name init   # or: npm run db:push for a quick sync
   ```

3. **(Optional) seed a demo account** — `demo@wanbai.store` / `password123`:

   ```bash
   npm run db:seed
   ```

4. `npm run dev`, then visit `/en/signup` or `/en/login`.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run db:migrate` | Create/apply migrations (`prisma migrate dev`) |
| `npm run db:push` | Push schema without a migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the demo user |

### What's in M3

- **Auth**: email/password + Google/Facebook OAuth + password reset (Auth.js v5,
  Prisma adapter, bcrypt).
- **Dashboard** (`/[lang]/dashboard`): overview, orders, favorites,
  notifications, wallet, profile — guarded; guests are redirected to login.
- **Wallet**: USD-cents balance, top-up (demo), transaction history; usable at
  checkout.
- **Checkout**: guest + logged-in order creation from the product page. Wallet
  payments complete + deliver instantly; card/gateway orders are created as
  `PENDING` (real gateway lands in M4).
- **Favorites & notifications** wired across the store (product Save button,
  order/wallet events).

Payment amounts are stored in **USD cents**; display conversion uses the existing
currency selector.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
