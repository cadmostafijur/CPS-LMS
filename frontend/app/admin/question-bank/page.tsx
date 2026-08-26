import { DashboardShell } from "@/components/layout/dashboard-shell";
import { QuestionBankManager } from "@/features/admin/question-bank-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/question-bank");
  return (
    <DashboardShell user={user}>
      <QuestionBankManager />
    </DashboardShell>
  );
}
