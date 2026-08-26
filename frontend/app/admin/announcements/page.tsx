import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnnouncementsManager } from "@/features/admin/announcements-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/announcements");
  return (
    <DashboardShell user={user}>
      <AnnouncementsManager />
    </DashboardShell>
  );
}
