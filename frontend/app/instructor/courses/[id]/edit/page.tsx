import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseEditWorkspace } from "@/features/courses/course-edit-workspace";
import { InstructorCourseExtras } from "@/features/instructor/instructor-course-extras";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getCourseById } from "@/services/courses.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/instructor/courses/${id}/edit`);
  const token = await getTokenFromCookies();
  const course = await getCourseById(id, token).catch(() => null);
  if (!course) notFound();

  const courseKey = course.documentId || course.id;

  return (
    <DashboardShell user={user}>
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/instructor/courses" },
          { label: course.title },
        ]}
      />
      <PageHeader
        title="Edit course"
        description="Use the tabs below to update details, modules, lessons, and quizzes."
      />
      <CourseEditWorkspace
        course={course}
        redirectBase="/instructor/courses"
        extras={<InstructorCourseExtras courseId={courseKey} />}
      />
    </DashboardShell>
  );
}
