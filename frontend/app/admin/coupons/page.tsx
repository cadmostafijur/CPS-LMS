import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CouponsAdminManager } from "@/features/admin/coupons-admin-manager";
import { requireUser } from "@/lib/session";

export default async function AdminCouponsPage() {
  const user = await requireUser("/admin/coupons");
  return (
    <DashboardShell user={user}>
      <CouponsAdminManager />
    </DashboardShell>
  );
}
