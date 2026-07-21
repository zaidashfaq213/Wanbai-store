"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}
async function requireAdminUser() {
  const user = await getSessionUser();
  return user && user.role === "ADMIN" ? user : null;
}

// --- Users -----------------------------------------------------------------

export type UserDetail = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  walletBalance: number;
  orders: Array<{
    ref: string;
    status: string;
    total: number;
    createdAt: string;
    items: Array<{ productName: string; packageLabel: string; deliveredCode: string | null }>;
  }>;
  submissions: Array<{
    amount: number;
    status: string;
    purpose: string;
    bankName: string;
    createdAt: string;
  }>;
  transactions: Array<{
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }>;
  favoritesCount: number;
};

// Fetch a full snapshot of a user for the admin "view" modal.
export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  if (!(await requireAdminUser())) return null;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: true },
      },
      paymentSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { bankAccount: { select: { nameEn: true, nameAr: true } } },
      },
      walletTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { favorites: true } },
    },
  });
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    verified: Boolean(u.emailVerified),
    createdAt: u.createdAt.toISOString(),
    walletBalance: u.walletBalance,
    orders: u.orders.map((o) => ({
      ref: o.ref,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        productName: it.productName,
        packageLabel: it.packageLabel,
        deliveredCode: it.deliveredCode,
      })),
    })),
    submissions: u.paymentSubmissions.map((s) => ({
      amount: s.amount,
      status: s.status,
      purpose: s.purpose,
      bankName: s.bankAccount.nameEn,
      createdAt: s.createdAt.toISOString(),
    })),
    transactions: u.walletTransactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    favoritesCount: u._count.favorites,
  };
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdminUser();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const raw = String(formData.get("role") ?? "");
  const role = raw === "ADMIN" ? "ADMIN" : raw === "MANAGER" ? "MANAGER" : "USER";
  const locale = loc(String(formData.get("locale") ?? ""));
  // Don't let a Supervisor strip their own rights (avoid lock-out).
  if (userId === admin.id && role !== "ADMIN") return;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/staff`);
}

// --- Staff (Supervisors / Managers) ----------------------------------------

/** Existing staff accounts (ADMIN or MANAGER), newest first. */
export function getStaffList() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
  });
}

const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "MANAGER"]),
});

/** Create a new staff account (Supervisor or Manager), verified immediately. */
export async function createStaff(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "password") return { ok: false, code: "weak_password" };
    if (field === "email") return { ok: false, code: "invalid_email" };
    if (field === "username") return { ok: false, code: "invalid_username" };
    return { ok: false, code: "invalid_input" };
  }
  const { name, username, email, password, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) return { ok: false, code: "email_taken" };
  if (await prisma.user.findUnique({ where: { username } })) return { ok: false, code: "username_taken" };

  // Staff sign in with these credentials right away — no email verification.
  await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      emailVerified: new Date(),
    },
  });

  revalidatePath(`/${locale}/admin/staff`);
  return { ok: true, code: "created" };
}

const adjustSchema = z.object({
  userId: z.string().min(1),
  amountUsd: z.coerce.number().min(-10_000_000).max(10_000_000),
  reason: z.string().trim().max(200).optional(),
});

export type AdminState = { ok: boolean; code?: string };

export async function adjustWallet(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const parsed = adjustSchema.safeParse({
    userId: formData.get("userId"),
    amountUsd: formData.get("amountUsd"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success || parsed.data.amountUsd === 0) {
    return { ok: false, code: "invalid_input" };
  }
  const cents = Math.round(parsed.data.amountUsd * 100);
  const locale = loc(String(formData.get("locale") ?? ""));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: parsed.data.userId },
      data: { walletBalance: { increment: cents } },
    }),
    prisma.walletTransaction.create({
      data: {
        userId: parsed.data.userId,
        amount: cents,
        type: "ADJUSTMENT",
        description: parsed.data.reason || "Admin adjustment",
      },
    }),
    prisma.notification.create({
      data: {
        userId: parsed.data.userId,
        type: "WALLET",
        title: cents >= 0 ? "Wallet credited" : "Wallet adjusted",
        body: `${cents >= 0 ? "+" : "−"}${Math.abs(parsed.data.amountUsd).toFixed(2)} ج.س${parsed.data.reason ? ` — ${parsed.data.reason}` : ""}`,
        href: "/dashboard/wallet",
      },
    }),
  ]);

  revalidatePath(`/${locale}/admin/users`);
  return { ok: true, code: "saved" };
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdminUser();
  if (!admin) return;
  const userId = String(formData.get("userId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  if (userId === admin.id) return; // can't delete yourself
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath(`/${locale}/admin/users`);
}

// --- Bank accounts ---------------------------------------------------------

const bankCreateSchema = z.object({
  key: z.string().trim().min(2).max(30).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().trim().min(1).max(60),
  nameAr: z.string().trim().min(1).max(60),
  accountName: z.string().trim().min(1).max(120),
  accountNumber: z.string().trim().min(1).max(120),
  color: z.string().trim().max(20).optional(),
});

export async function createBankAccount(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, code: "requires_auth" };
  const parsed = bankCreateSchema.safeParse({
    key: formData.get("key"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const exists = await prisma.bankAccount.findUnique({ where: { key: parsed.data.key } });
  if (exists) return { ok: false, code: "slug_taken" };

  const count = await prisma.bankAccount.count();
  await prisma.bankAccount.create({
    data: { ...parsed.data, color: parsed.data.color || "#6d28d9", sortOrder: count },
  });
  revalidatePath(`/${loc(String(formData.get("locale") ?? ""))}/admin/banks`);
  return { ok: true, code: "saved" };
}

export async function deleteBankAccount(formData: FormData) {
  const admin = await requireAdminUser();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  const used = await prisma.paymentSubmission.count({ where: { bankAccountId: id } });
  if (used > 0) {
    // Keep history intact — just deactivate instead of hard delete.
    await prisma.bankAccount.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.bankAccount.delete({ where: { id } });
  }
  revalidatePath(`/${locale}/admin/banks`);
}
