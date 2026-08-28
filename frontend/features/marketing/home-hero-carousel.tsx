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

function hasHeroButtons(banner: Banner) {
  const showCta = banner.showCta === true && Boolean(banner.linkUrl?.trim());
  const showBrowse = banner.showBrowseCourses === true;
  const showAuth = banner.showAuthButton === true;
  return showCta || showBrowse || showAuth;
}

function HeroButtons({
  banner,
  user,
  className,
}: {
  banner: Banner;
  user?: AuthUser | null;
  className?: string;
}) {
  const showCta = banner.showCta === true && Boolean(banner.linkUrl?.trim());
  const showBrowse = banner.showBrowseCourses === true;
  const showAuth = banner.showAuthButton === true;

  if (!showCta && !showBrowse && !showAuth) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}>
      {showCta ? (
        <Button size="pill" asChild>
          <Link href={banner.linkUrl!}>
            {banner.ctaLabel || "Learn more"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
      {showBrowse ? (
        <Button size="pill" variant="inverse" asChild>
          <Link href="/courses">Browse courses</Link>
        </Button>
      ) : null}
      {showAuth ? (
        <Button size="pill" variant="onDark" asChild>
          <Link href={user ? "/dashboard" : "/login"}>
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function HeroSlide({
  banner,
  user,
  active,
  graphicMode,
}: {
  banner: Banner;
  user?: AuthUser | null;
  active: boolean;
  graphicMode: boolean;
}) {
  const showTitle = banner.showTitle !== false && Boolean(banner.title?.trim());
  const showSubtitle =
    banner.showSubtitle !== false && Boolean(banner.subtitle?.trim());
  const watermark = watermarkWord(banner.title || "CPS");

  if (graphicMode && banner.imageUrl) {
    return (
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out",
          active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
        )}
        aria-hidden={!active}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imageUrl}
          alt={banner.title || "Hero banner"}
          className="absolute inset-0 h-full w-full object-cover object-center"
          sizes="100vw"
        />
        {hasHeroButtons(banner) ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        ) : null}
        <HeroButtons
          banner={banner}
          user={user}
          className="absolute bottom-5 left-5 right-5 z-10 sm:bottom-8 sm:left-8"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700 ease-out",
        active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
      )}
      aria-hidden={!active}
    >
      <div className="relative flex h-full min-h-[inherit] flex-col lg:flex-row">
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:max-w-[52%] lg:px-12 lg:py-14">
          <p
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(3rem,12vw,8rem)] font-bold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.07)] sm:left-6 lg:left-10"
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

            <HeroButtons
              banner={banner}
              user={user}
              className="mt-6 sm:mt-8"
            />
          </div>
        </div>

        {banner.imageUrl ? (
          <div className="relative flex min-h-[240px] flex-1 items-end justify-center overflow-hidden lg:min-h-0 lg:items-stretch">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-3/4 bg-gradient-to-l from-orange/15 to-transparent" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imageUrl}
              alt={banner.title || "Hero"}
              className="relative z-10 h-full w-full max-h-[340px] object-contain object-bottom px-4 pb-2 lg:max-h-none lg:object-cover lg:object-[center_20%] lg:px-0 lg:pb-0"
              sizes="(max-width: 1024px) 100vw, 50vw"
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

function isGraphicBanner(banner: Banner) {
  const showTitle = banner.showTitle !== false && Boolean(banner.title?.trim());
  const showSubtitle =
    banner.showSubtitle !== false && Boolean(banner.subtitle?.trim());
  return Boolean(banner.imageUrl) && !showTitle && !showSubtitle;
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
  const activeBanner = banners[index];
  const graphicMode = activeBanner ? isGraphicBanner(activeBanner) : false;

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
    <section className="bg-[#f6f8fb] px-4 pb-6 pt-2 sm:px-6 sm:pb-8 sm:pt-4">
      <div className="relative mx-auto max-w-6xl">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-navy/15 bg-navy shadow-[0_20px_50px_-16px_rgba(11,18,32,0.45)] sm:rounded-3xl",
            graphicMode
              ? "aspect-[16/9] min-h-[200px] sm:aspect-[2.1/1]"
              : "min-h-[clamp(400px,62vw,520px)]"
          )}
        >
          {!graphicMode ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.18),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(21,29,46,0.9),transparent_55%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-12deg, transparent, transparent 18px, rgba(255,255,255,0.5) 18px, rgba(255,255,255,0.5) 19px)",
                }}
                aria-hidden
              />
              <DotGrid className="left-4 top-4 sm:left-6 sm:top-6" />
              <DotGrid className="bottom-4 left-4 sm:bottom-6 sm:left-6" />
            </>
          ) : null}

          <div className="relative h-full min-h-[inherit]">
            {banners.map((banner, i) => (
              <HeroSlide
                key={String(banner.documentId || banner.id)}
                banner={banner}
                user={user}
                active={i === index}
                graphicMode={isGraphicBanner(banner)}
              />
            ))}
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:h-10 sm:w-10"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:h-10 sm:w-10"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
                {banners.map((banner, i) => (
                  <button
                    key={String(banner.documentId || banner.id)}
                    type="button"
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index
                        ? "w-7 bg-orange"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
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
