import "server-only";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Shared plumbing for the mobile REST API (/api/v1/*).
//
// The web app uses Auth.js cookie sessions; native apps can't rely on those, so
// the API issues a signed JWT that the app sends as `Authorization: Bearer <t>`.
// ---------------------------------------------------------------------------

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me",
);
const ISSUER = "wanbai-store";
const TOKEN_TTL = "30d";
// Only touch lastActiveAt if it's stale — avoids a write on nearly every
// mobile request while still tracking activity closely enough for the
// re-engagement email job (which only cares about day-level inactivity).
const ACTIVITY_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

export type TokenPayload = { sub: string; role: string };

export async function signToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret);
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: String(payload.role ?? "USER") };
  } catch {
    return null;
  }
}

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
  walletBalance: number;
  gsmWalletBalance: number;
  preferredLocale: string | null;
  preferredCurrency: string | null;
};

/** Resolve the caller from the Bearer token, or null. */
export async function getApiUser(req: Request): Promise<ApiUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      walletBalance: true,
      gsmWalletBalance: true,
      preferredLocale: true,
      preferredCurrency: true,
      lastActiveAt: true,
    },
  });
  if (!user) return null;

  // Throttled — the app calls this on nearly every request; only write when
  // the existing timestamp is stale, matching the web session check.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > ACTIVITY_THROTTLE_MS) {
    prisma.user
      .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});
  }
  const { lastActiveAt, ...apiUser } = user;
  void lastActiveAt;
  return apiUser;
}

// --- responses -------------------------------------------------------------

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** `code` is a stable machine-readable string the app maps to a translation. */
export function fail(code: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, ...extra }, { status });
}

export const unauthorized = () => fail("unauthorized", 401);
export const notFound = () => fail("not_found", 404);

/** Wrap a handler that requires an authenticated user. */
export function withAuth<C>(
  handler: (req: Request, user: ApiUser, ctx: C) => Promise<Response>,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const user = await getApiUser(req);
    if (!user) return unauthorized();
    return handler(req, user, ctx);
  };
}
