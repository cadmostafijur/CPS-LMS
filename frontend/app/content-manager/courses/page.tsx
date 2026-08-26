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
import { apiFetch } from "@/lib/api";
import type { Course } from "@/types";

async function listStaffCourses(token: string | null) {
  const res = await apiFetch<{ data: Course[] }>("/lms/staff/courses", { token });
  return res.data || [];
}

export default async function ContentManagerCoursesPage() {
  const user = await requireUser("/content-manager/courses");
  const token = await getTokenFromCookies();
  let courses: Course[] = [];
  let loadError: string | null = null;
  try {
    courses = await listStaffCourses(token);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load courses";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Create and manage all courses on the platform."
        actions={
          <Button asChild>
            <Link href="/content-manager/courses/new">New course</Link>
          </Button>
        }
      />

      {loadError ? (
        <p className="rounded-2xl border border-dashed border-destructive/30 bg-card px-6 py-8 text-center text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to populate the catalog."
          action={
            <Button asChild>
              <Link href="/content-manager/courses/new">Create course</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/80 hover:bg-surface/80">
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={String(course.documentId || course.id)}>
                  <TableCell className="font-medium text-navy">{course.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.status}</Badge>
                  </TableCell>
                  <TableCell>{course.lessonCount ?? 0}</TableCell>
                  <TableCell>{course.quizCount ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.instructor?.name || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/content-manager/courses/${course.documentId || course.id}/edit`}
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
