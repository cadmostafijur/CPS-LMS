import Link from "next/link";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/marketing/section-header";
import { copy } from "@/lib/site-copy";
import type { Banner } from "@/types";
import { cn } from "@/lib/utils";

export function SuccessStories({ stories }: { stories: Banner[] }) {
  if (!stories.length) return null;

  const gridClass =
    stories.length === 1
      ? "mx-auto max-w-md"
      : stories.length === 2
        ? "mx-auto grid max-w-4xl gap-6 sm:grid-cols-2"
        : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="success-stories" className="border-t border-border bg-white py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          align="center"
          eyebrow={copy.success.eyebrow}
          title={copy.success.title}
          description={copy.success.desc}
          className="mb-12"
        />

        <div className={gridClass}>
          {stories.map((story) => (
            <article
              key={String(story.documentId || story.id)}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-md",
                stories.length === 1 && "sm:flex-row sm:items-stretch"
              )}
            >
              <div
                className={cn(
                  "relative shrink-0 overflow-hidden bg-navy/5",
                  stories.length === 1
                    ? "aspect-square sm:aspect-auto sm:w-2/5"
                    : "aspect-[4/5] sm:aspect-square"
                )}
              >
                {story.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.imageUrl}
                    alt={story.title || "Success story"}
                    className="h-full w-full object-cover object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                    {copy.success.noPhoto}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <Quote className="h-5 w-5 text-orange" />
                {story.showSubtitle !== false && story.subtitle ? (
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/85 sm:text-base">
                    &ldquo;{story.subtitle}&rdquo;
                  </p>
                ) : (
                  <p className="mt-3 flex-1 text-sm italic text-muted-foreground">
                    {copy.success.defaultLearner}
                  </p>
                )}
                <div className="mt-5 border-t border-border pt-4">
                  {story.showTitle !== false && story.title ? (
                    <p className="font-display font-semibold text-navy">{story.title}</p>
                  ) : null}
                  {story.personRole ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{story.personRole}</p>
                  ) : null}
                </div>
                {story.showCta !== false && story.linkUrl ? (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
                    <Link href={story.linkUrl}>{story.ctaLabel || copy.success.readStory}</Link>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
