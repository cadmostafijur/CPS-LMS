import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentHelpDesk } from "@/features/student/student-help-desk";
import { requireUser } from "@/lib/session";

export default async function InstructorHelpDeskPage() {
  const user = await requireUser("/instructor/messages");
  return (
    <DashboardShell user={user}>
      <StudentHelpDesk studentName={user.name || user.username} />
    </DashboardShell>
  );
}
