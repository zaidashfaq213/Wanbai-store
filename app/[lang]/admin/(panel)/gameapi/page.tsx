import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/data/content";
import { getAdminProducts, getAdminCategories } from "@/lib/data/catalog-db";
import { getMe, isConfigured } from "@/lib/gameapi/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { GameApiOverview } from "@/components/admin/gameapi-overview";

export default async function AdminGameApiPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.gameapi;

  const [settings, games, products, categories] = await Promise.all([
    getSettings(),
    prisma.gameApiGame.findMany({
      orderBy: { nameEn: "asc" },
      include: {
        product: { select: { id: true, nameEn: true, nameAr: true } },
        _count: { select: { catalogues: true } },
      },
    }),
    getAdminProducts(),
    getAdminCategories(),
  ]);

  const connection = isConfigured()
    ? await getMe()
        .then((r) => ({ ok: true as const, username: r.username, balance: r.balance }))
        .catch((e) => ({ ok: false as const, message: e instanceof Error ? e.message : "" }))
    : { ok: false as const, message: "" };

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <GameApiOverview
        locale={locale}
        dict={d}
        confirm={dict.admin.confirm}
        enabled={settings.gameApiEnabled}
        configured={isConfigured()}
        connection={connection}
        games={games.map((g) => ({
          id: g.id,
          code: g.code,
          nameEn: g.nameEn,
          imageUrl: g.imageUrl,
          active: g.active,
          catalogueCount: g._count.catalogues,
          lastSyncedAt: g.lastSyncedAt ? g.lastSyncedAt.toISOString() : null,
          product: g.product
            ? { id: g.product.id, name: locale === "ar" ? g.product.nameAr : g.product.nameEn }
            : null,
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: locale === "ar" ? p.nameAr : p.nameEn,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: locale === "ar" ? c.nameAr : c.nameEn,
        }))}
      />
    </div>
  );
}
