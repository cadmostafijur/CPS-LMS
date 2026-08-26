import Link from "next/link";
import {
  BookOpen,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  Ban,
  Tag,
  Image as ImageIcon,
  Percent,
  DollarSign,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        description="Live platform KPIs for learning and commerce."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/users">Users</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/courses">Courses</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Students" value={data.students ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active students" value={data.activeStudents ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Instructors" value={data.instructors ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Total users" value={data.users} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Courses" value={data.courses} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Published" value={data.publishedCourses ?? 0} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Drafts" value={data.draftCourses ?? 0} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Enrollments" value={data.enrollments} icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Certificates" value={data.certificates ?? 0} icon={<Award className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Revenue (sim.)" value={`$${(data.revenue ?? 0).toFixed(0)}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active coupons" value={data.activeCoupons ?? 0} icon={<Tag className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Active banners" value={data.activeBanners ?? 0} icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Blog posts" value={data.blogPosts} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Quizzes" value={data.quizzes} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Banned users" value={data.bannedUsers ?? 0} icon={<Ban className="h-4 w-4 text-muted-foreground" />} />
        <StatsCard title="Completion rate" value={`${data.completionRate ?? 0}%`} icon={<Percent className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Course completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={data.completionRate ?? 0} />
          <p className="text-sm text-muted-foreground">
            {data.completedEnrollments ?? 0} of {data.enrollments} enrollments completed.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
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
          { href: "/admin/courses", label: "Courses (free/paid)" },
          { href: "/admin/coupons", label: "Coupons" },
          { href: "/admin/banners", label: "Banners" },
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
