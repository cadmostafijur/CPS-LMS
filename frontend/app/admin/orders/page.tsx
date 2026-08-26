import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrdersManager } from "@/features/admin/orders-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/orders");
  return (
    <DashboardShell user={user}>
      <OrdersManager />
    </DashboardShell>
  );
}
