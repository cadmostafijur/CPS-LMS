import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { getRoleName } from "@/lib/roles";
import type { AuthUser } from "@/types";

export function DashboardShell({
  user,
  children,
  compact,
}: {
  user: AuthUser;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const role = getRoleName(user);

  return (
    <div className="min-h-screen bg-surface/60">
      <Navbar user={user} />
      <div className="mx-auto flex max-w-[1400px]">
        <Sidebar role={role} />
        <main
          className={
            compact
              ? "min-w-0 flex-1 px-4 py-4 pb-20 md:px-6 md:py-5 md:pb-6"
              : "min-w-0 flex-1 px-4 py-8 pb-24 md:px-8 md:py-10 md:pb-12"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
