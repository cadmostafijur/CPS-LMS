import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { BlogCard } from "@/features/blog/blog-card";
import { BlogFeaturedHero } from "@/features/blog/blog-featured-hero";
import { BlogNewsletter } from "@/features/blog/blog-newsletter";
import { listPublishedBlog } from "@/services/blog.service";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, guides, and stories from CPS Academy.",
};

export default async function BlogPage() {
  const [user, result] = await Promise.all([
    getCurrentUser(),
    listPublishedBlog().catch(() => ({ data: [] })),
  ]);
  const posts = result.data || [];
  const [featured, ...rest] = posts;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <Navbar user={user} />

      <main className="flex-1">
        <div className="border-b border-border/60 bg-gradient-to-b from-rose-50/60 via-white to-transparent">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              CPS Academy Blog
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Learn, grow, and stay inspired
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Guides, career tips, and platform updates for aspiring software engineers.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
          {posts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              description="Published articles will appear here."
            />
          ) : (
            <>
              {featured ? <BlogFeaturedHero post={featured} /> : null}

              {rest.length > 0 ? (
                <section>
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-navy">
                        Latest articles
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fresh reads from the CPS Academy team
                      </p>
                    </div>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-orange hover:underline"
                    >
                      Explore courses
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post) => (
                      <BlogCard key={String(post.documentId || post.id)} post={post} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-2 to-[#1e1b4b] px-6 py-10 text-center text-white sm:px-10">
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Turn reading into real skills
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">
                  Browse structured courses with lessons, quizzes, and progress tracking.
                </p>
                <Button size="pill" className="mt-6" asChild>
                  <Link href="/courses">
                    Browse courses
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </section>
            </>
          )}

          <BlogNewsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}
