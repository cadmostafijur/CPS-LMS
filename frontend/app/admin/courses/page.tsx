import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/features/courses/course-form";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Course } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function listAllCourses(token: string | null) {
  const res = await apiFetch<{ data: Course[] }>("/lms/staff/courses", { token });
  return res.data || [];
}

export default async function AdminCoursesPage() {
  const user = await requireUser("/admin/courses");
  const token = await getTokenFromCookies();
  let courses: Course[] = [];
  let loadError: string | null = null;
  try {
    courses = await listAllCourses(token);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load courses";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Create courses and jump into the editor."
      />
      {loadError ? (
        <p className="mb-4 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CourseForm redirectBase="/instructor/courses" />
        <div className="rounded-xl border border-border bg-card">
          {courses.length === 0 ? (
            <EmptyState
              className="border-0"
              title="No courses yet"
              description="Create a course on the left to populate the catalog."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lessons</TableHead>
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
                    <TableCell>{course.lessonCount ?? 0}</TableCell>
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
      </div>
    </DashboardShell>
  );
}
