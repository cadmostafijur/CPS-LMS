import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/shared/page-header";
import { CourseCatalog } from "@/features/courses/course-catalog";
import { PromoBanners } from "@/features/marketing/promo-banners";
import { listPublishedCourses } from "@/services/courses.service";
import { getCurrentUser } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { Banner } from "@/types";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse published courses at CPS Academy.",
};

async function listCatalogBanners() {
  try {
    const res = await apiFetch<{ data: Banner[] }>("/lms/banners", {
      searchParams: { placement: "CATALOG" },
    });
    return res.data || [];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const user = await getCurrentUser();
  let courses: Awaited<ReturnType<typeof listPublishedCourses>> = [];
  let loadError: string | null = null;
  const banners = (await listCatalogBanners()).filter(
    (b) => (b.style || "STRIP") === "STRIP"
  );

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
      <main className="mx-auto max-w-6xl px-4 py-12">
        <PageHeader
          title="Course catalog"
          description="Explore published courses and enroll to start learning."
        />
        {banners.length > 0 ? (
          <div className="mb-8">
            <PromoBanners banners={banners} />
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold text-navy">
              Courses unavailable
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Start the API with <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code>{" "}
              from the project root, then refresh.
            </p>
          </div>
        ) : (
          <CourseCatalog courses={courses} />
        )}
      </main>
      <Footer />
    </div>
  );
}
