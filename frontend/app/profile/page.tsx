import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileManager } from "@/features/profile/profile-manager";
import { requireUser } from "@/lib/session";

export const metadata = {
  title: "Profile",
  description: "Manage your CPS Academy profile",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  return (
    <DashboardShell user={user}>
      <ProfileManager user={user} />
    </DashboardShell>
  );
}
