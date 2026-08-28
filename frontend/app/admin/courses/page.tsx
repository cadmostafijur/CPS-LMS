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

  const items = coursesToStaffItems(courses, "/instructor/courses");

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Manage the full catalog, publish tracks, and jump into the editor."
        actions={
          <Button asChild>
            <Link href="/instructor/courses/new">
              <Plus className="h-4 w-4" />
              New course
            </Link>
          </Button>
        }
      />
      <StaffCoursesBoard
        courses={items}
        createHref="/instructor/courses/new"
        loadError={loadError}
      />
    </DashboardShell>
  );
}
