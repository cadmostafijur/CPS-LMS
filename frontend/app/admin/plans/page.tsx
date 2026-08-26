import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlansManager } from "@/features/admin/plans-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/plans");
  return (
    <DashboardShell user={user}>
      <PlansManager />
    </DashboardShell>
  );
}
