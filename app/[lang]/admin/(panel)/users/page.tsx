import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { getCurrency } from "@/lib/data/currency";
import { getAllUsers } from "@/lib/data/payments";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const admin = await requireAdmin(locale);
  const dict = await getDictionary(locale);
  const u = dict.admin.users;
  const roles = dict.admin.roles as Record<string, string>;
  const currency = await getCurrency();
  const users = await getAllUsers();
  const labels = {
    orderStatus: dict.admin.orders.statuses as Record<string, string>,
    subStatus: dict.payments.statuses as Record<string, string>,
    txType: dict.dashboard.wallet.types as Record<string, string>,
  };

  return (
    <div>
      <PageHeader title={u.title} subtitle={u.subtitle} />
      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          {u.none}
        </div>
      ) : (
        <UsersTable
          locale={locale}
          dict={u}
          confirm={dict.admin.confirm}
          roles={roles}
          currency={currency}
          labels={labels}
          adminId={admin.id}
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
      )}
    </div>
  );
}
