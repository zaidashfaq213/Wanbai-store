// Optional demo seed — creates a test account you can log in with.
// Run after migrating:  npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@wanbai.store";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash,
      emailVerified: new Date(),
      preferredLocale: "ar",
      preferredCurrency: "USD",
      walletBalance: 2500, // $25.00
      walletTransactions: {
        create: { amount: 2500, type: "TOPUP", description: "Welcome credit" },
      },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Welcome to WANBAI-STORE 🎉",
          body: "Your demo account is ready. Explore the store!",
          href: "/dashboard",
        },
      },
    },
  });

  console.log(`Seeded demo user: ${user.email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
