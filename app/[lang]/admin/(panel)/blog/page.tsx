import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPosts } from "@/lib/data/content";
import { PageHeader } from "@/components/dashboard/page-header";
import { PostForm, type PostRow } from "@/components/admin/content-forms";

export default async function AdminBlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const d = dict.admin.content.blog;
  const rows = await getAdminPosts();

  return (
    <div>
      <PageHeader title={d.title} subtitle={d.subtitle} />
      <div className="flex flex-col gap-4">
        {rows.map((p) => (
          <PostForm
            key={p.id}
            locale={locale}
            dict={d}
            errors={dict.admin.content.errors}
            post={p as PostRow}
          />
        ))}
        <PostForm locale={locale} dict={d} errors={dict.admin.content.errors} />
      </div>
    </div>
  );
}
