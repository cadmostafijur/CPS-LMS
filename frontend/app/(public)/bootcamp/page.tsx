import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/marketing/section-header";
import { BootcampTrainers } from "@/features/marketing/bootcamp/bootcamp-trainers";
import { BootcampTimeline } from "@/features/marketing/bootcamp/bootcamp-timeline";
import {
  BOOTCAMP_YOUTUBE,
  bootcampAudience,
  bootcampBenefits,
  bootcampHighlights,
  trainerReasons,
} from "@/lib/bootcamp-data";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Zero to Competitive Programmer — Free Bootcamp",
  description:
    "20-day free programming and C++ STL bootcamp for freshers. Live classes, 100+ problems, contests, and scholarships at CPS Academy.",
};

export default async function BootcampPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <Navbar user={user} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-navy px-4 py-16 sm:px-6 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.2),transparent_55%),radial-gradient(ellipse_at_100%_100%,rgba(21,29,46,0.8),transparent_50%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange/40 bg-orange/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange">
                Free camp
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                All classes & video solutions available now
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Zero to Competitive
              <span className="block text-orange">Programmer</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">
              20-day programming and C++ STL bootcamp for freshers.
              <span className="block font-medium text-white">
                No prior knowledge required!
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["20 days", "C++ STL", "Free course"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3" id="classes">
              <Button size="pill" asChild>
                <a href={BOOTCAMP_YOUTUBE} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="h-4 w-4" />
                  View bootcamp classes & videos
                </a>
              </Button>
              <Button size="pill" variant="onDark" asChild>
                <Link href="/courses">
                  Browse courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 rounded-2xl border border-orange/30 bg-orange/10 px-5 py-4 sm:inline-flex sm:items-center sm:gap-3">
              <Trophy className="h-5 w-5 shrink-0 text-orange" />
              <p className="text-sm text-white/90 sm:text-base">
                <span className="font-semibold text-white">Top rewards:</span> Top 10
                students get a full free scholarship in our Complete Competitive
                Programming Course.
              </p>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            eyebrow="Course highlights"
            title="Everything you need to start your journey"
            className="mb-10"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bootcampHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy">
                <Users className="h-5 w-5 text-orange" />
                Perfect for beginners
              </h3>
              <ul className="mt-4 space-y-2">
                {bootcampAudience.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-orange/20 bg-gradient-to-br from-orange/5 to-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy">
                <Award className="h-5 w-5 text-orange" />
                100% free
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No hidden costs, no prerequisites. Join live classes, practice
                problems, compete in contests, and learn from ICPC-level trainers —
                completely free.
              </p>
            </div>
          </div>
        </section>

        {/* Trainers */}
        <section className="border-y border-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Expert trainers"
              title="Meet your expert trainers"
              description="Learn from engineers and competitive programmers with ICPC finals experience."
              className="mb-10"
            />
            <BootcampTrainers />
          </div>
        </section>

        {/* Why trainers */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            align="center"
            title="Why learn from our expert trainers?"
            className="mb-10"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {trainerReasons.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="border-y border-border bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Course timeline"
              title="A structured 20-day journey"
              className="mb-8"
            />
            <BootcampTimeline />
          </div>
        </section>

        {/* YouTube CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
            <div className="grid lg:grid-cols-2">
              <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange">
                  Classes available now
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">
                  Access bootcamp materials
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  All 100+ problem solutions and live classes are on our YouTube
                  channel. Subscribe for free access to every video.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={BOOTCAMP_YOUTUBE} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4" />
                      Visit CPS Academy YouTube
                    </a>
                  </Button>
                </div>
              </div>
              <div className="bg-[#f6f8fb] p-8">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-orange" />
                  <div>
                    <p className="font-semibold text-navy">Bootcamp period</p>
                    <p className="text-sm text-muted-foreground">
                      July 15 – August 3, 2025
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="flex items-center gap-2 font-semibold text-navy">
                    <BookOpen className="h-4 w-4 text-orange" />
                    What you get
                  </p>
                  <ul className="mt-3 space-y-2">
                    {bootcampBenefits.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scholarship + final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="rounded-3xl bg-gradient-to-br from-navy via-navy-2 to-navy px-6 py-10 text-center sm:px-10 sm:py-12">
            <Trophy className="mx-auto h-10 w-10 text-orange" />
            <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
              Scholarship opportunity
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/75 sm:text-base">
              Top 10 performers get <span className="font-semibold text-white">free access</span>{" "}
              to our premium Complete Competitive Programming Course — worth ৳4,000.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="pill" asChild>
                <a href={BOOTCAMP_YOUTUBE} target="_blank" rel="noopener noreferrer">
                  View classes & solutions
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              {!user ? (
                <Button size="pill" variant="onDark" asChild>
                  <Link href="/register">Create free account</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
