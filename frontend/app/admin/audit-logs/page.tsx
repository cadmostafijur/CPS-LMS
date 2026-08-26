import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuditLogsManager } from "@/features/admin/audit-logs-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/audit-logs");
  return (
    <DashboardShell user={user}>
      <AuditLogsManager />
    </DashboardShell>
  );
}
