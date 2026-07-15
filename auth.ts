import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Auth.js builds the OAuth callback from the site origin (AUTH_URL). If the
// .env only provides GOOGLE_REDIRECT_URI (the value registered in Google
// Console), derive AUTH_URL from its origin so the callback Auth.js sends to
// Google exactly matches what was registered — no separate AUTH_URL needed.
if (!process.env.AUTH_URL && process.env.GOOGLE_REDIRECT_URI) {
  try {
    const origin = new URL(process.env.GOOGLE_REDIRECT_URI).origin;
    process.env.AUTH_URL = origin;
    process.env.NEXTAUTH_URL = origin;
  } catch {
    // Malformed URL — ignore and fall back to request-host inference.
  }
}

// Accept either the Auth.js-style names (AUTH_GOOGLE_ID/SECRET) or the names
// Google Cloud Console shows (GOOGLE_CLIENT_ID/SECRET), so whichever the .env
// uses just works.
const GOOGLE_ID = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SECRET =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_ID = process.env.AUTH_FACEBOOK_ID ?? process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_SECRET =
  process.env.AUTH_FACEBOOK_SECRET ?? process.env.FACEBOOK_CLIENT_SECRET;

// Only enable an OAuth provider when its credentials are configured, so the
// login page can hide buttons that aren't wired up yet.
const oauthProviders: NextAuthConfig["providers"] = [];
if (GOOGLE_ID && GOOGLE_SECRET) {
  oauthProviders.push(
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}
if (FACEBOOK_ID && FACEBOOK_SECRET) {
  oauthProviders.push(
    Facebook({
      clientId: FACEBOOK_ID,
      clientSecret: FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/** Which OAuth providers are active — used by the login/signup UI. */
export const enabledOAuth = {
  google: Boolean(GOOGLE_ID && GOOGLE_SECRET),
  facebook: Boolean(FACEBOOK_ID && FACEBOOK_SECRET),
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires the JWT session strategy. OAuth accounts are
  // still persisted via the Prisma adapter for account linking.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    // Locale-prefixed guards are handled in the dashboard layout; this is the
    // fallback path Auth.js redirects to for protected calls.
    signIn: "/en/login",
  },
  providers: [
    ...oauthProviders,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        // No user, or an OAuth-only account without a password set.
        if (!user?.passwordHash) return null;
        // Block sign-in until the signup email code has been verified.
        if (!user.emailVerified) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, persist id + role onto the token.
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
});
