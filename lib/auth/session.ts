import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Locale } from "@/lib/i18n/config";

/** The current session user, or null for guests. */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
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
