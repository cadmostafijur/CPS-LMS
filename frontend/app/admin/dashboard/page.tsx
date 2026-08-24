import Link from "next/link";
import {
  BookOpen,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getAdminDashboard } from "@/services/dashboard.service";

export default async function AdminDashboardPage() {
  const user = await requireUser("/admin/dashboard");
  const token = await getTokenFromCookies();
  const { data } = await getAdminDashboard(token);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Admin dashboard"
        description="Platform-wide overview and controls."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/users">Manage users</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Users" value={data.users} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Courses" value={data.courses} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Enrollments" value={data.enrollments} icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Blog posts" value={data.blogPosts} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Quizzes" value={data.quizzes} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Users by role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.usersByRole || {}).map(([role, count]) => (
            <div
              key={role}
              className="rounded-lg border border-border bg-muted/40 px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{role}</p>
              <p className="font-display text-2xl font-bold">{count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
