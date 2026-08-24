import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { dashboardPathForRole, getRoleName } from "@/lib/roles";

export default async function DashboardRedirectPage() {
  const user = await requireUser("/dashboard");
  redirect(dashboardPathForRole(getRoleName(user)));
}
