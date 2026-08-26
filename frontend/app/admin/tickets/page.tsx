import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TicketsManager } from "@/features/admin/tickets-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/tickets");
  return (
    <DashboardShell user={user}>
      <TicketsManager />
    </DashboardShell>
  );
}
