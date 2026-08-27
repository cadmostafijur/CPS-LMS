"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Package,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Ticket,
  Users,
  BarChart3,
  ScrollText,
  Bell,
  Star,
  CreditCard,
  Layers,
  UserCheck,
  CalendarCheck,
  Library,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RoleName } from "@/lib/roles";
import { ROLE_NAMES } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

function adminSections(): NavSection[] {
  return [
    {
      id: "overview",
      label: "Overview",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/search", label: "Search", icon: Search },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/students", label: "Students", icon: GraduationCap },
        { href: "/admin/instructors", label: "Instructors", icon: UserCheck },
      ],
    },
    {
      id: "learning",
      label: "Learning",
      items: [
        { href: "/admin/courses", label: "Courses", icon: BookOpen },
        { href: "/admin/categories", label: "Categories", icon: FolderKanban },
        { href: "/admin/batches", label: "Batches", icon: Layers },
        { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
      ],
    },
    {
      id: "assessment",
      label: "Assessment",
      items: [
        { href: "/admin/assignments", label: "Assignments", icon: FileText },
        { href: "/admin/question-bank", label: "Question bank", icon: Library },
        { href: "/admin/certificates", label: "Certificates", icon: Award },
      ],
    },
    {
      id: "commerce",
      label: "Commerce",
      items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/coupons", label: "Coupons", icon: Tag },
        { href: "/admin/plans", label: "Plans", icon: Layers },
        { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
        { href: "/admin/inventory", label: "Inventory", icon: Package },
      ],
    },
    {
      id: "content",
      label: "Content & comms",
      items: [
        { href: "/admin/banners", label: "Banners", icon: ImageIcon },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/blog", label: "Blog", icon: FileText },
        { href: "/admin/notifications", label: "Notifications", icon: Bell },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
        { href: "/admin/tickets", label: "Tickets", icon: Ticket },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
}

function flatNavForRole(role: string | null | undefined): NavItem[] {
  switch (role) {
    case ROLE_NAMES.ADMIN:
      return adminSections().flatMap((s) => s.items);
    case ROLE_NAMES.CONTENT_MANAGER:
      return [
        { href: "/content-manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
        { href: "/content-manager/progress", label: "Progress", icon: BarChart3 },
        { href: "/content-manager/categories", label: "Categories", icon: FolderKanban },
        { href: "/content-manager/blog", label: "Blog", icon: FileText },
        { href: "/content-manager/banners", label: "Banners", icon: ImageIcon },
        { href: "/profile", label: "Profile", icon: UserCheck },
      ];
    case ROLE_NAMES.INSTRUCTOR:
      return [
        { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/instructor/courses", label: "My courses", icon: BookOpen },
        { href: "/instructor/progress", label: "Progress", icon: BarChart3 },
        { href: "/instructor/assignments", label: "Assignments", icon: FileText },
        { href: "/profile", label: "Profile", icon: UserCheck },
      ];
    default:
      return [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student/my-courses", label: "My courses", icon: GraduationCap },
        { href: "/student/assignments", label: "Assignments", icon: FileText },
        { href: "/student/certificates", label: "Certificates", icon: Award },
        { href: "/student/wishlist", label: "Wishlist", icon: Star },
        { href: "/student/notifications", label: "Notifications", icon: Bell },
        { href: "/student/tickets", label: "Support", icon: Ticket },
        { href: "/profile", label: "Profile", icon: UserCheck },
      ];
  }
}

function contentManagerSections(): NavSection[] {
  return [
    {
      id: "overview",
      label: "Overview",
      items: [
        { href: "/content-manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/content-manager/progress", label: "Progress", icon: BarChart3 },
      ],
    },
    {
      id: "learning",
      label: "Learning content",
      items: [
        { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
        { href: "/content-manager/categories", label: "Categories", icon: FolderKanban },
      ],
    },
    {
      id: "publishing",
      label: "Publishing",
      items: [
        { href: "/content-manager/blog", label: "Blog", icon: FileText },
        { href: "/content-manager/banners", label: "Banners", icon: ImageIcon },
      ],
    },
    {
      id: "account",
      label: "Account",
      items: [{ href: "/profile", label: "Profile", icon: UserCheck }],
    },
  ];
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionContainsPath(section: NavSection, pathname: string) {
  return section.items.some((item) => isActivePath(pathname, item.href));
}

export function Sidebar({ role }: { role?: RoleName | string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === ROLE_NAMES.ADMIN;
  const isContentManager = role === ROLE_NAMES.CONTENT_MANAGER;
  const sections = useMemo(() => {
    if (isAdmin) return adminSections();
    if (isContentManager) return contentManagerSections();
    return [];
  }, [isAdmin, isContentManager]);
  const flatItems = useMemo(() => flatNavForRole(role), [role]);
  const useSections = isAdmin || isContentManager;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!useSections) return;
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const section of sections) {
        if (sectionContainsPath(section, pathname)) {
          next[section.id] = true;
        }
      }
      if (Object.keys(next).length === 0) next.overview = true;
      return next;
    });
  }, [pathname, useSections, sections]);

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function navLinkClass(active: boolean, iconOnly: boolean) {
    return cn(
      "flex items-center rounded-lg text-[13px] font-medium transition-colors",
      iconOnly
        ? "mx-auto h-10 w-10 justify-center"
        : "gap-2.5 px-2.5 py-2",
      active
        ? "bg-orange/15 font-semibold text-orange ring-1 ring-orange/25"
        : "text-muted-foreground hover:bg-white hover:text-navy"
    );
  }

  return (
    <>
      <aside
        className={cn(
          "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-border bg-surface transition-all md:block",
          "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex flex-col pb-6",
            collapsed ? "items-center px-2 pt-2" : "p-2.5"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "mb-2 h-10 w-10 shrink-0",
              !collapsed && "self-end h-8 w-8"
            )}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {useSections && !collapsed ? (
            <nav className="flex w-full flex-col gap-3">
              {sections.map((section) => {
                const open = openSections[section.id] ?? false;
                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-navy"
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          open ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </button>
                    {open ? (
                      <div className="flex flex-col gap-0.5">
                        {section.items.map((item) => {
                          const active = isActivePath(pathname, item.href);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              title={item.label}
                              className={navLinkClass(active, false)}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          ) : (
            <nav
              className={cn(
                "flex flex-col",
                collapsed ? "w-full items-center gap-1.5" : "w-full gap-0.5"
              )}
            >
              {flatItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={navLinkClass(active, collapsed)}
                  >
                    <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden">
        {flatItems.slice(0, 4).map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-orange" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
