import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CategoriesAdminManager } from "@/features/admin/categories-admin-manager";
import { requireUser } from "@/lib/session";

export default async function AdminCategoriesPage() {
  const user = await requireUser("/admin/categories");
  return (
    <DashboardShell user={user}>
      <CategoriesAdminManager />
    </DashboardShell>
  );
}
