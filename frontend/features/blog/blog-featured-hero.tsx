import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";

export function BlogFeaturedHero({ post }: { post: BlogPost }) {
  const href = `/blog/${post.slug}`;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-rose-50/80 via-white to-violet-50/50 shadow-sm">
      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">
            Featured article
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-navy sm:text-3xl lg:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            {post.publishedAt ? formatDate(post.publishedAt) : null}
            {post.author?.name ? ` · ${post.author.name}` : ""}
          </p>
          <Button size="pill" className="mt-6" asChild>
            <Link href={href}>
              Read more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Link
          href={href}
          className="order-1 block overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md lg:order-2"
        >
          <div className="aspect-[4/3] bg-surface sm:aspect-video lg:aspect-[4/3]">
            {post.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy/5 to-orange/10">
                <BookOpen className="h-16 w-16 text-orange/60" />
              </div>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
