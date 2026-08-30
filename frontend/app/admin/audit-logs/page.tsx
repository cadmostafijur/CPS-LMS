import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuditLogsManager } from "@/features/admin/audit-logs-manager";
import { isAdmin } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await requireUser("/admin/audit-logs");
  if (!isAdmin(user)) {
    redirect("/admin/dashboard");
  }
  return (
    <DashboardShell user={user}>
      <AuditLogsManager />
    </DashboardShell>
  );
}
