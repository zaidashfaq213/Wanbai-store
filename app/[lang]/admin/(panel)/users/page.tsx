import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAllUsers } from "@/lib/data/payments";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [{ lang }, { q, page }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const admin = await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const u = dict.admin.users;
  const roles = dict.admin.roles as Record<string, string>;
  const currency = await getCurrency();

  const query = q?.trim() ?? "";
  const pageNum = Number.parseInt(page ?? "1", 10);
  // Searched and paged in the DB — the admin must be able to reach every
  // registered customer, not just the most recent page of them.
  const { users, total, perPage } = await getAllUsers({
    query,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });
  const currentPage = Math.max(1, Number.isFinite(pageNum) ? pageNum : 1);

  const labels = {
    orderStatus: dict.admin.orders.statuses as Record<string, string>,
    subStatus: dict.payments.statuses as Record<string, string>,
    txType: dict.dashboard.wallet.types as Record<string, string>,
  };

  return (
    <div>
      <PageHeader title={u.title} subtitle={u.subtitle} />
      <UsersTable
        locale={locale}
        dict={u}
        confirm={dict.admin.confirm}
        roles={roles}
        currency={currency}
        labels={labels}
        adminId={admin.id}
        query={query}
        total={total}
        page={currentPage}
        perPage={perPage}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          gsmWalletBalance: user.gsmWalletBalance,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
