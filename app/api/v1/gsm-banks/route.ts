import { getActiveGsmBankAccounts } from "@/lib/data/payments";
import { ok } from "@/lib/api/core";

// Same shape as /api/v1/banks, but only banks an admin opted into the GSM
// (USD) top-up form — see BankAccount.forGsm.
export async function GET() {
  const banks = await getActiveGsmBankAccounts();
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
      logo: b.logo,
    })),
  });
}
