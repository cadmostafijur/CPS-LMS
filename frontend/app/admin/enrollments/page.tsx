import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EnrollmentsAdminTable } from "@/features/admin/enrollments-admin-table";
import { requireUser } from "@/lib/session";

export default async function AdminEnrollmentsPage() {
  const user = await requireUser("/admin/enrollments");
  return (
    <DashboardShell user={user}>
      <EnrollmentsAdminTable />
    </DashboardShell>
  );
}
