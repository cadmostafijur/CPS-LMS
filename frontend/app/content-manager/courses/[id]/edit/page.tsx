import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseEditWorkspace } from "@/features/courses/course-edit-workspace";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getCourseById } from "@/services/courses.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContentManagerEditCoursePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/content-manager/courses/${id}/edit`);
  const token = await getTokenFromCookies();
  const course = await getCourseById(id, token).catch(() => null);
  if (!course) notFound();

  return (
    <DashboardShell user={user}>
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/content-manager/courses" },
          { label: course.title },
        ]}
      />
      <PageHeader
        title="Edit course"
        description="Use the tabs below to update details, modules, lessons, and quizzes."
      />
      <CourseEditWorkspace
        course={course}
        redirectBase="/content-manager/courses"
      />
    </DashboardShell>
  );
}
