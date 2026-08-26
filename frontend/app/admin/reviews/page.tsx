import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReviewsManager } from "@/features/admin/reviews-manager";
import { requireUser } from "@/lib/session";

export default async function Page() {
  const user = await requireUser("/admin/reviews");
  return (
    <DashboardShell user={user}>
      <ReviewsManager />
    </DashboardShell>
  );
}
