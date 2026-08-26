import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StaffProgressTable } from "@/features/staff/staff-progress-table";
import { requireUser } from "@/lib/session";

export default async function ContentManagerProgressPage() {
  const user = await requireUser("/content-manager/progress");
  return (
    <DashboardShell user={user}>
      <StaffProgressTable
        title="Student progress"
        description="View progress across all courses on the platform."
        courseEditBase="/content-manager/courses"
      />
    </DashboardShell>
  );
}
