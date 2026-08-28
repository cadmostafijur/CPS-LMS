import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseForm } from "@/features/courses/course-form";
import { requireUser } from "@/lib/session";

export default async function NewCoursePage() {
  const user = await requireUser("/instructor/courses/new");

  return (
    <DashboardShell user={user}>
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/instructor/courses" },
          { label: "New" },
        ]}
      />
      <PageHeader
        title="Create course"
        description="Start with a draft. Add lessons and quizzes after saving."
      />
      <div className="max-w-4xl">
        <CourseForm redirectBase="/instructor/courses" />
      </div>
    </DashboardShell>
  );
}
