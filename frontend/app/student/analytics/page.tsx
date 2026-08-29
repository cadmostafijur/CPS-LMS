import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StudentAnalyticsPanel } from "@/features/student/student-analytics-panel";
import { getTokenFromCookies } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { getStudentAnalytics } from "@/services/dashboard.service";
import type { StudentAnalytics } from "@/types";

const empty: StudentAnalytics = {
  moduleProgress: 0,
  enrolledCourses: 0,
  completedCourses: 0,
  avgQuizMark: 0,
  avgAssignmentMark: 0,
  quizAttemptsTotal: 0,
  quiz: { completed: 0, attempted: 0, incomplete: 0, total: 0 },
  calendarMonth: new Date().toISOString().slice(0, 7),
  completedDays: [],
  activityByDay: [],
  assignmentSeries: [],
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
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load analytics";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student analytics"
        description="Real progress from your enrollments, lessons, quizzes, and graded assignments."
      />

      {loadError ? (
        <p className="mb-6 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-navy">Analytics unavailable.</span>{" "}
          {loadError}
        </p>
      ) : null}

      {!loadError ? <StudentAnalyticsPanel data={data} /> : null}
    </DashboardShell>
  );
}
