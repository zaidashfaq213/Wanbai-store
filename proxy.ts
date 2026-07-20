import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./lib/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

function resolveLocale(request: NextRequest): string {
  // Respect an explicit choice saved by the language switcher (so a user who
  // switches to English stays on English). Otherwise ALWAYS default to Arabic —
  // we deliberately do NOT auto-detect the browser's Accept-Language, so every
  // first-time visitor lands on the Arabic site.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = resolveLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
