# WANBAI-STORE

An Arabic-first (RTL), multi-currency **digital-goods & game top-up store** —
game top-ups, gift cards, e-payment, activation keys, telecom recharge and app
subscriptions — with **manual (no-API) fulfilment**.

Built with **Next.js 16** (App Router), **Tailwind v4**, **Prisma + PostgreSQL**,
**Auth.js v5**.

---

## 1. Quick start

Use **Node 20/22/24 LTS** (a `.nvmrc` is included):

```bash
nvm use            # picks up .nvmrc
npm install        # also runs `prisma generate`
cp .env.example .env
# → fill in DATABASE_URL (and AUTH_SECRET; a dev one is pre-generated)
npx prisma db push # create all tables
npm run db:seed    # demo data: users, banks, catalog, pages, FAQs, blog
npm run dev
```

Open <http://localhost:3000> (redirects to `/ar`, the default locale).

> **Important:** after **any** Prisma schema change you must **restart the dev
> server** — the generated client lives in `node_modules` and Turbopack caches it.

### Seeded logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@wanbai.store` | `admin123` |
| Customer | `demo@wanbai.store` | `password123` |

---

## 2. Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js session secret (`npx auth secret`) |
| `AUTH_URL` | ✅ | Public base URL — used for OAuth callbacks, email links, sitemap |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | – | Google sign-in (button hidden until set) |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | – | Facebook sign-in |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | – | Outgoing email |

Without SMTP the app still works: verification codes, password-reset links and
delivery emails are **printed to the server console** instead of being sent.

---

## 3. How the store works (manual model)

There are **no supplier APIs**. Every order is fulfilled by a human admin.

**Money comes in one of two ways:**

1. **Wallet top-up** — customer picks an amount + one of the banks
   (O-Cash / MyCashi / BOK), transfers the money, uploads a **screenshot**.
   Admin reviews it → **approves** → wallet is credited.
2. **Direct bank payment for an order** — customer buys a product, chooses
   "Bank transfer", uploads the screenshot for that order. Admin approves → order
   becomes `PAID`.

**Buying:** on the product page the customer picks a package (price), then pays
either **from wallet** (instant debit → order `PAID`) or **by bank transfer**
(order `PENDING` until the screenshot is approved). Guests are asked to sign in.

**Fulfilment:** in **Admin → Orders**, the admin enters the real code / note and
clicks *Mark delivered*. The customer gets an **email** plus an in-app
notification, and the code appears under *My Orders*.

**Refunds:** Admin → Orders → *Refund* credits the amount back to the wallet.

Screenshots are stored in the database (base64) — no object storage needed.
Upload limit: **5 MB** (PNG / JPG / WebP).

---

## 4. Admin panel — `/[lang]/admin`

Sign in at **`/[lang]/admin/login`** with an `ADMIN` account.

| Section | What you can do |
| --- | --- |
| **Overview** | Pending payments, active orders, users, **revenue + top products** |
| **Payments** | Review payment **screenshots**; approve / reject (filter by status & type) |
| **Orders** | **Manually fulfil** (enter code) · change status · **refund** · filter · **View & chat**: open an order to see the customer, their inputs, payment screenshots, and **chat with the buyer** about that order |
| **Products** | Create / edit / delete products, **edit package prices**, variants |
| **Categories** | Create / edit / delete storefront categories |
| **Tickets** | Reply to support tickets, close / reopen |
| **Reviews** | Moderate customer reviews (hide / delete) |
| **Pages** | Edit the CMS/legal pages (About, Terms, Privacy, Return, Cookie, GDPR) |
| **Blog** | Write and publish articles |
| **Help FAQs** | Manage the help-center questions |
| **Bank Accounts** | Your payout banks — **put the real account numbers here** |
| **Users** | **View** a user (orders, payments, wallet history), adjust wallet, delete |
| **Settings** | WhatsApp / Telegram / email + social links shown across the site |

---

## 5. Catalog

The catalog is **fully database-driven and admin-managed** (nothing is
hardcoded). `lib/data/catalog-static.ts` only exists to seed the DB the first
time; at runtime everything is read through `lib/data/catalog-db.ts`.

Prices are stored in **USD cents**; the storefront converts them for display via
the currency selector (USD / EGP / SDG).

---

## 6. Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to the DB (no migration file) |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:seed` | Seed demo data (safe to re-run — it upserts) |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

---

## 7. Project structure

```
app/[lang]/
  (storefront)/        home, cards, product, search, help, contact, blog, pages
  admin/(panel)/       admin back-office (guarded)
  admin/login/         admin sign-in (outside the guard)
  dashboard/           customer area (orders, wallet, favorites, tickets…)
  login • signup • verify-email • forgot/reset-password
components/            ui, layout, home, catalog, product, dashboard, admin, auth
lib/
  actions/             server actions (checkout, payments, catalog, content, …)
  data/                DB read helpers
  i18n/                dictionaries (ar.json / en.json) — both must stay in sync
prisma/schema.prisma   database schema
```

Everything is bilingual: **every user-facing string lives in
`lib/i18n/dictionaries/{ar,en}.json`** and both files must have an identical
shape.

---

## 8. SEO

- Per-page `<title>`, description, OpenGraph/Twitter tags and **canonical** URLs.
- `app/sitemap.ts` → **`/sitemap.xml`** (all locales × categories, products,
  pages, blog posts).
- `app/robots.ts` → **`/robots.txt`** (blocks `/admin`, `/dashboard`, `/api`).

Set `AUTH_URL` to the live domain so these emit the correct absolute URLs.

---

## 9. Deployment checklist

1. Provision **PostgreSQL** and set `DATABASE_URL`.
2. Set `AUTH_SECRET` and `AUTH_URL` (the real domain, `https://…`).
3. Configure **SMTP** so customers receive codes and delivered orders.
4. `npx prisma migrate deploy` (or `db push`), then `npm run db:seed` **once**.
5. `npm run build && npm start`.
6. In **Admin → Bank Accounts**, replace the placeholder account numbers.
7. In **Admin → Settings**, add WhatsApp / Telegram / socials.
8. Change the seeded admin password (or create a new admin and delete the demo).
