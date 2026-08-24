"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Users,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
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
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/courses", label: "Courses", icon: BookOpen },
        { href: "/admin/blog", label: "Blog", icon: FileText },
      ];
    case ROLE_NAMES.CONTENT_MANAGER:
      return [
        {
          href: "/content-manager/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
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
          "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-border bg-card transition-all md:block",
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
          <nav className="flex flex-col gap-1">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-navy text-gold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden">
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
                active ? "text-primary" : "text-muted-foreground"
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
