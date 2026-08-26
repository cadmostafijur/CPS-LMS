import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsAdminForm } from "@/features/admin/settings-admin-form";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/settings");
  return (
    <DashboardShell user={user}>
      <SettingsAdminForm />
    </DashboardShell>
  );
}
