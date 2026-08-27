import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentAssignmentsPanel } from "@/features/student/student-assignments-panel";
import { requireUser } from "@/lib/session";

export default async function StudentAssignmentsPage() {
  const user = await requireUser("/student/assignments");
  return (
    <DashboardShell user={user}>
      <StudentAssignmentsPanel />
    </DashboardShell>
  );
}
