import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UsersAdminTable } from "@/features/admin/users-admin-table";
import { requireUser } from "@/lib/session";

export default async function AdminUsersPage() {
  const user = await requireUser("/admin/users");
  return (
    <DashboardShell user={user}>
      <UsersAdminTable currentUserId={user.id} />
    </DashboardShell>
  );
}
