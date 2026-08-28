import Link from "next/link";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types";

export function SuccessStories({ stories }: { stories: Banner[] }) {
  if (!stories.length) return null;

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange">
            Success stories
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy">
            Learners who grew with CPS Academy
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Real students, real progress — discover how structured learning helped them level up.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={String(story.documentId || story.id)}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-navy/5">
                {story.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <Quote className="h-5 w-5 text-orange/80" />
                {story.showSubtitle !== false && story.subtitle ? (
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/90">
                    &ldquo;{story.subtitle}&rdquo;
                  </p>
                ) : null}
                <div className="mt-4 border-t border-border pt-4">
                  {story.showTitle !== false ? (
                    <p className="font-display font-semibold text-navy">{story.title}</p>
                  ) : null}
                  {story.personRole ? (
                    <p className="text-xs text-muted-foreground">{story.personRole}</p>
                  ) : null}
                </div>
                {story.showCta !== false && story.linkUrl ? (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
                    <Link href={story.linkUrl}>{story.ctaLabel || "Read their story"}</Link>
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
