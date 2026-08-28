import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  ClipboardCheck,
  LineChart,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SectionHeader } from "@/components/marketing/section-header";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { CourseCard } from "@/features/courses/course-card";
import { HomeHero } from "@/features/marketing/home-hero";
import { PromoBanners } from "@/features/marketing/promo-banners";
import { SuccessStories } from "@/features/marketing/success-stories";
import { PlacementShowcase } from "@/features/marketing/placement-showcase";
import { getCurrentUser } from "@/lib/session";
import { listPublishedCourses } from "@/services/courses.service";
import { apiFetch } from "@/lib/api";
import { copy } from "@/lib/site-copy";
import type { Banner } from "@/types";

const featureIcons = [Bot, LineChart, ClipboardCheck, BookOpen, ShieldCheck];

async function listHomeBanners() {
  try {
    const res = await apiFetch<{ data: Banner[] }>("/lms/banners", {
      searchParams: { placement: "HOME" },
    });
    return res.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const banners = await listHomeBanners();

  let courses: Awaited<ReturnType<typeof listPublishedCourses>> = [];
  let catalogError: string | null = null;
  try {
    courses = await listPublishedCourses();
  } catch (err) {
    catalogError =
      err instanceof Error
        ? err.message
        : "Could not load courses. Is the API running on port 1337?";
  }

  const featured = courses.slice(0, 3);
  const courseCount = courses.length;
  const heroBanners = banners
    .filter((b) => b.style === "HERO")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const stripBanners = banners.filter((b) => (b.style || "STRIP") === "STRIP");
  const storyBanners = banners
    .filter((b) => b.style === "STORY")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <Navbar user={user} />

      <main>
        <HomeHero banners={heroBanners} user={user} />

        <div className="-mt-3 pb-4 sm:-mt-4">
          <TrustStrip courseCount={courseCount} />
        </div>

        {stripBanners.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <PromoBanners banners={stripBanners} />
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow={copy.home.catalogEyebrow}
              title={copy.home.featuredTitle}
              description={copy.home.featuredDesc}
            />
            <Button variant="outline" size="pill" asChild>
              <Link href="/courses">
                {copy.home.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {catalogError ? (
            <p className="rounded-2xl border border-dashed border-destructive/30 bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
              <span className="font-medium text-navy">{copy.home.coursesUnavailable}</span>{" "}
              {catalogError}
            </p>
          ) : featured.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
              {copy.home.noCourses}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => (
                <CourseCard
                  key={String(course.documentId || course.id)}
                  course={course}
                />
              ))}
            </div>
          )}
        </section>

        <PlacementShowcase />

        <section className="border-y border-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              align="center"
              eyebrow={copy.home.platformEyebrow}
              title={copy.home.whyTitle}
              description={copy.home.whyDesc}
              className="mb-12"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {copy.home.features.map((item, index) => {
                const Icon = featureIcons[index];
                return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border/80 bg-[#f6f8fb] p-6 transition hover:border-orange/30 hover:bg-white hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange transition group-hover:bg-orange group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              );
              })}
            </div>
          </div>
        </section>

        <SuccessStories stories={storyBanners} />

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeader
              align="center"
              title={copy.home.faqTitle}
              description={copy.home.faqDesc}
              className="mb-10"
            />
            <div className="space-y-3">
              {copy.home.faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border bg-white px-5 py-4 shadow-sm open:border-orange/20 open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-navy outline-none">
                    <span>{item.q}</span>
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
                      <Plus className="h-4 w-4 group-open:hidden" strokeWidth={2.5} />
                      <Minus className="hidden h-4 w-4 group-open:block" strokeWidth={2.5} />
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-2 to-navy px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {copy.home.ctaTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/70 sm:text-base">
              {copy.home.ctaDesc}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="pill" asChild>
                <Link href="/courses">
                  {copy.home.browseCourses}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="pill" variant="onDark" asChild>
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? copy.home.goDashboard : copy.home.createFreeAccount}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
