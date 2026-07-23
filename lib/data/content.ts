import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

// --- CMS pages -------------------------------------------------------------

export function getPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, published: true } });
}

export function getPages() {
  return prisma.page.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function getAdminPages() {
  return prisma.page.findMany({ orderBy: { sortOrder: "asc" } });
}

// --- Blog ------------------------------------------------------------------

export function getPosts() {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
}

export function getPost(slug: string) {
  return prisma.post.findFirst({ where: { slug, published: true } });
}

export function getAdminPosts() {
  return prisma.post.findMany({ orderBy: { publishedAt: "desc" } });
}

// --- Help centre -----------------------------------------------------------

export const HELP_CATEGORIES = ["getting-started", "account", "orders"] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export function getHelpFaqs() {
  return prisma.helpFaq.findMany({
    orderBy: [{ categoryKey: "asc" }, { sortOrder: "asc" }],
  });
}

// --- Store settings (singleton) --------------------------------------------

// Called by the storefront layout AND several pages/actions in the same
// request — cache() collapses those into a single DB round trip.
export const getSettings = cache(async () => {
  const existing = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  if (existing) return existing;
  return prisma.storeSettings.create({ data: { id: "store" } });
});

// --- Support tickets -------------------------------------------------------

export function getUserTickets(userId: string) {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
}

export function getUserTicket(id: string, userId: string) {
  return prisma.supportTicket.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
}

export function getAdminTickets(status?: "OPEN" | "ANSWERED" | "CLOSED") {
  return prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });
}

export function getAdminTicket(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
}

export function getOpenTicketCount() {
  return prisma.supportTicket.count({ where: { status: "OPEN" } });
}

// --- Reviews ---------------------------------------------------------------

/** Has this user bought (and paid for) the product? Gates review submission. */
export async function hasPurchased(userId: string, productSlug: string) {
  const count = await prisma.orderItem.count({
    where: {
      productSlug,
      order: { userId, status: { in: ["PAID", "DELIVERED"] } },
    },
  });
  return count > 0;
}

export async function hasReviewed(userId: string, productId: string) {
  const count = await prisma.productReview.count({ where: { userId, productId } });
  return count > 0;
}

export function getAdminReviews() {
  return prisma.productReview.findMany({
    where: { userId: { not: null } },
    orderBy: { id: "desc" },
    take: 100,
    include: { product: { select: { nameEn: true, slug: true } } },
  });
}
