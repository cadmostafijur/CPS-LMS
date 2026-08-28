import Link from "next/link";
import { Award, BookOpen, Bot, CheckCircle2, ClipboardList, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { continueLessonHref } from "@/lib/continue-lesson";
import { getStudentDashboard } from "@/services/dashboard.service";
import type { StudentDashboard } from "@/types";
import { cn } from "@/lib/utils";

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

  const firstName = user.name?.split(" ")[0] || user.username || null;

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student dashboard"
        description={
          firstName
            ? `Welcome back, ${firstName}. Pick up where you left off.`
            : "Welcome back. Pick up where you left off."
        }
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

      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard
          title="Enrolled"
          value={data.enrolledCount}
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <BookOpen className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Completed"
          value={data.completedCourses}
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Quiz attempts"
          value={data.quizAttempts}
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <ClipboardList className="h-4 w-4" />
            </span>
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-orange/25 bg-gradient-to-r from-orange/10 via-white to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-orange">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange">
              Your AI assistant
            </p>
            <h2 className="font-display text-lg font-semibold text-navy">
              Ask Ersa anything, learn everything
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get guided answers and continue your learning journey in one place.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 gap-2 self-start sm:self-center">
          <Link href="/student/assistant">
            <Sparkles className="h-4 w-4" />
            Open assistant
          </Link>
        </Button>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy">
              Your courses
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Resume learning or review finished tracks.
            </p>
          </div>
          {data.courses.length > 0 ? (
            <Button asChild variant="ghost" size="sm" className="text-orange">
              <Link href="/student/my-courses">View all</Link>
            </Button>
          ) : null}
        </div>

        {data.courses.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            description="Browse the catalog and enroll in a course to get started."
            action={
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.courses.map((item) => {
              const course = item.enrollment?.course;
              if (!course) return null;
              const id = course.documentId || course.id;
              const pct = Math.min(100, Math.round(item.progress?.percentage ?? 0));
              const done = pct >= 100;
              const cert = item.enrollment?.certificate;
              const certHref = cert
                ? `/certificates/${cert.documentId || cert.id}`
                : null;
              const learnHref =
                continueLessonHref(
                  id,
                  course.lessons,
                  null,
                  course.moduleGates
                ) || "/student/my-courses";

              return (
                <article
                  key={String(item.enrollment?.id ?? id)}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                    done ? "border-orange/25" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-semibold leading-snug text-navy">
                      {course.title}
                    </h3>
                    {done ? (
                      <Badge variant="success" className="shrink-0">
                        Completed
                      </Badge>
                    ) : pct > 0 ? (
                      <Badge variant="gold" className="shrink-0">
                        In progress
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        Not started
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 flex-1">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-display font-semibold text-navy">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    {done ? (
                      <>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={learnHref}>Review course</Link>
                        </Button>
                        <Button asChild className="w-full" variant={certHref ? "default" : "secondary"}>
                          <Link href={certHref || "/student/certificates"}>
                            <Award className="h-4 w-4" />
                            {certHref ? "View certificate" : "Certificates"}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={learnHref}>
                          {pct > 0 ? "Continue learning" : "Start learning"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
