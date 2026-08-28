import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentAnalyticsPanel } from "@/features/student/student-analytics-panel";
import { getTokenFromCookies } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { getStudentAnalytics } from "@/services/dashboard.service";
import type { StudentAnalytics } from "@/types";

const empty: StudentAnalytics = {
  healthCheck: 0,
  moduleProgress: 0,
  avgQuizMark: 0,
  avgAssignmentMark: 0,
  quiz: { completed: 0, attempted: 0, incomplete: 0, total: 0 },
  calendarMonth: new Date().toISOString().slice(0, 7),
  completedDays: [],
  videoMinutesTotal: 0,
  videoByDay: [],
  assignmentSeries: [],
  rewardPoints: 0,
  lessonsCompleted: 0,
};

export default async function StudentAnalyticsPage() {
  const user = await requireUser("/student/analytics");
  const token = await getTokenFromCookies();

  let data = empty;
  let loadError: string | null = null;

  try {
    const res = await getStudentAnalytics(token);
    data = { ...empty, ...res.data };
    if (!data.videoByDay?.length) {
      const now = new Date();
      data.videoByDay = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return {
          label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
          minutes: 0,
        };
      });
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load analytics";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student analytics"
        description="Track your learning health, quizzes, videos, and assignments."
      />

      {loadError ? (
        <p className="mb-6 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-navy">Analytics unavailable.</span>{" "}
          {loadError}
        </p>
      ) : null}

      <StudentAnalyticsPanel data={data} />
    </DashboardShell>
  );
}
