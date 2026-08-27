import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstructorAssignmentsPanel } from "@/features/instructor/instructor-assignments-panel";
import { requireUser } from "@/lib/session";

export default async function InstructorAssignmentsPage() {
  const user = await requireUser("/instructor/assignments");
  return (
    <DashboardShell user={user}>
      <InstructorAssignmentsPanel />
    </DashboardShell>
  );
}
