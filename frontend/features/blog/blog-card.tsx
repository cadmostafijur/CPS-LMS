import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function BlogCard({
  post,
  className,
  compact,
}: {
  post: BlogPost;
  className?: string;
  compact?: boolean;
}) {
  const href = `/blog/${post.slug}`;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-orange/20 hover:shadow-lg",
        className
      )}
    >
      <Link href={href} className="block overflow-hidden">
        <div className={cn("relative bg-surface", compact ? "aspect-[16/9]" : "aspect-[16/10]")}>
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/10 via-violet-50 to-navy/5">
              <BookOpen className="h-10 w-10 text-orange/70" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange">
          {post.author?.name || "CPS Academy"}
          {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
        </p>
        <Link href={href}>
          <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-snug text-navy transition group-hover:text-orange">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt || "Read the full article on CPS Academy blog."}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange"
        >
          Read more
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
