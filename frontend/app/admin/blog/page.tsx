import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { BlogManager } from "@/features/blog/blog-manager";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { manageBlog } from "@/services/blog.service";
import type { BlogPost } from "@/types";

export default async function AdminBlogPage() {
  const user = await requireUser("/admin/blog");
  const token = await getTokenFromCookies();

  let posts: BlogPost[] = [];
  let loadError: string | null = null;
  try {
    const res = await manageBlog(token);
    posts = res.data || [];
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load posts";
  }

  return (
    <DashboardShell user={user}>
      <PageHeader title="Blog" description="Create and manage academy posts." />
      {loadError ? (
        <p className="mb-4 rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-3 text-sm text-muted-foreground">
          {loadError}
        </p>
      ) : null}
      <BlogManager posts={posts} />
    </DashboardShell>
  );
}
