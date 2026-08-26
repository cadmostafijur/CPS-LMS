import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BannersAdminManager } from "@/features/admin/banners-admin-manager";
import { requireUser } from "@/lib/session";

export default async function AdminBannersPage() {
  const user = await requireUser("/admin/banners");
  return (
    <DashboardShell user={user}>
      <BannersAdminManager />
    </DashboardShell>
  );
}
