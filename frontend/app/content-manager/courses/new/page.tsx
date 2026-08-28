import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CourseForm } from "@/features/courses/course-form";
import { requireUser } from "@/lib/session";

export default async function ContentManagerNewCoursePage() {
  const user = await requireUser("/content-manager/courses/new");

  return (
    <DashboardShell user={user}>
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/content-manager/courses" },
          { label: "New" },
        ]}
      />
      <PageHeader
        title="Create course"
        description="Start with a draft. Add lessons and quizzes after saving."
      />
      <div className="max-w-4xl">
        <CourseForm redirectBase="/content-manager/courses" />
      </div>
    </DashboardShell>
  );
}
