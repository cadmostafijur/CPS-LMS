import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getMyCourses } from "@/services/courses.service";

export default async function MyCoursesPage() {
  const user = await requireUser("/student/my-courses");
  const token = await getTokenFromCookies();
  const { data } = await getMyCourses(token);

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
            const lessons = [...(course.lessons || [])].sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0)
            );
            const first = lessons[0]?.documentId || lessons[0]?.id;
            const pct = enrollment.progress?.percentage ?? 0;
            return (
              <Card key={String(enrollment.id)}>
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={pct} />
                  <p className="text-sm text-muted-foreground">
                    {enrollment.progress?.completedCount ?? 0}/
                    {enrollment.progress?.totalLessons ?? 0} lessons · {pct}%
                  </p>
                  <Button asChild className="w-full">
                    <Link
                      href={first ? `/learn/${id}/${first}` : `/courses/${course.slug}`}
                    >
                      Open course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
