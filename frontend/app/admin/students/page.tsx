import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PeopleAdminTable } from "@/features/admin/people-admin-table";
import { requireUser } from "@/lib/session";

export default async function AdminStudentsPage() {
  const user = await requireUser("/admin/students");
  return (
    <DashboardShell user={user}>
      <PeopleAdminTable
        role="Student"
        title="Students"
        description="All student accounts and enrollment counts."
      />
    </DashboardShell>
  );
}
