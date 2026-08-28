import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import {
  StudentNotificationsPanel,
  type StudentNotification,
} from "@/features/student/student-notifications-panel";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

async function loadNotifications(token: string | null) {
  const res = await apiFetch<{
    data: StudentNotification[];
    meta?: { unreadCount?: number };
  }>("/lms/notifications/me", { token });
  const items = res.data || [];
  const unread = Number(
    res.meta?.unreadCount ?? items.filter((n) => !n.isRead).length
  );
  return { items, unread };
}

export default async function AdminInboxPage() {
  const user = await requireUser("/admin/inbox");
  const token = await getTokenFromCookies();

  let items: StudentNotification[] = [];
  let unread = 0;
  let loadError: string | null = null;

  try {
    const data = await loadNotifications(token);
    items = data.items;
    unread = data.unread;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load notifications";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My notifications"
        description="Your personal alerts — enrollments, messages, and system updates."
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
