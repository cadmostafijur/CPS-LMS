import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseForm } from "@/features/courses/course-form";
import { LessonManager } from "@/features/courses/lesson-manager";
import { ModuleManager } from "@/features/courses/module-manager";
import { QuizManager } from "@/features/courses/quiz-manager";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getCourseById } from "@/services/courses.service";

type Props = { params: Promise<{ id: string }> };

export default async function ContentManagerEditCoursePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/content-manager/courses/${id}/edit`);
  const token = await getTokenFromCookies();
  const course = await getCourseById(id, token).catch(() => null);
  if (!course) notFound();

  const courseKey = course.documentId || course.id;

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
        description="Update details, modules, lessons, and quizzes."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <CourseForm course={course} redirectBase="/content-manager/courses" />
        <div className="space-y-6">
          <ModuleManager courseId={courseKey} modules={course.modules || []} />
          <LessonManager
            courseId={courseKey}
            lessons={course.lessons || []}
            modules={course.modules || []}
          />
          <QuizManager
            courseId={courseKey}
            quizzes={course.quizzes || []}
            modules={course.modules || []}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
