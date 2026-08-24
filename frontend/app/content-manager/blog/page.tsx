import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { BlogManager } from "@/features/blog/blog-manager";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { manageBlog } from "@/services/blog.service";

export default async function ContentManagerBlogPage() {
  const user = await requireUser("/content-manager/blog");
  const token = await getTokenFromCookies();
  const { data } = await manageBlog(token);

  return (
    <DashboardShell user={user}>
      <PageHeader title="Blog" description="Create and manage academy posts." />
      <BlogManager posts={data} />
    </DashboardShell>
  );
}
