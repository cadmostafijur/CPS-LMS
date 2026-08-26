import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/shared/page-header";
import { CourseCatalog } from "@/features/courses/course-catalog";
import { listPublishedCourses } from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse published courses at CPS Academy.",
};

export default async function CoursesPage() {
  const [user, courses] = await Promise.all([
    getCurrentUser(),
    listPublishedCourses().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <PageHeader
          title="Course catalog"
          description="Explore published courses and enroll to start learning."
        />
        <CourseCatalog courses={courses} />
      </main>
      <Footer />
    </div>
  );
}
