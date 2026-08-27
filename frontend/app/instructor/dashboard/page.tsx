import Link from "next/link";
import { BarChart3, BookOpen, Plus, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getInstructorDashboard } from "@/services/dashboard.service";
import type { InstructorDashboard } from "@/types";

const empty: InstructorDashboard = {
  user: null,
  courseCount: 0,
  enrollmentCount: 0,
  courses: [],
};

export default async function InstructorDashboardPage() {
  const user = await requireUser("/instructor/dashboard");
  const token = await getTokenFromCookies();

  let data = empty;
  let loadError: string | null = null;
  try {
    const res = await getInstructorDashboard(token);
    data = {
      ...empty,
      ...res.data,
      courses: res.data?.courses || [],
    };
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load dashboard";
  }

  const courses = data.courses || [];
  const published = courses.filter((c) => c.status === "PUBLISHED").length;

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Instructor dashboard"
        description="Manage your own courses, lessons, quizzes, and student progress."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/instructor/progress">View progress</Link>
            </Button>
            <Button asChild>
              <Link href="/instructor/courses/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New course
              </Link>
            </Button>
          </div>
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
          title="My courses"
          value={data.courseCount}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total enrollments"
          value={data.enrollmentCount}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Published"
          value={published}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/instructor/courses",
            label: "My courses",
            desc: "Create, edit, publish (own only)",
          },
          {
            href: "/instructor/progress",
            label: "Student progress",
            desc: "Enrollees in your courses",
          },
          {
            href: "/instructor/courses/new",
            label: "New course",
            desc: "Start a draft course",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-border bg-card p-4 transition hover:border-orange/40 hover:bg-orange/5"
          >
            <p className="font-medium text-navy">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        {courses.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No courses yet"
            description="Create your first course, then add lessons and quizzes."
            action={
              <Button asChild>
                <Link href="/instructor/courses/new">Create course</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={String(course.documentId || course.id)}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        course.status === "PUBLISHED"
                          ? "success"
                          : course.status === "ARCHIVED"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{course.lessonCount}</TableCell>
                  <TableCell>{course.quizCount}</TableCell>
                  <TableCell>{course.enrollmentCount}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/instructor/progress">Progress</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/instructor/courses/${course.documentId || course.id}/edit`}
                      >
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardShell>
  );
}
