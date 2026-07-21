import "server-only";
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
 */
export async function getSessionUser() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  try {
    const exists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (!exists) return null;
  } catch {
    // DB unreachable — don't block; fall back to the token.
  }
  return user;
}

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

/** Require an ADMIN user. Guests → admin login; non-admins → dashboard. */
export async function requireAdmin(locale: Locale) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/admin/login`);
  if (user.role !== "ADMIN") redirect(`/${locale}/dashboard`);
  return user;
}
