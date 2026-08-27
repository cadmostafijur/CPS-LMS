import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentLiveCalendar } from "@/features/student/student-live-calendar";
import { requireUser } from "@/lib/session";

export default async function StudentCalendarPage() {
  const user = await requireUser("/student/calendar");
  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Live class calendar"
        description="Upcoming and past live sessions across your enrolled courses."
      />
      <StudentLiveCalendar />
    </DashboardShell>
  );
}
