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
  const showCta =
    banner.showCta !== false && Boolean(banner.linkUrl?.trim());
  const showBrowse = banner.showBrowseCourses !== false;
  const showAuth = banner.showAuthButton !== false;
  const hasButtons = showCta || showBrowse || showAuth;

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
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.35),transparent_45%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/65 to-navy/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-navy/15" />

      {(showTitle || showSubtitle || hasButtons) && (
        <div className="relative mx-auto flex min-h-[min(72vh,640px)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:py-24">
          {(banner.eyebrow || showTitle) && (
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-orange">
              {banner.eyebrow || "CPS Academy"}
            </p>
          )}
          {showTitle ? (
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {banner.title}
            </h2>
          ) : null}
          {showSubtitle ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              {banner.subtitle}
            </p>
          ) : null}
          {hasButtons ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {showCta ? (
                <Button size="lg" asChild>
                  <Link href={banner.linkUrl!}>
                    {banner.ctaLabel || "Learn more"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {showBrowse ? (
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              ) : null}
              {showAuth ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
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
      )}
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
    <section className="relative min-h-[min(72vh,640px)] overflow-hidden bg-navy">
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
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-5"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-5"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((banner, i) => (
              <button
                key={String(banner.documentId || banner.id)}
                type="button"
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-8 bg-orange" : "w-2 bg-white/50 hover:bg-white/80"
                )}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
