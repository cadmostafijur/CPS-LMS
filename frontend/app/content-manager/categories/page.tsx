import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CategoriesAdminManager } from "@/features/admin/categories-admin-manager";
import { requireUser } from "@/lib/session";

export default async function ContentManagerCategoriesPage() {
  const user = await requireUser("/content-manager/categories");
  return (
    <DashboardShell user={user}>
      <CategoriesAdminManager />
    </DashboardShell>
  );
}
