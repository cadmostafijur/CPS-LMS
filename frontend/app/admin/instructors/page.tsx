import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PeopleAdminTable } from "@/features/admin/people-admin-table";
import { requireUser } from "@/lib/session";

export default async function AdminInstructorsPage() {
  const user = await requireUser("/admin/instructors");
  return (
    <DashboardShell user={user}>
      <PeopleAdminTable
        role="Instructor"
        title="Instructors"
        description="Instructor accounts and course counts."
      />
    </DashboardShell>
  );
}
