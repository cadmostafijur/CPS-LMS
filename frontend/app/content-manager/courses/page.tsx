import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/features/courses/course-form";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch, unwrapStrapiList } from "@/lib/api";
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
  const res = await apiFetch<{ data: unknown[] }>("/courses", {
    token,
    searchParams: {
      populate: "*",
      "pagination[pageSize]": 100,
      "sort[0]": "updatedAt:desc",
    },
  });
  return unwrapStrapiList<Course>(res as never) as Course[];
}

export default async function ContentManagerCoursesPage() {
  const user = await requireUser("/content-manager/courses");
  const token = await getTokenFromCookies();
  const courses = await listAllCourses(token).catch(() => []);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Create and manage all courses."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CourseForm redirectBase="/instructor/courses" />
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
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
        </div>
      </div>
    </DashboardShell>
  );
}
