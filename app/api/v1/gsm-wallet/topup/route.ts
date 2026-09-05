import { prisma } from "@/lib/db";
import { imageToDataUrl, PROOF_MAX_BYTES } from "@/lib/upload";
import { ok, fail, getApiUser, unauthorized } from "@/lib/api/core";
import { notifyNewPaymentSubmission } from "@/lib/telegram";

// POST multipart/form-data: amountUsd, bankAccountId, senderName?, reference?, screenshot
// Same shape as /api/v1/wallet/topup, but purpose GSM_TOPUP against the
// separate USD wallet — the bank must be forGsm, not just active.
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) return fail("invalid_input");

  const amountUsd = Number(form.get("amountUsd"));
  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 10_000_000) {
    return fail("invalid_input");
  }

  const bankAccountId = String(form.get("bankAccountId") ?? "");
  const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
  if (!bank || !bank.forGsm) return fail("invalid_bank");

  const upload = await imageToDataUrl(form.get("screenshot"), PROOF_MAX_BYTES);
  if (!upload.ok) return fail(`proof_${upload.error}`, 413);

  const amount = Math.round(amountUsd * 100);
  const submission = await prisma.paymentSubmission.create({
    data: {
      userId: user.id,
      purpose: "GSM_TOPUP",
      amount,
      bankAccountId: bank.id,
      senderName: (form.get("senderName") as string) || null,
      reference: (form.get("reference") as string) || null,
      proofUrl: upload.dataUrl,
    },
  });
  void notifyNewPaymentSubmission({ purpose: "GSM_TOPUP", amountCents: amount, email: user.email });
  return ok({ submissionId: submission.id, status: "submitted" }, 201);
}
