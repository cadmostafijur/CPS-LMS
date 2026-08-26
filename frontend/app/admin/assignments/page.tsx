import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentsManager } from "@/features/admin/assignments-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/assignments");
  return (
    <DashboardShell user={user}>
      <AssignmentsManager />
    </DashboardShell>
  );
}
