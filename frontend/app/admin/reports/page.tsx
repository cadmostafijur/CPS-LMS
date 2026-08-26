import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReportsAdminView } from "@/features/admin/reports-admin-view";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/reports");
  return (
    <DashboardShell user={user}>
      <ReportsAdminView />
    </DashboardShell>
  );
}
