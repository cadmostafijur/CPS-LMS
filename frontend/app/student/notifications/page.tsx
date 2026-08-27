import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import {
  StudentNotificationsPanel,
  type StudentNotification,
} from "@/features/student/student-notifications-panel";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default async function StudentNotificationsPage() {
  const user = await requireUser("/student/notifications");
  const token = await getTokenFromCookies();

  let items: StudentNotification[] = [];
  let unread = 0;
  let loadError: string | null = null;

  try {
    const res = await apiFetch<{
      data: StudentNotification[];
      meta?: { unreadCount?: number };
    }>("/lms/notifications/me", { token });
    items = res.data || [];
    unread = Number(res.meta?.unreadCount ?? items.filter((n) => !n.isRead).length);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load notifications";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Notifications"
        description="Alerts about enrollments, quizzes, and certificates."
      />
      {loadError ? (
        <p className="mb-4 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}
      <StudentNotificationsPanel initialItems={items} initialUnread={unread} />
    </DashboardShell>
  );
}
