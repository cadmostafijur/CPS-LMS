import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GlobalSearchAdmin } from "@/features/admin/global-search-admin";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/search");
  return (
    <DashboardShell user={user}>
      <GlobalSearchAdmin />
    </DashboardShell>
  );
}
