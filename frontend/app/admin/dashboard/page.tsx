import Link from "next/link";
import {
  BookOpen,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  Ban,
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
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/users">Manage users</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/users">Create account</Link>
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Users" value={data.users} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Courses" value={data.courses} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Enrollments" value={data.enrollments} icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Certificates" value={data.certificates ?? 0} icon={<Award className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Blog posts" value={data.blogPosts} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Quizzes" value={data.quizzes} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Banned users" value={data.bannedUsers ?? 0} icon={<Ban className="h-4 w-4 text-muted-foreground" />} />
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/users", label: "Users & roles" },
          { href: "/admin/courses", label: "All courses" },
          { href: "/admin/enrollments", label: "Enrollments" },
          { href: "/admin/certificates", label: "Certificates" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-orange/40 hover:bg-orange/5"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
