"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser, Banner } from "@/types";

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
  const hasOverlay = showTitle || showSubtitle || hasButtons;
  const imageOnly = Boolean(banner.imageUrl) && !hasOverlay;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700 ease-in-out",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!active}
    >
      {banner.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrl}
          alt={banner.title || "Hero banner"}
          className={cn(
            "absolute inset-0 h-full w-full",
            imageOnly
              ? "object-contain object-center"
              : "object-cover object-center"
          )}
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.35),transparent_45%)]" />
      )}

      {imageOnly ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/60 to-transparent sm:h-24" />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/50 to-navy/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-transparent to-navy/10" />
        </>
      )}

      {hasOverlay ? (
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 md:py-12">
          {banner.eyebrow?.trim() ? (
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange sm:text-sm">
              {banner.eyebrow}
            </p>
          ) : null}
          {showTitle ? (
            <h2 className="mt-2 max-w-3xl font-display text-2xl font-bold leading-tight tracking-tight text-white sm:mt-3 sm:text-4xl lg:text-5xl">
              {banner.title}
            </h2>
          ) : null}
          {showSubtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:mt-4 sm:text-base md:text-lg">
              {banner.subtitle}
            </p>
          ) : null}
          {hasButtons ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
              {showCta ? (
                <Button size="lg" className="h-10 px-4 text-sm sm:h-11 sm:px-6" asChild>
                  <Link href={banner.linkUrl!}>
                    {banner.ctaLabel || "Learn more"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {showBrowse ? (
                <Button size="lg" variant="secondary" className="h-10 text-sm sm:h-11" asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              ) : null}
              {showAuth ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 border-white/30 bg-white/10 text-sm text-white hover:bg-white/20 sm:h-11"
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
      ) : null}
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
    <section className="relative w-full overflow-hidden bg-navy">
      <div className="relative mx-auto w-full max-w-[1920px]">
        <div className="relative w-full h-[clamp(180px,42vw,680px)] min-h-[180px] max-h-[min(75vh,680px)]">
          {banners.map((banner, i) => (
            <HeroSlide
              key={String(banner.documentId || banner.id)}
              banner={banner}
              user={user}
              active={i === index}
            />
          ))}

          {count > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:left-4 sm:h-10 sm:w-10"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:right-4 sm:h-10 sm:w-10"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
                {banners.map((banner, i) => (
                  <button
                    key={String(banner.documentId || banner.id)}
                    type="button"
                    className={cn(
                      "h-1.5 rounded-full transition-all sm:h-2",
                      i === index ? "w-6 bg-orange sm:w-8" : "w-1.5 bg-white/60 hover:bg-white/90 sm:w-2"
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
