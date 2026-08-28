import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeroCarousel } from "@/features/marketing/home-hero-carousel";
import type { AuthUser, Banner } from "@/types";

function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute grid grid-cols-5 gap-2 opacity-30 ${className || ""}`}
      aria-hidden
    >
      {Array.from({ length: 25 }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/50" />
      ))}
    </div>
  );
}

export function HomeHero({
  banners,
  user,
}: {
  banners: Banner[];
  user?: AuthUser | null;
}) {
  if (banners.length > 0) {
    return <HomeHeroCarousel banners={banners} user={user} />;
  }

  return (
    <section className="bg-surface/80 px-4 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
      <div className="relative mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-navy/20 bg-navy shadow-[0_24px_60px_-20px_rgba(11,18,32,0.55)] sm:rounded-[2rem]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.18),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(21,29,46,0.9),transparent_55%)]"
            aria-hidden
          />
          <DotGrid className="left-4 top-4 sm:left-6 sm:top-6" />
          <DotGrid className="bottom-4 left-4 sm:bottom-6 sm:left-6" />

          <div className="relative grid min-h-[420px] items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:px-12 lg:py-16">
            <div className="relative z-10">
              <p
                className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(3rem,12vw,7rem)] font-bold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.07)]"
                aria-hidden
              >
                CPS
              </p>
              <span className="relative inline-flex rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange">
                CPS Academy
              </span>
              <h1 className="relative mt-4 font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-white">
                Master software
                <span className="block text-orange">engineering skills.</span>
              </h1>
              <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
                Structured courses, progress tracking, and auto-graded quizzes —
                built for serious practice.
              </p>
              <div className="relative mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="h-11 rounded-full px-6 font-semibold shadow-lg shadow-orange/25"
                  asChild
                >
                  <Link href="/courses">
                    Browse courses
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="h-11 rounded-full bg-white px-6 font-semibold text-navy hover:bg-white/90"
                  asChild
                >
                  <Link href={user ? "/dashboard" : "/login"}>
                    {user ? "Dashboard" : "Sign in"}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden items-center justify-center lg:flex">
              <div className="absolute h-64 w-64 rounded-full bg-orange/20 blur-3xl" />
              <div className="relative flex h-72 w-72 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
                <span className="font-display text-6xl font-bold text-orange/90">
                  CPS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
