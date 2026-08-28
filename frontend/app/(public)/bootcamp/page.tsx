import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/shared/page-header";
import { CourseCatalog } from "@/features/courses/course-catalog";
import { listPublishedCourses } from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";
import { copy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Bootcamp",
  description: "Free intensive bootcamp tracks at CPS Academy.",
};

export default async function BootcampPage() {
  const user = await getCurrentUser();
  let courses: Awaited<ReturnType<typeof listPublishedCourses>> = [];
  let loadError: string | null = null;

  try {
    courses = await listPublishedCourses();
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load courses. Is the Strapi API running?";
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <PageHeader
          title="Free bootcamp"
          description={copy.courses.bootcampDesc}
        />
        {loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold text-navy">
              {copy.courses.unavailable}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.courses.apiHint}{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code>{" "}
              {copy.courses.apiHint2}
            </p>
          </div>
        ) : (
          <CourseCatalog courses={courses} freeOnly />
        )}
      </main>
      <Footer />
    </div>
  );
}
