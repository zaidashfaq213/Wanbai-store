import { getActiveBankAccounts } from "@/lib/data/payments";
import { ok } from "@/lib/api/core";

export async function GET() {
  const banks = await getActiveBankAccounts();
  return ok({
    banks: banks.map((b) => ({
      id: b.id,
      key: b.key,
      nameEn: b.nameEn,
      nameAr: b.nameAr,
      accountName: b.accountName,
      accountNumber: b.accountNumber,
      instructionsEn: b.instructionsEn,
      instructionsAr: b.instructionsAr,
      color: b.color,
    })),
  });
}
