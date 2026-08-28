import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BlogCard } from "@/features/blog/blog-card";
import type { BlogPost } from "@/types";

export function BlogPostNav({
  prev,
  next,
}: {
  prev?: BlogPost | null;
  next?: BlogPost | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex max-w-sm items-center gap-2 text-sm font-medium text-navy hover:text-orange"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">Previous: {prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex max-w-sm items-center justify-end gap-2 text-right text-sm font-medium text-navy hover:text-orange sm:ml-auto"
        >
          <span className="line-clamp-1">Next: {next.title}</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      ) : null}
    </nav>
  );
}

export function BlogRelatedPosts({
  posts,
  currentSlug,
}: {
  posts: BlogPost[];
  currentSlug: string;
}) {
  const related = posts.filter((p) => p.slug !== currentSlug).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-display text-2xl font-bold text-navy">Related posts</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <BlogCard key={String(post.documentId || post.id)} post={post} compact />
        ))}
      </div>
    </section>
  );
}
