import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { continueLessonHref } from "@/lib/continue-lesson";
import { getMyCourses, getCourseProgress } from "@/services/courses.service";
import type { Enrollment } from "@/types";

export default async function MyCoursesPage() {
  const user = await requireUser("/student/my-courses");
  const token = await getTokenFromCookies();

  let data: Enrollment[] = [];
  let loadError: string | null = null;
  try {
    const res = await getMyCourses(token);
    data = res.data || [];
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load courses";
  }

  const resumeByCourse = new Map<string, string>();
  await Promise.all(
    data.map(async (enrollment) => {
      const course = enrollment.course;
      if (!course) return;
      const id = course.documentId || course.id;
      const progress = await getCourseProgress(id, token).catch(() => null);
      const completedIds = (progress?.data?.lessons || [])
        .filter((lp) => lp.completed)
        .map((lp) => lp.lesson?.documentId || lp.lesson?.id)
        .filter((x): x is string | number => x != null);
      const href = continueLessonHref(
        id,
        course.lessons,
        completedIds,
        progress?.data?.moduleGates || course.moduleGates
      );
      if (href) resumeByCourse.set(String(id), href);
    })
  );

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My courses"
        description="Courses you are enrolled in."
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">Find more</Link>
          </Button>
        }
      />
      {loadError ? (
        <p className="mb-4 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}
      {data.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Enroll in a published course to see it here."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;
            const id = course.documentId || course.id;
            const pct = enrollment.progress?.percentage ?? 0;
            const href =
              resumeByCourse.get(String(id)) ||
              continueLessonHref(id, course.lessons) ||
              `/courses/${course.slug}`;
            const done = pct >= 100;
            return (
              <Card
                key={String(enrollment.id)}
                className={
                  done
                    ? "rounded-2xl border-orange/25 shadow-sm"
                    : "rounded-2xl border-border/80 shadow-sm"
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-navy">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {enrollment.progress?.completedCount ?? 0}/
                        {enrollment.progress?.totalLessons ?? 0} lessons
                      </span>
                      <span className="font-display font-semibold text-navy">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  {done ? (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" className="w-full">
                        <Link href={href}>Review course</Link>
                      </Button>
                      {enrollment.certificate ? (
                        <Button asChild className="w-full">
                          <Link
                            href={`/certificates/${enrollment.certificate.documentId || enrollment.certificate.id}`}
                          >
                            View certificate
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={href}>
                        {pct > 0 ? "Continue learning" : "Start learning"}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
