import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

/**
 * The current session user, or null for guests.
 *
 * The session lives in a JWT, so its user id can outlive the actual DB record
 * (e.g. the DB was reseeded, or the user was deleted). We verify the record
 * still exists and treat a stale session as logged-out — this stops every
 * write action (orders, tickets, favorites, profile) from throwing foreign-key
 * / "record not found" errors. If the DB is briefly unreachable we trust the
 * token instead of blocking public pages.
 *
 * Wrapped in cache(): layouts and pages (and requireUser/requireAdmin/
 * requireStaff, which all call this) commonly run more than once per request
 * — cache() collapses the auth() call + existence check to a single lookup.
 */
// Only touch lastActiveAt if it's stale — avoids a write on every single
// page navigation while still tracking activity closely enough for the
// re-engagement email job (which only cares about day-level inactivity).
const ACTIVITY_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

export const getSessionUser = cache(async () => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  try {
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, lastActiveAt: true },
    });
    if (!existing) return null;
    if (!existing.lastActiveAt || Date.now() - existing.lastActiveAt.getTime() > ACTIVITY_THROTTLE_MS) {
      // Fire-and-forget — never let this add latency to a page load.
      prisma.user
        .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    }
  } catch {
    // DB unreachable — don't block; fall back to the token.
  }
  return user;
});

/**
 * Require an authenticated user. Redirects guests to the locale login page
 * with a callback back to where they were headed.
 */
export async function requireUser(locale: Locale, callbackPath?: string) {
  const user = await getSessionUser();
  if (!user) {
    const cb = callbackPath ? `?callbackUrl=${encodeURIComponent(callbackPath)}` : "";
    redirect(`/${locale}/login${cb}`);
  }
  return user;
}

// Admin panel roles. ADMIN = "Supervisor" (full access); MANAGER = limited
// staff who only handle Orders (requests) + Payments (deposits).
export const STAFF_ROLES = ["ADMIN", "MANAGER"] as const;
export function isStaff(role?: string | null) {
  return role === "ADMIN" || role === "MANAGER";
}

/** Session user if they're admin-panel staff (ADMIN or MANAGER), else null. */
export async function getStaffUser() {
  const u = await getSessionUser();
  return u && isStaff(u.role) ? u : null;
}
/** Session user if they're a Supervisor (full ADMIN), else null. */
export async function getAdminUser() {
  const u = await getSessionUser();
  return u && u.role === "ADMIN" ? u : null;
}

/**
 * Require any admin-panel user (Supervisor OR Manager). Used by the admin
 * layout and the Orders / Payments pages that both roles can access.
 */
export async function requireStaff(locale: Locale) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/admin/login`);
  if (!isStaff(user.role)) redirect(`/${locale}/dashboard`);
  return user;
}

/**
 * Require a Supervisor (full ADMIN). Guests → admin login; a Manager is sent to
 * their allowed home (Orders); regular users → dashboard.
 */
export async function requireAdmin(locale: Locale) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/admin/login`);
  if (user.role === "MANAGER") redirect(`/${locale}/admin/orders`);
  if (user.role !== "ADMIN") redirect(`/${locale}/dashboard`);
  return user;
}
