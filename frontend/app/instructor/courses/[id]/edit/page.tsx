import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseForm } from "@/features/courses/course-form";
import { LessonManager } from "@/features/courses/lesson-manager";
import { QuizManager } from "@/features/courses/quiz-manager";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getCourseById } from "@/services/courses.service";

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
        description="Update details, lessons, and quizzes."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <CourseForm course={course} />
        <div className="space-y-6">
          <LessonManager courseId={courseKey} lessons={course.lessons || []} />
          <QuizManager courseId={courseKey} quizzes={course.quizzes || []} />
        </div>
      </div>
    </DashboardShell>
  );
}
