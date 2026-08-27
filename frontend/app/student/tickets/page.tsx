import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentTicketsPanel } from "@/features/student/student-tickets-panel";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default async function StudentTicketsPage() {
  const user = await requireUser("/student/tickets");
  const token = await getTokenFromCookies();
  let items: any[] = [];
  try {
    const res = await apiFetch<{ data: any[] }>("/lms/tickets/me", { token });
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Support"
        description="Create and track help tickets."
      />
      <StudentTicketsPanel initialItems={items} />
    </DashboardShell>
  );
}
