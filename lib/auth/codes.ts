import "server-only";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { verificationEmail } from "@/lib/emails/verification";

// Shared 6-digit email-verification logic, used by both the web server actions
// and the mobile REST API so the rules stay identical.

export const CODE_TTL_MS = 1000 * 60 * 15; // 15 minutes
export const MAX_CODE_ATTEMPTS = 6;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Replace any previous code for this email with a fresh one and email it. */
export async function issueVerificationCode(email: string) {
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

export type CodeResult = { ok: true } | { ok: false; code: string };

/** Check a submitted code; on success marks the user verified. */
export async function consumeVerificationCode(
  email: string,
  code: string,
): Promise<CodeResult> {
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
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationCode.deleteMany({ where: { email } }),
  ]);
  return { ok: true };
}
