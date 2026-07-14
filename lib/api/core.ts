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
      preferredLocale: true,
      preferredCurrency: true,
    },
  });
  return user;
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
