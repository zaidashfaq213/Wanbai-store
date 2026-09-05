import { prisma } from "@/lib/db";
import { signToken } from "@/lib/api/core";
import { SITE_URL } from "@/lib/seo";

// Where the mobile app's Google sign-in (lib/auth.tsx signInWithGoogle)
// lands after Google's consent screen. This is an https:// URL because a
// "Web application" OAuth client — the SAME one the website already uses
// (GOOGLE_CLIENT_ID/AUTH_GOOGLE_ID) — is only allowed to redirect to
// http(s) origins, never a custom app:// scheme directly. So the code
// exchange (which needs the client SECRET — never shipped to the app)
// happens here, then we bounce the browser on to the app's own wanbai://
// scheme with our own API token attached. app/auth-callback.tsx in the
// mobile app picks that up.
const APP_SCHEME = "wanbai";

function bounceToApp(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return Response.redirect(`${APP_SCHEME}://auth-callback?${qs}`, 302);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return bounceToApp({ error: "invalid_credentials" });
  if (!code) return bounceToApp({ error: "invalid_input" });

  // Same env-var fallback as auth.ts, so this always matches whichever name
  // is actually set.
  const clientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return bounceToApp({ error: "server_error" });

  const redirectUri = `${SITE_URL}/api/v1/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed (${tokenRes.status})`);
    const tokenData: { id_token?: string } = await tokenRes.json();
    if (!tokenData.id_token) throw new Error("no id_token in response");

    // The id_token came straight from Google's token endpoint over a direct
    // HTTPS server-to-server call authenticated with our client secret —
    // that's already a trusted channel, so decoding the JWT payload here
    // (rather than re-verifying its signature) is standard practice for this
    // flow.
    const payloadB64 = tokenData.id_token.split(".")[1];
    const payload: {
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
    } = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

    if (payload.email_verified !== true && payload.email_verified !== "true") {
      return bounceToApp({ error: "invalid_credentials" });
    }
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!email) return bounceToApp({ error: "invalid_credentials" });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: payload.name ?? null,
          image: payload.picture ?? null,
          emailVerified: new Date(),
        },
      });
    } else if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    const apiToken = await signToken(user.id, user.role);
    return bounceToApp({ token: apiToken });
  } catch (e) {
    console.error("[google callback] failed:", e);
    return bounceToApp({ error: "invalid_credentials" });
  }
}
