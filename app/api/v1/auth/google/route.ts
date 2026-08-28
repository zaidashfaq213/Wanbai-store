import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, signToken } from "@/lib/api/core";

// Mobile Google Sign-In (@react-native-google-signin/google-signin) hands
// the app an ID token signed by Google; the app posts it here and we swap it
// for our own API token — same shape /auth/login already returns, so the
// app's existing token-storage code doesn't need to know Google was involved.
//
// The mobile app is configured with the SAME "webClientId" as the website's
// AUTH_GOOGLE_ID (that's how Google's native SDKs work — see the deploy
// notes), so we only ever need to check the token was issued for that one
// audience; no separate mobile client id/secret to manage.
const schema = z.object({ idToken: z.string().min(1) });

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_input");

  const googleClientId = process.env.AUTH_GOOGLE_ID;
  if (!googleClientId) return fail("server_error", 500);

  let info: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.idToken)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return fail("invalid_credentials", 401);
    info = await res.json();
  } catch {
    return fail("invalid_credentials", 401);
  }

  // aud must match our own client — otherwise this is a token minted for a
  // completely different app and proves nothing about who's calling us.
  if (info.aud !== googleClientId) return fail("invalid_credentials", 401);
  if (info.email_verified !== "true" && info.email_verified !== true) {
    return fail("invalid_credentials", 401);
  }
  const email = String(info.email ?? "").trim().toLowerCase();
  if (!email) return fail("invalid_credentials", 401);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: info.name ?? null,
        image: info.picture ?? null,
        // Google already verified this address — no code step needed.
        emailVerified: new Date(),
      },
    });
  } else if (!user.emailVerified) {
    // e.g. they'd started a credentials signup and never verified it —
    // Google proving the same email is good enough to unblock the account.
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const token = await signToken(user.id, user.role);
  return ok({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
