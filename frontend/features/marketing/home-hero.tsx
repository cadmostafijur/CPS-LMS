import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { HomeHeroCarousel } from "@/features/marketing/home-hero-carousel";
import type { AuthUser, Banner } from "@/types";

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
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-orange/15 blur-3xl animate-soft-pulse" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-navy/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-12 text-center sm:pb-20 sm:pt-16">
        <BrandLogo size={80} priority className="animate-fade-up rounded-2xl shadow-md ring-1 ring-navy/10" />
        <p className="animate-fade-up mt-5 font-display text-4xl font-bold tracking-tight text-navy sm:text-5xl">
          CPS Academy
        </p>
        <h1 className="animate-fade-up-delay mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug text-navy sm:text-3xl">
          Master software engineering with structured courses
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Progress tracking, auto-graded quizzes, and role-based learning —
          built for serious practice.
        </p>
        <div className="animate-fade-up-delay mt-8 flex flex-wrap items-center justify-center gap-3">
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
  );
}
