import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAllUsers } from "@/lib/data/payments";
import { formatCents, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const u = dict.admin.users;
  const roles = dict.admin.roles as Record<string, string>;
  const currency = await getCurrency();
  const users = await getAllUsers();

  return (
    <div>
      <PageHeader title={u.title} subtitle={u.subtitle} />

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {u.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-border text-start text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3 text-start">{u.name}</th>
                <th className="p-3 text-start">{u.contact}</th>
                <th className="p-3 text-start">{u.role}</th>
                <th className="p-3 text-start">{u.wallet}</th>
                <th className="p-3 text-start">{u.joined}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{user.name ?? "—"}</p>
                    {user.username && <p className="text-xs text-muted">@{user.username}</p>}
                  </td>
                  <td className="p-3 text-muted">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-2 text-muted",
                      )}
                    >
                      {roles[user.role]}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    {formatCents(user.walletBalance, currency.symbol, currency.rate, locale)}
                  </td>
                  <td className="p-3 text-muted">
                    {new Date(user.createdAt).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
