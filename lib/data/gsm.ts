import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

// --- Storefront (public, active-only) ---------------------------------------

export const getGsmCategories = cache(async () => {
  return prisma.gsmCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: { where: { active: true } } } } },
  });
});

export const getGsmCategoryBySlug = cache(async (slug: string) => {
  return prisma.gsmCategory.findFirst({
    where: { slug, active: true },
    include: {
      services: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });
});

// All active services with their category slug — used by the sitemap
// (getGsmCategoryBySlug/getGsmCategories don't carry every service's own
// slug list flattened across categories, which is what a sitemap needs).
export const getAllGsmServices = cache(async () => {
  return prisma.gsmService.findMany({
    where: { active: true },
    include: { category: { select: { slug: true } } },
    orderBy: { sortOrder: "asc" },
  });
});

export const getGsmServiceBySlug = cache(async (slug: string) => {
  return prisma.gsmService.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      fields: { orderBy: { sortOrder: "asc" } },
    },
  });
});

// --- Customer (own orders) ---------------------------------------------------

export function getGsmOrders(userId: string) {
  return prisma.gsmOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { service: { select: { nameEn: true, nameAr: true } } },
  });
}

export function getGsmOrderDetail(ref: string, userId: string) {
  return prisma.gsmOrder.findFirst({
    where: { ref, userId },
    include: {
      service: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      files: { orderBy: { createdAt: "asc" } },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
}

// --- Admin --------------------------------------------------------------

export function getAdminGsmCategories() {
  return prisma.gsmCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: true } } },
  });
}

export function getAdminGsmServices() {
  return prisma.gsmService.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { nameEn: true, nameAr: true } } },
  });
}

export function getAdminGsmService(id: string) {
  return prisma.gsmService.findUnique({
    where: { id },
    include: { fields: { orderBy: { sortOrder: "asc" } }, category: true },
  });
}

export function getAdminGsmOrders() {
  return prisma.gsmOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      service: { select: { nameEn: true, nameAr: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export function getAdminGsmOrderDetail(id: string) {
  return prisma.gsmOrder.findUnique({
    where: { id },
    include: {
      service: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      user: { select: { name: true, email: true } },
      files: { orderBy: { createdAt: "asc" } },
      notes: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
}

export function getGsmOpenOrderCount() {
  return prisma.gsmOrder.count({
    where: { status: { in: ["PAID", "UNDER_REVIEW", "IN_PROGRESS"] } },
  });
}
