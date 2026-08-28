import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  StaffCoursesBoard,
  coursesToStaffItems,
} from "@/features/courses/staff-courses-board";
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

  const items = coursesToStaffItems(courses, "/content-manager/courses");

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Create and manage all courses on the platform."
        actions={
          <Button asChild>
            <Link href="/content-manager/courses/new">
              <Plus className="h-4 w-4" />
              New course
            </Link>
          </Button>
        }
      />
      <StaffCoursesBoard
        courses={items}
        createHref="/content-manager/courses/new"
        loadError={loadError}
      />
    </DashboardShell>
  );
}
