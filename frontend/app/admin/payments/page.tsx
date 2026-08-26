import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PaymentsManager } from "@/features/admin/payments-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/payments");
  return (
    <DashboardShell user={user}>
      <PaymentsManager />
    </DashboardShell>
  );
}
