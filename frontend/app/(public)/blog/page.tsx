import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listPublishedBlog } from "@/services/blog.service";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "News and articles from CPS Academy.",
};

export default async function BlogPage() {
  const [user, result] = await Promise.all([
    getCurrentUser(),
    listPublishedBlog().catch(() => ({ data: [] })),
  ]);
  const posts = result.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <PageHeader
          title="Blog"
          description="Updates, guides, and stories from CPS Academy."
        />
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description="Published articles will appear here."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={String(post.documentId || post.id)}
                href={`/blog/${post.slug}`}
              >
                <Card className="h-full rounded-2xl border-border/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <p className="text-xs font-medium text-orange">
                      {formatDate(post.publishedAt)}
                      {post.author?.name ? ` · ${post.author.name}` : ""}
                    </p>
                    <CardTitle className="line-clamp-2 font-display text-navy">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt || "Read more…"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
