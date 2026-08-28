import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentAiAssistant } from "@/features/student/student-ai-assistant";
import { requireUser } from "@/lib/session";

export default async function StudentAssistantPage() {
  const user = await requireUser("/student/assistant");

  return (
    <DashboardShell user={user}>
      <StudentAiAssistant studentName={user.name || user.username} />
    </DashboardShell>
  );
}
