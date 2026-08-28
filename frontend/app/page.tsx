import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
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
import { getCurrentUser } from "@/lib/session";
import { listPublishedCourses } from "@/services/courses.service";
import { apiFetch } from "@/lib/api";
import type { Banner } from "@/types";

const features = [
  {
    icon: LineChart,
    title: "Progress tracking",
    text: "Mark lessons complete and watch your course percentage update across sessions.",
  },
  {
    icon: ClipboardCheck,
    title: "Auto-graded quizzes",
    text: "Submit answers and get server-side scoring with attempt history.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based learning",
    text: "Students, instructors, content managers, and admins each get the right workspace.",
  },
  {
    icon: BookOpen,
    title: "Expert-led courses",
    text: "Structured lessons with text and video content built for real skill growth.",
  },
];

const faqs = [
  {
    q: "Who is CPS Academy for?",
    a: "Students who want structured software engineering courses, plus instructors and admins who manage content and enrollments.",
  },
  {
    q: "How do quizzes work?",
    a: "Quizzes are graded on the server. You can review attempt history and keep learning from your results.",
  },
  {
    q: "Can I track my progress?",
    a: "Yes. Mark lessons complete as you go and your course progress percentage stays in sync across devices.",
  },
  {
    q: "Do I need an account to browse courses?",
    a: "You can browse the public catalog freely. Sign in to enroll, take quizzes, and save progress.",
  },
];

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
              eyebrow="Catalog"
              title="Featured courses"
              description="Start with published tracks designed for focused, hands-on learning."
            />
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/courses">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {catalogError ? (
            <p className="rounded-2xl border border-dashed border-destructive/30 bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
              <span className="font-medium text-navy">Courses unavailable.</span>{" "}
              {catalogError}
            </p>
          ) : featured.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
              No published courses yet. Check back soon, or browse the full catalog
              once instructors publish their tracks.
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

        <section className="border-y border-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              align="center"
              eyebrow="Platform"
              title="Why CPS Academy"
              description="Everything you need to learn, practice, and track growth in one place."
              className="mb-12"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border/80 bg-[#f6f8fb] p-6 transition hover:border-orange/30 hover:bg-white hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange transition group-hover:bg-orange group-hover:text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SuccessStories stories={storyBanners} />

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeader
              align="center"
              title="Frequently asked questions"
              description="Quick answers about learning on CPS Academy."
              className="mb-10"
            />
            <div className="space-y-3">
              {faqs.map((item) => (
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
              Ready to start learning?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/70 sm:text-base">
              Browse the catalog, enroll for free, and track your progress from day one.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-6" asChild>
                <Link href="/courses">
                  Browse courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/15"
                asChild
              >
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Go to dashboard" : "Create free account"}
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
