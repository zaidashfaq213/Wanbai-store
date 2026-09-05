import { prisma } from "@/lib/db";
import { imageToDataUrl, PROOF_MAX_BYTES } from "@/lib/upload";
import { ok, fail, getApiUser, unauthorized } from "@/lib/api/core";
import { notifyNewPaymentSubmission } from "@/lib/telegram";

// POST multipart/form-data: bankAccountId, senderName?, reference?, screenshot
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const { ref } = await params;

  const form = await req.formData().catch(() => null);
  if (!form) return fail("invalid_input");

  const order = await prisma.order.findUnique({ where: { ref } });
  if (!order || order.userId !== user.id) return fail("invalid_order", 404);

  const bankAccountId = String(form.get("bankAccountId") ?? "");
  const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
  if (!bank || !bank.active) return fail("invalid_bank");

  const upload = await imageToDataUrl(form.get("screenshot"), PROOF_MAX_BYTES);
  if (!upload.ok) return fail(`proof_${upload.error}`, 413);

  const submission = await prisma.paymentSubmission.create({
    data: {
      userId: user.id,
      purpose: "ORDER",
      amount: order.total,
      bankAccountId: bank.id,
      orderId: order.id,
      senderName: (form.get("senderName") as string) || null,
      reference: (form.get("reference") as string) || null,
      proofUrl: upload.dataUrl,
    },
  });
  void notifyNewPaymentSubmission({ purpose: "ORDER", amountCents: order.total, email: user.email, orderRef: order.ref });
  return ok({ submissionId: submission.id, status: "submitted" }, 201);
}
