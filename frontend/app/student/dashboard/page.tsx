import Link from "next/link";
import { BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { continueLessonHref } from "@/lib/continue-lesson";
import { getStudentDashboard } from "@/services/dashboard.service";
import type { StudentDashboard } from "@/types";

const empty: StudentDashboard = {
  user: null,
  enrolledCount: 0,
  completedCourses: 0,
  quizAttempts: 0,
  courses: [],
};

export default async function StudentDashboardPage() {
  const user = await requireUser("/student/dashboard");
  const token = await getTokenFromCookies();

  let data = empty;
  let loadError: string | null = null;
  try {
    const res = await getStudentDashboard(token);
    data = {
      ...empty,
      ...res.data,
      courses: res.data?.courses || [],
    };
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load dashboard";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student dashboard"
        description={`Welcome back${user.name ? `, ${user.name}` : ""}.`}
        actions={
          <Button asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />

      {loadError ? (
        <p className="mb-6 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-navy">Dashboard data unavailable.</span>{" "}
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Enrolled"
          value={data.enrolledCount}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Completed"
          value={data.completedCourses}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
        <StatsCard
          title="Quiz attempts"
          value={data.quizAttempts}
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold">Your courses</h2>
        {data.courses.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No enrollments yet"
            description="Browse the catalog and enroll in a course to get started."
            action={
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {data.courses.map((item) => {
              const course = item.enrollment?.course;
              if (!course) return null;
              const id = course.documentId || course.id;
              const href =
                continueLessonHref(
                  id,
                  course.lessons,
                  null,
                  course.moduleGates
                ) || "/student/my-courses";
              const pct = item.progress?.percentage ?? 0;
              return (
                <Card key={String(item.enrollment?.id ?? id)}>
                  <CardHeader>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                    <Button asChild size="sm" className="w-full">
                      <Link href={href}>
                        {pct > 0 ? "Continue" : "Start learning"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
