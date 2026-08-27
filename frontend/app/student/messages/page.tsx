import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentMessagesPanel } from "@/features/student/student-messages-panel";
import { requireUser } from "@/lib/session";

export default async function StudentMessagesPage() {
  const user = await requireUser("/student/messages");
  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Messages"
        description="Chat with instructors and staff."
      />
      <StudentMessagesPanel myUserId={user.id} />
    </DashboardShell>
  );
}
