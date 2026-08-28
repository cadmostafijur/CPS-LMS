import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  StaffCoursesBoard,
} from "@/features/courses/staff-courses-board";
import { coursesToStaffItems } from "@/features/courses/staff-courses-utils";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Course } from "@/types";

async function listAllCourses(token: string | null) {
  const res = await apiFetch<{ data: Course[] }>("/lms/staff/courses", { token });
  return Array.isArray(res.data) ? res.data : [];
}

export default async function AdminCoursesPage() {
  const user = await requireUser("/admin/courses");
  const token = await getTokenFromCookies();
  let items: ReturnType<typeof coursesToStaffItems> = [];
  let loadError: string | null = null;
  try {
    const courses = await listAllCourses(token);
    items = coursesToStaffItems(courses, "/content-manager/courses");
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load courses";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Courses"
        description="Manage the full catalog, publish tracks, and jump into the editor."
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
