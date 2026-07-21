import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAllBankAccounts } from "@/lib/data/payments";
import { PageHeader } from "@/components/dashboard/page-header";
import { BankEditForm, type BankRow } from "@/components/admin/bank-edit-form";
import { BankCreateForm } from "@/components/admin/bank-create-form";

export default async function AdminBanksPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const b = dict.admin.banks;
  const banks = await getAllBankAccounts();

  return (
    <div>
      <PageHeader title={b.title} subtitle={b.subtitle} />
      <div className="flex flex-col gap-4">
        {banks.map((bank) => (
          <BankEditForm key={bank.id} locale={locale} dict={b} confirm={dict.admin.confirm} bank={bank as BankRow} />
        ))}
        <BankCreateForm locale={locale} dict={b} />
      </div>
    </div>
  );
}
