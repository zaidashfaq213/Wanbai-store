"use server";

import { createHash, randomBytes, randomInt } from "crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut, enabledOAuth } from "@/auth";
import { sendMail } from "@/lib/mail";
import { verificationEmail } from "@/lib/emails/verification";
import { isLocale, defaultLocale } from "@/lib/i18n/config";

// Result codes are mapped to localized strings on the client (dict.auth.errors).
export type FormState = { ok: boolean; code?: string };

const CODE_TTL_MS = 1000 * 60 * 15; // verification code valid for 15 minutes
const MAX_CODE_ATTEMPTS = 6;

function localeFrom(formData: FormData) {
  const raw = String(formData.get("locale") ?? "");
  return isLocale(raw) ? raw : defaultLocale;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Create (replacing any previous) a 6-digit code for an email and send it.
async function issueVerificationCode(email: string) {
  const code = generateCode();
  await prisma.emailVerificationCode.deleteMany({ where: { email } });
  await prisma.emailVerificationCode.create({
    data: {
      email,
      codeHash: hashToken(code),
      expires: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  await sendMail({ to: email, ...verificationEmail(code) });
}

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = localeFrom(formData);
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.path[0];
    if (issue === "password") return { ok: false, code: "weak_password" };
    if (issue === "email") return { ok: false, code: "invalid_email" };
    if (issue === "username") return { ok: false, code: "invalid_username" };
    return { ok: false, code: "invalid_input" };
  }
  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, code: "email_taken" };

  const usernameTaken = await prisma.user.findUnique({ where: { username } });
  if (usernameTaken) return { ok: false, code: "username_taken" };

  const passwordHash = await bcrypt.hash(password, 12);
  // Create the account as unverified; access is gated until the emailed code
  // is confirmed on the verify-email page.
  await prisma.user.create({
    data: { name, username, email, passwordHash, preferredLocale: locale },
  });
  await issueVerificationCode(email);

  // redirect() throws NEXT_REDIRECT which propagates out of the action.
  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
}

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function verifyEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = localeFrom(formData);
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { ok: false, code: "code_invalid" };
  const { email, code } = parsed.data;

  const record = await prisma.emailVerificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expires < new Date()) {
    return { ok: false, code: "code_expired" };
  }
  if (record.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false, code: "code_too_many" };
  }
  if (record.codeHash !== hashToken(code)) {
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, code: "code_invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationCode.deleteMany({ where: { email } }),
  ]);

  redirect(`/${locale}/login?verified=1`);
}

export async function resendCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, code: "invalid_email" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Only (re)send for existing, still-unverified accounts. Report success either
  // way to avoid leaking which emails exist.
  if (user && !user.emailVerified) {
    await issueVerificationCode(parsed.data.email);
  }
  return { ok: true, code: "code_sent" };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = localeFrom(formData);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, code: "invalid_credentials" };

  // Give unverified users a clear message (and a resend path) instead of a
  // generic "invalid credentials" from the credentials provider.
  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (account?.passwordHash && !account.emailVerified) {
    const match = await bcrypt.compare(parsed.data.password, account.passwordHash);
    if (match) {
      // Re-issue a code and send them to the verify page (redirect throws).
      await issueVerificationCode(parsed.data.email);
      redirect(
        `/${locale}/verify-email?email=${encodeURIComponent(parsed.data.email)}&notice=unverified`,
      );
    }
  }

  // Only allow a small allow-list of post-login destinations (no open redirect).
  // Regular users land on the storefront homepage (not the dashboard) so they
  // can keep shopping; only the admin-panel login explicitly asks for /admin.
  const next = String(formData.get("next") ?? "");
  const redirectTo = next === "admin" ? `/${locale}/admin` : `/${locale}`;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "invalid_credentials" };
    }
    throw error;
  }
  return { ok: true };
}

// Kick off an OAuth flow (Google/Facebook). Throws a redirect to the provider.
export async function oauthLoginAction(formData: FormData) {
  const locale = localeFrom(formData);
  const provider = String(formData.get("provider") ?? "");
  if (provider !== "google" && provider !== "facebook") return;
  // If the provider isn't configured yet (no env credentials), don't crash —
  // send the user back with a friendly notice.
  if (!enabledOAuth[provider]) {
    redirect(`/${locale}/login?error=oauth_unavailable`);
  }
  await signIn(provider, { redirectTo: `/${locale}` });
}

export async function logoutAction(formData: FormData) {
  const locale = localeFrom(formData);
  await signOut({ redirectTo: `/${locale}` });
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = localeFrom(formData);
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  // Always report success to avoid leaking which emails exist.
  if (!parsed.success) return { ok: true, code: "reset_sent" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expires },
    });

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const link = `${base}/${locale}/reset-password?token=${rawToken}`;
    await sendMail({
      to: user.email,
      subject: "WANBAI-STORE — Reset your password",
      text: `Reset your password using this link (valid for 1 hour): ${link}`,
      html: `<p>We received a request to reset your WANBAI-STORE password.</p>
<p><a href="${link}">Click here to reset your password</a> (valid for 1 hour).</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  }

  return { ok: true, code: "reset_sent" };
}

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.path[0];
    if (issue === "password") return { ok: false, code: "weak_password" };
    return { ok: false, code: "reset_invalid" };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expires < new Date()) {
    return { ok: false, code: "reset_invalid" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, code: "reset_success" };
}
