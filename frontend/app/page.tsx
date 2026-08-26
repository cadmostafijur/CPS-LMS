import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CourseCard } from "@/features/courses/course-card";
import { getCurrentUser } from "@/lib/session";
import { listPublishedCourses } from "@/services/courses.service";

export default async function HomePage() {
  const [user, courses] = await Promise.all([
    getCurrentUser(),
    listPublishedCourses().catch(() => []),
  ]);
  const featured = courses.slice(0, 3);

  return (
    <div className="min-h-screen">
      <div className="bg-navy text-white">
        <Navbar user={user} variant="dark" />
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-gold/25 blur-3xl animate-soft-pulse" />
            <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-orange/20 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "26px 26px",
              }}
            />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center">
            <Image
              src="/logo.png"
              alt="CPS Academy"
              width={120}
              height={120}
              priority
              className="animate-fade-up drop-shadow-[0_0_42px_rgba(240,180,41,0.4)]"
            />
            <p className="animate-fade-up mt-7 font-display text-5xl font-bold tracking-tight text-gold sm:text-6xl">
              CPS Academy
            </p>
            <h1 className="animate-fade-up-delay mt-5 max-w-2xl font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
              Learn software engineering with courses, progress, and real quizzes.
            </h1>
            <p className="animate-fade-up-delay mt-4 max-w-xl text-base text-white/70 sm:text-lg">
              Built for students, instructors, content managers, and admins — with
              backend-enforced roles.
            </p>
            <div className="animate-fade-up-delay mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="gold" asChild>
                <Link href="/courses">
                  Browse Courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href={user ? "/dashboard" : "/login"}>
                  {user ? "Go to dashboard" : "Sign in"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section className="border-y border-border/70 bg-card/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Structured courses",
              text: "Ordered lessons with text and video content.",
            },
            {
              icon: LineChart,
              title: "Persistent progress",
              text: "Mark complete and keep your percentage across sessions.",
            },
            {
              icon: ClipboardCheck,
              title: "Auto-graded quizzes",
              text: "Server-side scoring with attempt history.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center sm:text-left">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold sm:mx-0">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Featured courses
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start with published tracks curated for the hiring contest demo.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">View all</Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
            Courses will appear here after the backend finishes seeding Neon.
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

      <Footer />
    </div>
  );
}
