import { prisma } from "@/lib/db";
import { imageToDataUrl, PROOF_MAX_BYTES } from "@/lib/upload";
import { ok, fail, getApiUser, unauthorized } from "@/lib/api/core";

// POST multipart/form-data: amountUsd, bankAccountId, senderName?, reference?, screenshot
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) return fail("invalid_input");

  const amountUsd = Number(form.get("amountUsd"));
  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 5000) {
    return fail("invalid_input");
  }

  const bankAccountId = String(form.get("bankAccountId") ?? "");
  const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
  if (!bank || !bank.active) return fail("invalid_bank");

  const upload = await imageToDataUrl(form.get("screenshot"), PROOF_MAX_BYTES);
  if (!upload.ok) return fail(`proof_${upload.error}`, 413);

  const submission = await prisma.paymentSubmission.create({
    data: {
      userId: user.id,
      purpose: "WALLET_TOPUP",
      amount: Math.round(amountUsd * 100),
      bankAccountId: bank.id,
      senderName: (form.get("senderName") as string) || null,
      reference: (form.get("reference") as string) || null,
      proofUrl: upload.dataUrl,
    },
  });
  return ok({ submissionId: submission.id, status: "submitted" }, 201);
}
