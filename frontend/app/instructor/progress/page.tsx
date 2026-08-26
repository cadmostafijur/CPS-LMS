import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StaffProgressTable } from "@/features/staff/staff-progress-table";
import { requireUser } from "@/lib/session";

export default async function InstructorProgressPage() {
  const user = await requireUser("/instructor/progress");
  return (
    <DashboardShell user={user}>
      <StaffProgressTable
        title="Student progress"
        description="Track students enrolled in your courses (own courses only)."
        courseEditBase="/instructor/courses"
      />
    </DashboardShell>
  );
}
