import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  StaffCoursesBoard,
  type StaffCourseItem,
} from "@/features/courses/staff-courses-board";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getInstructorDashboard } from "@/services/dashboard.service";

export default async function InstructorCoursesPage() {
  const user = await requireUser("/instructor/courses");
  const token = await getTokenFromCookies();

  let items: StaffCourseItem[] = [];
  let loadError: string | null = null;
  try {
    const { data } = await getInstructorDashboard(token);
    items = (data?.courses || []).map((course) => ({
      id: String(course.documentId || course.id),
        title: course.title?.trim() || "Untitled course",
        status: course.status || "DRAFT",
      lessonCount: course.lessonCount,
      quizCount: course.quizCount,
      editHref: `/instructor/courses/${course.documentId || course.id}/edit`,
    }));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load courses";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My courses"
        description="Create drafts, publish when ready, and manage lessons from one place."
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
