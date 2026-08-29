import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  ClipboardList,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getTokenFromCookies } from "@/lib/auth";
import { getContentManagerDashboard } from "@/services/dashboard.service";
import type { ContentManagerDashboard } from "@/types";

export const dynamic = "force-dynamic";

const empty: ContentManagerDashboard = {
  user: null,
  courses: 0,
  blogPosts: 0,
  publishedBlog: 0,
  draftBlog: 0,
  publishedCourses: 0,
  draftCourses: 0,
  categories: 0,
  lessons: 0,
  quizzes: 0,
  activeBanners: 0,
  recentCourses: [],
};

export default async function ContentManagerDashboardPage() {
  const user = await requireUser("/content-manager/dashboard");
  const token = await getTokenFromCookies();

  let data = empty;
  let loadError: string | null = null;
  try {
    const res = await getContentManagerDashboard(token);
    data = {
      ...empty,
      ...res.data,
      recentCourses: res.data?.recentCourses || [],
    };
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load dashboard. Is Strapi running?";
  }

  const shortcuts = [
    {
      href: "/content-manager/courses",
      label: "Courses",
      desc: "Create, edit, publish",
      icon: BookOpen,
    },
    {
      href: "/content-manager/progress",
      label: "Progress",
      desc: "Student progress by course",
      icon: ClipboardList,
    },
    {
      href: "/content-manager/categories",
      label: "Categories",
      desc: "Organize catalog",
      icon: FolderKanban,
    },
    {
      href: "/content-manager/blog",
      label: "Blog",
      desc: "Drafts & publish",
      icon: FileText,
    },
    {
      href: "/content-manager/banners",
      label: "Banners",
      desc: "Homepage promos",
      icon: ImageIcon,
    },
  ];

  return (
    <DashboardShell user={user}>
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-navy via-navy to-navy-2 px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange">
              Content workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Manage courses, categories, blog posts, and promotional banners.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="inverse">
              <Link href="/content-manager/blog">Blog</Link>
            </Button>
            <Button asChild>
              <Link href="/content-manager/courses">
                Manage courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-2xl border border-dashed border-destructive/30 bg-card px-6 py-8 text-center text-sm text-muted-foreground">
          <span className="font-medium text-navy">Dashboard data unavailable.</span>{" "}
          {loadError}
        </p>
      ) : null}

      <div className="mt-8">
        <PageHeader title="Overview" description="Content health at a glance." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Courses"
            value={data.courses}
            description={`${data.publishedCourses ?? 0} published · ${data.draftCourses ?? 0} drafts`}
            icon={<BookOpen className="h-4 w-4 text-orange" />}
            className="border-orange/15 shadow-sm"
          />
          <StatsCard
            title="Blog posts"
            value={data.blogPosts}
            description={`${data.publishedBlog} published · ${data.draftBlog} drafts`}
            icon={<FileText className="h-4 w-4 text-orange" />}
            className="border-orange/15 shadow-sm"
          />
          <StatsCard
            title="Categories"
            value={data.categories ?? 0}
            icon={<FolderKanban className="h-4 w-4 text-orange" />}
            className="border-orange/15 shadow-sm"
          />
          <StatsCard
            title="Active banners"
            value={data.activeBanners ?? 0}
            icon={<ImageIcon className="h-4 w-4 text-orange" />}
            className="border-orange/15 shadow-sm"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Lessons"
          value={data.lessons ?? 0}
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Quizzes"
          value={data.quizzes ?? 0}
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard title="Published courses" value={data.publishedCourses ?? 0} />
        <StatsCard title="Draft courses" value={data.draftCourses ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Recent courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.recentCourses || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            ) : (
              (data.recentCourses || []).map((course) => (
                <Link
                  key={String(course.documentId || course.id)}
                  href={`/content-manager/courses/${course.documentId || course.id}/edit`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/70 px-4 py-3 transition hover:border-orange/40"
                >
                  <div>
                    <p className="font-medium text-navy">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.instructor?.name || "No instructor"}
                    </p>
                  </div>
                  <Badge variant="secondary">{course.status}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <PageHeader title="Quick actions" description="Jump into your tools." className="mb-0" />
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-orange/40 hover:bg-orange/[0.04]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-navy">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
