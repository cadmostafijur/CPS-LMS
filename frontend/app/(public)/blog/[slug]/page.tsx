import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BlogPostContent } from "@/features/blog/blog-post-content";
import { BlogPostSidebar } from "@/features/blog/blog-post-sidebar";
import { BlogRelatedPosts, BlogPostNav } from "@/features/blog/blog-related";
import { BlogNewsletter } from "@/features/blog/blog-newsletter";
import { extractHeadings, formatBlogDate } from "@/features/blog/blog-utils";
import { getBlogBySlug, listPublishedBlog } from "@/services/blog.service";
import { getCurrentUser } from "@/lib/session";
import { getSiteUrl } from "@/lib/config";
import type { BlogPost } from "@/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogBySlug(slug).catch(() => null);
  const post = result?.data;
  if (!post) return { title: "Blog post" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: `${getSiteUrl()}/blog/${post.slug}`,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

function getAdjacentPosts(posts: BlogPost[], slug: string) {
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? posts[idx - 1] : null,
    next: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [result, listResult, user] = await Promise.all([
    getBlogBySlug(slug).catch(() => null),
    listPublishedBlog().catch(() => ({ data: [] as BlogPost[] })),
    getCurrentUser(),
  ]);
  const post = result?.data;
  if (!post) notFound();

  const allPosts = listResult.data || [];
  const { prev, next } = getAdjacentPosts(allPosts, slug);
  const headings = extractHeadings(post.body);
  const shareUrl = `${getSiteUrl()}/blog/${post.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <Navbar user={user} />

      <main className="flex-1">
        <div className="border-b border-border/60 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <nav
              className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-orange">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link href="/blog" className="hover:text-orange">
                Blog
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1 font-medium text-navy">{post.title}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
            <article className="min-w-0">
              <header>
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl lg:text-[2.5rem]">
                  {post.title}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatBlogDate(post.publishedAt)}
                  {post.author?.name ? ` · ${post.author.name}` : ""}
                </p>
                {post.excerpt ? (
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                ) : null}
              </header>

              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    className="aspect-[2/1] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-orange/10 via-violet-50 to-navy/5">
                    <BookOpen className="h-16 w-16 text-orange/50" />
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                <BlogPostContent body={post.body} />
              </div>

              <div className="mt-8 rounded-2xl border border-orange/20 bg-gradient-to-r from-orange/5 to-violet-50/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange">
                  CPS Academy
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-navy">
                  Put what you learn into practice
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enroll in hands-on courses with lessons, quizzes, and tracked progress.
                </p>
                <Link
                  href="/courses"
                  className="mt-4 inline-flex text-sm font-semibold text-orange hover:underline"
                >
                  Browse courses →
                </Link>
              </div>

              <BlogPostNav prev={prev} next={next} />

              <div className="mt-10 lg:hidden">
                <BlogNewsletter />
              </div>
            </article>

            <BlogPostSidebar
              headings={headings}
              shareUrl={shareUrl}
              title={post.title}
            />
          </div>

          <BlogRelatedPosts posts={allPosts} currentSlug={slug} />

          <div className="mt-14 hidden lg:block">
            <BlogNewsletter />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
