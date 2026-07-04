import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  isLocale,
  defaultLocale,
  locales,
  localeLabels,
  type Locale,
} from "@/lib/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { currencies } from "@/lib/data/catalog";
import { getCurrency } from "@/lib/data/currency";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const user = await requireUser(locale);
  const dict = await getDictionary(locale);
  const currency = await getCurrency();

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      preferredLocale: true,
      preferredCurrency: true,
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold">{dict.dashboard.profile.title}</h2>
      <ProfileForm
        locale={locale}
        dict={dict.dashboard.profile}
        defaults={{
          name: record?.name ?? "",
          email: record?.email ?? user.email ?? "",
          preferredLocale: record?.preferredLocale ?? locale,
          preferredCurrency: record?.preferredCurrency ?? currency.code,
        }}
        localeOptions={locales.map((l) => ({ value: l, label: localeLabels[l] }))}
        currencyOptions={currencies.map((c) => c.code)}
      />
    </div>
  );
}
