import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getBlogBySlug } from "@/services/blog.service";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { getSiteUrl } from "@/lib/config";

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
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const result = await getBlogBySlug(slug).catch(() => null);
  const post = result?.data;
  if (!post) notFound();

  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-surface">
      <Navbar user={user} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          {formatDate(post.publishedAt)}
          {post.author?.name ? ` · ${post.author.name}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-sm leading-7">
          {post.body}
        </div>
      </article>
      <Footer />
    </div>
  );
}
