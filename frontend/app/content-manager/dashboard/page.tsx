import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getContentManagerDashboard } from "@/services/dashboard.service";

export default async function ContentManagerDashboardPage() {
  const user = await requireUser("/content-manager/dashboard");
  const token = await getTokenFromCookies();
  const { data } = await getContentManagerDashboard(token);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Content manager"
        description="Oversee courses and blog publishing."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/content-manager/courses">Courses</Link>
            </Button>
            <Button asChild>
              <Link href="/content-manager/blog">Blog</Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Courses" value={data.courses} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Blog posts" value={data.blogPosts} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Published blog" value={data.publishedBlog} />
        <StatsCard title="Draft blog" value={data.draftBlog} />
      </div>
    </DashboardShell>
  );
}
