"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser, Banner } from "@/types";

function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute grid grid-cols-5 gap-2 opacity-30",
        className
      )}
      aria-hidden
    >
      {Array.from({ length: 25 }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/50" />
      ))}
    </div>
  );
}

function HeroTitle({ title }: { title: string }) {
  if (title.includes("|")) {
    const [line1, line2] = title.split("|").map((s) => s.trim());
    return (
      <>
        <span className="block text-white">{line1}</span>
        <span className="block text-orange">{line2}</span>
      </>
    );
  }
  return <span className="text-white">{title}</span>;
}

function watermarkWord(title: string) {
  const first = title.split("|")[0]?.trim() || title;
  const word = first.split(/\s+/)[0] || "LEARN";
  return word.length > 12 ? word.slice(0, 12) : word;
}

function HeroSlide({
  banner,
  user,
  active,
}: {
  banner: Banner;
  user?: AuthUser | null;
  active: boolean;
}) {
  const showTitle = banner.showTitle !== false && Boolean(banner.title?.trim());
  const showSubtitle =
    banner.showSubtitle !== false && Boolean(banner.subtitle?.trim());
  const showCta = banner.showCta !== false && Boolean(banner.linkUrl?.trim());
  const showBrowse = banner.showBrowseCourses !== false;
  const showAuth = banner.showAuthButton !== false;
  const hasButtons = showCta || showBrowse || showAuth;
  const hasText = showTitle || showSubtitle || hasButtons;
  const watermark = watermarkWord(banner.title || "CPS");

  return (
    <div
      className={cn(
        "absolute inset-0 transition-all duration-700 ease-out",
        active
          ? "z-10 opacity-100"
          : "pointer-events-none z-0 opacity-0"
      )}
      aria-hidden={!active}
    >
      <div className="relative flex h-full min-h-[inherit] flex-col lg:flex-row">
        <div
          className={cn(
            "relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:max-w-[55%] lg:px-12 lg:py-14",
            !hasText && "lg:max-w-full"
          )}
        >
          <p
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(3.5rem,14vw,9rem)] font-bold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.07)] sm:left-6 lg:left-10"
            aria-hidden
          >
            {watermark}
          </p>

          <div className="relative z-10">
            {banner.eyebrow?.trim() ? (
              <span className="inline-flex rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange">
                {banner.eyebrow}
              </span>
            ) : null}

            {showTitle ? (
              <h2 className="mt-4 font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-tight">
                <HeroTitle title={banner.title} />
              </h2>
            ) : null}

            {showSubtitle ? (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
                {banner.subtitle}
              </p>
            ) : null}

            {hasButtons ? (
              <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
                {showCta ? (
                  <Button
                    size="lg"
                    className="h-11 rounded-full px-6 text-sm font-semibold shadow-lg shadow-orange/25"
                    asChild
                  >
                    <Link href={banner.linkUrl!}>
                      {banner.ctaLabel || "Learn more"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                {showBrowse ? (
                  <Button
                    size="lg"
                    className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-navy hover:bg-white/90"
                    asChild
                  >
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                ) : null}
                {showAuth ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 rounded-full border-white/25 bg-white/5 px-6 text-sm text-white hover:bg-white/15"
                    asChild
                  >
                    <Link href={user ? "/dashboard" : "/login"}>
                      {user ? "Dashboard" : "Sign in"}
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {banner.imageUrl ? (
          <div
            className={cn(
              "relative flex min-h-[220px] flex-1 items-end justify-center px-4 pb-0 pt-4 sm:min-h-[260px] lg:min-h-0 lg:items-center lg:justify-end lg:px-8 lg:pb-0 lg:pt-0",
              !hasText && "lg:flex-[1.2]"
            )}
          >
            <div className="pointer-events-none absolute inset-y-8 right-0 w-2/3 rounded-full bg-orange/20 blur-3xl lg:inset-y-12" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imageUrl}
              alt={banner.title || "Hero"}
              className={cn(
                "relative z-10 w-full max-w-[min(100%,520px)] object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] lg:max-h-[min(92%,480px)] lg:object-center lg:translate-x-2",
                hasText ? "max-h-[280px] sm:max-h-[320px]" : "max-h-[360px] sm:max-h-[420px]"
              )}
              sizes="(max-width: 1024px) 90vw, 520px"
            />
          </div>
        ) : (
          <div className="relative hidden flex-1 items-center justify-center lg:flex">
            <div className="h-56 w-56 rounded-full bg-orange/15 blur-3xl" />
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeHeroCarousel({
  banners,
  user,
}: {
  banners: Banner[];
  user?: AuthUser | null;
}) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      setIndex((next + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!count) return null;

  return (
    <section className="bg-surface/80 px-4 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
      <div className="relative mx-auto max-w-6xl">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-navy/20 bg-navy shadow-[0_24px_60px_-20px_rgba(11,18,32,0.55)] sm:rounded-[2rem]",
            "min-h-[clamp(420px,68vw,540px)]"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.18),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(21,29,46,0.9),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-12deg, transparent, transparent 18px, rgba(255,255,255,0.5) 18px, rgba(255,255,255,0.5) 19px)",
            }}
            aria-hidden
          />
          <DotGrid className="left-4 top-4 sm:left-6 sm:top-6" />
          <DotGrid className="bottom-4 left-4 sm:bottom-6 sm:left-6" />

          <div className="relative min-h-[inherit]">
            {banners.map((banner, i) => (
              <HeroSlide
                key={String(banner.documentId || banner.id)}
                banner={banner}
                user={user}
                active={i === index}
              />
            ))}
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy sm:left-4 sm:h-10 sm:w-10"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-navy/70 text-white backdrop-blur-sm transition hover:bg-navy sm:right-4 sm:h-10 sm:w-10"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {banners.map((banner, i) => (
                  <button
                    key={String(banner.documentId || banner.id)}
                    type="button"
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index
                        ? "w-7 bg-orange"
                        : "w-1.5 bg-white/40 hover:bg-white/70"
                    )}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
