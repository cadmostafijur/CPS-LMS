import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentMessagesPanel } from "@/features/student/student-messages-panel";
import { requireUser } from "@/lib/session";

export default async function InstructorMessagesPage() {
  const user = await requireUser("/instructor/messages");
  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Messages"
        description="Chat with enrolled students. Use their user id from enrollment lists."
      />
      <StudentMessagesPanel myUserId={user.id} />
    </DashboardShell>
  );
}
