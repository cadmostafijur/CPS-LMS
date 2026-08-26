import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceManager } from "@/features/admin/attendance-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/attendance");
  return (
    <DashboardShell user={user}>
      <AttendanceManager />
    </DashboardShell>
  );
}
