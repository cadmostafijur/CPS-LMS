import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  LineChart,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BrandLogo } from "@/components/shared/brand-logo";
import { CourseCard } from "@/features/courses/course-card";
import { PromoBanners } from "@/features/marketing/promo-banners";
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
  const courseCount = courses.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-orange/15 blur-3xl animate-soft-pulse" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-navy/5 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:pt-24">
          <BrandLogo size={112} priority className="animate-fade-up rounded-2xl shadow-md ring-1 ring-navy/10" />
          <p className="animate-fade-up mt-6 font-display text-5xl font-bold tracking-tight text-navy sm:text-6xl">
            CPS Academy
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-2xl font-display text-2xl font-semibold leading-snug text-navy sm:text-3xl">
            Master software engineering with structured courses
          </h1>
          <p className="animate-fade-up-delay mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Progress tracking, auto-graded quizzes, and role-based learning —
            built for serious practice.
          </p>
          <div className="animate-fade-up-delay mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="dark" asChild>
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Go to dashboard" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {banners.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <PromoBanners banners={banners} />
        </section>
      ) : null}

      <section className="border-y border-border bg-surface/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-center sm:gap-8">
          <BrandLogo size={28} className="opacity-90" />
          <p className="text-sm text-muted-foreground">
            Trusted by learners preparing for software engineering interviews and
            contests
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-navy">
              Featured courses
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start with published tracks designed for focused, hands-on learning.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">View all</Link>
          </Button>
        </div>
        {catalogError ? (
          <p className="rounded-2xl border border-dashed border-destructive/30 bg-card px-6 py-12 text-center text-muted-foreground shadow-sm">
            <span className="font-medium text-navy">Courses unavailable.</span>{" "}
            {catalogError}
          </p>
        ) : featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground shadow-sm">
            No published courses yet. Publish a course in Admin, or restart Strapi
            with <code className="text-xs">SEED_ON_BOOTSTRAP=true</code>.
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

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-navy">
              Why CPS Academy
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Everything you need to learn, practice, and track growth in one place.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange">
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

      <section className="border-y border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4">
          {[
            { label: "Courses", value: String(courseCount), icon: BookOpen },
            { label: "Quizzes", value: "12+", icon: ClipboardCheck },
            { label: "Blog posts", value: "8+", icon: FileText },
            { label: "Roles", value: "4", icon: ShieldCheck },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-orange" />
              <p className="font-display text-3xl font-bold text-navy">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-navy">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-muted-foreground">
            Quick answers about learning on CPS Academy.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-navy outline-none [&::-webkit-details-marker]:hidden [&::marker]:content-none">
                <span>{item.q}</span>
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center text-orange">
                  <Plus className="h-4 w-4 group-open:hidden" strokeWidth={2.5} />
                  <Minus className="hidden h-4 w-4 group-open:block" strokeWidth={2.5} />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
