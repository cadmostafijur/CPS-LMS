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
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RoleName } from "@/lib/roles";
import { ROLE_NAMES } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

function navForRole(role: string | null | undefined): NavItem[] {
  switch (role) {
    case ROLE_NAMES.ADMIN:
      return [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/search", label: "Search", icon: Search },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/students", label: "Students", icon: GraduationCap },
        { href: "/admin/instructors", label: "Instructors", icon: UserCheck },
        { href: "/admin/courses", label: "Courses", icon: BookOpen },
        { href: "/admin/categories", label: "Categories", icon: FolderKanban },
        { href: "/admin/batches", label: "Batches", icon: Layers },
        { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
        { href: "/admin/assignments", label: "Assignments", icon: FileText },
        { href: "/admin/question-bank", label: "Question bank", icon: Library },
        { href: "/admin/certificates", label: "Certificates", icon: Award },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/coupons", label: "Coupons", icon: Tag },
        { href: "/admin/plans", label: "Plans", icon: Layers },
        { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
        { href: "/admin/inventory", label: "Inventory", icon: Package },
        { href: "/admin/banners", label: "Banners", icon: ImageIcon },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/tickets", label: "Tickets", icon: Ticket },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
        { href: "/admin/notifications", label: "Notifications", icon: Bell },
        { href: "/admin/blog", label: "Blog", icon: FileText },
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ];
    case ROLE_NAMES.CONTENT_MANAGER:
      return [
        {
          href: "/content-manager/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
        { href: "/content-manager/categories", label: "Categories", icon: FolderKanban },
        { href: "/content-manager/blog", label: "Blog", icon: FileText },
      ];
    case ROLE_NAMES.INSTRUCTOR:
      return [
        {
          href: "/instructor/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { href: "/instructor/courses", label: "My courses", icon: BookOpen },
      ];
    default:
      return [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          href: "/student/my-courses",
          label: "My courses",
          icon: GraduationCap,
        },
        {
          href: "/student/certificates",
          label: "Certificates",
          icon: Award,
        },
      ];
  }
}

export function Sidebar({ role }: { role?: RoleName | string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = navForRole(role);

  return (
    <>
      <aside
        className={cn(
          "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-border bg-surface transition-all md:block",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <div className="flex h-full flex-col p-3">
          <Button
            variant="ghost"
            size="icon"
            className="mb-2 self-end"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          <nav className="flex flex-col gap-1 pb-8">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-orange/10 text-orange"
                      : "text-muted-foreground hover:bg-white hover:text-navy"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden">
        {items.slice(0, 4).map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
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
