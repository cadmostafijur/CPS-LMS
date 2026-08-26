import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SubscriptionsManager } from "@/features/admin/subscriptions-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/subscriptions");
  return (
    <DashboardShell user={user}>
      <SubscriptionsManager />
    </DashboardShell>
  );
}
