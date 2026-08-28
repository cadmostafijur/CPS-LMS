import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentHelpDesk } from "@/features/student/student-help-desk";
import { requireUser } from "@/lib/session";

export default async function StudentHelpDeskPage() {
  const user = await requireUser("/student/messages");
  return (
    <DashboardShell user={user}>
      <StudentHelpDesk studentName={user.name || user.username} />
    </DashboardShell>
  );
}
