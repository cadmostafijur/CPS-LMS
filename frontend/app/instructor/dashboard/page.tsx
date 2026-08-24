import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
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

export default async function InstructorDashboardPage() {
  const user = await requireUser("/instructor/dashboard");
  const token = await getTokenFromCookies();
  const { data } = await getInstructorDashboard(token);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Instructor dashboard"
        description="Manage your courses and track enrollments."
        actions={
          <Button asChild>
            <Link href="/instructor/courses/new">New course</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Courses"
          value={data.courseCount}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total enrollments"
          value={data.enrollmentCount}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        {data.courses.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No courses yet"
            description="Create your first course to start teaching."
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
              {data.courses.map((course) => (
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
                  <TableCell className="text-right">
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
