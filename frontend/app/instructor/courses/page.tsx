import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
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

export default async function InstructorCoursesPage() {
  const user = await requireUser("/instructor/courses");
  const token = await getTokenFromCookies();

  let courses: Array<{
    id: number | string;
    documentId?: string;
    title: string;
    status: string;
    lessonCount: number;
    quizCount: number;
  }> = [];
  let loadError: string | null = null;
  try {
    const { data } = await getInstructorDashboard(token);
    courses = data?.courses || [];
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load courses";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My courses"
        description="Create and manage your courses."
        actions={
          <Button asChild>
            <Link href="/instructor/courses/new">New course</Link>
          </Button>
        }
      />
      {loadError ? (
        <p className="mb-4 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}
      {courses.length === 0 ? (
        <EmptyState
          title="No courses"
          description="Start by creating a draft course."
          action={
            <Button asChild>
              <Link href="/instructor/courses/new">Create course</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={String(course.documentId || course.id)}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.status}</Badge>
                  </TableCell>
                  <TableCell>{course.lessonCount}</TableCell>
                  <TableCell>{course.quizCount}</TableCell>
                  <TableCell className="space-x-2 text-right">
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
        </div>
      )}
    </DashboardShell>
  );
}
