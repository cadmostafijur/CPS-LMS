import Link from "next/link";
import type { Banner } from "@/types";
import { Button } from "@/components/ui/button";

export function PromoBanners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <div
          key={String(banner.id)}
          className="relative min-h-[200px] overflow-hidden rounded-2xl border border-border bg-navy text-white sm:min-h-[240px] sm:aspect-[3/1]"
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
          <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/75 to-navy/35" />
          <div className="relative flex h-full min-h-[200px] flex-col justify-center px-6 py-8 sm:min-h-[240px] sm:px-10 sm:py-10">
            {banner.showTitle !== false ? (
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {banner.title}
              </h2>
            ) : null}
            {banner.showSubtitle !== false && banner.subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                {banner.subtitle}
              </p>
            ) : null}
            {banner.showCta === true && banner.linkUrl ? (
              <Button asChild className="mt-5 w-fit" variant="inverse">
                <Link href={banner.linkUrl}>
                  {banner.ctaLabel || "Learn more"}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
