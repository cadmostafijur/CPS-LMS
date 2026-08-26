import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotificationsManager } from "@/features/admin/notifications-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/notifications");
  return (
    <DashboardShell user={user}>
      <NotificationsManager />
    </DashboardShell>
  );
}
