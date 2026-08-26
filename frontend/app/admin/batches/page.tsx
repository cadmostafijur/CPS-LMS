import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BatchesManager } from "@/features/admin/batches-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/batches");
  return (
    <DashboardShell user={user}>
      <BatchesManager />
    </DashboardShell>
  );
}
