import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { getRoleName } from "@/lib/roles";
import type { AuthUser } from "@/types";

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const role = getRoleName(user);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="mx-auto flex max-w-[1400px]">
        <Sidebar role={role} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
