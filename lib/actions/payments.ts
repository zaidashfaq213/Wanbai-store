"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, getAdminUser, isStaff } from "@/lib/auth/session";
import { imageToDataUrl, PROOF_MAX_BYTES } from "@/lib/upload";
import { sendMail } from "@/lib/mail";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

function loc(v: string): Locale {
  return isLocale(v) ? v : defaultLocale;
}

export type PaymentState = { ok: boolean; code?: string };

// ---------------------------------------------------------------------------
// Customer: submit a bank-transfer screenshot
// ---------------------------------------------------------------------------

const topUpSchema = z.object({
  amountUsd: z.coerce.number().min(1).max(10_000_000),
  bankAccountId: z.string().min(1),
  senderName: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
});

export async function submitWalletTopUp(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = topUpSchema.safeParse({
    amountUsd: formData.get("amountUsd"),
    bankAccountId: formData.get("bankAccountId"),
    senderName: formData.get("senderName") || undefined,
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const bank = await prisma.bankAccount.findUnique({
    where: { id: parsed.data.bankAccountId },
  });
  if (!bank || !bank.active) return { ok: false, code: "invalid_bank" };

  const upload = await imageToDataUrl(formData.get("screenshot"), PROOF_MAX_BYTES);
  if (!upload.ok) return { ok: false, code: `proof_${upload.error}` };

  await prisma.paymentSubmission.create({
    data: {
      userId: user.id,
      purpose: "WALLET_TOPUP",
      amount: Math.round(parsed.data.amountUsd * 100),
      bankAccountId: bank.id,
      senderName: parsed.data.senderName,
      reference: parsed.data.reference,
      proofUrl: upload.dataUrl,
    },
  });

  revalidatePath(`/${locale}/dashboard/wallet`);
  return { ok: true, code: "submitted" };
}

const orderPaySchema = z.object({
  orderRef: z.string().min(1),
  bankAccountId: z.string().min(1),
  senderName: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
});

export async function submitOrderPayment(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = orderPaySchema.safeParse({
    orderRef: formData.get("orderRef"),
    bankAccountId: formData.get("bankAccountId"),
    senderName: formData.get("senderName") || undefined,
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const order = await prisma.order.findUnique({
    where: { ref: parsed.data.orderRef },
  });
  if (!order || order.userId !== user.id) return { ok: false, code: "invalid_order" };

  const bank = await prisma.bankAccount.findUnique({
    where: { id: parsed.data.bankAccountId },
  });
  if (!bank || !bank.active) return { ok: false, code: "invalid_bank" };

  const upload = await imageToDataUrl(formData.get("screenshot"), PROOF_MAX_BYTES);
  if (!upload.ok) return { ok: false, code: `proof_${upload.error}` };

  await prisma.paymentSubmission.create({
    data: {
      userId: user.id,
      purpose: "ORDER",
      amount: order.total,
      bankAccountId: bank.id,
      orderId: order.id,
      senderName: parsed.data.senderName,
      reference: parsed.data.reference,
      proofUrl: upload.dataUrl,
    },
  });

  revalidatePath(`/${locale}/dashboard/orders`, "layout");
  return { ok: true, code: "submitted" };
}

// ---------------------------------------------------------------------------
// Admin: approve / reject a submission, and manually fulfill orders
// ---------------------------------------------------------------------------

// Orders + Payments are handled by BOTH Supervisors (ADMIN) and Managers, so
// these actions accept any staff. Bank-account edits stay Supervisor-only
// (they use getAdminUser directly).
async function requireStaffUser() {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) return null;
  return user;
}

export async function approveSubmission(formData: FormData) {
  const admin = await requireStaffUser();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));

  const sub = await prisma.paymentSubmission.findUnique({ where: { id } });
  if (!sub || sub.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.paymentSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    });

    if (sub.purpose === "WALLET_TOPUP") {
      await tx.user.update({
        where: { id: sub.userId },
        data: { walletBalance: { increment: sub.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: sub.userId,
          amount: sub.amount,
          type: "TOPUP",
          description: "Bank transfer top-up (approved)",
        },
      });
      await tx.notification.create({
        data: {
          userId: sub.userId,
          type: "WALLET",
          title: "Wallet top-up approved",
          body: `${(sub.amount / 100).toFixed(2)} ج.س added to your wallet.`,
          href: "/dashboard/wallet",
        },
      });
    } else if (sub.orderId) {
      // Mark the order paid; the admin then fulfills it (enters the code).
      await tx.order.update({
        where: { id: sub.orderId },
        data: { status: "PAID" },
      });
      await tx.notification.create({
        data: {
          userId: sub.userId,
          type: "ORDER",
          title: "Payment approved",
          body: "We're preparing your order now.",
          href: "/dashboard/orders",
        },
      });
    }
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/payments`);
}

export async function rejectSubmission(formData: FormData) {
  const admin = await requireStaffUser();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 300);
  const locale = loc(String(formData.get("locale") ?? ""));

  const sub = await prisma.paymentSubmission.findUnique({ where: { id } });
  if (!sub || sub.status !== "PENDING") return;

  await prisma.paymentSubmission.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: note || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  await prisma.notification.create({
    data: {
      userId: sub.userId,
      type: "WALLET",
      title: "Payment could not be verified",
      body: note || "Please check your transfer and submit again.",
      href: sub.purpose === "ORDER" ? "/dashboard/orders" : "/dashboard/wallet",
    },
  });

  revalidatePath(`/${locale}/admin/payments`);
}

// Manually fulfill an order: set the delivered code and mark it DELIVERED.
export async function fulfillOrder(formData: FormData) {
  const admin = await requireStaffUser();
  if (!admin) return;
  const orderId = String(formData.get("orderId") ?? "");
  const code = String(formData.get("code") ?? "").trim().slice(0, 500);
  const locale = loc(String(formData.get("locale") ?? ""));

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    if (order.items[0]) {
      await tx.orderItem.update({
        where: { id: order.items[0].id },
        data: { deliveredCode: code || null, deliveredAt: new Date() },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });
    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER",
          title: `Order ${order.ref} delivered`,
          body: "Your order has been delivered. Check your orders.",
          href: "/dashboard/orders",
        },
      });
    }
  });

  // Email the delivery (code for gift-card products, or a fulfilment note).
  const item = order.items[0];
  const codeLine = code
    ? `<p>Your code / details:</p><p style="font-size:20px;font-weight:800;font-family:monospace">${code}</p>`
    : "<p>Your top-up / service has been completed.</p>";
  await sendMail({
    to: order.email,
    subject: `WANBAI-STORE — Order ${order.ref} delivered`,
    text: `Your order ${order.ref} (${item?.productName ?? ""}) has been delivered.${code ? ` Code: ${code}` : ""}`,
    html: `<p>Your order <strong>${order.ref}</strong>${item ? ` — ${item.productName} · ${item.packageLabel}` : ""} has been delivered.</p>${codeLine}<p>Thank you for shopping with WANBAI-STORE.</p>`,
  });

  revalidatePath(`/${locale}/admin/orders`, "layout");
}

// Refund a paid/delivered order: credit the customer's wallet and mark REFUNDED.
export async function refundOrder(formData: FormData) {
  const admin = await requireStaffUser();
  if (!admin) return;
  const orderId = String(formData.get("orderId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "REFUNDED") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
    if (order.userId) {
      await tx.user.update({
        where: { id: order.userId },
        data: { walletBalance: { increment: order.total } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: order.userId,
          amount: order.total,
          type: "REFUND",
          description: `Refund for order ${order.ref}`,
          orderId: order.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "WALLET",
          title: `Order ${order.ref} refunded`,
          body: `${(order.total / 100).toFixed(2)} ج.س was added back to your wallet.`,
          href: "/dashboard/wallet",
        },
      });
    }
  });

  revalidatePath(`/${locale}/admin/orders`, "layout");
}

const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "DELIVERED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]);

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireStaffUser();
  if (!admin) return;
  const orderId = String(formData.get("orderId") ?? "");
  const locale = loc(String(formData.get("locale") ?? ""));
  const parsed = orderStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data },
  });
  revalidatePath(`/${locale}/admin/orders`, "layout");
}

// Admin: update a payout bank's details.
const bankSchema = z.object({
  id: z.string().min(1),
  accountName: z.string().trim().min(1).max(120),
  accountNumber: z.string().trim().min(1).max(120),
  instructionsEn: z.string().trim().max(300).optional(),
  instructionsAr: z.string().trim().max(300).optional(),
  active: z.boolean(),
});

export async function updateBankAccount(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const admin = await getAdminUser(); // Supervisor only
  if (!admin) return { ok: false, code: "requires_auth" };
  const locale = loc(String(formData.get("locale") ?? ""));

  const parsed = bankSchema.safeParse({
    id: formData.get("id"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    instructionsEn: formData.get("instructionsEn") || undefined,
    instructionsAr: formData.get("instructionsAr") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  // Logo: upload a new file, keep the current one, or clear it.
  let logo: string | null | undefined; // undefined = leave unchanged
  if (formData.get("removeLogo") === "on") {
    logo = null;
  } else {
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      const upload = await imageToDataUrl(file);
      if (!upload.ok) return { ok: false, code: `logo_${upload.error}` };
      logo = upload.dataUrl;
    }
  }

  const { id, ...data } = parsed.data;
  await prisma.bankAccount.update({
    where: { id },
    data: { ...data, ...(logo !== undefined ? { logo } : {}) },
  });
  revalidatePath(`/${locale}/admin/banks`);
  return { ok: true, code: "saved" };
}
