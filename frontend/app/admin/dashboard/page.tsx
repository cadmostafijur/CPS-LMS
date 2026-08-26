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
  ArrowRight,
  Search,
  Layers,
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

  const primary = [
    {
      title: "Students",
      value: data.students ?? 0,
      icon: <Users className="h-4 w-4 text-orange" />,
      hint: `${data.activeStudents ?? 0} active`,
    },
    {
      title: "Instructors",
      value: data.instructors ?? 0,
      icon: <GraduationCap className="h-4 w-4 text-orange" />,
    },
    {
      title: "Published courses",
      value: data.publishedCourses ?? 0,
      icon: <BookOpen className="h-4 w-4 text-orange" />,
      hint: `${data.draftCourses ?? 0} drafts`,
    },
    {
      title: "Revenue (sim.)",
      value: `$${(data.revenue ?? 0).toFixed(0)}`,
      icon: <DollarSign className="h-4 w-4 text-orange" />,
    },
  ];

  const secondary = [
    { title: "Enrollments", value: data.enrollments, icon: <Layers className="h-4 w-4 text-muted-foreground" /> },
    { title: "Certificates", value: data.certificates ?? 0, icon: <Award className="h-4 w-4 text-muted-foreground" /> },
    { title: "Quizzes", value: data.quizzes, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" /> },
    { title: "Blog posts", value: data.blogPosts, icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active coupons", value: data.activeCoupons ?? 0, icon: <Tag className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active banners", value: data.activeBanners ?? 0, icon: <ImageIcon className="h-4 w-4 text-muted-foreground" /> },
    { title: "Banned users", value: data.bannedUsers ?? 0, icon: <Ban className="h-4 w-4 text-muted-foreground" /> },
    { title: "Completion", value: `${data.completionRate ?? 0}%`, icon: <Percent className="h-4 w-4 text-muted-foreground" /> },
  ];

  const shortcuts = [
    { href: "/admin/students", label: "Students", desc: "People & enrollments" },
    { href: "/admin/courses", label: "Courses", desc: "Builder & pricing" },
    { href: "/admin/orders", label: "Orders", desc: "Commerce" },
    { href: "/admin/banners", label: "Banners", desc: "Homepage promos" },
    { href: "/admin/certificates", label: "Certificates", desc: "Issue & revoke" },
    { href: "/admin/search", label: "Search", desc: "Find anything" },
    { href: "/admin/reports", label: "Reports", desc: "Ops snapshot" },
    { href: "/admin/settings", label: "Settings", desc: "Org defaults" },
  ];

  return (
    <DashboardShell user={user}>
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-navy via-navy to-navy-2 px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange">
              Admin control plane
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Live KPIs for learners, courses, and simulated commerce across CPS
              Academy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="bg-white text-navy hover:bg-white/90">
              <Link href="/admin/search">
                <Search className="h-4 w-4" />
                Search
              </Link>
            </Button>
            <Button asChild className="bg-orange hover:bg-orange-hover">
              <Link href="/admin/courses">
                Manage courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PageHeader
          title="Overview"
          description="Key numbers at a glance."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primary.map((item) => (
            <StatsCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.hint}
              icon={item.icon}
              className="border-orange/15 shadow-sm"
            />
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondary.map((item) => (
          <StatsCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">Course completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-4xl font-bold text-navy">
                {data.completionRate ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                {data.completedEnrollments ?? 0} of {data.enrollments} enrollments
              </p>
            </div>
            <Progress value={data.completionRate ?? 0} className="h-3" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Users by role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.usersByRole || {}).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-xl border border-border bg-surface/80 px-4 py-3"
              >
                <span className="text-sm font-medium text-navy">{role}</span>
                <span className="font-display text-xl font-bold text-navy">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <PageHeader title="Quick actions" description="Jump to common admin tasks." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-orange/40 hover:bg-orange/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold text-navy">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 text-muted-foreground transition group-hover:text-orange" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
