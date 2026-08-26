import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InventoryAdminManager } from "@/features/admin/inventory-admin-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/inventory");
  return (
    <DashboardShell user={user}>
      <InventoryAdminManager />
    </DashboardShell>
  );
}
