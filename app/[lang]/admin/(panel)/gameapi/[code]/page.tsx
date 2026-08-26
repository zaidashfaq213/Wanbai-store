import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { GameApiDetail } from "@/components/admin/gameapi-detail";

export default async function AdminGameApiDetailPage({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}) {
  const { lang, code } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.gameapi;

  const game = await prisma.gameApiGame.findUnique({
    where: { code },
    include: {
      catalogues: { orderBy: { amount: "asc" }, include: { package: true } },
      product: {
        include: {
          variantGroups: {
            orderBy: { sortOrder: "asc" },
            include: { packages: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
  if (!game) notFound();

  const packageOptions = (game.product?.variantGroups ?? []).flatMap((g) =>
    g.packages.map((p) => ({
      id: p.id,
      label: `${locale === "ar" ? g.nameAr : g.nameEn} — ${locale === "ar" ? p.labelAr : p.labelEn}`,
      priceUsd: p.price / 100,
    })),
  );

  return (
    <div>
      <Link
        href={`/${locale}/admin/gameapi`}
        className="mb-3 inline-block text-sm font-semibold text-muted hover:text-primary"
      >
        {d.back}
      </Link>
      <PageHeader title={game.nameEn} subtitle={game.code} />
      <GameApiDetail
        locale={locale}
        dict={d}
        gameCode={game.code}
        product={game.product ? { id: game.product.id, name: locale === "ar" ? game.product.nameAr : game.product.nameEn } : null}
        packageOptions={packageOptions}
        catalogues={game.catalogues.map((c) => ({
          id: c.id,
          name: c.name,
          amount: c.amount,
          packageId: c.packageId,
          packagePriceUsd: c.package ? c.package.price / 100 : null,
        }))}
      />
    </div>
  );
}
